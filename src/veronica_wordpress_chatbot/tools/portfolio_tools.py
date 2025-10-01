"""
Portfolio-related tools
"""

import json

from langchain_core.tools import tool

from ..wordpress import ContentProcessor, get_wordpress_client


@tool
def get_portfolio_projects(category: str = "", limit: int = 10) -> str:
    """
    Recupera progetti del portfolio di Veronica con tutti i dettagli.

    Args:
        category: Categoria progetti (ai, web, ecc.) - opzionale
        limit: Numero massimo di progetti (default 10)
    """
    try:
        wp_client = get_wordpress_client()

        params = {"per_page": limit}
        # Note: category filtering può essere implementato se necessario

        projects = wp_client.get_projects(params)

        if not projects:
            return json.dumps(
                {
                    "message": "Nessun progetto trovato nel portfolio",
                    "total": 0,
                    "projects": [],
                }
            )

        results = []
        for project in projects:
            processed = ContentProcessor.process_project(project)
            results.append(processed)

        return json.dumps({"total": len(results), "projects": results})

    except Exception as e:
        return json.dumps({"error": f"Errore nel recupero progetti: {str(e)}"})
