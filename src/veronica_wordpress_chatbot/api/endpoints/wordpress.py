"""
WordPress endpoints
"""

from fastapi import APIRouter, HTTPException

from ...config import Configuration
from ..dependencies import get_chatbot

router = APIRouter()


@router.get("/test")
async def test_wordpress():
    """Test della connessione WordPress"""
    try:
        chatbot = get_chatbot()
        if chatbot is None:
            raise HTTPException(status_code=503, detail="Chatbot non inizializzato")

        stats = chatbot.get_wordpress_stats()
        return stats

    except Exception as e:
        return {"status": "error", "message": f"Errore nel test WordPress: {str(e)}"}


@router.get("/stats")
async def wordpress_stats():
    """Statistiche dettagliate WordPress"""
    try:
        chatbot = get_chatbot()
        if chatbot is None:
            raise HTTPException(status_code=503, detail="Chatbot non inizializzato")

        stats = chatbot.get_wordpress_stats()

        # Aggiungi informazioni aggiuntive
        config = Configuration()
        stats["api_info"] = {
            "base_url": config.wordpress_base_url,
            "api_endpoints": [
                f"{config.wordpress_base_url}/wp-json/wp/v2/posts",
                f"{config.wordpress_base_url}/wp-json/wp/v2/projects",
                f"{config.wordpress_base_url}/wp-json/wp/v2/certifications",
                f"{config.wordpress_base_url}/wp-json/wp/v2/work-experiences",
            ],
        }

        return stats

    except Exception as e:
        return {
            "status": "error",
            "message": f"Errore nel recupero stats WordPress: {str(e)}",
        }
