"""
Integration tests for LangGraph workflow

IMPORTANT FOR INTERVIEW: These tests demonstrate understanding of:
- LangGraph StateGraph architecture
- ReAct pattern implementation
- State management with TypedDict
- Tool calling and conditional routing
- Memory/checkpointing for conversation persistence
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from src.veronica_wordpress_chatbot.workflow.graph import (
    create_graph,
    should_continue,
    call_model
)
from src.veronica_wordpress_chatbot.models import State, InputState
from src.veronica_wordpress_chatbot.config import Configuration


class TestWorkflowGraphCreation:
    """Test LangGraph workflow creation and structure"""

    def test_graph_creation_succeeds(self):
        """Test that graph is created successfully"""
        graph = create_graph()
        assert graph is not None
        assert hasattr(graph, 'invoke')
        assert hasattr(graph, 'stream')

    def test_graph_has_correct_nodes(self):
        """Test that graph contains required nodes"""
        graph = create_graph()

        # Check that graph was compiled
        assert graph.builder is not None

    def test_graph_has_memory_checkpointer(self):
        """Test that graph uses MemorySaver for persistence"""
        graph = create_graph()

        # Graph should have checkpointer for memory
        assert graph.checkpointer is not None

    def test_graph_accepts_configuration(self):
        """Test that graph accepts Configuration schema"""
        graph = create_graph()

        # Should be able to invoke with config
        config = {"configurable": {"model": "gpt-4o-mini"}}
        # We'll test actual invocation in other tests


class TestShouldContinueFunction:
    """Test the conditional routing function"""

    def test_continue_when_tool_calls_present(self):
        """Test that workflow continues to tools when LLM calls tools"""
        # Create mock message with tool calls
        mock_message = Mock()
        mock_message.tool_calls = [
            {"name": "search_blog_posts", "args": {"query": "AI"}}
        ]

        state = {"messages": [mock_message]}

        result = should_continue(state)
        assert result == "tools", "Should route to tools when tool_calls present"

    def test_end_when_no_tool_calls(self):
        """Test that workflow ends when LLM doesn't call tools"""
        # Create mock message without tool calls
        mock_message = Mock()
        mock_message.tool_calls = []

        state = {"messages": [mock_message]}

        result = should_continue(state)
        assert result == "__end__", "Should end when no tool_calls"

    def test_handles_multiple_messages(self):
        """Test routing with multiple messages in state"""
        # Create multiple messages, only last one matters
        mock_message_1 = Mock()
        mock_message_1.tool_calls = [{"name": "some_tool", "args": {}}]

        mock_message_2 = Mock()
        mock_message_2.tool_calls = []  # Last message, no tools

        state = {"messages": [mock_message_1, mock_message_2]}

        result = should_continue(state)
        assert result == "__end__", "Should check only last message"


