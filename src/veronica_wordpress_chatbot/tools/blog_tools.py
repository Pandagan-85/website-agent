"""
Blog-related tools - moved from chatbot.py
"""

import json
from langchain_core.tools import tool
from ..config import Configuration
from ..wordpress import OptimizedWordPressClient, ContentProcessor


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
        config = Configuration()
        wp_client = OptimizedWordPressClient(config.wordpress_base_url)

        params = {"per_page": limit}
        if query.strip():
            params["search"] = query

        posts = wp_client.get_posts(params)

        if not posts:
            return json.dumps({
                "message": f"Nessun articolo trovato" + (f" per la ricerca: {query}" if query else ""),
                "total": 0,
                "articles": []
            })

        results = []
        for post in posts:
            processed = ContentProcessor.process_post(post)
            results.append(processed)

        return json.dumps({
            "total": len(results),
            "search_query": query if query else "ultimi articoli",
            "articles": results
        })

    except Exception as e:
        return json.dumps({"error": f"Errore nella ricerca articoli: {str(e)}"})


@tool
def get_latest_blog_post() -> str:
    """Recupera l'ultimo articolo pubblicato sul blog di Veronica con dettagli completi."""
    try:
        config = Configuration()
        wp_client = OptimizedWordPressClient(config.wordpress_base_url)

        posts = wp_client.get_posts({"per_page": 1})

        if not posts:
            return json.dumps({"message": "Nessun articolo trovato"})

        processed = ContentProcessor.process_post(posts[0])

        return json.dumps({
            "latest_article": processed,
            "message": "Ultimo articolo pubblicato"
        })

    except Exception as e:
        return json.dumps({"error": f"Errore nel recupero ultimo articolo: {str(e)}"})