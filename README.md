# Veronica Schembri WordPress Chatbot v2.0

## 🚀 Novità Versione 2.0

- **LangGraph ReAct Pattern**: Implementazione del pattern ReAct per reasoning iterativo
- **LangSmith Tracing**: Tracciamento completo per debugging e monitoring
- **WordPress API Ottimizzata**: Connessione diretta agli endpoint WordPress con www
- **Memory Persistence**: Gestione delle conversazioni con stato persistente
- **Tools Specializzati**: Set completo di tools per contenuti WordPress

## 🏗️ Architettura

```
WordPress API (veronicaschembri.com)
    ↓
LangGraph ReAct Agent
    ├── Agent Node (Reasoning)
    ├── Tools Node (Actions)
    └── Memory (State Persistence)
    ↓
FastAPI Backend
    ↓
LangSmith Tracing
```

## 📋 Setup Rapido con UV

### 1. Clona e Setup Environment

```bash
# Clona il progetto
git clone <your-repo>
cd veronica-wordpress-chatbot

# Setup con uv
uv venv
source .venv/bin/activate  # Linux/Mac
# o .venv\Scripts\activate  # Windows

# Installa dipendenze
uv pip install -r requirements.txt
```

### 2. Configura Environment Variables

Crea `.env`:

```bash
OPENAI_API_KEY=your_openai_api_key_here
WORDPRESS_URL=https://www.veronicaschembri.com
LANGCHAIN_API_KEY=your_langsmith_api_key_here  # Opzionale
LANGSMITH_PROJECT=veronica-wordpress-chatbot
```

### 3. Avvia il Server

```bash
# Con uv
uv run python main.py

# Oppure direttamente
python main.py
```

## 🔧 Endpoint Principali

- `GET /health` - Health check completo
- `POST /chat` - Chat principale con tracing
- `GET /wordpress/test` - Test connessione WordPress
- `GET /debug/tools` - Debug tools disponibili
- `POST /test/conversation` - Test conversazione completa

## 🧪 Testing

```bash
# Test manuale
curl -X POST "http://localhost:8000/chat" \
     -H "Content-Type: application/json" \
     -d '{"message": "Ciao! Parlami dei tuoi progetti di AI"}'

# Test health check
curl http://localhost:8000/health

# Test WordPress
curl http://localhost:8000/wordpress/test
```

## 📊 LangSmith Integration

Con LangSmith attivo potrai:

- 🔍 **Tracciare ogni step** del reasoning
- 📈 **Monitorare performance** e costi
- 🐛 **Debug problemi** in tempo reale
- 📊 **Analizzare conversazioni** complete

Accedi a LangSmith: https://smith.langchain.com

## 🛠️ Tools Disponibili

1. `search_blog_posts` - Cerca negli articoli del blog
2. `get_latest_blog_post` - Ultimo articolo pubblicato
3. `get_portfolio_projects` - Progetti del portfolio
4. `get_certifications` - Certificazioni conseguite
5. `get_work_experience` - Esperienze lavorative
6. `search_content` - Ricerca generale nei contenuti

## 🔄 Rispetto alla Versione Precedente

### ✅ Manteniamo

- ✅ Logic di estrazione contenuti dalla versione app.py
- ✅ System prompt personalizzato basato su summary.txt
- ✅ Gestione robusta errori WordPress API
- ✅ Struttura tools specializzati

### 🚀 Miglioriamo

- 🚀 Pattern ReAct per reasoning avanzato
- 🚀 LangSmith tracing per debugging
- 🚀 State management con memory
- 🚀 Architettura più scalabile
- 🚀 Endpoint WordPress corretti (con www)

## 🐛 Troubleshooting

### WordPress API Issues

```bash
# Test endpoints manualmente
curl https://www.veronicaschembri.com/wp-json/wp/v2/posts?per_page=1
curl https://www.veronicaschembri.com/wp-json/wp/v2/projects?per_page=1
```

### LangSmith Not Working

- Verifica `LANGCHAIN_API_KEY` in .env
- Controlla progetto su smith.langchain.com
- L'app funziona anche senza LangSmith

### Tools Not Called

- Verifica system prompt
- Controlla logs del server
- Usa `/debug/tools` per verificare configurazione

## 🚀 Deploy in Produzione

### Con Railway/Render

1. Connetti repository
2. Configura environment variables
3. Deploy automatico

### Con Docker

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```
