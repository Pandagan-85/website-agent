# Test Suite - Veronica WordPress Chatbot

Comprehensive test suite for the AI chatbot project, demonstrating best practices for testing LangGraph, LangChain, and FastAPI applications.

## 📊 Test Coverage

Current test status: **90+ tests passing**

### Test Categories

#### Unit Tests (`tests/unit/`)
- **test_security.py** (23 tests) - Security validation
  - XSS attack prevention (script tags, event handlers, dangerous protocols)
  - Input validation (length limits, character encoding)
  - DoS prevention (suspicious character repetition)
  - Thread ID validation
  - Pydantic integration

- **test_tools.py** (27 tests) - LangChain tools
  - Tool registration and schema validation
  - WordPress client mocking
  - Content processing (HTML cleaning)
  - Error handling in tools
  - JSON serialization

#### Integration Tests (`tests/integration/`)
- **test_workflow.py** (15 tests) - LangGraph workflow
  - ReAct pattern implementation
  - State management and memory
  - Tool calling and routing
  - Conversation persistence
  - Conditional edges

- **test_api_endpoints.py** (40 tests) - FastAPI endpoints
  - Request/response validation
  - Error handling
  - Rate limiting
  - CORS middleware
  - Security integration

#### End-to-End Tests (`tests/e2e/`)
- Complete conversation flows
- Multi-turn interactions
- System integration

## 🚀 Running Tests

### All Tests
```bash
uv run pytest
```

### Specific Test Files
```bash
uv run pytest tests/unit/test_security.py -v
uv run pytest tests/integration/test_workflow.py -v
```

### By Category
```bash
uv run pytest tests/unit/          # Unit tests only
uv run pytest tests/integration/   # Integration tests only
uv run pytest tests/e2e/            # E2E tests only
```

### By Marker
```bash
uv run pytest -m security          # Security tests
uv run pytest -m langgraph         # LangGraph tests
uv run pytest -m api               # API tests
uv run pytest -m wordpress         # WordPress tests
```

### With Coverage
```bash
uv run pytest --cov=src/veronica_wordpress_chatbot --cov-report=html
```

The coverage report will be generated in `htmlcov/index.html`.

## 📝 Test Markers

Tests are marked with pytest markers for easy filtering:

- `@pytest.mark.unit` - Unit tests
- `@pytest.mark.integration` - Integration tests
- `@pytest.mark.e2e` - End-to-end tests
- `@pytest.mark.security` - Security-related tests
- `@pytest.mark.langgraph` - LangGraph workflow tests
- `@pytest.mark.api` - FastAPI endpoint tests
- `@pytest.mark.wordpress` - WordPress integration tests

## 🛠️ Test Fixtures

Shared fixtures are defined in `conftest.py`:

### Environment Setup
- `setup_test_env` - Sets test environment variables

### Mock Data
- `mock_wordpress_post` - Sample blog post data
- `mock_wordpress_project` - Sample project data
- `mock_wordpress_certification` - Sample certification data
- `mock_wordpress_client` - Mocked WordPress client

### Configuration
- `test_config` - Test configuration instance
- `test_client` - FastAPI TestClient

### Sample Data
- `sample_chat_messages` - Valid chat messages
- `malicious_inputs` - XSS attack samples
- `valid_thread_ids` - Valid thread IDs
- `invalid_thread_ids` - Invalid thread IDs

## 📚 Writing New Tests

### Unit Test Example
```python
import pytest
from src.veronica_wordpress_chatbot.api.security import validate_input_security

def test_reject_xss_attack():
    """Test that XSS attacks are rejected"""
    malicious = "<script>alert('XSS')</script>"
    assert validate_input_security(malicious) is False
```

### Integration Test Example
```python
from unittest.mock import patch

@patch('src.veronica_wordpress_chatbot.workflow.graph.ChatOpenAI')
def test_workflow_execution(mock_chat_openai):
    """Test LangGraph workflow execution"""
    # Setup mock
    mock_llm = Mock()
    mock_chat_openai.return_value = mock_llm

    # Test workflow
    graph = create_graph()
    result = graph.invoke({"messages": [...]})

    assert "messages" in result
```

### Using Fixtures
```python
def test_with_mock_client(mock_wordpress_client):
    """Test using mocked WordPress client"""
    posts = mock_wordpress_client.get_posts({"per_page": 5})
    assert len(posts) == 1
```

## 🎯 Key Testing Principles

### 1. Security Testing
All security validation is thoroughly tested:
- XSS attack vectors (14+ patterns)
- Input sanitization
- Resource exhaustion prevention
- Thread ID validation

### 2. Mocking External Dependencies
WordPress API calls are mocked to:
- Avoid network calls in tests
- Ensure consistent test data
- Test error scenarios

### 3. LangGraph Testing
Workflow tests verify:
- ReAct pattern implementation
- State management
- Memory/checkpointing
- Tool calling and routing

### 4. API Testing
FastAPI endpoints are tested with:
- TestClient for HTTP simulation
- Request/response validation
- Error handling
- Rate limiting

## 🐛 Debugging Failed Tests

### Verbose Output
```bash
uv run pytest -v --tb=long
```

### Run Single Test
```bash
uv run pytest tests/unit/test_security.py::TestInputSecurityValidation::test_reject_script_tags -v
```

### Print Debugging
```bash
uv run pytest -s  # Shows print statements
```

### Drop into Debugger on Failure
```bash
uv run pytest --pdb
```

## 📊 CI/CD Integration

Tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run tests
  run: uv run pytest --cov --cov-report=xml

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## 🎓 For Technical Interviews

This test suite demonstrates:

1. **Testing Best Practices**
   - Comprehensive coverage (90+ tests)
   - Clear test organization (unit/integration/e2e)
   - Proper use of fixtures and mocks
   - Descriptive test names and docstrings

2. **LangGraph/LangChain Knowledge**
   - Testing AI agent workflows
   - Mocking LLM responses
   - State management verification
   - Tool testing strategies

3. **Security Awareness**
   - XSS prevention testing
   - Input validation coverage
   - DoS attack prevention
   - OWASP best practices

4. **API Testing**
   - FastAPI TestClient usage
   - Request/response validation
   - Error handling verification
   - Middleware testing

## 📖 Additional Resources

- [pytest documentation](https://docs.pytest.org/)
- [LangChain testing guide](https://python.langchain.com/docs/contributing/testing)
- [FastAPI testing guide](https://fastapi.tiangolo.com/tutorial/testing/)
- [LangGraph testing patterns](https://langchain-ai.github.io/langgraph/how-tos/testing/)

## 🤝 Contributing

When adding new features, please:
1. Write tests first (TDD approach)
2. Ensure all tests pass before committing
3. Add integration tests for new workflows
4. Update this README if adding new test categories
