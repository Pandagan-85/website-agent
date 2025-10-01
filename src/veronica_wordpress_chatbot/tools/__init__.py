"""
Tools registry - centralized import of all tools
"""

from .blog_tools import get_latest_blog_post, search_blog_posts
from .content_tools import get_books_and_reading, get_tools_and_stack
from .portfolio_tools import get_portfolio_projects
from .profile_tools import get_certifications, get_work_experience
from .search_tools import get_contact_info, search_all_content

# Lista dei tools ottimizzati (same order as original)
TOOLS = [
    search_blog_posts,
    get_latest_blog_post,
    get_portfolio_projects,
    get_certifications,
    get_work_experience,
    get_books_and_reading,
    get_tools_and_stack,
    search_all_content,
    get_contact_info,
]


def get_all_tools():
    """Restituisce tutti i tools disponibili"""
    return TOOLS


__all__ = [
    "TOOLS",
    "get_all_tools",
    "search_blog_posts",
    "get_latest_blog_post",
    "get_portfolio_projects",
    "get_certifications",
    "get_work_experience",
    "get_books_and_reading",
    "get_tools_and_stack",
    "search_all_content",
    "get_contact_info",
]
