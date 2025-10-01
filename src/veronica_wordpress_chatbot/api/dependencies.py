"""
FastAPI dependencies and global instances
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

# Rate limit setup
limiter = Limiter(key_func=get_remote_address)

# Global chatbot instance (will be set during startup)
chatbot = None


def get_chatbot():
    """Get the global chatbot instance"""
    return chatbot


def set_chatbot(chatbot_instance):
    """Set the global chatbot instance"""
    global chatbot
    chatbot = chatbot_instance
