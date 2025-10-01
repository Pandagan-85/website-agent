"""
Search and contact tools
"""

import json
from typing import Any, Dict, List

from langchain_core.tools import tool

from ..config import CONTACT_INFO
from ..wordpress import ContentProcessor, get_wordpress_client


@tool
def search_all_content(query: str, limit_per_type: int = 3) -> str:
    """
    Ricerca generale nei contenuti di Veronica (articoli, progetti, certificazioni, etc.).

    Args:
        query: Termine di ricerca
        limit_per_type: Limite risultati per tipo di contenuto
    """
    try:
        wp_client = get_wordpress_client()

        results: Dict[str, Any] = {"search_query": query, "results": {}}

        # Cerca in articoli
        posts = wp_client.get_posts({"search": query, "per_page": limit_per_type})
        if posts:
            results["results"]["articles"] = [
                ContentProcessor.process_post(p) for p in posts
            ]

        # Cerca in progetti
        projects = wp_client.get_projects({"search": query, "per_page": limit_per_type})
        if projects:
            results["results"]["projects"] = [
                ContentProcessor.process_project(p) for p in projects
            ]

        # Cerca in certificazioni
        certifications = wp_client.get_certifications(
            {"search": query, "per_page": limit_per_type}
        )
        if certifications:
            results["results"]["certifications"] = [
                ContentProcessor.process_certification(c) for c in certifications
            ]

        # Cerca in strumenti
        tools_list = wp_client.get_tools({"search": query, "per_page": limit_per_type})
        if tools_list:
            results["results"]["tools"] = [
                ContentProcessor.process_tool(t) for t in tools_list
            ]

        return json.dumps(results)

    except Exception as e:
        return json.dumps({"error": f"Errore nella ricerca generale: {str(e)}"})


@tool
def get_contact_info() -> str:
    """Restituisce le informazioni di contatto di Veronica."""
    return json.dumps(
        {
            "contacts": CONTACT_INFO,
            "message": "Contattami per collaborazioni, progetti o semplicemente per fare una chiacchierata tech!",
        }
    )
