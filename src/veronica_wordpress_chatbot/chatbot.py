"""
LangGraph WordPress Chatbot - Con Endpoint Ottimizzati
Sfrutta tutto il lavoro fatto sugli endpoint WordPress specifici
"""

import os
import json
import re
import asyncio
from typing import Dict, List, Any, Optional, Literal, TypedDict, Annotated
from dataclasses import dataclass, field
import requests
from datetime import datetime

# LangGraph imports
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver

# LangChain imports
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langchain_core.runnables.config import RunnableConfig

# Configuration


@dataclass
class Configuration:
    """Configuration for the chatbot"""
    model: str = field(
        default="gpt-4o-mini",
        metadata={
            "description": "The LLM model to use."
        },
    )

    wordpress_base_url: str = field(
        default="https://www.veronicaschembri.com",
        metadata={
            "description": "WordPress site base URL"
        },
    )

# State definition


class State(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    wordpress_url: str
    user_info: Dict[str, Any]


class InputState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]


class OptimizedWordPressClient:
    """Client WordPress ottimizzato con tutti gli endpoint specifici"""

    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.wp_api_base = f"{self.base_url}/wp-json/wp/v2"

        # Field configurations ottimizzate per ogni endpoint
        self.field_configs = {
            "posts": {
                "fields": "id,date,title,content,excerpt,link,categories,tags,author,featured_media,yoast_head_json",
                "description": "Articoli del blog completi"
            },
            "projects": {
                "fields": "id,date,title,content,excerpt,link,acf,project-category,featured_media",
                "acf_fields": [
                    "project_external_url", "project_preview_text",
                    "project_repository", "project_frontend", "project_single_page"
                ],
                "description": "Progetti portfolio con ACF"
            },
            "certifications": {  # Certificazioni
                "fields": "id,date,title,content,link,acf",
                "acf_fields": [
                    "ente_certificazione", "descrizione_certificazione",
                    "start_corso", "end_corso", "link_corso", "link_progetto"
                ],
                "description": "Certificazioni e formazione"
            },
            "work-experiences": {
                "fields": "id,date,title,content,link,acf",
                "acf_fields": [
                    "company", "position", "start_date", "end_date", "description"
                ],
                "description": "Esperienze lavorative"
            },
            "books": {
                "fields": "id,date,title,content,excerpt,link,acf,book-category",
                "acf_fields": [
                    "book_author", "book_rating", "book_review", "book_status"
                ],
                "description": "Libri letti e recensiti"
            },
            "tools": {
                "fields": "id,date,title,content,excerpt,link,acf,tool-category",
                "acf_fields": [
                    "tool_url", "tool_category", "tool_description", "tool_rating"
                ],
                "description": "Strumenti e stack tecnologico"
            }
        }

    def _make_request(self, endpoint: str, params: dict = None) -> Optional[List[Dict]]:
        """Effettua richiesta ottimizzata all'API WordPress"""
        try:
            url = f"{self.wp_api_base}/{endpoint}"
            print(f"🔍 WordPress API Request: {url}")

            # Aggiungi parametri default ottimizzati
            default_params = {
                "per_page": 50,  # Limite ragionevole
                "orderby": "date",
                "order": "desc",
            }

            if params:
                default_params.update(params)

            response = requests.get(url, params=default_params, timeout=15)
            response.raise_for_status()

            data = response.json()
            print(
                f"✅ WordPress API Success: {len(data) if isinstance(data, list) else 1} items")
            return data

        except requests.exceptions.RequestException as e:
            print(f"❌ WordPress API Error: {e}")
            return None
        except json.JSONDecodeError as e:
            print(f"❌ JSON Decode Error: {e}")
            return None

    def get_posts(self, params: Dict = None) -> List[Dict]:
        """Recupera post del blog ottimizzato"""
        return self._make_request("posts", params) or []

    def get_projects(self, params: Dict = None) -> List[Dict]:
        """Recupera progetti del portfolio ottimizzato"""
        return self._make_request("projects", params) or []

    def get_certifications(self, params: Dict = None) -> List[Dict]:
        """Recupera certificazioni ottimizzato (endpoint: certifications)"""
        return self._make_request("certifications", params) or []

    def get_work_experiences(self, params: Dict = None) -> List[Dict]:
        """Recupera esperienze lavorative ottimizzato"""
        return self._make_request("work-experiences", params) or []

    def get_books(self, params: Dict = None) -> List[Dict]:
        """Recupera libri letti ottimizzato"""
        return self._make_request("books", params) or []

    def get_tools(self, params: Dict = None) -> List[Dict]:
        """Recupera strumenti e stack ottimizzato"""
        return self._make_request("tools", params) or []


