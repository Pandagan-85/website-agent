# 🤖 Veronica Chatbot - AI Assistant

> **Assistente AI conversazionale** per Veronica Schembri, AI Engineer. Architettura modulare con LangGraph, WordPress integration e sicurezza avanzata.

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green.svg)](https://fastapi.tiangolo.com/)
[![LangChain](https://img.shields.io/badge/LangChain-0.3.26-orange.svg)](https://python.langchain.com/)
[![Security](https://img.shields.io/badge/Security-XSS%20Protected-red.svg)](#-sicurezza)

---

## 🎯 Overview

Chatbot AI progettato per rappresentare Veronica Schembri sul suo portfolio, con accesso intelligente ai contenuti WordPress e conversazioni naturali per potenziali clienti e datori di lavoro.

### ✨ Caratteristiche Principali

- **🧠 AI Agent**: LangGraph con pattern ReAct per reasoning avanzato
- **🔧 Architettura Modulare**: Codice organizzato e manutenibile post-refactoring
- **🌐 WordPress Integration**: API native + custom endpoints ottimizzati
- **🛡️ Sicurezza Avanzata**: Protezione XSS, input validation, storage sicuro
- **📱 Mobile Ready**: Widget React responsive con persistenza cross-page
- **📊 Observability**: LangSmith integration per monitoring e debugging

---

## 🏗️ Architettura Post-Refactoring

### Struttura Modulare

```
src/veronica_wordpress_chatbot/
├── 🧠 workflow/          # LangGraph orchestration
│   ├── graph.py          # StateGraph + ReAct pattern
│   └── __init__.py
├── 🛠️ tools/            # Specialized AI tools
│   ├── wordpress_tools.py # WordPress API interactions
│   ├── __init__.py
│   └── TOOLS            # Tool registry
├── 🔌 clients/          # External integrations
│   ├── wordpress.py     # Optimized WP client
│   └── __init__.py
├── 📋 models/           # Data models & state
│   ├── state.py         # LangGraph State classes
│   ├── config.py        # Configuration schemas
│   └── __init__.py
├── ⚙️ config/           # App configuration
│   ├── settings.py      # Environment + defaults
│   └── __init__.py
└── 🔧 utils/            # Utilities & helpers
    ├── prompts.py       # System prompt creation
    ├── tracing.py       # LangSmith integration
    └── __init__.py
```

### Core Components

#### 🧠 LangGraph Workflow (`workflow/graph.py`)

```python
# Pattern ReAct Implementation
def create_graph():
    builder = StateGraph(State, input=InputState, config_schema=Configuration)
    
    # Core nodes
    builder.add_node("agent", call_model)      # 🧠 Reasoning
    builder.add_node("tools", ToolNode(TOOLS)) # 🛠️ Actions
    
    # ReAct flow: Reason → Act → Observe → Repeat
    builder.add_conditional_edges("agent", should_continue, {
        "tools": "tools",
        "__end__": "__end__"
    })
    builder.add_edge("tools", "agent")  # Continue reasoning
    
    return builder.compile(checkpointer=MemorySaver())
```

#### 🛠️ Specialized Tools (`tools/wordpress_tools.py`)

**📝 Content Discovery**:
- `search_blog_posts()`: Ricerca intelligente negli articoli
- `get_latest_blog_post()`: Ultimo contenuto pubblicato
- `get_portfolio_projects()`: Progetti del portfolio

**🎓 Professional Profile**:
- `get_certifications()`: Certificazioni e formazione
- `get_work_experience()`: Esperienze lavorative
- `get_tools_and_stack()`: Stack tecnologico

**🔍 Advanced Search**:
- `search_all_content()`: Ricerca globale
- `get_contact_info()`: Informazioni contatto

#### 🔌 WordPress Client (`clients/wordpress.py`)

```python
class OptimizedWordPressClient:
    def __init__(self, base_url: str):
        self.wp_api_base = f"{base_url}/wp-json/wp/v2"
        self.field_configs = {
            "posts": {...},      # Configurazione campi ottimizzata
            "projects": {...},   # Custom post types
            "formazione": {...}  # Certificazioni
        }
    
    def _make_request(self, endpoint: str, params: dict = None):
        # Gestione robusta con timeout e error handling
```

---

## 🚀 Quick Start

### 1. Prerequisites

- **Python 3.11+**
- **WordPress site** con REST API attiva
- **OpenAI API Key**
- **UV package manager** (consigliato)

### 2. Installation

```bash
# Clone repository
git clone https://github.com/your-username/veronica-chatbot.git
cd veronica-chatbot

# Setup environment con UV
uv venv --python 3.11
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate   # Windows

# Install dependencies
uv pip install -r requirements.txt
```

### 3. Configuration

Crea file `.env`:

```bash
# Core Configuration
OPENAI_API_KEY=your_openai_api_key_here
WORDPRESS_URL=https://www.veronicaschembri.com

# LangSmith (Optional - per debugging)
LANGSMITH_API_KEY=your_langsmith_api_key_here
LANGSMITH_PROJECT=veronica-wordpress-chatbot
LANGSMITH_TRACING=true
```

### 4. Run Locally

```bash
# Test WordPress endpoints
python -m src.veronica_wordpress_chatbot.test_client

# Start FastAPI server
python main.py

# Server available at: http://localhost:8000
```

### 5. WordPress Plugin Setup (v2.1)

1. **Upload Plugin**:
   ```bash
   cp -r WP_Plugin/plugin-wp_v_2_1/ /path/to/wordpress/wp-content/plugins/veronica-chatbot/
   ```

2. **Activate**: WordPress Admin → Plugins → Activate "Veronica Chatbot"

3. **Configure**: Settings → Veronica Chatbot:
   - **API Endpoint**: `https://your-backend-url.com/chat`
   - **Theme**: Light/Dark
   - **Position**: Bottom Right/Left
   - **Persistenza**: Durata sessione, timeout, max messaggi
   - **Sicurezza**: Validazione input, XSS protection

---

## 🎨 Frontend Features

### React Widget con Persistenza

**🖥️ Desktop Experience**:
- Floating button bottom-right
- Expandable chat window (380px)
- Minimize/close controls con stato persistente
- Smooth animations e gestione memoria

**📱 Mobile Responsive**:
- Full-width con margini intelligenti
- Optimized touch targets
- Adjusted typography e spacing
- iOS zoom prevention (16px input font)

### Sicurezza Frontend

```javascript
function renderMessageContent(message, config) {
  if (message.sender === "user") {
    // MESSAGGI UTENTE: Solo testo puro, sempre
    return React.createElement("div", {
      style: userMessageStyle,
    }, message.content); // Solo testo, niente HTML
  } else {
    // MESSAGGI BOT: HTML processato da markdown sicuro
    const processedContent = formatBotMessageSafely(message.content);
    return React.createElement("div", {
      style: botMessageStyle,
      dangerouslySetInnerHTML: { __html: processedContent },
    });
  }
}
```

### Markdown Support Sicuro

**Supported Features**:
- ✅ **Bold text**: `**testo**`
- ✅ **Headers**: `### Titolo`
- ✅ **Links**: `[testo](url)` (con validazione URL)
- ✅ **Lists**: `- item`
- 🛡️ **XSS Protection**: Blocco completo script e contenuti pericolosi

---

## 🌐 API Endpoints

### Main Chat Endpoint

```http
POST /chat
Content-Type: application/json

{
    "message": "Quali sono i tuoi progetti di AI?",
    "thread_id": "user-session-123"
}
```

**Response**:
```json
{
    "response": "Ecco i miei principali progetti di AI:\n\n**🤖 Chatbot Portfolio**: Questo stesso chatbot che stai usando...",
    "thread_id": "user-session-123",
    "sources": ["portfolio_projects", "blog_posts"]
}
```

### Health Check

```http
GET /health
```

**Response**:
```json
{
    "status": "healthy",
    "wordpress_connection": "ok",
    "langsmith_enabled": true
}
```

---

## 🛡️ Sicurezza

### Input Sanitization

- **XSS Prevention**: Blocco completo di script, iframe e contenuti pericolosi
- **HTML Filtering**: Rimozione automatica di tag HTML maliciosi dall'input utente
- **Content Security**: Validazione pre-input con oltre 20 pattern di sicurezza
- **Safe Rendering**: Separazione tra messaggi utente (solo testo) e bot (markdown processato)

```javascript
// Esempio di protezione input
function validateInputSecure(input) {
  const xssPatterns = [
    /<script/i, /javascript:/i, /on\w+\s*=/i, /&lt;script/i,
    /document\./i, /window\./i, /expression\s*\(/i, /import\s+/i,
  ];
  return !xssPatterns.some((pattern) => pattern.test(input));
}
```

### Security Features

- **Real-time Input Validation**: Blocco immediato di contenuti sospetti
- **Storage Protection**: Validazione dati prima di localStorage
- **Content Encoding**: Gestione sicura di entità HTML e caratteri speciali
- **Error Logging**: Tracking eventi di sicurezza per analisi

---

## 🛠️ Stack Tecnologico

### Backend Core

- **🐍 Python 3.11+**: Linguaggio principale
- **🦜 LangChain 0.3.26**: Framework AI per LLM
- **📊 LangGraph 0.5.0**: Orchestrazione agent con pattern ReAct
- **📈 LangSmith 0.4.4**: Observability e debugging
- **🤖 OpenAI API**: Modello GPT-4o-mini per reasoning

### Web Framework

- **⚡ FastAPI 0.115+**: Backend API moderno e veloce
- **🔧 Uvicorn**: Server ASGI per produzione
- **🌐 CORS Middleware**: Supporto cross-origin requests

### WordPress Integration

- **📝 WordPress REST API**: Endpoint nativi per contenuti
- **🔌 Custom Endpoints**: Post types specializzati (progetti, certificazioni, etc.)
- **🛡️ Error Handling**: Gestione robusta delle richieste API

### Frontend

- **⚛️ React 18**: UI component framework
- **💅 Tailwind CSS**: Utility-first styling
- **📱 Responsive Design**: Mobile-first approach
- **📝 Markdown Support**: Rendering HTML da markdown
- **💾 Persistent Storage**: LocalStorage con fallback in-memory

### DevOps & Deployment

- **📦 UV Package Manager**: Gestione dipendenze veloce
- **🐳 Docker Ready**: Containerizzazione per deploy
- **☁️ Railway Compatible**: Deploy cloud semplificato
- **🔄 Git Workflow**: Version control e CI/CD

---

## 📊 Performance

### Benchmarks Aggiornati

- **⚡ Response Time**: < 1.5s con persistenza attiva
- **💾 Memory Usage**: ~150MB con 100 messaggi in cache
- **📱 Mobile Performance**: < 2s first load su 3G
- **🔄 Cross-Page Sync**: < 100ms sincronizzazione
- **🛡️ Security Validation**: < 10ms per input

### Optimization Features

- **Lazy Loading**: Caricamento progressivo componenti React
- **Storage Cleanup**: Garbage collection automatica sessioni scadute
- **Message Compression**: Ottimizzazione spazio localStorage
- **Network Caching**: Cache intelligente richieste API
- **XSS Prevention**: Validation ottimizzata con minimal overhead

---

## 📊 LangSmith Integration

```python
@traceable(name="wordpress_chatbot_request")
def process_chat_with_tracing(message: str, thread_id: str):
    # Automatic tracing di conversazioni con sicurezza
    return chatbot.chat(message, thread_id)
```

**Dashboard Features**:
- 📈 Conversation analytics
- 💰 Cost tracking
- 🐛 Error monitoring con eventi sicurezza
- 📊 Performance insights

---

## 🚀 Deployment

### Railway (Recommended)

1. **Connect Repository** su Railway
2. **Set Environment Variables**:
   ```
   OPENAI_API_KEY=your_key
   WORDPRESS_URL=https://www.veronicaschembri.com
   LANGSMITH_API_KEY=your_langsmith_key
   ```
3. **Deploy**: Automatic build e deploy

### Docker

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
# Build e run
docker build -t veronica-chatbot .
docker run -p 8000:8000 veronica-chatbot
```

### Production Checklist

#### Sicurezza ✅
- [ ] XSS protection attiva
- [ ] Input validation configurata
- [ ] Security logging appropriato
- [ ] Debug mode disabilitato

#### Persistenza ✅
- [ ] Session duration configurata (raccomandato: 7 giorni)
- [ ] Conversation timeout appropriato (raccomandato: 24 ore)
- [ ] Max messages ragionevole (raccomandato: 100)
- [ ] Cross-page sync testato

#### Performance ✅
- [ ] Mobile responsive verificato
- [ ] Storage cleanup configurato
- [ ] API timeout appropriati
- [ ] Loading states implementati

---

## 🔧 Customization

### Adding New Tools

```python
# In tools/wordpress_tools.py
@tool
def get_custom_data(query: str) -> str:
    """Custom tool description"""
    # Implementation with security validation
    if not validate_input(query):
        return json.dumps({"error": "Invalid input blocked"})
    
    return result

# Add to tools/__init__.py
TOOLS = [
    search_blog_posts,
    get_portfolio_projects,
    get_custom_data,  # ← New tool
    # ...
]
```

### WordPress Custom Endpoints

```php
// In WordPress functions.php
register_post_type('custom_type', [
    'public' => true,
    'show_in_rest' => true,  // Essential for REST API
    'rest_base' => 'custom',
]);
```

### Configuration Extension

```python
# In models/config.py
class Configuration(BaseModel):
    model: str = "gpt-4o-mini"
    wordpress_base_url: str = "https://www.veronicaschembri.com"
    custom_setting: str = "default_value"  # ← New setting
```

---

## 🤝 Contributing

1. **Fork** il repository
2. **Create** feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** Pull Request

### Development Guidelines

- Seguire l'architettura modulare esistente
- Aggiungere test per nuove funzionalità
- Mantenere la sicurezza XSS protection
- Documentare API changes
- Testare su mobile e desktop

---

## 📝 License

Questo progetto è licensed under the MIT License - vedi il file [LICENSE](LICENSE) per dettagli.

---

## 📞 Support

- **🌐 Website**: [veronicaschembri.com](https://www.veronicaschembri.com)
- **📧 Email**: veronicaschembri@gmail.com
- **💼 LinkedIn**: [linkedin.com/in/veronicaschembri](https://www.linkedin.com/in/veronicaschembri/)
- **🐙 GitHub**: [github.com/Pandagan-85](https://github.com/Pandagan-85/)

---

<div align="center">

**⭐ Star questo repository se ti è stato utile!**

*Made with ❤️ by Veronica Schembri - AI Engineer*

</div>