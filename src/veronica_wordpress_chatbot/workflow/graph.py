"""
LangGraph workflow - Graph creation and export
"""

from typing import Any, Dict, List, Literal

from dotenv import load_dotenv
from langchain_core.messages import BaseMessage, SystemMessage
from langchain_core.runnables.config import RunnableConfig
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph
from langgraph.prebuilt import ToolNode

# carica .env subito
load_dotenv()

from ..config import Configuration  # noqa: E402
from ..models import InputState, State  # noqa: E402
from ..tools import TOOLS  # noqa: E402
from ..utils.prompts import create_system_prompt  # noqa: E402


def should_continue(state: State) -> Literal["tools", "__end__"]:
    """Decide se continuare con i tools o terminare"""
    messages = state["messages"]
    last_message = messages[-1]

    # type: ignore[attr-defined]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    return "__end__"


def call_model(state: State, config: RunnableConfig) -> Dict[str, List[BaseMessage]]:
    """Nodo principale del modello - Pattern ReAct"""
    # Estrai configurazione e filtra parametri interni LangGraph
    configurable = config.get("configurable", {})

    # Lista parametri validi per Configuration (evita parametri interni LangGraph)
    valid_config_params = {"model", "wordpress_base_url"}

    # Filtra solo parametri supportati da Configuration
    filtered_params = {
        k: v
        for k, v in configurable.items()
        if k in valid_config_params and not k.startswith("__")
    }

    # Usa Configuration con parametri filtrati (o default se vuoti)
    configuration = (
        Configuration(**filtered_params) if filtered_params else Configuration()
    )

    # Inizializza il modello con tools
    model = ChatOpenAI(model=configuration.model, temperature=0.1, streaming=True)
    model_with_tools = model.bind_tools(TOOLS)

    messages = state["messages"]

    # Aggiungi system prompt se non presente
    if not messages or not isinstance(messages[0], SystemMessage):
        system_message = SystemMessage(content=create_system_prompt())
        messages = [system_message] + messages

    # Invoca il modello
    response = model_with_tools.invoke(messages)

    return {"messages": [response]}


def create_graph() -> Any:
    """Crea il grafo LangGraph con pattern ReAct"""

    # Crea il grafo con configurazione
    builder = StateGraph(  # type: ignore[call-arg]
        State, input=InputState, config_schema=Configuration
    )

    # Aggiungi nodi
    builder.add_node("agent", call_model)
    builder.add_node("tools", ToolNode(TOOLS))

    # Imposta entry point
    builder.set_entry_point("agent")

    # Aggiungi edges condizionali (Pattern ReAct)
    builder.add_conditional_edges(
        "agent", should_continue, {"tools": "tools", "__end__": "__end__"}
    )

    # Edge da tools a agent (continua il ciclo)
    builder.add_edge("tools", "agent")

    # Compila con memory per persistenza stato
    memory = MemorySaver()
    graph = builder.compile(checkpointer=memory)

    return graph


# Export per LangGraph Studio
def get_graph() -> Any:
    """Funzione di export per LangGraph Studio"""
    return create_graph()


# Alias per compatibilità
graph = get_graph()
