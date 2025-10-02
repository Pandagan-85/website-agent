"""
LangSmith tracing setup - initialization and traceable functions
"""

import os
from typing import Optional, Tuple

from langsmith import traceable

from .logging_config import setup_logging

logger = setup_logging(__name__)


def setup_langsmith():
    """Setup LangSmith per il tracing"""
    try:
        # Cerca sia LANGSMITH_API_KEY che LANGCHAIN_API_KEY
        langsmith_api_key = os.getenv("LANGSMITH_API_KEY") or os.getenv(
            "LANGCHAIN_API_KEY"
        )
        langsmith_project = os.getenv("LANGSMITH_PROJECT", "veronica-wordpress-chatbot")

        if langsmith_api_key:
            os.environ["LANGCHAIN_TRACING_V2"] = "true"
            os.environ["LANGCHAIN_API_KEY"] = langsmith_api_key
            os.environ["LANGCHAIN_PROJECT"] = langsmith_project
            logger.info(f"LangSmith attivato - Progetto: {langsmith_project}")
            return True
        else:
            logger.info("LangSmith disabilitato (nessuna API key configurata)")
            return False
    except Exception as e:
        logger.error(f"Errore setup LangSmith: {e}")
        return False


# Setup LangSmith
LANGSMITH_ENABLED = setup_langsmith()


@traceable(name="wordpress_chatbot_request")
def process_chat_with_tracing(
    message: str, thread_id: str
) -> Tuple[str, Optional[str]]:
    """Processa la chat con tracing LangSmith aggiornato"""
    from ..api.dependencies import get_chatbot

    chatbot = get_chatbot()
    if chatbot is None:
        raise Exception("Chatbot non inizializzato")

    # Processa la richiesta (LangSmith traccia automaticamente)
    response = chatbot.chat(message, thread_id)

    # Ottieni trace URL se disponibile
    trace_url = None
    if LANGSMITH_ENABLED:
        try:
            # Il trace URL viene generato automaticamente da LangSmith
            project = os.getenv("LANGSMITH_PROJECT", "veronica-wordpress-chatbot")
            trace_url = f"https://smith.langchain.com/projects/{project}"
        except Exception as e:
            logger.warning(f"Errore generazione trace URL: {e}")

    return response, trace_url
