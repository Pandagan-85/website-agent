"""
Data models for LangGraph state management
Defines only the essential TypedDict classes for the chatbot workflow
"""

from typing import TypedDict, Annotated, List, Dict, Any
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class State(TypedDict):
    """Main state for the LangGraph workflow"""
    messages: Annotated[List[BaseMessage], add_messages]
    wordpress_url: str
    user_info: Dict[str, Any]


class InputState(TypedDict):
    """Input state for the LangGraph workflow"""
    messages: Annotated[List[BaseMessage], add_messages]