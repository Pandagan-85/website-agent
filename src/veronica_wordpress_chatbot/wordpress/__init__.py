"""
WordPress integration module
"""

from ..config import Configuration
from .client import OptimizedWordPressClient
from .processor import ContentProcessor


def get_wordpress_client() -> OptimizedWordPressClient:
    """
    Factory function to create WordPress client with default configuration.

    Reduces code duplication across tools and endpoints.

    Returns:
        OptimizedWordPressClient instance configured with default settings
    """
    config = Configuration()
    return OptimizedWordPressClient(config.wordpress_base_url)


__all__ = [
    "OptimizedWordPressClient",
    "ContentProcessor",
    "get_wordpress_client",
]
