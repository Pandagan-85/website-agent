"""
FastAPI Main - Versione Refactored con LangSmith Tracing
"""

import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import json
from datetime import datetime

# LangSmith setup
from langsmith import trace, traceable
import langsmith

# Import del chatbot refactored
from chatbot import VeronicaChatbot, Configuration

# Configurazione LangSmith


def setup_langsmith():
    """Setup LangSmith per il tracing"""
    try:
        # Cerca sia LANGSMITH_API_KEY che LANGCHAIN_API_KEY
        langsmith_api_key = os.getenv(
            "LANGSMITH_API_KEY") or os.getenv("LANGCHAIN_API_KEY")
        langsmith_project = os.getenv(
            "LANGSMITH_PROJECT", "veronica-wordpress-chatbot")

        if langsmith_api_key:
            os.environ["LANGCHAIN_TRACING_V2"] = "true"
            os.environ["LANGCHAIN_API_KEY"] = langsmith_api_key
            os.environ["LANGCHAIN_PROJECT"] = langsmith_project
            print(f"✅ LangSmith attivato - Progetto: {langsmith_project}")
            return True
        else:
            print("ℹ️ LangSmith disabilitato (nessuna API key configurata)")
            return False
    except Exception as e:
        print(f"❌ Errore setup LangSmith: {e}")
        return False


# Setup LangSmith
LANGSMITH_ENABLED = setup_langsmith()

# Modelli Pydantic


class ChatRequest(BaseModel):
    message: str
    thread_id: Optional[str] = "default"
    conversation_history: Optional[List[Dict[str, str]]] = None


class ChatResponse(BaseModel):
    response: str
    thread_id: str
    timestamp: str
    langsmith_trace_url: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    services: Dict[str, Any]


