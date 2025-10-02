# 🤖 Veronica Chatbot - AI Assistant

> **Assistente AI conversazionale** per Veronica Schembri, AI Engineer. Architettura modulare con **LangGraph ReAct pattern**, WordPress integration e sicurezza avanzata.

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green.svg)](https://fastapi.tiangolo.com/)
[![LangChain](https://img.shields.io/badge/LangChain-0.3.26-orange.svg)](https://python.langchain.com/)
[![LangGraph](https://img.shields.io/badge/LangGraph-0.5.0-purple.svg)](https://langchain-ai.github.io/langgraph/)
[![Tests](https://img.shields.io/badge/tests-69%20passing-success.svg)](#-testing)

---

## 🎯 Overview

Chatbot AI che rappresenta Veronica Schembri sul suo portfolio, utilizzando il **pattern ReAct** (Reasoning and Acting) per conversazioni intelligenti con accesso dinamico ai contenuti WordPress.

### ✨ Caratteristiche Principali

- **🧠 AI Agent con ReAct Pattern**: LangGraph orchestration per reasoning e azioni iterative
- **🔧 Architettura Modulare**: Codice organizzato, testabile e manutenibile
- **🌐 WordPress Integration**: 9 tools specializzati per accesso contenuti
- **🛡️ Sicurezza Avanzata**: 23+ test per XSS, DoS prevention, input validation
- **📱 React Widget**: Frontend responsive con persistenza sessioni
- **📊 Observability**: LangSmith integration per monitoring + 20 test questions dataset
- **🧪 Test Suite**: 69 test pytest + 20 LangSmith evaluation questions - 100% pass rate
- **🎨 Template System**: Separation of concerns (prompt logic vs content)

---

## 🧠 Pattern ReAct - Come Funziona

Il chatbot implementa il pattern **ReAct** (Reasoning and Acting), un approccio che combina ragionamento e azioni in un ciclo iterativo:

### Flusso ReAct

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Input                                   │
│              "Parlami dei tuoi progetti AI"                      │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. REASON (Agent Node)                                          │
│     LLM analizza la richiesta:                                   │
│     "L'utente chiede progetti AI → devo chiamare                 │
│      get_portfolio_projects() tool"                              │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. ACT (Tools Node)                                             │
│     Esegue: get_portfolio_projects(limit=5)                      │
│     Recupera progetti da WordPress API                           │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. OBSERVE (Agent Node)                                         │
│     LLM riceve risultati tool:                                   │
│     "Ho trovato 3 progetti: Chatbot, RAG System, ML Pipeline"    │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. REASON (Agent Node)                                          │
│     LLM decide: "Ho le info necessarie, genero risposta finale"  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. RESPOND                                                       │
│     "Ecco i miei principali progetti AI: ..."                    │
└─────────────────────────────────────────────────────────────────┘
```

### Implementazione LangGraph

```python
# workflow/graph.py
def create_graph():
    builder = StateGraph(State, input=InputState, config_schema=Configuration)

    # Nodi del grafo
    builder.add_node("agent", call_model)      # Reasoning
    builder.add_node("tools", ToolNode(TOOLS)) # Actions

    # Routing condizionale
    builder.add_conditional_edges(
        "agent",
        should_continue,  # Decide se continuare o terminare
        {
            "tools": "tools",    # Chiama tools se necessario
            "__end__": "__end__" # Termina se risposta completa
        }
    )

    # Loop ReAct: tools → agent (per osservare risultati)
    builder.add_edge("tools", "agent")

    return builder.compile(checkpointer=MemorySaver())
```

**Vantaggi del Pattern ReAct:**

- ✅ **Reasoning trasparente**: Ogni decisione è tracciabile
- ✅ **Azioni dinamiche**: Sceglie i tool necessari in base al contesto
- ✅ **Iterativo**: Può chiamare più tool in sequenza se serve
- ✅ **Robusto**: Gestisce errori e tool falliti

---

## 🏗️ Architettura

### Struttura Modulare

```
src/veronica_wordpress_chatbot/
├── workflow/              # LangGraph orchestration
│   └── graph.py          # ReAct pattern implementation
├── tools/                # 9 specialized LangChain tools
│   ├── blog_tools.py     # search_blog_posts, get_latest_blog_post
│   ├── portfolio_tools.py # get_portfolio_projects
│   ├── profile_tools.py  # get_certifications, get_work_experience
│   ├── content_tools.py  # get_books_and_reading, get_tools_and_stack
│   └── search_tools.py   # search_all_content, get_contact_info
├── wordpress/            # WordPress API integration
│   ├── client.py         # OptimizedWordPressClient
│   └── processor.py      # ContentProcessor (HTML cleaning)
├── api/                  # FastAPI application
│   ├── endpoints/        # REST endpoints
│   ├── security.py       # Input validation (14+ XSS patterns)
│   └── models.py         # Pydantic models
├── models.py             # LangGraph State (TypedDict)
├── config.py             # Configuration
└── utils/
    ├── logging_config.py # Centralized logging (3 handlers)
    ├── prompts.py        # System prompt generation
    ├── tracing.py        # LangSmith integration
    └── templates/        # Template files (prompt, personal summary)
```

### 🛠️ WordPress Tools

9 tools specializzati per accesso contenuti:

1. **`search_blog_posts`** - Ricerca articoli per query
2. **`get_latest_blog_post`** - Ultimo articolo pubblicato
3. **`get_portfolio_projects`** - Progetti del portfolio
4. **`get_certifications`** - Certificazioni e formazione
5. **`get_work_experience`** - Esperienze lavorative
6. **`get_books_and_reading`** - Libri letti e recensioni
7. **`get_tools_and_stack`** - Strumenti personali (4 categorie) + Stack tecnologico professionale (5 categorie)
8. **`search_all_content`** - Ricerca globale multi-contenuto
9. **`get_contact_info`** - Informazioni contatto

Ogni tool:

- Decorato con `@tool` di LangChain
- Restituisce JSON per dati strutturati
- Gestisce errori gracefully
- Usa `ContentProcessor` per pulire HTML

---

## 🚀 Quick Start

### 1. Prerequisites

- **Python 3.11+**
- **UV package manager** (consigliato) o pip
- **OpenAI API Key**
- **WordPress site** con REST API attiva

### 2. Installation

```bash
# Clone repository
git clone https://github.com/your-username/veronica-chatbot.git
cd veronica-chatbot

# Setup environment con UV
uv venv --python 3.11
source .venv/bin/activate  # Mac/Linux
# .venv\Scripts\activate   # Windows

# Install dependencies
uv pip install -r requirements.txt
```

### 3. Configuration

Crea file `.env`:

```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here
WORDPRESS_URL=https://www.veronicaschembri.com

# Optional - LangSmith tracing
LANGSMITH_API_KEY=your_langsmith_api_key
LANGSMITH_PROJECT=veronica-wordpress-chatbot
LANGSMITH_TRACING=true
```

### 4. Run

```bash
# Test WordPress endpoints
python -m src.veronica_wordpress_chatbot.chatbot

# Start FastAPI server
python main.py

# Server: http://localhost:8000
# API docs: http://localhost:8000/docs
```

---

## 🧪 Testing

### Test Suite

Comprehensive test suite con **69 test passing** (100% pass rate):

```bash
# Run all tests
uv run pytest

# Run specific suites
uv run pytest tests/unit/          # Unit tests
uv run pytest tests/integration/   # Integration tests

# Run with coverage
uv run pytest --cov=src/veronica_wordpress_chatbot --cov-report=html
```

### Test Coverage

- **23 test security** - XSS prevention, DoS protection, input validation, rate limiting
- **27 test tools** - LangChain tools con WordPress mock
- **19 test workflow** - LangGraph ReAct pattern, state management, memory
- **Total: 69 tests, 1 skipped** (pytest-benchmark non installato)

**Execution time**: ~4.6 secondi

### LangSmith Dataset & Evaluation

**20 test questions** categorizzate per evaluation automatica su LangSmith:

- **5 domande personali** - Verificano uso corretto di `personal_summary` (no tool calls)
- **11 domande tecniche** - Verificano chiamata tool corretti (`get_certifications`, `get_portfolio_projects`, etc.)
- **4 domande out-of-scope** - Verificano rifiuto corretto di domande generiche

```bash
# Dataset location
tests/fixtures/langsmith_test_dataset.jsonl

# Documentation
tests/fixtures/README_LANGSMITH_DATASET.md
```

**Strategia evaluation completa** con roadmap per 15+ metriche (Correctness, Tool Usage Accuracy, Factuality, Latency, Robustness, etc.). Vedi [documentazione dettagliata](tests/fixtures/README_LANGSMITH_DATASET.md#-strategia-di-evaluation-completa).

---

## 🛡️ Sicurezza

### Defense-in-Depth (3 livelli)

1. **Frontend** - React widget valida input prima dell'invio
2. **Pydantic** - Validators su API models
3. **Security Module** - 14+ pattern XSS, limiti DoS

### Protezioni Implementate

```python
# api/security.py
MALICIOUS_PATTERNS = [
    r'<script[^>]*>.*?</script>',  # Script tags
    r'javascript:',                 # JS protocol
    r'on\w+\s*=',                  # Event handlers
    r'<iframe[^>]*>',              # Iframes
    r'eval\s*\(',                  # Eval
    r'document\.|window\.',        # DOM manipulation
    # ... 8+ altri pattern
]
```

- ✅ **XSS Prevention**: 14+ malicious patterns bloccati
- ✅ **DoS Prevention**: Limiti lunghezza (2000 chars), caratteri ripetuti
- ✅ **Input Sanitization**: Encoding check, whitespace validation
- ✅ **Rate Limiting**: SlowAPI middleware (10 req/min)

23 test dedicati garantiscono la sicurezza.

---

## 🛠️ Stack Tecnologico

### Backend Core

- **Python 3.11+** - Linguaggio principale
- **LangGraph 0.5.0** - Orchestrazione AI agent (ReAct pattern)
- **LangChain 0.3.26** - Framework per LLM
- **LangSmith 0.4.4** - Observability e debugging
- **OpenAI GPT-4o-mini** - Modello LLM

### Web Framework

- **FastAPI 0.115+** - REST API
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation
- **SlowAPI** - Rate limiting

### WordPress Integration

- **WordPress REST API** - Endpoint nativi
- **Custom Post Types** - progetti, certificazioni, work-experiences, books, tools, stacks
- **ACF (Advanced Custom Fields)** - Campi personalizzati (projects, certifications, work-experiences, books)
- **Taxonomies** - tool-category (4 categorie), stack-category (5 categorie)

### Frontend (WordPress Plugin)

- **React 18** - UI framework (caricato da CDN)
- **JavaScript ES6+** - Moduli, async/await
- **LocalStorage** - Persistenza sessioni
- **Markdown** - Rendering sicuro messaggi bot

### Development Tools

- **UV** - Package manager veloce
- **pytest** - Test framework (90+ test)
- **black** - Code formatter
- **mypy** - Type checking

---

## 📊 API Endpoints

### Chat

```http
POST /chat
Content-Type: application/json

{
    "message": "Quali sono i tuoi progetti di AI?",
    "thread_id": "user-session-123"
}
```

**Response:**

```json
{
  "response": "Ecco i miei principali progetti AI: ...",
  "thread_id": "user-session-123",
  "timestamp": "2024-01-15T10:30:00",
  "langsmith_trace_url": "https://smith.langchain.com/..."
}
```

### Health Check

```http
GET /health
```

### Debug Tools

```http
GET /debug/tools      # Lista tools disponibili
GET /wordpress/test   # Test connessione WordPress
```

---

## 🌐 WordPress Plugin (v4.0)

### Installation

```bash
# Upload plugin
cp -r WP_Plugin/plugin-wp-v_4/ /path/to/wordpress/wp-content/plugins/veronica-chatbot/

# Activate in WordPress Admin
# Configure: Settings → Veronica Chatbot
```

### Plugin Features

- ✅ **React widget** responsive
- ✅ **Persistenza sessioni** (localStorage)
- ✅ **XSS protection** multi-layer
- ✅ **Cross-page sync** automatico
- ✅ **Markdown support** sicuro
- ✅ **Mobile optimized**

---

## 📈 Performance

- **Response Time**: 2-5s (LLM latency dipendente da OpenAI)
- **WordPress API**: 0.5-1s per endpoint
- **Memory Usage**: MemorySaver in-memory (scalabile con PostgreSQL checkpointer)
- **Security Validation**: < 10ms per input
- **Test Execution**: 4.6s (69 test)

---

## 🚀 Deployment

### Railway (Consigliato)

1. Connect repository su Railway
2. Set environment variables (`.env` template)
3. Auto-deploy on push

### Requisiti Produzione

- Python 3.11+
- OpenAI API Key
- WordPress REST API accessibile
- (Optional) LangSmith API Key per tracing

---

## 📝 Development

### Code Quality & Best Practices

Il progetto segue best practices rigorose:

- **✅ No variabili globali**: Pattern factory (`get_chatbot()`) invece di istanze globali
- **✅ Logging centralizzato**: 3 handlers (console, file, errors) con `setup_logging(__name__)`
- **✅ Template system**: Prompt separato da logica (vedi `utils/templates/`)
- **✅ Defensive programming**: Fallback su 3 livelli per caricamento file
- **✅ Path handling corretto**: `Path(__file__).parent` invece di path relativi
- **✅ Type hints**: Mypy strict mode per type safety
- **✅ DRY principle**: No duplicazioni, componenti riutilizzabili

### Commands

```bash
# Format code
black src/

# Type check
mypy src/

# Run tests
uv run pytest -v

# Run server with reload
uvicorn main:app --reload

# LangGraph Studio
langgraph dev
```

---

## 🤝 Contributing

Questo è un progetto portfolio. Per suggerimenti o feedback:

- 📧 Email: veronicaschembri@gmail.com
- 💼 LinkedIn: [linkedin.com/in/veronicaschembri](https://www.linkedin.com/in/veronicaschembri/)
- 🐙 GitHub: [github.com/Pandagan-85](https://github.com/Pandagan-85/)

---

<div align="center">

**⭐ Star questo repository se ti è stato utile!**

_Made with ❤️ by Veronica Schembri - AI Engineer_

**Stack**: Python · LangGraph · LangChain · FastAPI · React · WordPress

</div>
