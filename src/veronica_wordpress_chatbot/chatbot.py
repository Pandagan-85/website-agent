"""
VeronicaChatbot class - Core chatbot logic with LangGraph
and optimized WordPress endpoints
"""

from typing import Any, Dict

from langchain_core.messages import HumanMessage
from langchain_core.runnables.config import RunnableConfig

from .utils.logging_config import setup_logging
from .wordpress import get_wordpress_client
from .workflow import create_graph

logger = setup_logging(__name__)


class VeronicaChatbot:
    """Chatbot Veronica con LangGraph e endpoint WordPress ottimizzati"""

    graph: Any

    def __init__(self) -> None:
        """Inizializza il chatbot"""
        logger.info("Inizializzazione VeronicaChatbot con endpoint ottimizzati")

        # Crea il grafo
        self.graph = create_graph()

        logger.info("VeronicaChatbot con endpoint ottimizzati pronto")

    def chat(self, message: str, thread_id: str = "default") -> str:
        """
        Metodo principale per la chat

        Args:
            message: Messaggio dell'utente
            thread_id: ID del thread per la persistenza della conversazione
        """
        try:
            # Configura il thread per la persistenza
            config = RunnableConfig(configurable={"thread_id": thread_id})

            # Prepara l'input
            input_state = {"messages": [HumanMessage(content=message)]}

            # Esegui il grafo
            result = self.graph.invoke(input_state, config)

            # Estrai la risposta
            if result and "messages" in result:
                last_message = result["messages"][-1]
                if hasattr(last_message, "content"):
                    return str(last_message.content)

            return "Mi dispiace, non sono riuscita a processare la tua richiesta."

        except Exception as e:
            logger.error(f"Errore nella chat: {e}", exc_info=True)
            return "Mi dispiace, c'è stato un errore. Riprova più tardi."

    def get_wordpress_stats(self) -> Dict[str, Any]:
        """
        Ottieni statistiche WordPress per debugging/monitoring

        Returns:
            Dict contenente status e statistiche degli endpoint WordPress
        """
        try:
            wp_client = get_wordpress_client()

            # Test tutti gli endpoint
            posts = wp_client.get_posts({"per_page": 1})
            projects = wp_client.get_projects({"per_page": 1})
            certifications = wp_client.get_certifications({"per_page": 1})
            work_experiences = wp_client.get_work_experiences({"per_page": 1})
            books = wp_client.get_books({"per_page": 1})
            tools = wp_client.get_tools({"per_page": 1})

            return {
                "status": "success",
                "wordpress_url": wp_client.base_url,
                "endpoints_status": {
                    "posts": {
                        "working": len(posts) > 0,
                        "count": len(posts),
                        "latest": (
                            posts[0].get("title", {}).get("rendered", "")
                            if posts
                            else "Nessuno"
                        ),
                    },
                    "projects": {
                        "working": len(projects) > 0,
                        "count": len(projects),
                        "latest": (
                            projects[0].get("title", {}).get("rendered", "")
                            if projects
                            else "Nessuno"
                        ),
                    },
                    "certifications": {
                        "working": len(certifications) > 0,
                        "count": len(certifications),
                        "latest": (
                            certifications[0].get("title", {}).get("rendered", "")
                            if certifications
                            else "Nessuno"
                        ),
                    },
                    "work_experiences": {
                        "working": len(work_experiences) > 0,
                        "count": len(work_experiences),
                        "latest": (
                            work_experiences[0].get("title", {}).get("rendered", "")
                            if work_experiences
                            else "Nessuno"
                        ),
                    },
                    "books": {
                        "working": len(books) > 0,
                        "count": len(books),
                        "latest": (
                            books[0].get("title", {}).get("rendered", "")
                            if books
                            else "Nessuno"
                        ),
                    },
                    "tools": {
                        "working": len(tools) > 0,
                        "count": len(tools),
                        "latest": (
                            tools[0].get("title", {}).get("rendered", "")
                            if tools
                            else "Nessuno"
                        ),
                    },
                },
            }

        except Exception as e:
            logger.error(f"Errore in get_wordpress_stats: {e}", exc_info=True)
            return {"status": "error", "error": str(e)}