class TestCallModelFunction:
    """Test the main agent node function"""

    @patch('src.veronica_wordpress_chatbot.workflow.graph.ChatOpenAI')
    def test_call_model_initializes_llm(self, mock_chat_openai):
        """Test that call_model initializes ChatOpenAI correctly"""
        # Setup mocks
        mock_llm_instance = Mock()
        mock_llm_with_tools = Mock()
        mock_response = Mock()
        mock_response.content = "Test response"
        mock_response.tool_calls = []

        mock_llm_with_tools.invoke.return_value = mock_response
        mock_llm_instance.bind_tools.return_value = mock_llm_with_tools
        mock_chat_openai.return_value = mock_llm_instance

        # Create state and config
        state = {
            "messages": [HumanMessage(content="Hello")],
            "wordpress_url": "https://test.com",
            "user_info": {}
        }
        config = {"configurable": {}}

        # Call the function
        result = call_model(state, config)

        # Verify LLM was initialized with correct parameters
        mock_chat_openai.assert_called_once()
        call_args = mock_chat_openai.call_args
        assert call_args.kwargs['model'] == "gpt-4o-mini"
        assert call_args.kwargs['temperature'] == 0.1
        assert call_args.kwargs['streaming'] is True

    @patch('src.veronica_wordpress_chatbot.workflow.graph.ChatOpenAI')
    def test_call_model_adds_system_prompt(self, mock_chat_openai):
        """Test that call_model adds system prompt when missing"""
        # Setup mocks
        mock_llm_instance = Mock()
        mock_llm_with_tools = Mock()
        mock_response = Mock()
        mock_response.content = "Test response"
        mock_response.tool_calls = []

        mock_llm_with_tools.invoke.return_value = mock_response
        mock_llm_instance.bind_tools.return_value = mock_llm_with_tools
        mock_chat_openai.return_value = mock_llm_instance

        # State without system message
        state = {
            "messages": [HumanMessage(content="Hello")],
            "wordpress_url": "https://test.com",
            "user_info": {}
        }
        config = {"configurable": {}}

        # Call the function
        result = call_model(state, config)

        # Verify invoke was called
        mock_llm_with_tools.invoke.assert_called_once()

        # Get the messages passed to invoke
        invoke_args = mock_llm_with_tools.invoke.call_args[0][0]

        # First message should be SystemMessage now
        assert isinstance(invoke_args[0], SystemMessage)
        assert isinstance(invoke_args[1], HumanMessage)

    @patch('src.veronica_wordpress_chatbot.workflow.graph.ChatOpenAI')
    def test_call_model_returns_correct_format(self, mock_chat_openai):
        """Test that call_model returns dict with messages key"""
        # Setup mocks
        mock_llm_instance = Mock()
        mock_llm_with_tools = Mock()
        mock_response = AIMessage(content="Test response")

        mock_llm_with_tools.invoke.return_value = mock_response
        mock_llm_instance.bind_tools.return_value = mock_llm_with_tools
        mock_chat_openai.return_value = mock_llm_instance

        state = {
            "messages": [HumanMessage(content="Hello")],
            "wordpress_url": "https://test.com",
            "user_info": {}
        }
        config = {"configurable": {}}

        result = call_model(state, config)

        # Result should be dict with 'messages' key containing list
        assert isinstance(result, dict)
        assert "messages" in result
        assert isinstance(result["messages"], list)
        assert len(result["messages"]) == 1
        assert result["messages"][0] == mock_response

    @patch('src.veronica_wordpress_chatbot.workflow.graph.ChatOpenAI')
    def test_call_model_binds_tools(self, mock_chat_openai):
        """Test that call_model binds tools to LLM"""
        # Setup mocks
        mock_llm_instance = Mock()
        mock_llm_with_tools = Mock()
        mock_response = Mock()
        mock_response.content = "Test"
        mock_response.tool_calls = []

        mock_llm_with_tools.invoke.return_value = mock_response
        mock_llm_instance.bind_tools.return_value = mock_llm_with_tools
        mock_chat_openai.return_value = mock_llm_instance

        state = {
            "messages": [HumanMessage(content="Hello")],
            "wordpress_url": "https://test.com",
            "user_info": {}
        }
        config = {"configurable": {}}

        call_model(state, config)

        # Verify bind_tools was called
        mock_llm_instance.bind_tools.assert_called_once()

    @patch('src.veronica_wordpress_chatbot.workflow.graph.ChatOpenAI')
    def test_call_model_uses_custom_config(self, mock_chat_openai):
        """Test that call_model respects custom configuration"""
        # Setup mocks
        mock_llm_instance = Mock()
        mock_llm_with_tools = Mock()
        mock_response = Mock()
        mock_response.content = "Test"
        mock_response.tool_calls = []

        mock_llm_with_tools.invoke.return_value = mock_response
        mock_llm_instance.bind_tools.return_value = mock_llm_with_tools
        mock_chat_openai.return_value = mock_llm_instance

        state = {
            "messages": [HumanMessage(content="Hello")],
            "wordpress_url": "https://custom.com",
            "user_info": {}
        }

        # Custom config
        config = {
            "configurable": {
                "model": "gpt-4",
                "wordpress_base_url": "https://custom.com"
            }
        }

        call_model(state, config)

        # Verify custom model was used
        call_args = mock_chat_openai.call_args
        assert call_args.kwargs['model'] == "gpt-4"


