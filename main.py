"""
FastAPI Main - Versione Refactored con LangSmith Tracing
"""

import os
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import Dict, Any, Optional, List, Pattern
import json
from datetime import datetime
import re
import time
import logging

# import rate limit
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

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
    message: str = Field(..., min_length=1, max_length=2000, description="User message")
    thread_id: Optional[str] = Field(default="default", max_length=100, description="Conversation thread ID")
    conversation_history: Optional[List[Dict[str, str]]] = Field(default=None, description="Previous conversation")

    @validator('message')
    def validate_message_security(cls, v):
        """Validate message for security threats"""
        if not validate_input_security(v):
            raise ValueError('Message contains invalid or potentially malicious content')
        return v.strip()

    @validator('thread_id')
    def validate_thread_id_format(cls, v):
        """Validate thread ID format"""
        if v and not validate_thread_id(v):
            raise ValueError('Invalid thread ID format')
        return v or "default"

    class Config:
        schema_extra = {
            "example": {
                "message": "Ciao! Parlami dei tuoi progetti di AI",
                "thread_id": "user_123"
            }
        }


class ChatResponse(BaseModel):
    response: str
    thread_id: str
    timestamp: str
    langsmith_trace_url: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    services: Dict[str, Any]

# Setup logger 
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("veronica_chatbot")

# Inizializza FastAPI
app = FastAPI(
    title="Veronica Schembri WordPress Chatbot",
    description="AI Chatbot powered by LangGraph and WordPress API with LangSmith tracing",
    version="2.0.0"
)

# Rate limit setup
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Funzione per gestire CORS in base all'ambiente
def get_cors_origins() -> List[str]:
    """Get CORS origins based on environment"""
    env = os.getenv("ENVIRONMENT", "development")
    
    if env == "production":
        return [
            "https://www.veronicaschembri.com",
            "https://veronicaschembri.com",
        ]
    elif env == "staging":
        return [
            "https://staging.veronicaschembri.com",
            "https://www.veronicaschembri.com",
        ]
    else:  # development
        return [
            "http://localhost:3000",
            "http://localhost:8080", 
            "http://127.0.0.1:3000",
            "http://127.0.0.1:8080",
            "http://0.0.0.0:3000",         # Se server usa 0.0.0.0
            "http://0.0.0.0:8080",         # Se server usa 0.0.0.0
            "https://www.veronicaschembri.com",  # Per test con sito reale
        ]


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language", 
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-WP-Nonce",  # Per WordPress
    ],
    max_age=600,  # Cache preflight per 10 minuti
)

# Inizializza chatbot
chatbot = None

# Security validation patterns
MALICIOUS_PATTERNS: List[Pattern] = [
    re.compile(r'<script[^>]*>.*?</script>', re.IGNORECASE | re.DOTALL),
    re.compile(r'javascript:', re.IGNORECASE),
    re.compile(r'on\w+\s*=', re.IGNORECASE),  # onclick, onload, etc.
    re.compile(r'<iframe[^>]*>', re.IGNORECASE),
    re.compile(r'<object[^>]*>', re.IGNORECASE),
    re.compile(r'<embed[^>]*>', re.IGNORECASE),
    re.compile(r'vbscript:', re.IGNORECASE),
    re.compile(r'eval\s*\(', re.IGNORECASE),
    re.compile(r'expression\s*\(', re.IGNORECASE),
    re.compile(r'document\.|window\.', re.IGNORECASE),
    re.compile(r'&lt;script', re.IGNORECASE),  # Encoded script tags
    re.compile(r'&#60;script', re.IGNORECASE),
    re.compile(r'data:text/html', re.IGNORECASE),
    re.compile(r'data:image/svg', re.IGNORECASE),
]

def validate_input_security(text: str) -> bool:
    """Comprehensive input security validation"""
    if not text or not isinstance(text, str):
        return False
    
    # Length check - prevent resource exhaustion
    if len(text) > 2000:
        return False
    
    # Empty/whitespace check
    if not text.strip():
        return False
    
    # Character encoding check
    try:
        text.encode('utf-8')
    except UnicodeError:
        return False
    
    # Malicious pattern check
    for pattern in MALICIOUS_PATTERNS:
        if pattern.search(text):
            return False
    
    # Suspicious repeated characters (potential DoS)
    suspicious_chars = ['x', 'a', '1', ' ', '.', '-']
    for char in suspicious_chars:
        if char * 50 in text:  # 50+ repeated chars
            return False
    
    return True

def validate_thread_id(thread_id: str) -> bool:
    """Validate thread ID format"""
    if not thread_id or len(thread_id) > 100:
        return False
    
    # Only alphanumeric, underscore, hyphen
    if not re.match(r'^[a-zA-Z0-9_-]+$', thread_id):
        return False
    
    return True

## Security headers ---

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses"""
    response = await call_next(request)
    
    # Prevent MIME type sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"
    
    # Prevent clickjacking
    response.headers["X-Frame-Options"] = "DENY"
    
    # XSS protection (legacy browsers)
    response.headers["X-XSS-Protection"] = "1; mode=block"
    
    # Force HTTPS (only in production)
    if os.getenv("ENVIRONMENT") == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    # Control referrer information
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    # Basic Content Security Policy
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; object-src 'none';"
    
    # Prevent caching of sensitive data
    if request.url.path.startswith("/chat"):
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
        response.headers["Pragma"] = "no-cache"
    
    return response

@app.middleware("http")
async def security_logging_middleware(request: Request, call_next):
    """Log security-relevant events"""
    start_time = time.time()
    
    # Extract client info
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")
    origin = request.headers.get("origin", "")
    
    # Log request info
    request_info = {
        "timestamp": datetime.now().isoformat(),
        "method": request.method,
        "path": str(request.url.path),
        "client_ip": client_ip,
        "user_agent": user_agent[:200],  # Truncate long user agents
        "origin": origin,
        "content_length": request.headers.get("content-length", 0)
    }
    
    # Process request
    response = await call_next(request)
    
    # Calculate processing time
    process_time = time.time() - start_time
    
    # Log response info
    response_info = {
        **request_info,
        "status_code": response.status_code,
        "process_time": round(process_time, 3),
    }
    
    # Log different events based on response
    if response.status_code >= 500:
        logger.error(f"Server Error: {json.dumps(response_info)}")
    elif response.status_code == 429:  # Rate limit hit
        logger.warning(f"Rate Limit Hit: {json.dumps(response_info)}")
    elif response.status_code >= 400:
        logger.warning(f"Client Error: {json.dumps(response_info)}")
    elif process_time > 10:  # Slow requests
        logger.warning(f"Slow Request: {json.dumps(response_info)}")
    else:
        logger.info(f"Request: {request.method} {request.url.path} - {response.status_code} - {process_time}s")
    
    return response

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
@limiter.limit("10/minute")
async def chat_endpoint(request: Request, chat_request: ChatRequest):

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

# --- START test da eliminare ----
# test rate limit
@app.get("/test-rate-limit")
@limiter.limit("3/minute")  # Solo 3 richieste per test
async def test_rate_limit(request: Request):
    return {"message": "Rate limit working!", "timestamp": datetime.now().isoformat()}

# test per validation
@app.post("/test-validation")
async def test_validation(request: ChatRequest):
    return {
        "message": "Validation passed!",
        "received_message": request.message,
        "thread_id": request.thread_id
    }
# --- END test da eliminare ----
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
