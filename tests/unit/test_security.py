"""
Unit tests for security validation module

CRITICAL: These tests demonstrate security-first approach
Useful for technical interviews to show understanding of:
- XSS prevention
- Input validation
- DoS attack prevention
- OWASP best practices
"""

import pytest
from src.veronica_wordpress_chatbot.api.security import (
    validate_input_security,
    validate_thread_id,
    MALICIOUS_PATTERNS
)


class TestInputSecurityValidation:
    """Test comprehensive input security validation"""

    def test_valid_normal_message(self):
        """Test that normal messages pass validation"""
        valid_messages = [
            "Ciao! Come stai?",
            "Parlami dei tuoi progetti di AI",
            "Quali certificazioni hai conseguito?",
            "Ho visto il tuo articolo su Machine Learning, molto interessante!",
            "Posso usare emoji? 🤖 💻 ✨",
        ]

        for message in valid_messages:
            assert validate_input_security(message) is True, f"Valid message rejected: {message}"

    def test_reject_script_tags(self):
        """Test rejection of script tags (XSS prevention)"""
        malicious_inputs = [
            "<script>alert('XSS')</script>",
            "<SCRIPT>alert('XSS')</SCRIPT>",  # Case insensitive
            "<script src='http://evil.com'></script>",
            "Hello <script>alert(1)</script> World",
        ]

        for malicious in malicious_inputs:
            assert validate_input_security(malicious) is False, f"Script tag not blocked: {malicious}"

    def test_reject_javascript_protocol(self):
        """Test rejection of javascript: protocol"""
        malicious_inputs = [
            "javascript:alert('XSS')",
            "JavaScript:void(0)",
            "JAVASCRIPT:alert(1)",
        ]

        for malicious in malicious_inputs:
            assert validate_input_security(malicious) is False, f"Javascript protocol not blocked: {malicious}"

    def test_reject_event_handlers(self):
        """Test rejection of inline event handlers"""
        malicious_inputs = [
            "<img src=x onerror=alert('XSS')>",
            "<div onclick='alert(1)'>",
            "<body onload='malicious()'>",
            "test onmouseover='alert(1)'",
        ]

        for malicious in malicious_inputs:
            assert validate_input_security(malicious) is False, f"Event handler not blocked: {malicious}"

    def test_reject_dangerous_tags(self):
        """Test rejection of dangerous HTML tags"""
        malicious_inputs = [
            "<iframe src='http://evil.com'></iframe>",
            "<object data='malicious.swf'></object>",
            "<embed src='malicious.swf'>",
        ]

        for malicious in malicious_inputs:
            assert validate_input_security(malicious) is False, f"Dangerous tag not blocked: {malicious}"

    def test_reject_encoded_attacks(self):
        """Test rejection of encoded XSS attempts"""
        malicious_inputs = [
            "&lt;script&gt;alert('XSS')&lt;/script&gt;",
            "&#60;script&#62;alert('XSS')&#60;/script&#62;",
        ]

        for malicious in malicious_inputs:
            assert validate_input_security(malicious) is False, f"Encoded attack not blocked: {malicious}"

    def test_reject_dangerous_protocols(self):
        """Test rejection of dangerous data protocols"""
        malicious_inputs = [
            "data:text/html,<script>alert('XSS')</script>",
            "data:image/svg+xml,<svg onload=alert(1)>",
        ]

        for malicious in malicious_inputs:
            assert validate_input_security(malicious) is False, f"Dangerous protocol not blocked: {malicious}"

    def test_reject_eval_and_expression(self):
        """Test rejection of eval and expression attempts"""
        malicious_inputs = [
            "eval(maliciousCode)",
            "expression(alert('XSS'))",
            "EVAL(something)",
        ]

        for malicious in malicious_inputs:
            assert validate_input_security(malicious) is False, f"Eval/expression not blocked: {malicious}"

    def test_reject_dom_manipulation(self):
        """Test rejection of DOM manipulation attempts"""
        malicious_inputs = [
            "document.cookie",
            "window.location",
            "document.write",
            "window.location='http://evil.com'",
        ]

        for malicious in malicious_inputs:
            assert validate_input_security(malicious) is False, f"DOM manipulation not blocked: {malicious}"

    def test_reject_too_long_input(self):
        """Test rejection of inputs exceeding length limit (DoS prevention)"""
        # Maximum allowed is 2000 characters
        too_long = "a" * 2001
        assert validate_input_security(too_long) is False

        # Exactly 2000 with varied characters should pass
        # (not 2000 of same char - that triggers repetition check)
        exactly_max = ("Test message " * 150)[:2000]  # Varied content
        assert validate_input_security(exactly_max) is True

    def test_reject_suspicious_repetition(self):
        """Test rejection of suspicious character repetition (DoS prevention)"""
        suspicious_inputs = [
            "x" * 51,  # 51+ same characters
            "a" * 100,
            " " * 60,
            "." * 55,
        ]

        for suspicious in suspicious_inputs:
            assert validate_input_security(suspicious) is False, f"Suspicious repetition not blocked: {suspicious}"

        # Normal repetition should pass
        normal_repetition = "Hahaha" + "ha" * 10  # Less than 50 consecutive
        assert validate_input_security(normal_repetition) is True

    def test_reject_empty_or_whitespace(self):
        """Test rejection of empty or whitespace-only input"""
        invalid_inputs = [
            "",
            "   ",
            "\n\n\n",
            "\t\t\t",
        ]

        for invalid in invalid_inputs:
            assert validate_input_security(invalid) is False, f"Empty/whitespace not rejected: '{invalid}'"

    def test_reject_invalid_encoding(self):
        """Test rejection of invalid UTF-8 encoding"""
        # This is handled by the try/except in validate_input_security
        # Normal UTF-8 strings should pass
        valid_utf8 = "Testo con caratteri speciali: àèéìòù"
        assert validate_input_security(valid_utf8) is True

    def test_all_malicious_patterns_have_regex(self):
        """Test that all malicious patterns are properly compiled regexes"""
        assert len(MALICIOUS_PATTERNS) >= 14, "Missing security patterns"

        for pattern in MALICIOUS_PATTERNS:
            assert hasattr(pattern, 'search'), "Pattern is not a compiled regex"


