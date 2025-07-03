"""
VeronicaChatbot class - Refactored and simplified
All components moved to dedicated modules
"""

import asyncio
from typing import Dict, Any
from langchain_core.messages import HumanMessage
from langchain_core.runnables.config import RunnableConfig

from .workflow import create_graph
from .config import Configuration
from .wordpress import OptimizedWordPressClient
from .tools import get_all_tools


class VeronicaChatbot:
    """Chatbot Veronica con LangGraph e endpoint WordPress ottimizzati"""

    def __init__(self):
        """Inizializza il chatbot"""
        print("🤖 Inizializzazione VeronicaChatbot con endpoint ottimizzati...")

        # Crea il grafo
        self.graph = create_graph()

        print("✅ VeronicaChatbot con endpoint ottimizzati pronto!")

    def chat(self, message: str, thread_id: str = "default") -> str:
        """
        Metodo principale per la chat

        Args:
            message: Messaggio dell'utente
            thread_id: ID del thread per la persistenza della conversazione
        """
        try:
            # Configura il thread per la persistenza
            config = RunnableConfig(
                configurable={"thread_id": thread_id}
            )

            # Prepara l'input
            input_state = {
                "messages": [HumanMessage(content=message)]
            }

            # Esegui il grafo
            result = self.graph.invoke(input_state, config)

            # Estrai la risposta
            if result and "messages" in result:
                last_message = result["messages"][-1]
                if hasattr(last_message, 'content'):
                    return last_message.content

            return "Mi dispiace, non sono riuscita a processare la tua richiesta."

        except Exception as e:
            print(f"❌ Errore nella chat: {e}")
            return "Mi dispiace, c'è stato un errore. Riprova più tardi."

    def get_wordpress_stats(self) -> Dict[str, Any]:
        """Ottieni statistiche WordPress per debugging"""
        try:
            config = Configuration()
            wp_client = OptimizedWordPressClient(config.wordpress_base_url)

            # Test tutti gli endpoint
            posts = wp_client.get_posts({"per_page": 1})
            projects = wp_client.get_projects({"per_page": 1})
            certifications = wp_client.get_certifications({"per_page": 1})
            work_experiences = wp_client.get_work_experiences({"per_page": 1})
            books = wp_client.get_books({"per_page": 1})
            tools = wp_client.get_tools({"per_page": 1})

            return {
                "status": "success",
                "wordpress_url": config.wordpress_base_url,
                "endpoints_status": {
                    "posts": {
                        "working": len(posts) > 0,
                        "count": len(posts),
                        "latest": posts[0].get("title", {}).get("rendered", "") if posts else "Nessuno"
                    },
                    "projects": {
                        "working": len(projects) > 0,
                        "count": len(projects),
                        "latest": projects[0].get("title", {}).get("rendered", "") if projects else "Nessuno"
                    },
                    "certifications": {
                        "working": len(certifications) > 0,
                        "count": len(certifications),
                        "latest": certifications[0].get("title", {}).get("rendered", "") if certifications else "Nessuno"
                    },
                    "work_experiences": {
                        "working": len(work_experiences) > 0,
                        "count": len(work_experiences),
                        "latest": work_experiences[0].get("title", {}).get("rendered", "") if work_experiences else "Nessuno"
                    },
                    "books": {
                        "working": len(books) > 0,
                        "count": len(books),
                        "latest": books[0].get("title", {}).get("rendered", "") if books else "Nessuno"
                    },
                    "tools": {
                        "working": len(tools) > 0,
                        "count": len(tools),
                        "latest": tools[0].get("title", {}).get("rendered", "") if tools else "Nessuno"
                    }
                },
                "api_endpoints": [
                    f"{config.wordpress_base_url}/wp-json/wp/v2/posts",
                    f"{config.wordpress_base_url}/wp-json/wp/v2/projects",
                    f"{config.wordpress_base_url}/wp-json/wp/v2/certifications",
                    f"{config.wordpress_base_url}/wp-json/wp/v2/work-experiences",
                    f"{config.wordpress_base_url}/wp-json/wp/v2/books",
                    f"{config.wordpress_base_url}/wp-json/wp/v2/tools"
                ]
            }

        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }

    def test_all_tools(self) -> Dict[str, Any]:
        """Testa tutti i tools per debugging"""
        try:
            import json
            from .tools import TOOLS

            results = {}

            # Test ogni tool
            tool_tests = [
                ("search_blog_posts", lambda: TOOLS[0].invoke(
                    {"query": "", "limit": 2})),
                ("get_latest_blog_post", lambda: TOOLS[1].invoke({})),
                ("get_portfolio_projects",
                 lambda: TOOLS[2].invoke({"limit": 2})),
                ("get_certifications",
                 lambda: TOOLS[3].invoke({"limit": 2})),
                ("get_work_experience",
                 lambda: TOOLS[4].invoke({"limit": 2})),
                ("get_books_and_reading",
                 lambda: TOOLS[5].invoke({"limit": 2})),
                ("get_tools_and_stack",
                 lambda: TOOLS[6].invoke({"limit": 2})),
                ("get_contact_info", lambda: TOOLS[8].invoke({}))
            ]

            for tool_name, tool_func in tool_tests:
                try:
                    print(f"🔧 Testing {tool_name}...")
                    result = tool_func()
                    # Parse JSON result
                    if isinstance(result, str):
                        parsed = json.loads(result)
                        results[tool_name] = {
                            "status": "success",
                            "has_data": len(parsed) > 0 if isinstance(parsed, list) else bool(parsed.get("total", 0) if isinstance(parsed, dict) else True),
                            "preview": str(parsed)[:200] + "..." if len(str(parsed)) > 200 else str(parsed)
                        }
                    else:
                        results[tool_name] = {
                            "status": "success",
                            "result": str(result)[:200] + "..." if len(str(result)) > 200 else str(result)
                        }
                except Exception as e:
                    results[tool_name] = {
                        "status": "error",
                        "error": str(e)
                    }

            return {
                "status": "completed",
                "tools_tested": len(results),
                "results": results
            }

        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }


