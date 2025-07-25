"""
FastAPI app factory - moved from main.py
"""

from fastapi import FastAPI
from .middleware import setup_middleware
from .endpoints import setup_routes


def create_app() -> FastAPI:
    """Create FastAPI app with all setup"""
    app = FastAPI(
        title="Veronica Schembri WordPress Chatbot",
        description="AI Chatbot powered by LangGraph and WordPress API with LangSmith tracing",
        version="2.0.0"
    )
    
    # Setup middleware
    setup_middleware(app)
    
    # Setup routes
    setup_routes(app)
    
    return app


__all__ = ["create_app"]