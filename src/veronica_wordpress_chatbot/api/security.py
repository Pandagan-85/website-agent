"""
Security validation functions - input sanitization, CORS origins, thread ID validation
"""

import re
from typing import List, Pattern

# Security validation patterns
MALICIOUS_PATTERNS: List[Pattern] = [
    re.compile(r"<script[^>]*>.*?</script>", re.IGNORECASE | re.DOTALL),
    re.compile(r"javascript:", re.IGNORECASE),
    re.compile(r"on\w+\s*=", re.IGNORECASE),  # onclick, onload, etc.
    re.compile(r"<iframe[^>]*>", re.IGNORECASE),
    re.compile(r"<object[^>]*>", re.IGNORECASE),
    re.compile(r"<embed[^>]*>", re.IGNORECASE),
    re.compile(r"vbscript:", re.IGNORECASE),
    re.compile(r"eval\s*\(", re.IGNORECASE),
    re.compile(r"expression\s*\(", re.IGNORECASE),
    re.compile(r"document\.|window\.", re.IGNORECASE),
    re.compile(r"&lt;script", re.IGNORECASE),  # Encoded script tags
    re.compile(r"&#60;script", re.IGNORECASE),
    re.compile(r"data:text/html", re.IGNORECASE),
    re.compile(r"data:image/svg", re.IGNORECASE),
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
        text.encode("utf-8")
    except UnicodeError:
        return False

    # Malicious pattern check
    for pattern in MALICIOUS_PATTERNS:
        if pattern.search(text):
            return False

    # Suspicious repeated characters (potential DoS)
    suspicious_chars = ["x", "a", "1", " ", ".", "-"]
    for char in suspicious_chars:
        if char * 50 in text:  # 50+ repeated chars
            return False

    return True


def validate_thread_id(thread_id: str) -> bool:
    """Validate thread ID format"""
    if not thread_id or len(thread_id) > 100:
        return False

    # Only alphanumeric, underscore, hyphen
    if not re.match(r"^[a-zA-Z0-9_-]+$", thread_id):
        return False

    return True


def get_cors_origins() -> List[str]:
    """Get CORS origins based on environment"""
    import os

    env = os.getenv("ENVIRONMENT", "development")

    if env == "production":
        return ["https://www.veronicaschembri.com", "https://veronicaschembri.com"]
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
            "http://0.0.0.0:3000",  # Se server usa 0.0.0.0
            "http://0.0.0.0:8080",  # Se server usa 0.0.0.0
            "https://www.veronicaschembri.com",  # Per test con sito reale
        ]
