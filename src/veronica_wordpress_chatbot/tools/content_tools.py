"""
Content-related tools (books, tools stack)
"""

import json

from langchain_core.tools import tool

from ..wordpress import ContentProcessor, get_wordpress_client


@tool
def get_books_and_reading(limit: int = 10) -> str:
    """Recupera i libri letti e recensiti da Veronica."""
    try:
        wp_client = get_wordpress_client()

        books = wp_client.get_books({"per_page": limit})

        if not books:
            return json.dumps(
                {"message": "Nessun libro trovato", "total": 0, "books": []}
            )

        results = []
        for book in books:
            processed = ContentProcessor.process_book(book)
            results.append(processed)

        return json.dumps({"total": len(results), "books": results})

    except Exception as e:
        return json.dumps({"error": f"Errore nel recupero libri: {str(e)}"})


@tool
def get_tools_and_stack(category: str = "", limit: int = 20) -> str:
    """Recupera strumenti personali e stack tecnologico professionale di Veronica.

    Args:
        category: Filtra per categoria (es. 'AI', 'Design', 'Development', 'MLOps')
        limit: Numero massimo di risultati
    """
    try:
        wp_client = get_wordpress_client()

        # Recupera sia tools che stacks
        tools = wp_client.get_tools({"per_page": limit})
        stacks = wp_client.get_stacks({"per_page": limit})

        results = {
            "personal_tools": [],  # Strumenti uso personale
            "professional_stack": []  # Stack tecnologico lavoro
        }

        # Processa tools
        for tool in tools:
            processed = ContentProcessor.process_tool(tool)
            # Filtra per categoria se specificata
            if not category or any(category.lower() in cat.lower() for cat in processed["categories"]):
                results["personal_tools"].append(processed)

        # Processa stacks
        for stack in stacks:
            processed = ContentProcessor.process_stack(stack)
            # Filtra per categoria se specificata
            if not category or any(category.lower() in cat.lower() for cat in processed["categories"]):
                results["professional_stack"].append(processed)

        return json.dumps({
            "total_personal": len(results["personal_tools"]),
            "total_professional": len(results["professional_stack"]),
            "data": results
        })

    except Exception as e:
        return json.dumps({"error": f"Errore nel recupero strumenti: {str(e)}"})