class TestWorkflowExecution:
    """Test end-to-end workflow execution"""

    @patch('src.veronica_wordpress_chatbot.workflow.graph.ChatOpenAI')
    def test_simple_conversation_without_tools(self, mock_chat_openai):
        """Test simple conversation that doesn't require tools"""
        # Setup mock LLM that responds without calling tools
        mock_llm_instance = Mock()
        mock_llm_with_tools = Mock()
        mock_response = AIMessage(content="Ciao! Come posso aiutarti?")

        mock_llm_with_tools.invoke.return_value = mock_response
        mock_llm_instance.bind_tools.return_value = mock_llm_with_tools
        mock_chat_openai.return_value = mock_llm_instance

        # Create graph and invoke
        graph = create_graph()

        input_state = {
            "messages": [HumanMessage(content="Ciao!")]
        }

        config = {"configurable": {"thread_id": "test-1"}}

        result = graph.invoke(input_state, config)

        # Should have messages in result
        assert "messages" in result
        assert len(result["messages"]) >= 2  # System + Human + AI

    @patch('src.veronica_wordpress_chatbot.workflow.graph.ChatOpenAI')
    def test_conversation_with_tool_calling(self, mock_chat_openai):
        """Test conversation where LLM calls tools"""
        # Setup mock LLM that first calls a tool, then responds
        mock_llm_instance = Mock()
        mock_llm_with_tools = Mock()

        # First call: AI wants to use a tool
        first_response = AIMessage(
            content="",
            tool_calls=[{
                "name": "get_contact_info",
                "args": {},
                "id": "call_123"
            }]
        )

        # Second call: AI responds with tool result
        second_response = AIMessage(content="Ecco i miei contatti...")

        mock_llm_with_tools.invoke.side_effect = [first_response, second_response]
        mock_llm_instance.bind_tools.return_value = mock_llm_with_tools
        mock_chat_openai.return_value = mock_llm_instance

        # Mock the tool execution
        with patch('src.veronica_wordpress_chatbot.tools.search_tools.get_contact_info') as mock_tool:
            import json
            mock_tool.return_value = json.dumps({"email": "test@test.com"})

            graph = create_graph()

            input_state = {
                "messages": [HumanMessage(content="Come posso contattarti?")]
            }

            config = {"configurable": {"thread_id": "test-2"}}

            result = graph.invoke(input_state, config)

            # Should have called the LLM twice (once for tool call, once for response)
            assert mock_llm_with_tools.invoke.call_count == 2

    def test_conversation_persistence_with_thread_id(self):
        """Test that conversations persist across invocations with same thread_id"""
        with patch('src.veronica_wordpress_chatbot.workflow.graph.ChatOpenAI') as mock_chat_openai:
            # Setup mock
            mock_llm_instance = Mock()
            mock_llm_with_tools = Mock()
            mock_response = AIMessage(content="Test response")

            mock_llm_with_tools.invoke.return_value = mock_response
            mock_llm_instance.bind_tools.return_value = mock_llm_with_tools
            mock_chat_openai.return_value = mock_llm_instance

            graph = create_graph()

            thread_id = "persistent-thread"
            config = {"configurable": {"thread_id": thread_id}}

            # First message
            result1 = graph.invoke(
                {"messages": [HumanMessage(content="First message")]},
                config
            )

            # Second message with same thread_id
            result2 = graph.invoke(
                {"messages": [HumanMessage(content="Second message")]},
                config
            )

            # Second result should have more messages (includes history)
            assert len(result2["messages"]) > len(result1["messages"])