class ContentProcessor:
    """Processore di contenuti ottimizzato per ogni tipo di post"""

    @staticmethod
    def clean_html(html_content: str) -> str:
        """Pulizia HTML avanzata"""
        if not html_content:
            return ""

        # Rimuovi tag HTML
        clean_text = re.sub(r'<[^>]+>', '', html_content)

        # Pulisci entità HTML
        clean_text = clean_text.replace('&nbsp;', ' ')
        clean_text = clean_text.replace('&amp;', '&')
        clean_text = clean_text.replace('&lt;', '<')
        clean_text = clean_text.replace('&gt;', '>')
        clean_text = clean_text.replace('&quot;', '"')

        # Rimuovi spazi multipli e caratteri speciali
        clean_text = re.sub(r'\s+', ' ', clean_text)
        clean_text = clean_text.strip()

        return clean_text

    @staticmethod
    def process_post(post: Dict) -> Dict:
        """Processa un post del blog"""
        title = post.get("title", {}).get("rendered", "")
        content = post.get("content", {}).get("rendered", "")
        excerpt = post.get("excerpt", {}).get("rendered", "")
        link = post.get("link", "")
        date = post.get("date", "")

        # Pulizia contenuto
        clean_content = ContentProcessor.clean_html(content)
        clean_excerpt = ContentProcessor.clean_html(excerpt)

        # Estrai primi 300 caratteri del contenuto se excerpt vuoto
        if not clean_excerpt and clean_content:
            clean_excerpt = clean_content[:300] + \
                "..." if len(clean_content) > 300 else clean_content

        return {
            "title": title,
            "content_preview": clean_content[:500] + "..." if len(clean_content) > 500 else clean_content,
            "excerpt": clean_excerpt,
            "link": link,
            "date": date[:10] if date else "",
            "type": "article"
        }

    @staticmethod
    def process_project(project: Dict) -> Dict:
        """Processa un progetto del portfolio"""
        title = project.get("title", {}).get("rendered", "")
        content = project.get("content", {}).get("rendered", "")
        link = project.get("link", "")
        date = project.get("date", "")

        # Estrai campi ACF
        acf = project.get("acf", {})

        return {
            "title": title,
            "description": ContentProcessor.clean_html(content)[:400] + "..." if len(ContentProcessor.clean_html(content)) > 400 else ContentProcessor.clean_html(content),
            "repository": acf.get("project_repository", ""),
            "external_url": acf.get("project_external_url", ""),
            "frontend_url": acf.get("project_frontend", ""),
            "preview_text": acf.get("project_preview_text", ""),
            "link": link,
            "date": date[:10] if date else "",
            "type": "project"
        }

    @staticmethod
    def process_certification(cert: Dict) -> Dict:
        """Processa una certificazione"""
        title = cert.get("title", {}).get("rendered", "")
        content = cert.get("content", {}).get("rendered", "")
        link = cert.get("link", "")
        date = cert.get("date", "")

        # Estrai campi ACF
        acf = cert.get("acf", {})

        return {
            "title": title,
            "ente": acf.get("ente_certificazione", ""),
            "description": ContentProcessor.clean_html(acf.get("descrizione_certificazione", "")),
            "start_date": acf.get("start_corso", ""),
            "end_date": acf.get("end_corso", ""),
            "course_link": acf.get("link_corso", ""),
            "project_link": acf.get("link_progetto", ""),
            "link": link,
            "date": date[:10] if date else "",
            "type": "certification"
        }

    @staticmethod
    def process_work_experience(exp: Dict) -> Dict:
        """Processa un'esperienza lavorativa"""
        title = exp.get("title", {}).get("rendered", "")
        content = exp.get("content", {}).get("rendered", "")
        link = exp.get("link", "")
        date = exp.get("date", "")

        # Estrai campi ACF
        acf = exp.get("acf", {})

        return {
            "title": title,
            "company": acf.get("company", ""),
            "position": acf.get("position", ""),
            "description": ContentProcessor.clean_html(content),
            "start_date": acf.get("start_date", ""),
            "end_date": acf.get("end_date", ""),
            "link": link,
            "date": date[:10] if date else "",
            "type": "work_experience"
        }

    @staticmethod
    def process_book(book: Dict) -> Dict:
        """Processa un libro"""
        title = book.get("title", {}).get("rendered", "")
        content = book.get("content", {}).get("rendered", "")
        excerpt = book.get("excerpt", {}).get("rendered", "")
        link = book.get("link", "")
        date = book.get("date", "")

        # Estrai campi ACF
        acf = book.get("acf", {})

        return {
            "title": title,
            "author": acf.get("book_author", ""),
            "rating": acf.get("book_rating", ""),
            "review": ContentProcessor.clean_html(acf.get("book_review", "")),
            "status": acf.get("book_status", ""),
            "excerpt": ContentProcessor.clean_html(excerpt),
            "link": link,
            "date": date[:10] if date else "",
            "type": "book"
        }

    @staticmethod
    def process_tool(tool: Dict) -> Dict:
        """Processa uno strumento/tool"""
        title = tool.get("title", {}).get("rendered", "")
        content = tool.get("content", {}).get("rendered", "")
        excerpt = tool.get("excerpt", {}).get("rendered", "")
        link = tool.get("link", "")
        date = tool.get("date", "")

        # Estrai campi ACF
        acf = tool.get("acf", {})

        return {
            "title": title,
            "description": ContentProcessor.clean_html(content),
            "excerpt": ContentProcessor.clean_html(excerpt),
            "tool_url": acf.get("tool_url", ""),
            "category": acf.get("tool_category", ""),
            "rating": acf.get("tool_rating", ""),
            "link": link,
            "date": date[:10] if date else "",
            "type": "tool"
        }

