"""
Railway entry point
"""
from src.veronica_wordpress_chatbot.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)  # type: ignore[arg-type]