# Test function avanzata
async def test_chatbot_complete():
    """Funzione di test completa per il chatbot ottimizzato"""
    print("🧪 Test completo del chatbot ottimizzato...")

    chatbot = VeronicaChatbot()

    # Test 1: WordPress Stats
    print("\n--- Test 1: WordPress Endpoints ---")
    stats = chatbot.get_wordpress_stats()
    print(f"Status: {stats.get('status')}")
    if stats.get('status') == 'success':
        for endpoint, info in stats.get('endpoints_status', {}).items():
            status = "✅" if info.get('working') else "❌"
            print(
                f"{status} {endpoint}: {info.get('count', 0)} items, latest: {info.get('latest', 'N/A')[:50]}...")

    # Test 2: Tools Individuali
    print("\n--- Test 2: Tools Individuali ---")
    tool_results = chatbot.test_all_tools()
    print(f"Tools testati: {tool_results.get('tools_tested', 0)}")
    for tool_name, result in tool_results.get('results', {}).items():
        status = "✅" if result.get('status') == 'success' else "❌"
        print(
            f"{status} {tool_name}: {result.get('preview', result.get('error', 'N/A'))[:80]}...")

    # Test 3: Conversazioni Reali
    print("\n--- Test 3: Conversazioni ---")
    test_messages = [
        "Ciao! Chi sei?",
        "Qual è il tuo ultimo articolo?",
        "Parlami dei tuoi progetti di AI",
        "Che certificazioni hai?",
        "Quali strumenti usi per sviluppare?",
        "Hai mai letto libri su machine learning?"
    ]

    for i, message in enumerate(test_messages, 1):
        print(f"\n🗣️ Test {i}: {message}")
        response = chatbot.chat(message, thread_id=f"test_{i}")
        print(f"🤖 Risposta: {response[:150]}...")

    print("\n✅ Test completo terminato!")


# Test rapido per WordPress endpoints
def quick_wordpress_test():
    """Test rapido degli endpoint WordPress"""
    print("🔍 Quick test WordPress endpoints...")

    config = Configuration()
    wp_client = OptimizedWordPressClient(config.wordpress_base_url)

    endpoints = [
        ("Posts", wp_client.get_posts),
        ("Projects", wp_client.get_projects),
        ("Certifications", wp_client.get_certifications),
        ("Work Experiences", wp_client.get_work_experiences),
        ("Books", wp_client.get_books),
        ("Tools", wp_client.get_tools)
    ]

    for name, func in endpoints:
        try:
            data = func({"per_page": 1})
            status = "✅" if data and len(data) > 0 else "⚠️"
            count = len(data) if data else 0
            print(f"{status} {name}: {count} items")
        except Exception as e:
            print(f"❌ {name}: Error - {e}")


if __name__ == "__main__":
    # Setup environment variables
    from dotenv import load_dotenv
    load_dotenv()

    print("🚀 VeronicaChatbot con Endpoint Ottimizzati")
    print("=" * 50)

    # Quick test WordPress
    quick_wordpress_test()

    print("\n" + "=" * 50)
    print("Per test completo, usa: asyncio.run(test_chatbot_complete())")

    # Test del sistema completo se richiesto
    import sys
    if "--full-test" in sys.argv:
        asyncio.run(test_chatbot_complete())
