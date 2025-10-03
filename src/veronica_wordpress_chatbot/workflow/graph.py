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
    """
    Nodo principale del modello - Pattern ReAct (Reasoning step)

    Questo nodo viene chiamato ogni volta che il grafo deve ragionare:
    1. Filtra la configurazione per evitare parametri interni LangGraph
    2. Inizializza il modello LLM con tools (bind_tools abilita tool calling)
    3. Gestisce il system prompt (aggiunge solo se non presente)
    4. Invoca il modello e ritorna la risposta

    Args:
        state: State del grafo contenente messaggi e configurazione
        config: RunnableConfig con parametri (thread_id, model, ecc.)

    Returns:
        Dict con nuovo messaggio da aggiungere allo state
    """
    # Estrai configurazione e filtra parametri interni LangGraph
    # LangGraph passa: thread_id, __langgraph_step, ecc.
    # Configuration accetta solo: model, wordpress_base_url
    configurable = config.get("configurable", {})

    # Lista parametri validi per Configuration (evita parametri interni LangGraph)
    valid_config_params = {"model", "wordpress_base_url"}

    # Filtra solo parametri supportati da Configuration
    # Rimuove thread_id (già usato da LangGraph per checkpointing)
    # Rimuove __langgraph_* (parametri interni)
    filtered_params = {
        k: v
        for k, v in configurable.items()
        if k in valid_config_params and not k.startswith("__")
    }

    # Usa Configuration con parametri filtrati (o default se vuoti)
    # Default: model="gpt-4o-mini", wordpress_base_url da .env
    configuration = (
        Configuration(**filtered_params) if filtered_params else Configuration()
    )

    # Inizializza il modello LLM con tools
    # temperature=0.1: risposte deterministiche (poco creative)
    # streaming=True: preparato per streaming futuro (non usato ora)
    model = ChatOpenAI(model=configuration.model, temperature=0.1, streaming=True)

    # bind_tools() è CRUCIALE per ReAct pattern!
    # Permette al modello di vedere i 9 tools disponibili e decidere autonomamente
    # quali chiamare in base al contesto della conversazione
    model_with_tools = model.bind_tools(TOOLS)

    messages = state["messages"]

    # Aggiungi system prompt se non presente
    # System prompt deve essere PRIMO messaggio sempre
    # - Primo turno: messages vuoto → aggiungi system prompt
    # - Turni successivi (dopo tool call): system prompt già presente → skip
    if not messages or not isinstance(messages[0], SystemMessage):
        system_message = SystemMessage(content=create_system_prompt())
        messages = [system_message] + messages

    # Invoca il modello con tutto lo storico conversazione
    # Il modello può decidere di:
    # 1. Chiamare uno o più tools (ritorna AIMessage con tool_calls)
    # 2. Rispondere direttamente (ritorna AIMessage con content)
    response = model_with_tools.invoke(messages)

    # Ritorna nuovo messaggio che LangGraph aggiungerà allo state
    # should_continue() deciderà il prossimo step:
    # - Se response ha tool_calls → vai al nodo "tools"
    # - Altrimenti → termina conversazione (__end__)
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
