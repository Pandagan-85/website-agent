"""
Middleware setup - CORS, Rate Limiting, Security Headers, Logging
"""

import json
import logging
import os
import time
from datetime import datetime

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from .dependencies import limiter
from .security import get_cors_origins

# Setup logger
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("veronica_chatbot")


def setup_cors(app: FastAPI):
    """Setup CORS middleware"""
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


def setup_rate_limiting(app: FastAPI) -> None:
    """Setup rate limiting"""
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]


def setup_security_headers(app: FastAPI):
    """Setup security headers middleware"""

    @app.middleware("http")
    async def add_security_headers(request: Request, call_next):
        """Add security headers to all responses"""
        response = await call_next(request)

        # Altri headers sempre attivi
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"

        if os.getenv("ENVIRONMENT") == "production":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )

        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # ✅ CSP SOLO per endpoint NON-docs
        if not (
            request.url.path.startswith("/docs")
            or request.url.path.startswith("/redoc")
            or request.url.path.startswith("/openapi.json")
        ):
            # CSP restrictive solo per API
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; script-src 'self'; object-src 'none';"
            )

        # Prevent caching
        if request.url.path.startswith("/chat"):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
            response.headers["Pragma"] = "no-cache"

        return response


def setup_logging_middleware(app: FastAPI):
    """Setup security logging middleware"""

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
            "content_length": request.headers.get("content-length", 0),
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
            logger.info(
                f"Request: {request.method} {request.url.path} - {response.status_code} - {process_time}s"
            )

        return response


def setup_middleware(app: FastAPI):
    """Setup all middleware"""
    setup_cors(app)
    setup_rate_limiting(app)
    setup_security_headers(app)
    setup_logging_middleware(app)
