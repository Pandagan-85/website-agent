"""
Profile-related tools (certifications, work experience) - moved from chatbot.py
"""

import json
from langchain_core.tools import tool
from ..config import Configuration
from ..wordpress import OptimizedWordPressClient, ContentProcessor


@tool
def get_certifications(limit: int = 10) -> str:
    """Recupera le certificazioni e formazione di Veronica con dettagli completi."""
    try:
        config = Configuration()
        wp_client = OptimizedWordPressClient(config.wordpress_base_url)

        certifications = wp_client.get_certifications({"per_page": limit})

        if not certifications:
            return json.dumps({
                "message": "Nessuna certificazione trovata",
                "total": 0,
                "certifications": []
            })

        results = []
        for cert in certifications:
            processed = ContentProcessor.process_certification(cert)
            results.append(processed)

        return json.dumps({
            "total": len(results),
            "certifications": results
        })

    except Exception as e:
        return json.dumps({"error": f"Errore nel recupero certificazioni: {str(e)}"})


@tool
def get_work_experience(limit: int = 10) -> str:
    """Recupera le esperienze lavorative di Veronica con dettagli completi."""
    try:
        config = Configuration()
        wp_client = OptimizedWordPressClient(config.wordpress_base_url)

        experiences = wp_client.get_work_experiences({"per_page": limit})

        if not experiences:
            return json.dumps({
                "message": "Nessuna esperienza lavorativa trovata",
                "total": 0,
                "experiences": []
            })

        results = []
        for exp in experiences:
            processed = ContentProcessor.process_work_experience(exp)
            results.append(processed)

        return json.dumps({
            "total": len(results),
            "experiences": results
        })

    except Exception as e:
        return json.dumps({"error": f"Errore nel recupero esperienze: {str(e)}"})