"""
Unit tests for LangChain tools

IMPORTANT FOR INTERVIEW: These tests demonstrate:
- LangChain @tool decorator usage
- Tool input/output validation
- Error handling in tools
- Mocking external dependencies (WordPress API)
- JSON serialization in tool responses
"""

import pytest
import json
from unittest.mock import Mock, patch
from src.veronica_wordpress_chatbot.tools import (
    search_blog_posts,
    get_latest_blog_post,
    get_portfolio_projects,
    get_certifications,
    get_work_experience,
    get_contact_info,
    TOOLS
)


class TestToolRegistry:
    """Test tool registration and availability"""

    def test_all_tools_registered(self):
        """Test that all expected tools are in TOOLS list"""
        expected_tools = [
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

        tool_names = [tool.name for tool in TOOLS]

        for expected in expected_tools:
            assert expected in tool_names, f"Tool {expected} not registered"

    def test_tools_have_descriptions(self):
        """Test that all tools have descriptions for LLM"""
        for tool in TOOLS:
            assert tool.description, f"Tool {tool.name} missing description"
            assert len(tool.description) > 10, f"Tool {tool.name} description too short"

    def test_tools_have_proper_schema(self):
        """Test that tools have proper argument schema"""
        for tool in TOOLS:
            # Each tool should have args defined
            assert hasattr(tool, 'args'), f"Tool {tool.name} missing args schema"

    def test_tool_names_follow_convention(self):
        """Test that tool names follow snake_case convention"""
        for tool in TOOLS:
            assert tool.name.islower(), f"Tool {tool.name} not lowercase"
            assert " " not in tool.name, f"Tool {tool.name} contains spaces"


class TestBlogTools:
    """Test blog-related tools"""

    @patch('src.veronica_wordpress_chatbot.tools.blog_tools.get_wordpress_client')
    def test_search_blog_posts_with_query(self, mock_client_class, mock_wordpress_post):
        """Test searching blog posts with a query"""
        # Setup mock
        mock_client = Mock()
        mock_client.get_posts.return_value = [mock_wordpress_post]
        mock_client_class.return_value = mock_client

        # Call tool
        result = search_blog_posts.invoke({"query": "AI", "limit": 5})

        # Parse result
        parsed = json.loads(result)

        assert parsed["total"] == 1
        assert parsed["search_query"] == "AI"
        assert "articles" in parsed
        assert len(parsed["articles"]) == 1

        # Verify WordPress client was called correctly
        mock_client.get_posts.assert_called_once_with({"per_page": 5, "search": "AI"})

    @patch('src.veronica_wordpress_chatbot.tools.blog_tools.get_wordpress_client')
    def test_search_blog_posts_without_query(self, mock_client_class, mock_wordpress_post):
        """Test getting latest posts without search query"""
        mock_client = Mock()
        mock_client.get_posts.return_value = [mock_wordpress_post]
        mock_client_class.return_value = mock_client

        result = search_blog_posts.invoke({"query": "", "limit": 3})

        parsed = json.loads(result)

        assert parsed["total"] == 1
        assert parsed["search_query"] == "ultimi articoli"

        # Should not include search parameter
        call_args = mock_client.get_posts.call_args[0][0]
        assert "search" not in call_args

    @patch('src.veronica_wordpress_chatbot.tools.blog_tools.get_wordpress_client')
    def test_search_blog_posts_no_results(self, mock_client_class):
        """Test handling when no blog posts found"""
        mock_client = Mock()
        mock_client.get_posts.return_value = []
        mock_client_class.return_value = mock_client

        result = search_blog_posts.invoke({"query": "nonexistent", "limit": 5})

        parsed = json.loads(result)

        assert parsed["total"] == 0
        assert "Nessun articolo trovato" in parsed["message"]

    @patch('src.veronica_wordpress_chatbot.tools.blog_tools.get_wordpress_client')
    def test_search_blog_posts_error_handling(self, mock_client_class):
        """Test error handling in search_blog_posts"""
        mock_client = Mock()
        mock_client.get_posts.side_effect = Exception("Connection error")
        mock_client_class.return_value = mock_client

        result = search_blog_posts.invoke({"query": "test", "limit": 5})

        parsed = json.loads(result)

        assert "error" in parsed
        assert "Connection error" in parsed["error"]

    @patch('src.veronica_wordpress_chatbot.tools.blog_tools.get_wordpress_client')
    def test_get_latest_blog_post_success(self, mock_client_class, mock_wordpress_post):
        """Test getting latest blog post"""
        mock_client = Mock()
        mock_client.get_posts.return_value = [mock_wordpress_post]
        mock_client_class.return_value = mock_client

        result = get_latest_blog_post.invoke({})

        parsed = json.loads(result)

        assert "latest_article" in parsed
        assert parsed["message"] == "Ultimo articolo pubblicato"
        assert parsed["latest_article"]["title"] == "Test Article about AI"

    @patch('src.veronica_wordpress_chatbot.tools.blog_tools.get_wordpress_client')
    def test_get_latest_blog_post_no_articles(self, mock_client_class):
        """Test getting latest post when none exist"""
        mock_client = Mock()
        mock_client.get_posts.return_value = []
        mock_client_class.return_value = mock_client

        result = get_latest_blog_post.invoke({})

        parsed = json.loads(result)

        assert "message" in parsed
        assert "Nessun articolo trovato" in parsed["message"]


class TestPortfolioTools:
    """Test portfolio-related tools"""

    @patch('src.veronica_wordpress_chatbot.tools.portfolio_tools.get_wordpress_client')
    def test_get_portfolio_projects_success(self, mock_client_class, mock_wordpress_project):
        """Test getting portfolio projects"""
        mock_client = Mock()
        mock_client.get_projects.return_value = [mock_wordpress_project]
        mock_client_class.return_value = mock_client

        result = get_portfolio_projects.invoke({"limit": 5})

        parsed = json.loads(result)

        assert parsed["total"] == 1
        assert "projects" in parsed
        assert parsed["projects"][0]["title"] == "AI Chatbot Project"
        assert "repository" in parsed["projects"][0]

    @patch('src.veronica_wordpress_chatbot.tools.portfolio_tools.get_wordpress_client')
    def test_get_portfolio_projects_default_limit(self, mock_client_class):
        """Test default limit for portfolio projects"""
        mock_client = Mock()
        mock_client.get_projects.return_value = []
        mock_client_class.return_value = mock_client

        get_portfolio_projects.invoke({})

        # Should use default limit
        mock_client.get_projects.assert_called_once()


class TestProfileTools:
    """Test profile-related tools"""

    @patch('src.veronica_wordpress_chatbot.tools.profile_tools.get_wordpress_client')
    def test_get_certifications_success(self, mock_client_class, mock_wordpress_certification):
        """Test getting certifications"""
        mock_client = Mock()
        mock_client.get_certifications.return_value = [mock_wordpress_certification]
        mock_client_class.return_value = mock_client

        result = get_certifications.invoke({"limit": 10})

        parsed = json.loads(result)

        assert parsed["total"] == 1
        assert "certifications" in parsed
        assert parsed["certifications"][0]["title"] == "AI Agent Development"
        assert "ente" in parsed["certifications"][0]

    @patch('src.veronica_wordpress_chatbot.tools.profile_tools.get_wordpress_client')
    def test_get_work_experience_success(self, mock_client_class):
        """Test getting work experience"""
        mock_client = Mock()
        mock_work_exp = {
            "id": 1,
            "title": {"rendered": "AI Engineer"},
            "content": {"rendered": "<p>Working on AI projects</p>"},
            "link": "https://test.com/work",
            "date": "2024-01-01",
            "acf": {
                "company": "Tech Corp",
                "position": "AI Engineer",
                "start_date": "2023-01-01",
                "end_date": "Present"
            }
        }
        mock_client.get_work_experiences.return_value = [mock_work_exp]
        mock_client_class.return_value = mock_client

        result = get_work_experience.invoke({"limit": 5})

        parsed = json.loads(result)

        assert parsed["total"] == 1
        assert "experiences" in parsed


class TestSearchTools:
    """Test search and utility tools"""

    def test_get_contact_info_returns_json(self):
        """Test that get_contact_info returns proper JSON"""
        result = get_contact_info.invoke({})

        parsed = json.loads(result)

        # Should have contacts dict and message
        assert "contacts" in parsed
        assert "message" in parsed

        # Verify contact information structure
        contacts = parsed["contacts"]
        assert "email" in contacts
        assert "website" in contacts
        assert "linkedin" in contacts
        assert "location" in contacts

        # Verify actual values
        assert "veronicaschembri" in contacts["email"]
        assert "veronicaschembri.com" in contacts["website"]

    def test_get_contact_info_no_parameters(self):
        """Test that contact info tool doesn't need parameters"""
        # Should work without any parameters
        result = get_contact_info.invoke({})
        assert result is not None

        parsed = json.loads(result)
        assert isinstance(parsed, dict)


class TestContentProcessor:
    """Test ContentProcessor for HTML cleaning"""

    def test_clean_html_removes_tags(self):
        """Test that HTML tags are removed"""
        from src.veronica_wordpress_chatbot.wordpress.processor import ContentProcessor

        html = "<p>Test <strong>content</strong> with <em>tags</em></p>"
        cleaned = ContentProcessor.clean_html(html)

        assert "<p>" not in cleaned
        assert "<strong>" not in cleaned
        assert "Test content with tags" == cleaned

    def test_clean_html_handles_entities(self):
        """Test that HTML entities are decoded"""
        from src.veronica_wordpress_chatbot.wordpress.processor import ContentProcessor

        html = "Test &nbsp; &amp; &lt; &gt; &quot;"
        cleaned = ContentProcessor.clean_html(html)

        assert "&nbsp;" not in cleaned
        assert "&amp;" not in cleaned
        assert "Test" in cleaned

    def test_clean_html_removes_multiple_spaces(self):
        """Test that multiple spaces are normalized"""
        from src.veronica_wordpress_chatbot.wordpress.processor import ContentProcessor

        html = "Test    content   with     spaces"
        cleaned = ContentProcessor.clean_html(html)

        assert "    " not in cleaned
        assert cleaned == "Test content with spaces"

    def test_process_post_returns_proper_format(self, mock_wordpress_post):
        """Test that process_post returns correctly formatted dict"""
        from src.veronica_wordpress_chatbot.wordpress.processor import ContentProcessor

        result = ContentProcessor.process_post(mock_wordpress_post)

        assert "title" in result
        assert "content_preview" in result
        assert "link" in result
        assert "type" in result
        assert result["type"] == "article"

        # Content should be cleaned (no HTML)
        assert "<p>" not in result["content_preview"]
        assert "<strong>" not in result["content_preview"]

    def test_process_project_extracts_acf_fields(self, mock_wordpress_project):
        """Test that process_project extracts ACF custom fields"""
        from src.veronica_wordpress_chatbot.wordpress.processor import ContentProcessor

        result = ContentProcessor.process_project(mock_wordpress_project)

        assert "repository" in result
        assert "external_url" in result
        assert result["type"] == "project"
        assert result["repository"] == "https://github.com/test/chatbot"


class TestToolIntegration:
    """Integration tests for tools with actual invocation"""

    def test_tool_invocation_via_langchain(self):
        """Test that tools can be invoked via LangChain's tool interface"""
        # This tests the @tool decorator integration
        from langchain_core.tools import BaseTool

        # All TOOLS should be BaseTool instances
        for tool in TOOLS:
            assert isinstance(tool, BaseTool), f"Tool {tool.name} not a BaseTool"

    def test_tool_can_be_serialized(self):
        """Test that tools can be serialized (important for LangGraph)"""
        for tool in TOOLS:
            # Should have schema that can be sent to LLM
            schema = tool.args_schema

            # Schema should be defined
            assert schema is not None or hasattr(tool, 'args'), \
                f"Tool {tool.name} missing args schema"

    @patch('src.veronica_wordpress_chatbot.tools.blog_tools.get_wordpress_client')
    def test_tool_error_returns_json(self, mock_client_class):
        """Test that tool errors are returned as JSON"""
        mock_client = Mock()
        mock_client.get_posts.side_effect = Exception("Test error")
        mock_client_class.return_value = mock_client

        result = search_blog_posts.invoke({"query": "test", "limit": 5})

        # Should still be valid JSON even on error
        parsed = json.loads(result)
        assert "error" in parsed


class TestToolEdgeCases:
    """Test edge cases and boundary conditions for tools"""

    @patch('src.veronica_wordpress_chatbot.tools.blog_tools.get_wordpress_client')
    def test_large_limit_handled(self, mock_client_class):
        """Test handling of very large limit parameter"""
        mock_client = Mock()
        mock_client.get_posts.return_value = []
        mock_client_class.return_value = mock_client

        # Large limit should be handled
        result = search_blog_posts.invoke({"query": "test", "limit": 1000})

        parsed = json.loads(result)
        assert "total" in parsed

    @patch('src.veronica_wordpress_chatbot.tools.blog_tools.get_wordpress_client')
    def test_empty_string_query_handled(self, mock_client_class):
        """Test handling of empty string query"""
        mock_client = Mock()
        mock_client.get_posts.return_value = []
        mock_client_class.return_value = mock_client

        result = search_blog_posts.invoke({"query": "", "limit": 5})

        parsed = json.loads(result)
        # When no results, just verify valid structure
        assert "total" in parsed
        assert parsed["total"] == 0

    @patch('src.veronica_wordpress_chatbot.tools.blog_tools.get_wordpress_client')
    def test_special_characters_in_query(self, mock_client_class):
        """Test handling of special characters in search query"""
        mock_client = Mock()
        mock_client.get_posts.return_value = []
        mock_client_class.return_value = mock_client

        # Should handle special characters without breaking
        result = search_blog_posts.invoke({"query": "C++ & Python", "limit": 5})

        parsed = json.loads(result)
        assert "error" not in parsed
