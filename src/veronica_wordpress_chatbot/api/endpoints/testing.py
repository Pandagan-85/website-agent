"""
Testing and debug endpoints
"""

from datetime import datetime

from fastapi import APIRouter, HTTPException, Request

from ...utils.tracing import LANGSMITH_ENABLED, process_chat_with_tracing
from ..dependencies import get_chatbot, limiter
from ..models import ChatRequest

router = APIRouter()


# --- TEST ENDPOINTS (da eliminare in produzione) ---


@router.get("/test-rate-limit")
@limiter.limit("3/minute")  # Solo 3 richieste per test
async def test_rate_limit(request: Request):
    return {"message": "Rate limit working!", "timestamp": datetime.now().isoformat()}


@router.post("/test-validation")
async def test_validation(request: ChatRequest):
    return {
        "message": "Validation passed!",
        "received_message": request.message,
        "thread_id": request.thread_id,
    }


# --- DEBUG ENDPOINTS ---


@router.get("/debug/tools")
async def debug_tools():
    """Debug endpoint per verificare i tools disponibili"""
    try:
        from ...tools import TOOLS

        tools_info = []
        for tool in TOOLS:
            tools_info.append(
                {"name": tool.name, "description": tool.description, "args": tool.args}
            )

        return {"status": "success", "tools_count": len(TOOLS), "tools": tools_info}

    except Exception as e:
        return {"status": "error", "message": str(e)}


# --- TEST CONVERSATION ---


@router.post("/test/conversation")
async def test_conversation():
    """Test di una conversazione completa"""
    chatbot = get_chatbot()
    if chatbot is None:
        raise HTTPException(status_code=503, detail="Chatbot non disponibile")

    test_messages = [
        "Ciao! Chi sei?",
        "Parlami dei tuoi ultimi articoli",
        "Che progetti hai nel tuo portfolio?",
        "Quali certificazioni hai conseguito?",
    ]

    results = []
    thread_id = f"test_{datetime.now().timestamp()}"

    for i, message in enumerate(test_messages):
        try:
            if LANGSMITH_ENABLED:
                response, trace_url = process_chat_with_tracing(message, thread_id)
            else:
                response = chatbot.chat(message, thread_id)
                trace_url = None

            results.append(
                {
                    "step": i + 1,
                    "message": message,
                    "response": (
                        response[:200] + "..." if len(response) > 200 else response
                    ),
                    "trace_url": trace_url,
                    "success": True,
                }
            )
        except Exception as e:
            results.append(
                {"step": i + 1, "message": message, "error": str(e), "success": False}
            )

    return {
        "test_results": results,
        "thread_id": thread_id,
        "langsmith_enabled": LANGSMITH_ENABLED,
    }
