"""
Centralized logging configuration for Veronica Chatbot
"""

import logging
import sys
from pathlib import Path

# Create logs directory if it doesn't exist
LOGS_DIR: Path = Path(__file__).parent.parent.parent.parent / "logs"
LOGS_DIR.mkdir(exist_ok=True)


def setup_logging(name: str = "veronica_chatbot") -> logging.Logger:
    """
    Setup and return a configured logger

    Args:
        name: Logger name (typically __name__ from calling module)

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)

    # Avoid duplicate handlers if already configured
    if logger.handlers:
        return logger

    logger.setLevel(logging.INFO)

    # Console handler - for development
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    console_handler.setFormatter(console_formatter)

    # File handler - for production logs
    file_handler = logging.FileHandler(LOGS_DIR / "chatbot.log")
    file_handler.setLevel(logging.INFO)
    file_formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    file_handler.setFormatter(file_formatter)

    # Error file handler - separate file for errors
    error_handler = logging.FileHandler(LOGS_DIR / "errors.log")
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(file_formatter)

    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    logger.addHandler(error_handler)

    return logger


# Module-level logger for this utils package
logger = setup_logging(__name__)
