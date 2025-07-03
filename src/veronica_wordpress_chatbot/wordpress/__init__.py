"""
WordPress integration module
"""

from .client import OptimizedWordPressClient
from .processor import ContentProcessor

__all__ = ["OptimizedWordPressClient", "ContentProcessor"]