# Tools definition - Sfruttando gli endpoint ottimizzati


@tool
def search_blog_posts(query: str = "", limit: int = 5) -> str:
    """
    Cerca negli articoli del blog di Veronica per argomenti specifici.
    Se query è vuota, restituisce gli articoli più recenti.

    Args:
        query: Termine di ricerca per trovare articoli rilevanti (opzionale)
        limit: Numero massimo di risultati (default 5)
    """
    try:
        config = Configuration()
        wp_client = OptimizedWordPressClient(config.wordpress_base_url)

        params = {"per_page": limit}
        if query.strip():
            params["search"] = query

        posts = wp_client.get_posts(params)

        if not posts:
            return json.dumps({
                "message": f"Nessun articolo trovato" + (f" per la ricerca: {query}" if query else ""),
                "total": 0,
                "articles": []
            })

        results = []
        for post in posts:
            processed = ContentProcessor.process_post(post)
            results.append(processed)

        return json.dumps({
            "total": len(results),
            "search_query": query if query else "ultimi articoli",
            "articles": results
        })

    except Exception as e:
        return json.dumps({"error": f"Errore nella ricerca articoli: {str(e)}"})


@tool
def get_latest_blog_post() -> str:
    """Recupera l'ultimo articolo pubblicato sul blog di Veronica con dettagli completi."""
    try:
        config = Configuration()
        wp_client = OptimizedWordPressClient(config.wordpress_base_url)

        posts = wp_client.get_posts({"per_page": 1})

        if not posts:
            return json.dumps({"message": "Nessun articolo trovato"})

        processed = ContentProcessor.process_post(posts[0])

        return json.dumps({
            "latest_article": processed,
            "message": "Ultimo articolo pubblicato"
        })

    except Exception as e:
        return json.dumps({"error": f"Errore nel recupero ultimo articolo: {str(e)}"})


