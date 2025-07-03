"""
API endpoints assembly - routes all endpoints
"""

from fastapi import FastAPI
from .core import router as core_router
from .chat import router as chat_router
from .wordpress import router as wordpress_router
from .testing import router as testing_router


def setup_routes(app: FastAPI):
    """Setup all API routes"""
    # Core routes (/, /health, /api/info)
    app.include_router(core_router)
    
    # Chat routes (/chat, /simple-chat)
    app.include_router(chat_router)
    
    # WordPress routes (/wordpress/*)
    app.include_router(wordpress_router, prefix="/wordpress", tags=["wordpress"])
    
    # Testing & debug routes (/test/*, /debug/*)
    app.include_router(testing_router, tags=["testing"])