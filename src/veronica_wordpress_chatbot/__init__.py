"""
Veronica WordPress Chatbot Package
Main exports for the refactored chatbot
"""

from .api import create_app
from .chatbot import VeronicaChatbot
from .config import Configuration
from .tools import TOOLS, get_all_tools
from .workflow import create_graph, get_graph

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
    "TOOLS",
]