@tool
def get_portfolio_projects(category: str = "", limit: int = 10) -> str:
    """
    Recupera progetti del portfolio di Veronica con tutti i dettagli.

    Args:
        category: Categoria progetti (ai, web, ecc.) - opzionale
        limit: Numero massimo di progetti (default 10)
    """
    try:
        config = Configuration()
        wp_client = OptimizedWordPressClient(config.wordpress_base_url)

        params = {"per_page": limit}
        # Note: category filtering può essere implementato se necessario

        projects = wp_client.get_projects(params)

        if not projects:
            return json.dumps({
                "message": "Nessun progetto trovato nel portfolio",
                "total": 0,
                "projects": []
            })

        results = []
        for project in projects:
            processed = ContentProcessor.process_project(project)
            results.append(processed)

        return json.dumps({
            "total": len(results),
            "projects": results
        })

    except Exception as e:
        return json.dumps({"error": f"Errore nel recupero progetti: {str(e)}"})


@tool
def get_certifications(limit: int = 10) -> str:
    """Recupera le certificazioni e formazione di Veronica con dettagli completi."""
    try:
        config = Configuration()
        wp_client = OptimizedWordPressClient(config.wordpress_base_url)

        certifications = wp_client.get_certifications({"per_page": limit})

        if not certifications:
            return json.dumps({
                "message": "Nessuna certificazione trovata",
                "total": 0,
                "certifications": []
            })

        results = []
        for cert in certifications:
            processed = ContentProcessor.process_certification(cert)
            results.append(processed)

        return json.dumps({
            "total": len(results),
            "certifications": results
        })

    except Exception as e:
        return json.dumps({"error": f"Errore nel recupero certificazioni: {str(e)}"})


@tool
def get_work_experience(limit: int = 10) -> str:
    """Recupera le esperienze lavorative di Veronica con dettagli completi."""
    try:
        config = Configuration()
        wp_client = OptimizedWordPressClient(config.wordpress_base_url)

        experiences = wp_client.get_work_experiences({"per_page": limit})

        if not experiences:
            return json.dumps({
                "message": "Nessuna esperienza lavorativa trovata",
                "total": 0,
                "experiences": []
            })

        results = []
        for exp in experiences:
            processed = ContentProcessor.process_work_experience(exp)
            results.append(processed)

        return json.dumps({
            "total": len(results),
            "experiences": results
        })

    except Exception as e:
        return json.dumps({"error": f"Errore nel recupero esperienze: {str(e)}"})


@tool
def get_books_and_reading(limit: int = 10) -> str:
    """Recupera i libri letti e recensiti da Veronica."""
    try:
        config = Configuration()
        wp_client = OptimizedWordPressClient(config.wordpress_base_url)

        books = wp_client.get_books({"per_page": limit})

        if not books:
            return json.dumps({
                "message": "Nessun libro trovato",
                "total": 0,
                "books": []
            })

        results = []
        for book in books:
            processed = ContentProcessor.process_book(book)
            results.append(processed)

        return json.dumps({
            "total": len(results),
            "books": results
        })

    except Exception as e:
        return json.dumps({"error": f"Errore nel recupero libri: {str(e)}"})


@tool
def get_tools_and_stack(limit: int = 15) -> str:
    """Recupera gli strumenti e stack tecnologico di Veronica."""
    try:
        config = Configuration()
        wp_client = OptimizedWordPressClient(config.wordpress_base_url)

        tools = wp_client.get_tools({"per_page": limit})

        if not tools:
            return json.dumps({
                "message": "Nessuno strumento trovato",
                "total": 0,
                "tools": []
            })

        results = []
        for tool in tools:
            processed = ContentProcessor.process_tool(tool)
            results.append(processed)

        return json.dumps({
            "total": len(results),
            "tools": results
        })

    except Exception as e:
        return json.dumps({"error": f"Errore nel recupero strumenti: {str(e)}"})


