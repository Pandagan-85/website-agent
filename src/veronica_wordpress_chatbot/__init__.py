"""
Veronica WordPress Chatbot Package
Main exports for the refactored chatbot
"""

from .chatbot import VeronicaChatbot
from .config import Configuration
from .api import create_app
from .workflow import create_graph, get_graph
from .tools import get_all_tools, TOOLS

__version__ = "2.0.0"
__author__ = "Veronica Schembri"
__description__ = "AI Chatbot powered by LangGraph and WordPress API"

__all__ = [
    "VeronicaChatbot",
    "Configuration",
    "create_app",
    "create_graph",
    "get_graph",
    "get_all_tools",
    "TOOLS"
]