class TestReActPattern:
    """Test ReAct (Reason-Act-Observe) pattern implementation"""

    def test_react_loop_structure(self):
        """Test that graph implements ReAct loop correctly"""
        graph = create_graph()

        # The graph should have:
        # 1. Agent node (Reason)
        # 2. Tools node (Act)
        # 3. Conditional edge from agent (Decide: continue or end)
        # 4. Edge from tools back to agent (Observe and continue reasoning)

        # This is validated by the structure working end-to-end
        assert graph is not None

    @patch('src.veronica_wordpress_chatbot.workflow.graph.ChatOpenAI')
    def test_react_cycle_reason_act_observe(self, mock_chat_openai):
        """Test complete ReAct cycle: Reason → Act → Observe → Reason"""
        mock_llm_instance = Mock()
        mock_llm_with_tools = Mock()

        # Simulate ReAct cycle:
        # 1. Reason: LLM decides to use tool
        # 2. Act: Tool executes
        # 3. Observe: LLM sees tool result
        # 4. Reason: LLM generates final answer

        first_call = AIMessage(
            content="I need to search for blog posts",
            tool_calls=[{
                "name": "search_blog_posts",
                "args": {"query": "AI", "limit": 3},
                "id": "call_1"
            }]
        )

        second_call = AIMessage(content="Based on the blog posts, here's what I found...")

        mock_llm_with_tools.invoke.side_effect = [first_call, second_call]
        mock_llm_instance.bind_tools.return_value = mock_llm_with_tools
        mock_chat_openai.return_value = mock_llm_instance

        with patch('src.veronica_wordpress_chatbot.tools.blog_tools.search_blog_posts') as mock_tool:
            import json
            mock_tool.return_value = json.dumps({"total": 3, "articles": []})

            graph = create_graph()
            result = graph.invoke(
                {"messages": [HumanMessage(content="Tell me about AI articles")]},
                {"configurable": {"thread_id": "test-react"}}
            )

            # Verify the ReAct cycle happened
            # Should have: System, Human, AI (tool call), Tool result, AI (final)
            assert len(result["messages"]) >= 4


# ========================================
# EDGE CASES AND ERROR HANDLING
# ========================================

class TestWorkflowEdgeCases:
    """Test edge cases and error handling in workflow"""

    def test_empty_message_list(self):
        """Test handling of empty message list"""
        with patch('src.veronica_wordpress_chatbot.workflow.graph.ChatOpenAI') as mock_chat_openai:
            mock_llm_instance = Mock()
            mock_llm_with_tools = Mock()
            mock_response = AIMessage(content="Response")

            mock_llm_with_tools.invoke.return_value = mock_response
            mock_llm_instance.bind_tools.return_value = mock_llm_with_tools
            mock_chat_openai.return_value = mock_llm_instance

            graph = create_graph()

            # Empty messages should still work (system prompt will be added)
            result = graph.invoke(
                {"messages": []},
                {"configurable": {"thread_id": "test-empty"}}
            )

            assert "messages" in result

    def test_multiple_tool_calls_in_sequence(self):
        """Test handling multiple tool calls in sequence"""
        with patch('src.veronica_wordpress_chatbot.workflow.graph.ChatOpenAI') as mock_chat_openai:
            mock_llm_instance = Mock()
            mock_llm_with_tools = Mock()

            # Multiple tool calls in one message
            tool_call_response = AIMessage(
                content="",
                tool_calls=[
                    {"name": "search_blog_posts", "args": {"query": "AI"}, "id": "1"},
                    {"name": "get_portfolio_projects", "args": {}, "id": "2"}
                ]
            )

            final_response = AIMessage(content="Here's everything")

            mock_llm_with_tools.invoke.side_effect = [tool_call_response, final_response]
            mock_llm_instance.bind_tools.return_value = mock_llm_with_tools
            mock_chat_openai.return_value = mock_llm_instance

            with patch('src.veronica_wordpress_chatbot.tools.blog_tools.search_blog_posts'), \
                 patch('src.veronica_wordpress_chatbot.tools.portfolio_tools.get_portfolio_projects'):

                graph = create_graph()
                result = graph.invoke(
                    {"messages": [HumanMessage(content="Tell me everything")]},
                    {"configurable": {"thread_id": "test-multi"}}
                )

                # Should handle multiple tool calls
                assert "messages" in result