@tool
def search_all_content(query: str, limit_per_type: int = 3) -> str:
    """
    Ricerca generale nei contenuti di Veronica (articoli, progetti, certificazioni, etc.).

    Args:
        query: Termine di ricerca
        limit_per_type: Limite risultati per tipo di contenuto
    """
    try:
        config = Configuration()
        wp_client = OptimizedWordPressClient(config.wordpress_base_url)

        results = {
            "search_query": query,
            "results": {}
        }

        # Cerca in articoli
        posts = wp_client.get_posts(
            {"search": query, "per_page": limit_per_type})
        if posts:
            results["results"]["articles"] = [
                ContentProcessor.process_post(p) for p in posts]

        # Cerca in progetti
        projects = wp_client.get_projects(
            {"search": query, "per_page": limit_per_type})
        if projects:
            results["results"]["projects"] = [
                ContentProcessor.process_project(p) for p in projects]

        # Cerca in certificazioni
        certifications = wp_client.get_certifications(
            {"search": query, "per_page": limit_per_type})
        if certifications:
            results["results"]["certifications"] = [
                ContentProcessor.process_certification(c) for c in certifications]

        # Cerca in strumenti
        tools = wp_client.get_tools(
            {"search": query, "per_page": limit_per_type})
        if tools:
            results["results"]["tools"] = [
                ContentProcessor.process_tool(t) for t in tools]

        return json.dumps(results)

    except Exception as e:
        return json.dumps({"error": f"Errore nella ricerca generale: {str(e)}"})


@tool
def get_contact_info() -> str:
    """Restituisce le informazioni di contatto di Veronica."""
    return json.dumps({
        "contacts": {
            "website": "https://www.veronicaschembri.com",
            "email": "Contattami tramite il sito web",
            "linkedin": "Cerca 'Veronica Schembri' su LinkedIn",
            "location": "Palermo, Sicilia",
            "availability": "Aperta a collaborazioni e progetti interessanti nel campo AI/ML"
        },
        "message": "Contattami per collaborazioni, progetti o semplicemente per fare una chiacchierata tech!"
    })


# Lista dei tools ottimizzati
TOOLS = [
    search_blog_posts,
    get_latest_blog_post,
    get_portfolio_projects,
    get_certifications,
    get_work_experience,
    get_books_and_reading,
    get_tools_and_stack,
    search_all_content,
    get_contact_info
]


def load_personal_summary() -> str:
    """Carica il summary personale dalla cartella me/"""
    try:
        summary_path = "me/summary.txt"
        if os.path.exists(summary_path):
            with open(summary_path, "r", encoding="utf-8") as f:
                return f.read()
        else:
            return """
Ciao! Sono Veronica Schembri, AI Engineer appassionata di Intelligenza Artificiale, 
automazione e tecnologia. Attualmente sto costruendo la mia carriera nell'AI, 
approfondendo Machine Learning, LLM e automazione intelligente.

Ho un background in sviluppo front-end con JavaScript e React, e ora mi sto 
concentrando su Python, Data Science e AI. Utilizzo strumenti come Cursor e 
Obsidian per organizzare progetti e conoscenze.

Sono una super nerd, fan di serie TV, fumetti e Magic: The Gathering, 
con una debolezza per i Lego!
"""
    except Exception as e:
        print(f"Errore nel caricamento summary: {e}")
        return "Sono Veronica Schembri, AI Engineer appassionata di tecnologia e intelligenza artificiale."


def create_system_prompt() -> str:
    """Crea il system prompt basato sulla versione ottimizzata"""
    personal_summary = load_personal_summary()

    return f"""Sei Veronica Schembri, rappresentata dal tuo assistente AI personale.

**CHI SEI:**
{personal_summary}

**COME COMPORTARTI:**
- Rispondi sempre in prima persona come se fossi Veronica
- Usa un tono professionale ma amichevole e diretto
- Sii precisa e dettagliata nelle risposte tecniche
- Mostra entusiasmo per AI, tecnologia e progetti innovativi
- Condividi esperienze e progetti concreti quando rilevanti

**STRUMENTI DISPONIBILI (USA SEMPRE QUANDO RILEVANTE):**
1. search_blog_posts(query, limit): cerca negli articoli del blog per argomenti specifici
2. get_latest_blog_post(): ottieni l'ultimo articolo pubblicato con dettagli completi
3. get_portfolio_projects(category, limit): mostra progetti del portfolio con descrizioni dettagliate
4. get_certifications(limit): mostra certificazioni e formazione con tutti i dettagli
5. get_work_experience(limit): mostra esperienze lavorative complete
6. get_books_and_reading(limit): mostra libri letti e recensiti
7. get_tools_and_stack(limit): mostra strumenti e stack tecnologico utilizzati
8. search_all_content(query, limit_per_type): ricerca in tutti i contenuti
9. get_contact_info(): informazioni di contatto

**QUANDO USARE I TOOLS:**
- Per domande sui tuoi articoli o ultimo post: usa search_blog_posts() o get_latest_blog_post()
- Per il tuo portfolio e progetti: usa get_portfolio_projects()
- Per le tue certificazioni: usa get_certifications() 
- Per la tua esperienza lavorativa: usa get_work_experience()
- Per libri e letture consigliate: usa get_books_and_reading()
- Per strumenti e stack tech: usa get_tools_and_stack()
- Per ricerche generali: usa search_all_content()
- Per contatti: usa get_contact_info()

**REGOLE IMPORTANTI:**
- USA SEMPRE i tools per rispondere a domande sui tuoi contenuti
- Non inventare informazioni sui tuoi progetti o articoli
- Se i tools non trovano risultati, dillo chiaramente
- Incoraggia a contattarti per collaborazioni interessanti
- Cita sempre fonti specifiche (titoli articoli, nomi progetti, ecc.)
- Estrai e condividi dettagli specifici dai risultati dei tools

**OBIETTIVO:**
Rappresentare Veronica in modo autentico e professionale, fornendo informazioni 
accurate e dettagliate sui suoi progetti, competenze e contenuti, sempre basandoti 
sui dati reali recuperati tramite i tools WordPress ottimizzati.
"""

