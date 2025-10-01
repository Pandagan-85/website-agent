"""
Chat endpoints
"""

from datetime import datetime

from fastapi import APIRouter, HTTPException, Request

from ...utils.logging_config import setup_logging
from ...utils.tracing import LANGSMITH_ENABLED, process_chat_with_tracing
from ..dependencies import get_chatbot, limiter
from ..models import ChatRequest, ChatResponse

logger = setup_logging(__name__)

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
                chat_request.message, chat_request.thread_id
            )
        else:
            response = chatbot.chat(chat_request.message, chat_request.thread_id)
            trace_url = None

        return ChatResponse(
            response=response,
            thread_id=chat_request.thread_id or "default",
            timestamp=datetime.now().isoformat(),
            langsmith_trace_url=trace_url,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore nel processare la chat: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Errore interno: {str(e)}")
