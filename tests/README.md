# Test Suite - Veronica WordPress Chatbot

Comprehensive test suite for the AI chatbot project, demonstrating best practices for testing LangGraph, LangChain, and FastAPI applications.

## 📊 Test Coverage

Current test status: **69 tests passing** (100% pass rate)

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

- **test_workflow.py** (19 tests) - LangGraph workflow

  - ReAct pattern implementation
  - State management and memory
  - Tool calling and routing
  - Conversation persistence
  - Conditional edges
  - Multi-turn conversations

#### LangSmith Evaluation Dataset (`tests/fixtures/`)

- **langsmith_test_dataset.jsonl** (20 questions) - Automated evaluation
  - 5 personal questions (should use personal_summary, no tools)
  - 11 technical questions (should call correct tools)
  - 4 out-of-scope questions (should refuse correctly)
  - See [README_LANGSMITH_DATASET.md](fixtures/README_LANGSMITH_DATASET.md) for evaluation strategy

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

### With Coverage

```bash
uv run pytest --cov=src/veronica_wordpress_chatbot --cov-report=html
```

The coverage report will be generated in `htmlcov/index.html`.

## 📝 Test Organization

Tests are organized by directory for easy filtering:

- **`tests/unit/`** - Unit tests (test_security.py, test_tools.py)
- **`tests/integration/`** - Integration tests (test_workflow.py)
- **`tests/fixtures/`** - Test data and LangSmith evaluation dataset

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

   - Comprehensive coverage (69 pytest tests + 20 LangSmith evaluation questions)
   - Clear test organization (unit/integration)
   - Proper use of fixtures and mocks
   - Descriptive test names and docstrings
   - 100% pass rate

2. **LangGraph/LangChain Knowledge**

   - Testing AI agent workflows
   - Mocking LLM responses
   - State management verification
   - Tool testing strategies
   - ReAct pattern implementation

3. **Security Awareness**

   - XSS prevention testing (14+ attack patterns)
   - Input validation coverage
   - DoS attack prevention
   - OWASP best practices
   - 23 dedicated security tests

4. **AI Evaluation Strategy**
   - LangSmith dataset with 20 categorized questions
   - Automated evaluation with custom evaluators
   - Roadmap for 15+ quality metrics (Correctness, Tool Usage, Factuality, Latency, etc.)
   - Production-ready monitoring approach

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
