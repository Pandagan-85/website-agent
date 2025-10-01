"""
Blog-related tools - search posts, get latest post
"""

import json
from typing import Any, Dict

from langchain_core.tools import tool

from ..wordpress import ContentProcessor, get_wordpress_client


@tool
def search_blog_posts(query: str = "", limit: int = 5) -> str:
    """
    Cerca negli articoli del blog di Veronica per argomenti specifici.
    Se query è vuota, restituisce gli articoli più recenti.

    Args:
        query: Termine di ricerca per trovare articoli rilevanti (opzionale)
        limit: Numero massimo di risultati (default 5)
    """
    try:
        wp_client = get_wordpress_client()

        params: Dict[str, Any] = {"per_page": limit}
        if query.strip():
            params["search"] = query

        posts = wp_client.get_posts(params)

        if not posts:
            return json.dumps(
                {
                    "message": f"Nessun articolo trovato"
                    + (f" per la ricerca: {query}" if query else ""),
                    "total": 0,
                    "articles": [],
                }
            )

        results = []
        for post in posts:
            processed = ContentProcessor.process_post(post)
            results.append(processed)

        return json.dumps(
            {
                "total": len(results),
                "search_query": query if query else "ultimi articoli",
                "articles": results,
            }
        )

    except Exception as e:
        return json.dumps({"error": f"Errore nella ricerca articoli: {str(e)}"})


@tool
def get_latest_blog_post() -> str:
    """Recupera l'ultimo articolo pubblicato sul blog di Veronica con dettagli completi."""
    try:
        wp_client = get_wordpress_client()

        posts = wp_client.get_posts({"per_page": 1})

        if not posts:
            return json.dumps({"message": "Nessun articolo trovato"})

        processed = ContentProcessor.process_post(posts[0])

        return json.dumps(
            {"latest_article": processed, "message": "Ultimo articolo pubblicato"}
        )

    except Exception as e:
        return json.dumps({"error": f"Errore nel recupero ultimo articolo: {str(e)}"})
