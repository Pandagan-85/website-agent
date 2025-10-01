"""
Pytest configuration and shared fixtures
"""

import pytest
import os
from unittest.mock import Mock, patch, MagicMock
from typing import Dict, List, Any


# ========================================
# ENVIRONMENT SETUP
# ========================================

@pytest.fixture(scope="session", autouse=True)
def setup_test_env():
    """Setup test environment variables"""
    os.environ["OPENAI_API_KEY"] = "test-key-12345"
    os.environ["WORDPRESS_URL"] = "https://test.example.com"
    os.environ["LANGSMITH_TRACING"] = "false"
    os.environ["ENVIRONMENT"] = "test"


# ========================================
# WORDPRESS CLIENT MOCKS
# ========================================

@pytest.fixture
def mock_wordpress_post() -> Dict[str, Any]:
    """Mock WordPress post data"""
    return {
        "id": 1,
        "date": "2024-01-15T10:00:00",
        "title": {"rendered": "Test Article about AI"},
        "content": {"rendered": "<p>This is a test article about <strong>Artificial Intelligence</strong>.</p>"},
        "excerpt": {"rendered": "<p>Test excerpt</p>"},
        "link": "https://test.example.com/test-article",
        "categories": [1, 2],
        "tags": [3, 4]
    }


@pytest.fixture
def mock_wordpress_project() -> Dict[str, Any]:
    """Mock WordPress project data"""
    return {
        "id": 10,
        "date": "2024-01-10T10:00:00",
        "title": {"rendered": "AI Chatbot Project"},
        "content": {"rendered": "<p>Advanced chatbot with <strong>LangGraph</strong></p>"},
        "link": "https://test.example.com/project/chatbot",
        "acf": {
            "project_repository": "https://github.com/test/chatbot",
            "project_external_url": "https://chatbot.test.com",
            "project_frontend": "https://frontend.test.com",
            "project_preview_text": "AI-powered chatbot"
        }
    }


@pytest.fixture
def mock_wordpress_certification() -> Dict[str, Any]:
    """Mock WordPress certification data"""
    return {
        "id": 20,
        "date": "2024-01-05T10:00:00",
        "title": {"rendered": "AI Agent Development"},
        "content": {"rendered": "<p>Certificate in AI development</p>"},
        "link": "https://test.example.com/cert/ai-agent",
        "acf": {
            "ente_certificazione": "Hugging Face",
            "descrizione_certificazione": "Advanced AI Agents",
            "start_corso": "2024-01-01",
            "end_corso": "2024-01-31",
            "link_corso": "https://huggingface.co/course",
            "link_progetto": "https://github.com/test/project"
        }
    }


@pytest.fixture
def mock_wordpress_client(mock_wordpress_post, mock_wordpress_project, mock_wordpress_certification):
    """Mock WordPress client with predefined responses"""
    mock_client = Mock()
    mock_client.get_posts.return_value = [mock_wordpress_post]
    mock_client.get_projects.return_value = [mock_wordpress_project]
    mock_client.get_certifications.return_value = [mock_wordpress_certification]
    mock_client.get_work_experiences.return_value = []
    mock_client.get_books.return_value = []
    mock_client.get_tools.return_value = []
    return mock_client


# ========================================
# LANGGRAPH MOCKS
# ========================================

@pytest.fixture
def mock_llm_response():
    """Mock LLM response for testing"""
    mock_response = Mock()
    mock_response.content = "This is a test response from the AI assistant."
    mock_response.tool_calls = []
    return mock_response


@pytest.fixture
def mock_chat_model(mock_llm_response):
    """Mock ChatOpenAI model"""
    with patch('src.veronica_wordpress_chatbot.workflow.graph.ChatOpenAI') as mock:
        instance = mock.return_value
        instance.bind_tools.return_value.invoke.return_value = mock_llm_response
        yield instance


# ========================================
# FASTAPI TEST CLIENT
# ========================================

@pytest.fixture
def test_client():
    """FastAPI test client"""
    from fastapi.testclient import TestClient
    from src.veronica_wordpress_chatbot.api import create_app

    app = create_app()
    return TestClient(app)


# ========================================
# CONFIGURATION FIXTURES
# ========================================

@pytest.fixture
def test_config():
    """Test configuration"""
    from src.veronica_wordpress_chatbot.config import Configuration
    return Configuration(
        model="gpt-4o-mini",
        wordpress_base_url="https://test.example.com"
    )


# ========================================
# SAMPLE DATA FIXTURES
# ========================================

@pytest.fixture
def sample_chat_messages() -> List[str]:
    """Sample chat messages for testing"""
    return [
        "Ciao! Chi sei?",
        "Parlami dei tuoi progetti",
        "Quali certificazioni hai?",
        "Come posso contattarti?"
    ]


@pytest.fixture
def malicious_inputs() -> List[str]:
    """Malicious input samples for security testing"""
    return [
        "<script>alert('XSS')</script>",
        "javascript:alert('XSS')",
        "<img src=x onerror=alert('XSS')>",
        "<iframe src='http://evil.com'></iframe>",
        "eval(maliciousCode)",
        "document.cookie",
        "&lt;script&gt;alert('XSS')&lt;/script&gt;",
        "a" * 3000,  # Too long
        "x" * 100,   # Suspicious repetition
    ]


@pytest.fixture
def valid_thread_ids() -> List[str]:
    """Valid thread ID samples"""
    return [
        "user-123",
        "session_456",
        "test-thread-789",
        "abc123",
    ]


@pytest.fixture
def invalid_thread_ids() -> List[str]:
    """Invalid thread ID samples"""
    return [
        "user@123",  # Invalid character
        "thread id with spaces",  # Spaces
        "id/with/slashes",  # Slashes
        "a" * 200,  # Too long
        "",  # Empty
        "user;drop table users;",  # SQL injection attempt
    ]
