"""
FastAPI Main - Entry point for the Veronica WordPress Chatbot API
"""

import uvicorn

from .api import create_app
from .api.dependencies import set_chatbot
from .chatbot import VeronicaChatbot
from .utils.tracing import setup_langsmith

# Create FastAPI app
app = create_app()

# Global chatbot instance
chatbot = None


@app.on_event("startup")
async def startup_event():
    """Inizializza il chatbot all'avvio"""
    global chatbot
    try:
        print("🚀 Inizializzazione chatbot...")

        # Setup LangSmith
        setup_langsmith()

        # Initialize chatbot
        chatbot = VeronicaChatbot()

        # Set chatbot in dependencies
        set_chatbot(chatbot)

        print("✅ Chatbot inizializzato con successo!")
    except Exception as e:
        print(f"❌ Errore inizializzazione chatbot: {e}")
        chatbot = None


if __name__ == "__main__":
    print("🚀 Starting Veronica Schembri WordPress Chatbot API v2.0...")
    print("📍 Local server: http://localhost:8000")
    print("📖 API docs: http://localhost:8000/docs")
    print("🔍 Health check: http://localhost:8000/health")
    print("🧪 Test WordPress: http://localhost:8000/wordpress/test")

    from src.veronica_wordpress_chatbot.utils.tracing import LANGSMITH_ENABLED

    if LANGSMITH_ENABLED:
        import os

        print(
            f"📊 LangSmith Project: {os.getenv('LANGSMITH_PROJECT', 'veronica-wordpress-chatbot')}"
        )
    else:
        print("⚠️ LangSmith tracing non attivo")

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