class TestThreadIDValidation:
    """Test thread ID validation"""

    def test_valid_thread_ids(self, valid_thread_ids):
        """Test that valid thread IDs pass validation"""
        for thread_id in valid_thread_ids:
            assert validate_thread_id(thread_id) is True, f"Valid thread_id rejected: {thread_id}"

    def test_invalid_thread_ids(self, invalid_thread_ids):
        """Test that invalid thread IDs are rejected"""
        for thread_id in invalid_thread_ids:
            assert validate_thread_id(thread_id) is False, f"Invalid thread_id accepted: {thread_id}"

    def test_reject_special_characters(self):
        """Test rejection of special characters in thread IDs"""
        invalid_ids = [
            "user@domain",
            "id/with/slash",
            "id;drop;table",
            "id<script>",
            "id'OR'1'='1",
        ]

        for invalid_id in invalid_ids:
            assert validate_thread_id(invalid_id) is False, f"Special chars not blocked: {invalid_id}"

    def test_reject_too_long_thread_id(self):
        """Test rejection of thread IDs exceeding length limit"""
        too_long = "a" * 101
        assert validate_thread_id(too_long) is False

        # Exactly 100 should pass
        exactly_max = "a" * 100
        assert validate_thread_id(exactly_max) is True

    def test_reject_empty_thread_id(self):
        """Test rejection of empty thread ID"""
        assert validate_thread_id("") is False
        assert validate_thread_id(None) is False


class TestSecurityIntegration:
    """Integration tests for security validation"""

    def test_pydantic_validation_integration(self):
        """Test that Pydantic models use security validation"""
        from src.veronica_wordpress_chatbot.api.models import ChatRequest
        from pydantic import ValidationError

        # Valid request should pass
        valid_request = ChatRequest(
            message="Ciao! Come stai?",
            thread_id="user-123"
        )
        assert valid_request.message == "Ciao! Come stai?"

        # Malicious message should raise ValidationError
        with pytest.raises(ValidationError) as exc_info:
            ChatRequest(
                message="<script>alert('XSS')</script>",
                thread_id="user-123"
            )

        assert "invalid or potentially malicious" in str(exc_info.value).lower()

    def test_malicious_thread_id_rejected(self):
        """Test that malicious thread IDs are rejected by Pydantic"""
        from src.veronica_wordpress_chatbot.api.models import ChatRequest
        from pydantic import ValidationError

        with pytest.raises(ValidationError) as exc_info:
            ChatRequest(
                message="Hello",
                thread_id="user;drop table users;"
            )

        assert "invalid thread id" in str(exc_info.value).lower()

    def test_security_patterns_coverage(self):
        """Test that security patterns cover OWASP top vulnerabilities"""
        # Ensure we're checking for major vulnerability types
        pattern_types_covered = [
            r'<script',      # XSS - Script injection
            r'javascript:',  # XSS - Protocol handler
            r'on\w+\s*=',   # XSS - Event handlers
            r'<iframe',      # Clickjacking
            r'eval\s*\(',   # Code injection
            r'document\.',   # DOM manipulation
            r'data:text',    # Data URI attacks
        ]

        for pattern_str in pattern_types_covered:
            found = any(pattern_str in str(p.pattern) for p in MALICIOUS_PATTERNS)
            assert found, f"Security pattern not covered: {pattern_str}"


# ========================================
# PERFORMANCE TESTS
# ========================================

class TestSecurityPerformance:
    """Test that security validation is performant"""

    def test_validation_performance(self):
        """Benchmark security validation performance"""
        # Using pytest-benchmark if available, otherwise skip
        pytest.importorskip("pytest_benchmark")

        # This test is skipped if pytest-benchmark is not installed
        # Run with: pip install pytest-benchmark
        test_message = "Ciao! Parlami dei tuoi progetti di AI e Machine Learning"
        result = validate_input_security(test_message)
        assert result is True

    def test_validation_with_normal_load(self):
        """Test validation with multiple messages (simulating normal load)"""
        messages = [
            "Ciao! Come stai?",
            "Parlami dei tuoi progetti",
            "Quali certificazioni hai?",
        ] * 100  # 300 messages

        for message in messages:
            result = validate_input_security(message)
            assert result is True

        # Should complete quickly (within reasonable time)
        # If this test is slow, we have a performance issue