# Graph definition - Pattern ReAct


def should_continue(state: State) -> Literal["tools", "__end__"]:
    """Decide se continuare con i tools o terminare"""
    messages = state["messages"]
    last_message = messages[-1]

    if last_message.tool_calls:
        return "tools"
    return "__end__"


def call_model(state: State, config: RunnableConfig):
    """Nodo principale del modello - Pattern ReAct"""
    # Estrai configurazione e filtra parametri interni LangGraph
    configurable = config.get("configurable", {})

    # Lista parametri validi per Configuration (evita parametri interni LangGraph)
    valid_config_params = {"model", "wordpress_base_url"}

    # Filtra solo parametri supportati da Configuration
    filtered_params = {
        k: v for k, v in configurable.items()
        if k in valid_config_params and not k.startswith('__')
    }

    # Usa Configuration con parametri filtrati (o default se vuoti)
    configuration = Configuration(
        **filtered_params) if filtered_params else Configuration()

    # Inizializza il modello con tools
    model = ChatOpenAI(
        model=configuration.model,
        temperature=0.1,
        streaming=True
    )
    model_with_tools = model.bind_tools(TOOLS)

    messages = state["messages"]

    # Aggiungi system prompt se non presente
    if not messages or not isinstance(messages[0], SystemMessage):
        system_message = SystemMessage(content=create_system_prompt())
        messages = [system_message] + messages

    # Invoca il modello
    response = model_with_tools.invoke(messages)

    return {"messages": [response]}

# Costruzione del grafo


def create_graph():
    """Crea il grafo LangGraph con pattern ReAct"""

    # Crea il grafo con configurazione
    builder = StateGraph(State, input=InputState, config_schema=Configuration)

    # Aggiungi nodi
    builder.add_node("agent", call_model)
    builder.add_node("tools", ToolNode(TOOLS))

    # Imposta entry point
    builder.set_entry_point("agent")

    # Aggiungi edges condizionali (Pattern ReAct)
    builder.add_conditional_edges(
        "agent",
        should_continue,
        {
            "tools": "tools",
            "__end__": "__end__"
        }
    )

    # Edge da tools a agent (continua il ciclo)
    builder.add_edge("tools", "agent")

    # Compila con memory per persistenza stato
    memory = MemorySaver()
    graph = builder.compile(checkpointer=memory)

    return graph

# Classe principale del chatbot


