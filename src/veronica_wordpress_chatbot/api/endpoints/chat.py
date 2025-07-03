"""
Chat endpoints - moved from main.py
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, Request

from ..models import ChatRequest, ChatResponse
from ..dependencies import get_chatbot, limiter
from ...utils.tracing import LANGSMITH_ENABLED, process_chat_with_tracing

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("10/minute")
async def chat_endpoint(request: Request, chat_request: ChatRequest):
    try:
        chatbot = get_chatbot()
        if chatbot is None:
            raise HTTPException(status_code=503, detail="Chatbot non disponibile")

        # ✅ Usa 'chat_request.message' non 'request.message'
        if not chat_request.message.strip():
            raise HTTPException(status_code=400, detail="Messaggio vuoto")

        # Process con tracing
        if LANGSMITH_ENABLED:
            response, trace_url = process_chat_with_tracing(
                chat_request.message, chat_request.thread_id)
        else:
            response = chatbot.chat(chat_request.message, chat_request.thread_id)
            trace_url = None

        return ChatResponse(
            response=response,
            thread_id=chat_request.thread_id,
            timestamp=datetime.now().isoformat(),
            langsmith_trace_url=trace_url
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Errore nel processare la chat: {e}")
        raise HTTPException(status_code=500, detail=f"Errore interno: {str(e)}")


@router.post("/simple-chat")
async def simple_chat_endpoint(request: dict):
    """Endpoint semplificato per compatibilità con versioni precedenti"""
    try:
        message = request.get("message", "")
        if not message:
            raise HTTPException(status_code=400, detail="Messaggio richiesto")

        chatbot = get_chatbot()
        if chatbot is None:
            return {"response": "Mi dispiace, il chatbot non è attualmente disponibile."}

        response = chatbot.chat(message)
        return {"response": response}

    except Exception as e:
        print(f"❌ Errore in simple chat: {e}")
        return {"response": "Mi dispiace, c'è stato un errore nel processare la tua richiesta."}