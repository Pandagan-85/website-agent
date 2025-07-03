"""
Core endpoints (/, /health, /api/info) - moved from main.py
"""

import os
from datetime import datetime
from fastapi import APIRouter, HTTPException
from typing import Dict

from ..models import HealthResponse
from ..dependencies import get_chatbot

router = APIRouter()


@router.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint"""
    return {
        "message": "Veronica Schembri WordPress Chatbot API",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check completo"""
    try:
        chatbot = get_chatbot()
        
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
        from ...utils.tracing import LANGSMITH_ENABLED
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


@router.get("/api/info")
async def api_info():
    """Informazioni sull'API"""
    from ...utils.tracing import LANGSMITH_ENABLED
    
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