class VeronicaChatbot:
    """Chatbot Veronica con LangGraph e endpoint WordPress ottimizzati"""

    def __init__(self):
        """Inizializza il chatbot"""
        print("🤖 Inizializzazione VeronicaChatbot con endpoint ottimizzati...")

        # Crea il grafo
        self.graph = create_graph()

        print("✅ VeronicaChatbot con endpoint ottimizzati pronto!")

    def chat(self, message: str, thread_id: str = "default") -> str:
        """
        Metodo principale per la chat

        Args:
            message: Messaggio dell'utente
            thread_id: ID del thread per la persistenza della conversazione
        """
        try:
            # Configura il thread per la persistenza
            config = RunnableConfig(
                configurable={"thread_id": thread_id}
            )

            # Prepara l'input
            input_state = {
                "messages": [HumanMessage(content=message)]
            }

            # Esegui il grafo
            result = self.graph.invoke(input_state, config)

            # Estrai la risposta
            if result and "messages" in result:
                last_message = result["messages"][-1]
                if hasattr(last_message, 'content'):
                    return last_message.content

            return "Mi dispiace, non sono riuscita a processare la tua richiesta."

        except Exception as e:
            print(f"❌ Errore nella chat: {e}")
            return "Mi dispiace, c'è stato un errore. Riprova più tardi."

    def get_wordpress_stats(self) -> Dict[str, Any]:
        """Ottieni statistiche WordPress per debugging"""
        try:
            config = Configuration()
            wp_client = OptimizedWordPressClient(config.wordpress_base_url)

            # Test tutti gli endpoint
            posts = wp_client.get_posts({"per_page": 1})
            projects = wp_client.get_projects({"per_page": 1})
            certifications = wp_client.get_certifications({"per_page": 1})
            work_experiences = wp_client.get_work_experiences({"per_page": 1})
            books = wp_client.get_books({"per_page": 1})
            tools = wp_client.get_tools({"per_page": 1})

            return {
                "status": "success",
                "wordpress_url": config.wordpress_base_url,
                "endpoints_status": {
                    "posts": {
                        "working": len(posts) > 0,
                        "count": len(posts),
                        "latest": posts[0].get("title", {}).get("rendered", "") if posts else "Nessuno"
                    },
                    "projects": {
                        "working": len(projects) > 0,
                        "count": len(projects),
                        "latest": projects[0].get("title", {}).get("rendered", "") if projects else "Nessuno"
                    },
                    "certifications": {
                        "working": len(certifications) > 0,
                        "count": len(certifications),
                        "latest": certifications[0].get("title", {}).get("rendered", "") if certifications else "Nessuno"
                    },
                    "work_experiences": {
                        "working": len(work_experiences) > 0,
                        "count": len(work_experiences),
                        "latest": work_experiences[0].get("title", {}).get("rendered", "") if work_experiences else "Nessuno"
                    },
                    "books": {
                        "working": len(books) > 0,
                        "count": len(books),
                        "latest": books[0].get("title", {}).get("rendered", "") if books else "Nessuno"
                    },
                    "tools": {
                        "working": len(tools) > 0,
                        "count": len(tools),
                        "latest": tools[0].get("title", {}).get("rendered", "") if tools else "Nessuno"
                    }
                },
                "api_endpoints": [
                    f"{config.wordpress_base_url}/wp-json/wp/v2/posts",
                    f"{config.wordpress_base_url}/wp-json/wp/v2/projects",
                    f"{config.wordpress_base_url}/wp-json/wp/v2/certifications",
                    f"{config.wordpress_base_url}/wp-json/wp/v2/work-experiences",
                    f"{config.wordpress_base_url}/wp-json/wp/v2/books",
                    f"{config.wordpress_base_url}/wp-json/wp/v2/tools"
                ]
            }

        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }

    def test_all_tools(self) -> Dict[str, Any]:
        """Testa tutti i tools per debugging"""
        try:
            results = {}

            # Test ogni tool
            tool_tests = [
                ("search_blog_posts", lambda: search_blog_posts.invoke(
                    {"query": "", "limit": 2})),
                ("get_latest_blog_post", lambda: get_latest_blog_post.invoke({})),
                ("get_portfolio_projects",
                 lambda: get_portfolio_projects.invoke({"limit": 2})),
                ("get_certifications",
                 lambda: get_certifications.invoke({"limit": 2})),
                ("get_work_experience",
                 lambda: get_work_experience.invoke({"limit": 2})),
                ("get_books_and_reading",
                 lambda: get_books_and_reading.invoke({"limit": 2})),
                ("get_tools_and_stack",
                 lambda: get_tools_and_stack.invoke({"limit": 2})),
                ("get_contact_info", lambda: get_contact_info.invoke({}))
            ]

            for tool_name, tool_func in tool_tests:
                try:
                    print(f"🔧 Testing {tool_name}...")
                    result = tool_func()
                    # Parse JSON result
                    if isinstance(result, str):
                        parsed = json.loads(result)
                        results[tool_name] = {
                            "status": "success",
                            "has_data": len(parsed) > 0 if isinstance(parsed, list) else bool(parsed.get("total", 0) if isinstance(parsed, dict) else True),
                            "preview": str(parsed)[:200] + "..." if len(str(parsed)) > 200 else str(parsed)
                        }
                    else:
                        results[tool_name] = {
                            "status": "success",
                            "result": str(result)[:200] + "..." if len(str(result)) > 200 else str(result)
                        }
                except Exception as e:
                    results[tool_name] = {
                        "status": "error",
                        "error": str(e)
                    }

            return {
                "status": "completed",
                "tools_tested": len(results),
                "results": results
            }

        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }

