"""
Pydantic models for API requests/responses - moved from main.py
"""

from pydantic import BaseModel, Field, field_validator
from typing import Dict, Any, Optional, List


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000,
                         description="User message")
    thread_id: Optional[str] = Field(
        default="default", max_length=100, description="Conversation thread ID")
    conversation_history: Optional[List[Dict[str, str]]] = Field(
        default=None, description="Previous conversation")

    @field_validator('message')
    @classmethod
    def validate_message_security(cls, v):
        """Validate message for security threats"""
        from .security import validate_input_security
        if not validate_input_security(v):
            raise ValueError(
                'Message contains invalid or potentially malicious content')
        return v.strip()

    @field_validator('thread_id')
    @classmethod
    def validate_thread_id_format(cls, v):
        """Validate thread ID format"""
        from .security import validate_thread_id
        if v and not validate_thread_id(v):
            raise ValueError('Invalid thread ID format')
        return v or "default"

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "message": "Ciao! Parlami dei tuoi progetti di AI",
                    "thread_id": "user_123"
                }
            ]
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
