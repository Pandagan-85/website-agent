"""
Content-related tools (books, tools stack) - moved from chatbot.py
"""

import json
from langchain_core.tools import tool
from ..config import Configuration
from ..wordpress import OptimizedWordPressClient, ContentProcessor


@tool
def get_books_and_reading(limit: int = 10) -> str:
    """Recupera i libri letti e recensiti da Veronica."""
    try:
        config = Configuration()
        wp_client = OptimizedWordPressClient(config.wordpress_base_url)

        books = wp_client.get_books({"per_page": limit})

        if not books:
            return json.dumps({
                "message": "Nessun libro trovato",
                "total": 0,
                "books": []
            })

        results = []
        for book in books:
            processed = ContentProcessor.process_book(book)
            results.append(processed)

        return json.dumps({
            "total": len(results),
            "books": results
        })

    except Exception as e:
        return json.dumps({"error": f"Errore nel recupero libri: {str(e)}"})


@tool
def get_tools_and_stack(limit: int = 15) -> str:
    """Recupera gli strumenti e stack tecnologico di Veronica."""
    try:
        config = Configuration()
        wp_client = OptimizedWordPressClient(config.wordpress_base_url)

        tools = wp_client.get_tools({"per_page": limit})

        if not tools:
            return json.dumps({
                "message": "Nessuno strumento trovato",
                "total": 0,
                "tools": []
            })

        results = []
        for tool in tools:
            processed = ContentProcessor.process_tool(tool)
            results.append(processed)

        return json.dumps({
            "total": len(results),
            "tools": results
        })

    except Exception as e:
        return json.dumps({"error": f"Errore nel recupero strumenti: {str(e)}"})