# Inizializza FastAPI
app = FastAPI(
    title="Veronica Schembri WordPress Chatbot",
    description="AI Chatbot powered by LangGraph and WordPress API with LangSmith tracing",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In produzione, specifica i domini
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inizializza chatbot
chatbot = None


@app.on_event("startup")
async def startup_event():
    """Inizializza il chatbot all'avvio"""
    global chatbot
    try:
        print("🚀 Inizializzazione chatbot...")
        chatbot = VeronicaChatbot()
        print("✅ Chatbot inizializzato con successo!")
    except Exception as e:
        print(f"❌ Errore inizializzazione chatbot: {e}")
        chatbot = None

# Wrapper traceable per LangSmith


@traceable(name="wordpress_chatbot_request")
def process_chat_with_tracing(message: str, thread_id: str) -> tuple[str, Optional[str]]:
    """Processa la chat con tracing LangSmith aggiornato"""
    if chatbot is None:
        raise Exception("Chatbot non inizializzato")

    # Processa la richiesta (LangSmith traccia automaticamente)
    response = chatbot.chat(message, thread_id)

    # Ottieni trace URL se disponibile
    trace_url = None
    if LANGSMITH_ENABLED:
        try:
            # Il trace URL viene generato automaticamente da LangSmith
            project = os.getenv('LANGSMITH_PROJECT',
                                'veronica-wordpress-chatbot')
            trace_url = f"https://smith.langchain.com/projects/{project}"
        except:
            pass

    return response, trace_url

# Endpoints


@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint"""
    return {
        "message": "Veronica Schembri WordPress Chatbot API",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check completo"""
    try:
        # Test chatbot
        chatbot_status = "healthy" if chatbot is not None else "unhealthy"

        # Test WordPress API
        wordpress_stats = {}
        if chatbot:
            try:
                wordpress_stats = chatbot.get_wordpress_stats()
                wordpress_status = "healthy" if wordpress_stats.get(
                    "status") == "success" else "unhealthy"
            except Exception as e:
                wordpress_status = "unhealthy"
                wordpress_stats = {"error": str(e)}
        else:
            wordpress_status = "unknown"

        # Test LangSmith
        langsmith_status = "enabled" if LANGSMITH_ENABLED else "disabled"

        overall_status = "healthy" if chatbot_status == "healthy" and wordpress_status == "healthy" else "degraded"

        return HealthResponse(
            status=overall_status,
            timestamp=datetime.now().isoformat(),
            services={
                "chatbot": chatbot_status,
                "wordpress_api": wordpress_status,
                "langsmith_tracing": langsmith_status,
                "wordpress_details": wordpress_stats
            }
        )

    except Exception as e:
        return HealthResponse(
            status="unhealthy",
            timestamp=datetime.now().isoformat(),
            services={
                "error": str(e)
            }
        )


@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Endpoint principale per la chat con tracing LangSmith
    """
    try:
        if chatbot is None:
            raise HTTPException(
                status_code=503, detail="Chatbot non disponibile")

        # Valida input
        if not request.message.strip():
            raise HTTPException(status_code=400, detail="Messaggio vuoto")

        # Processa con tracing
        if LANGSMITH_ENABLED:
            response, trace_url = process_chat_with_tracing(
                request.message, request.thread_id)
        else:
            response = chatbot.chat(request.message, request.thread_id)
            trace_url = None

        return ChatResponse(
            response=response,
            thread_id=request.thread_id,
            timestamp=datetime.now().isoformat(),
            langsmith_trace_url=trace_url
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Errore nel processare la chat: {e}")
        raise HTTPException(
            status_code=500, detail=f"Errore interno: {str(e)}")


@app.post("/simple-chat")
async def simple_chat_endpoint(request: dict):
    """Endpoint semplificato per compatibilità con versioni precedenti"""
    try:
        message = request.get("message", "")
        if not message:
            raise HTTPException(status_code=400, detail="Messaggio richiesto")

        if chatbot is None:
            return {"response": "Mi dispiace, il chatbot non è attualmente disponibile."}

        response = chatbot.chat(message)
        return {"response": response}

    except Exception as e:
        print(f"❌ Errore in simple chat: {e}")
        return {"response": "Mi dispiace, c'è stato un errore nel processare la tua richiesta."}


@app.get("/wordpress/test")
async def test_wordpress():
    """Test della connessione WordPress"""
    try:
        if chatbot is None:
            raise HTTPException(
                status_code=503, detail="Chatbot non inizializzato")

        stats = chatbot.get_wordpress_stats()
        return stats

    except Exception as e:
        return {
            "status": "error",
            "message": f"Errore nel test WordPress: {str(e)}"
        }


@app.get("/wordpress/stats")
async def wordpress_stats():
    """Statistiche dettagliate WordPress"""
    try:
        if chatbot is None:
            raise HTTPException(
                status_code=503, detail="Chatbot non inizializzato")

        stats = chatbot.get_wordpress_stats()

        # Aggiungi informazioni aggiuntive
        config = Configuration()
        stats["api_info"] = {
            "base_url": config.wordpress_base_url,
            "api_endpoints": [
                f"{config.wordpress_base_url}/wp-json/wp/v2/posts",
                f"{config.wordpress_base_url}/wp-json/wp/v2/projects",
                f"{config.wordpress_base_url}/wp-json/wp/v2/certifications",
                f"{config.wordpress_base_url}/wp-json/wp/v2/work-experiences"
            ]
        }

        return stats

    except Exception as e:
        return {
            "status": "error",
            "message": f"Errore nel recupero stats WordPress: {str(e)}"
        }


@app.get("/api/info")
async def api_info():
    """Informazioni sull'API"""
    return {
        "name": "Veronica Schembri WordPress Chatbot API",
        "version": "2.0.0",
        "description": "AI chatbot powered by LangGraph and WordPress API with LangSmith tracing",
        "features": [
            "LangGraph ReAct pattern",
            "WordPress API integration",
            "LangSmith tracing",
            "Conversation persistence",
            "Professional AI representation"
        ],
        "endpoints": {
            "/": "Root endpoint",
            "/health": "Health check",
            "/wordpress/test": "Test WordPress connection",
            "/wordpress/stats": "WordPress content statistics",
            "/chat": "Main chat endpoint (POST)",
            "/simple-chat": "Simple chat endpoint (POST)",
            "/api/info": "This endpoint"
        },
        "langsmith": {
            "enabled": LANGSMITH_ENABLED,
            "project": os.getenv("LANGSMITH_PROJECT", "veronica-wordpress-chatbot") if LANGSMITH_ENABLED else None
        }
    }


@app.get("/debug/tools")
async def debug_tools():
    """Debug endpoint per verificare i tools disponibili"""
    try:
        from langgraph_wordpress_chatbot import TOOLS

        tools_info = []
        for tool in TOOLS:
            tools_info.append({
                "name": tool.name,
                "description": tool.description,
                "args": tool.args
            })

        return {
            "status": "success",
            "tools_count": len(TOOLS),
            "tools": tools_info
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

# Endpoint per test del sistema


@app.post("/test/conversation")
async def test_conversation():
    """Test di una conversazione completa"""
    if chatbot is None:
        raise HTTPException(status_code=503, detail="Chatbot non disponibile")

    test_messages = [
        "Ciao! Chi sei?",
        "Parlami dei tuoi ultimi articoli",
        "Che progetti hai nel tuo portfolio?",
        "Quali certificazioni hai conseguito?"
    ]

    results = []
    thread_id = f"test_{datetime.now().timestamp()}"

    for i, message in enumerate(test_messages):
        try:
            if LANGSMITH_ENABLED:
                response, trace_url = process_chat_with_tracing(
                    message, thread_id)
            else:
                response = chatbot.chat(message, thread_id)
                trace_url = None

            results.append({
                "step": i + 1,
                "message": message,
                "response": response[:200] + "..." if len(response) > 200 else response,
                "trace_url": trace_url,
                "success": True
            })
        except Exception as e:
            results.append({
                "step": i + 1,
                "message": message,
                "error": str(e),
                "success": False
            })

    return {
        "test_results": results,
        "thread_id": thread_id,
        "langsmith_enabled": LANGSMITH_ENABLED
    }

if __name__ == "__main__":
    print("🚀 Starting Veronica Schembri WordPress Chatbot API v2.0...")
    print("📍 Local server: http://localhost:8000")
    print("📖 API docs: http://localhost:8000/docs")
    print("🔍 Health check: http://localhost:8000/health")
    print("🧪 Test WordPress: http://localhost:8000/wordpress/test")

    if LANGSMITH_ENABLED:
        print(
            f"📊 LangSmith Project: {os.getenv('LANGSMITH_PROJECT', 'veronica-wordpress-chatbot')}")
    else:
        print("⚠️ LangSmith tracing non attivo")

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
