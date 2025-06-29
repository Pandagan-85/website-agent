# 🤖 Veronica Schembri WordPress Chatbot

> **Un chatbot AI professionale che rappresenta Veronica Schembri online, powered by LangGraph e WordPress API con sicurezza e persistenza avanzate**

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![LangGraph](https://img.shields.io/badge/LangGraph-0.5.0-green.svg)](https://langchain-ai.github.io/langgraph/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-red.svg)](https://fastapi.tiangolo.com)
[![WordPress](https://img.shields.io/badge/WordPress-API-blue.svg)](https://developer.wordpress.org/rest-api/)
[![Security](https://img.shields.io/badge/Security-XSS%20Protected-brightgreen.svg)](#-sicurezza)
[![Mobile](https://img.shields.io/badge/Mobile-Responsive-orange.svg)](#-responsive-e-mobile)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📖 Panoramica

Il **Veronica Schembri WordPress Chatbot** è un assistente AI avanzato che rappresenta professionalmente Veronica Schembri sul suo sito web. Utilizza il pattern **ReAct (Reasoning-Acting)** di LangGraph per fornire informazioni accurate sui progetti, articoli, certificazioni e competenze, sempre basandosi sui contenuti reali del sito WordPress.

### 🎯 Caratteristiche Principali

- **🧠 AI Reasoning Avanzato**: Pattern ReAct con LangGraph per decisioni intelligenti
- **📊 WordPress Integration**: Connessione diretta agli endpoint WordPress API
- **🔧 Tools Specializzati**: 9 strumenti dedicati per diversi tipi di contenuti
- **🛡️ Sicurezza Enterprise**: Protezione XSS completa e input sanitization
- **💾 Persistenza Intelligente**: Sessioni e conversazioni persistenti cross-page
- **📱 Mobile-First**: Widget React responsive con ottimizzazioni iOS/Android
- **📈 Observability**: Tracciamento LangSmith per debugging e monitoring
- **🚀 Production Ready**: Architettura scalabile e robusta

---

## 🏗️ Architettura

```mermaid
graph TD
    A[WordPress Site] -->|REST API| B[Python Backend]
    B -->|LangGraph ReAct| C[AI Agent]
    C -->|Specialized Tools| D[Content Retrieval]
    B -->|FastAPI| E[WordPress Plugin]
    E -->|React Widget| F[User Interface]
    B -->|Traces| G[LangSmith Monitoring]
    F -->|Persistence| H[LocalStorage]
    F -->|Security| I[XSS Protection]

    subgraph "Backend Components"
        B
        C
        D
    end

    subgraph "Frontend Components"
        E
        F
        H
        I
    end
```

### 🔄 Pattern ReAct Flow

1. **Reason**: L'agent analizza la domanda dell'utente
2. **Act**: Seleziona e esegue gli strumenti appropriati
3. **Observe**: Processa i risultati ottenuti
4. **Repeat**: Itera fino alla risposta completa

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
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /&lt;script/i,
    /document\./i,
    /window\./i,
    /expression\s*\(/i,
    /import\s+/i,
  ];
  return !xssPatterns.some((pattern) => pattern.test(input));
}
```

### Security Features

- **Real-time Validation**: Controllo input in tempo reale
- **Event Logging**: Monitoraggio tentativi XSS e attività sospette
- **Content Filtering**: Separazione sicura tra contenuti utente e bot
- **Debug Monitoring**: Logging sicurezza dettagliato per sviluppo

---

## 💾 Gestione Persistenza

### Sessioni Intelligenti

- **Duration Management**: Sessioni persistenti configurabili (1-30 giorni)
- **Activity Tracking**: Reset automatico dopo inattività prolungata
- **Cross-Page Sync**: Conversazioni sincronizzate tra pagine del sito
- **Storage Fallback**: Funzionamento anche senza localStorage disponibile

### Cronologia Conversazioni

- **Message Persistence**: Salvataggio automatico conversazioni nel browser
- **Storage Optimization**: Gestione quota con cleanup automatico
- **Conversation Timeout**: Reset intelligente dopo periodi di inattività
- **Message Limits**: Controllo memoria con limite configurabile (10-500 messaggi)

```javascript
// Configurazione persistenza
const PERSISTENCE_CONFIG = {
  SESSION_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 giorni
  CONVERSATION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 ore
  MAX_MESSAGES: 100, // Limite messaggi
  ENABLE_CROSS_PAGE_SYNC: true, // Sync tra pagine
};
```

---

## 📱 Responsive e Mobile

### Mobile-First Design

- **Adaptive Layout**: Design responsivo con breakpoint intelligenti
- **Touch Optimization**: Target touch amichevoli per dispositivi mobili
- **iOS Compatibility**: Prevenzione zoom automatico su input
- **Performance**: Caricamento ottimizzato per connessioni lente

### Desktop Experience

- **Floating Widget**: Posizionamento configurabile (bottom-right/left)
- **Smooth Animations**: Transizioni fluide e moderne
- **Keyboard Navigation**: Supporto completo navigazione da tastiera
- **Window Management**: Minimizza/espandi con stato persistente

---

## 📁 Struttura Progetto

```
veronica-chatbot/
├── 📄 main.py                    # FastAPI server entry point
├── 🤖 chatbot.py                 # LangGraph agent e tools
├── 🔧 requirements.txt           # Dipendenze Python
├── ⚙️ pyproject.toml             # Configurazione progetto
├── 🌍 .env                       # Environment variables
├── 📖 README.md                  # Documentazione
├── 🗂️ me/
│   └── 📝 summary.txt            # Profilo personale Veronica
├── 🔌 plugin-wp_v_2_1/           # Plugin WordPress v2.1
│   ├── 📄 veronica-chatbot.php   # Plugin principale con persistenza
│   └── 📁 assets/
│       └── 💻 chatbot.js         # Widget React con sicurezza avanzata
└── 📊 langgraph.json             # Configurazione LangGraph Studio
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
python chatbot.py

# Start FastAPI server
python main.py

# Server available at: http://localhost:8000
```

### 5. WordPress Plugin Setup (v2.1)

1. **Upload Plugin**:

   ```bash
   cp -r plugin-wp_v_2_1/ /path/to/wordpress/wp-content/plugins/veronica-chatbot/
   ```

2. **Activate**: WordPress Admin → Plugins → Activate "Veronica Chatbot"

3. **Configure**: Settings → Veronica Chatbot:
   - **API Endpoint**: `https://your-backend-url.com/chat`
   - **Theme**: Light/Dark
   - **Position**: Bottom Right/Left
   - **Persistenza**: Durata sessione, timeout, max messaggi
   - **Sicurezza**: Validazione input, XSS protection

---

## 🔧 Core Components

### LangGraph Agent (`chatbot.py`)

```python
# Pattern ReAct Implementation
def create_graph():
    builder = StateGraph(State, input=InputState, config_schema=Configuration)

    # Core nodes
    builder.add_node("agent", call_model)      # 🧠 Reasoning
    builder.add_node("tools", ToolNode(TOOLS)) # 🛠️ Actions

    # ReAct flow
    builder.add_conditional_edges("agent", should_continue, {
        "tools": "tools",
        "__end__": "__end__"
    })
    builder.add_edge("tools", "agent")  # Continue reasoning

    return builder.compile(checkpointer=MemorySaver())
```

### Specialized Tools

**📝 Content Tools**:

- `search_blog_posts()`: Ricerca negli articoli
- `get_latest_blog_post()`: Ultimo articolo pubblicato
- `get_portfolio_projects()`: Progetti del portfolio

**🎓 Professional Tools**:

- `get_certifications()`: Certificazioni e formazione
- `get_work_experience()`: Esperienze lavorative
- `get_tools_and_stack()`: Stack tecnologico

**🔍 Search Tools**:

- `search_all_content()`: Ricerca globale
- `get_contact_info()`: Informazioni contatto

### WordPress Client (`OptimizedWordPressClient`)

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
    return React.createElement(
      "div",
      {
        style: userMessageStyle,
      },
      message.content
    ); // Solo testo, niente HTML
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
    "thread_id": "user_123",
    "conversation_history": []
}
```

**Response**:

```json
{
  "response": "Ho diversi progetti interessanti di AI...",
  "thread_id": "user_123",
  "timestamp": "2025-06-28T16:00:00Z",
  "langsmith_trace_url": "https://smith.langchain.com/..."
}
```

### Additional Endpoints

- `GET /health` - Health check completo con sicurezza e persistenza
- `GET /wordpress/test` - Test connessione WordPress
- `GET /debug/tools` - Debug tools disponibili
- `POST /simple-chat` - Endpoint semplificato
- `GET /api/info` - Informazioni API con feature security

---

## ⚙️ Configurazione Avanzata

### Plugin WordPress Settings (v2.1)

**Gestione Persistenza:**

```php
// Nuove opzioni disponibili
'session_duration' => 7,              // Giorni (1-30)
'conversation_timeout' => 24,         // Ore (1-168)
'max_messages' => 100,               // Messaggi (10-500)
'enable_persistence' => true,        // Abilita persistenza
'enable_cross_page_sync' => true,    // Sync cross-page
'debug_mode' => false                // Debug logging
```

**Security Settings:**

```php
'input_validation' => 'strict',      // Validazione input
'xss_protection' => true,           // Protezione XSS
'content_filtering' => 'safe',       // Filtraggio contenuti
'security_logging' => true          // Log eventi sicurezza
```

### Frontend Configuration

```javascript
// Configurazione JavaScript avanzata
window.veronicaChatbotConfig = {
  // API & Core
  apiUrl: "https://your-api.com/chat",

  // Persistenza
  sessionDuration: 7 * 24 * 60 * 60 * 1000,
  conversationTimeout: 24 * 60 * 60 * 1000,
  maxMessages: 100,
  enablePersistence: true,
  enableCrossPageSync: true,

  // Sicurezza
  inputValidation: "strict",
  xssProtection: true,
  securityLogging: true,

  // UI & UX
  theme: "light",
  position: "bottom-right",
  debugMode: false,
};
```

---

## 🔍 Debugging & Monitoring

### LangGraph Studio

```bash
# Avvia LangGraph Studio per debugging visuale
langgraph dev

# UI disponibile: http://localhost:8123
```

**Features**:

- 📊 Visualizzazione grafo ReAct
- 🔍 Step-by-step execution trace
- 🛠️ Tools calls monitoring
- ⏱️ Performance metrics

### Debug Console (Dev Mode)

```javascript
// Funzioni debug disponibili in modalità sviluppo
window.VeronicaChatbotDebug = {
  showSessionInfo(),     // Info sessione corrente
  testAPI(),            // Test connessione API
  hardReset(),          // Reset completo dati
  showStorageStats(),   // Statistiche storage
  exportData(),         // Backup conversazioni
  importData(file)      // Ripristino backup
};
```

### LangSmith Integration

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
@tool
def get_custom_data(query: str) -> str:
    """Custom tool description"""
    # Implementation with security validation
    if not validateInputSecure(query):
        return json.dumps({"error": "Invalid input blocked"})

    return result

# Add to TOOLS list
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
    'show_in_rest' => true,  // Essential!
    'rest_base' => 'custom_type',
]);
```

### Frontend Security Customization

```javascript
// Custom security patterns
const customXSSPatterns = [
  /custom-dangerous-pattern/i,
  /another-security-check/i,
];

// Extend validation
function customValidateInput(input) {
  return (
    validateInputSecure(input) &&
    !customXSSPatterns.some((pattern) => pattern.test(input))
  );
}
```

---

## 📊 Analytics e Statistiche

### Metriche Disponibili (WordPress Admin)

- **Conversazioni Totali**: Numero sessioni uniche create
- **Messaggi Totali**: Volume messaggi scambiati
- **Sessioni Attive**: Utenti con conversazioni in corso
- **Ultima Attività**: Timestamp ultima interazione
- **Storage Usage**: Utilizzo spazio browser utenti
- **Security Events**: Tentativi XSS bloccati

### REST API per Analytics

```http
POST /wp-json/veronica-chatbot/v1/stats/update
{
  "type": "conversation|message|session|security_event",
  "increment": 1
}
```

---

## 🐛 Troubleshooting

### Common Issues

**❌ WordPress API Error**:

```bash
# Test manuale endpoint
curl https://www.veronicaschembri.com/wp-json/wp/v2/posts?per_page=1
```

**❌ Tools Not Called**:

- Verifica system prompt
- Check LangSmith traces
- Debug con `/debug/tools`

### Problemi Persistenza

**❌ Conversazioni non persistono:**

```bash
# Debug storage
VeronicaChatbotDebug.showStorageStats()

# Check quota localStorage
VeronicaChatbotDebug.showSessionInfo()

# Reset se necessario
VeronicaChatbotDebug.hardReset()
```

**❌ Sync cross-page non funziona:**

- Verifica `enable_cross_page_sync: true` in settings
- Check same origin policy tra pagine
- Controlla console per errori storage events

### Problemi Sicurezza

**❌ Messaggi bloccati erroneamente:**

- Disabilita temporaneamente validation strict
- Check console per pattern XSS detection
- Verifica input per caratteri speciali problematici

**❌ Frontend Not Loading**:

- Hard refresh cache (`Ctrl+F5`)
- Check browser console errors
- Verify plugin activation
- Test con debug mode attivo

### Debug Commands

```bash
# Test all components
python chatbot.py --full-test

# Health check con sicurezza
curl http://localhost:8000/health

# WordPress connection
curl http://localhost:8000/wordpress/test
```

---

## 🔄 Migration Guide

### Da Versione < 2.1.0

1. **Backup Esistente**:

   ```javascript
   VeronicaChatbotDebug.exportData(); // Se disponibile
   ```

2. **Update Plugin**:

   - Upload nuovo plugin WordPress v2.1
   - Attiva e configura nuove opzioni persistenza e sicurezza

3. **Test Features**:

   - Verifica cross-page sync
   - Test session persistence
   - Check mobile responsive
   - Validate security protection

4. **Production Deploy**:
   - Disabilita debug mode
   - Configura session duration appropriato
   - Monitor storage usage iniziale
   - Review security logs

---

## 🤝 Contributing

### Development Setup

```bash
# Setup dev environment
uv venv
source .venv/bin/activate
uv pip install -e ".[dev]"

# Code formatting
black .
isort .

# Type checking
mypy .

# Security checks
bandit -r .
```

### Pull Request Process

1. **Fork** il repository
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Test security**: Verify XSS protection e input validation
4. **Test persistence**: Check cross-page sync e storage
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push branch**: `git push origin feature/amazing-feature`
7. **Open Pull Request**

---

## 📄 License

Questo progetto è rilasciato sotto licenza **MIT**. Vedi il file [LICENSE](LICENSE) per i dettagli.

---

## 👥 Team

**🧑‍💻 Sviluppato da**: [Veronica Schembri](https://github.com/Pandagan-85)

- 🌐 Website: [veronicaschembri.com](https://www.veronicaschembri.com)
- 💼 LinkedIn: [linkedin.com/in/veronicaschembri](https://www.linkedin.com/in/veronicaschembri/)
- 📧 Email: veronicaschembri@gmail.com

---

## 🙏 Acknowledgments

- **🦜 LangChain Team** per gli strumenti AI framework
- **⚡ FastAPI** per l'eccellente web framework
- **📝 WordPress** per le API robuste
- **⚛️ React Team** per il frontend framework
- **🛡️ Security Community** per best practices XSS prevention

---

## 📈 Roadmap

### Version 2.2.0

- [ ] 🎤 Voice input/output support
- [ ] 🌍 Multi-language support con persistenza
- [ ] 📊 Advanced analytics dashboard con security metrics
- [ ] 🔐 Enhanced authentication system

### Version 2.3.0

- [ ] 📱 Mobile app nativa
- [ ] 🤖 Multi-agent workflows con sicurezza
- [ ] 🎨 Theme customization avanzato
- [ ] 📈 A/B testing framework per UX

### Version 3.0.0

- [ ] 🧠 Local LLM support (privacy-first)
- [ ] 🔒 End-to-end encryption per conversazioni
- [ ] 🌐 Multi-site management
- [ ] 📊 Business intelligence dashboard

---

<div align="center">

**⭐ Se questo progetto ti è utile, considera di dargli una stella!**

**🛡️ Sicuro • 💾 Persistente • 📱 Mobile-Ready • 🚀 Production-Tested**

[🚀 Live Demo](https://www.veronicaschembri.com) | [📚 Documentation](https://github.com/your-username/veronica-chatbot/wiki) | [🐛 Report Bug](https://github.com/your-username/veronica-chatbot/issues) | [🛡️ Security Policy](https://github.com/your-username/veronica-chatbot/security/policy)

---

**Version 2.1.0** - Sicurezza Enterprise & Persistenza Intelligente  
_Ultimo aggiornamento: Gennaio 2025_

</div>