# Test function avanzata


async def test_chatbot_complete():
    """Funzione di test completa per il chatbot ottimizzato"""
    print("🧪 Test completo del chatbot ottimizzato...")

    chatbot = VeronicaChatbot()

    # Test 1: WordPress Stats
    print("\n--- Test 1: WordPress Endpoints ---")
    stats = chatbot.get_wordpress_stats()
    print(f"Status: {stats.get('status')}")
    if stats.get('status') == 'success':
        for endpoint, info in stats.get('endpoints_status', {}).items():
            status = "✅" if info.get('working') else "❌"
            print(
                f"{status} {endpoint}: {info.get('count', 0)} items, latest: {info.get('latest', 'N/A')[:50]}...")

    # Test 2: Tools Individuali
    print("\n--- Test 2: Tools Individuali ---")
    tool_results = chatbot.test_all_tools()
    print(f"Tools testati: {tool_results.get('tools_tested', 0)}")
    for tool_name, result in tool_results.get('results', {}).items():
        status = "✅" if result.get('status') == 'success' else "❌"
        print(
            f"{status} {tool_name}: {result.get('preview', result.get('error', 'N/A'))[:80]}...")

    # Test 3: Conversazioni Reali
    print("\n--- Test 3: Conversazioni ---")
    test_messages = [
        "Ciao! Chi sei?",
        "Qual è il tuo ultimo articolo?",
        "Parlami dei tuoi progetti di AI",
        "Che certificazioni hai?",
        "Quali strumenti usi per sviluppare?",
        "Hai mai letto libri su machine learning?"
    ]

    for i, message in enumerate(test_messages, 1):
        print(f"\n🗣️ Test {i}: {message}")
        response = chatbot.chat(message, thread_id=f"test_{i}")
        print(f"🤖 Risposta: {response[:150]}...")

    print("\n✅ Test completo terminato!")

# Test rapido per WordPress endpoints


def quick_wordpress_test():
    """Test rapido degli endpoint WordPress"""
    print("🔍 Quick test WordPress endpoints...")

    config = Configuration()
    wp_client = OptimizedWordPressClient(config.wordpress_base_url)

    endpoints = [
        ("Posts", wp_client.get_posts),
        ("Projects", wp_client.get_projects),
        ("Certifications", wp_client.get_certifications),
        ("Work Experiences", wp_client.get_work_experiences),
        ("Books", wp_client.get_books),
        ("Tools", wp_client.get_tools)
    ]

    for name, func in endpoints:
        try:
            data = func({"per_page": 1})
            status = "✅" if data and len(data) > 0 else "⚠️"
            count = len(data) if data else 0
            print(f"{status} {name}: {count} items")
        except Exception as e:
            print(f"❌ {name}: Error - {e}")


if __name__ == "__main__":
    # Setup environment variables
    from dotenv import load_dotenv
    load_dotenv()

    print("🚀 VeronicaChatbot con Endpoint Ottimizzati")
    print("=" * 50)

    # Quick test WordPress
    quick_wordpress_test()

    print("\n" + "=" * 50)
    print("Per test completo, usa: asyncio.run(test_chatbot_complete())")

    # Test del sistema completo se richiesto
    import sys
    if "--full-test" in sys.argv:
        asyncio.run(test_chatbot_complete())
