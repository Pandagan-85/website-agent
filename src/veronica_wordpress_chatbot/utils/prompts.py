"""
System prompt creation for Veronica Chatbot
"""

from pathlib import Path

from .logging_config import setup_logging

logger = setup_logging(__name__)

# Default summary se file non trovato
DEFAULT_SUMMARY = """
Ciao! Sono Veronica Schembri, AI Engineer appassionata di Intelligenza Artificiale,
automazione e tecnologia. Attualmente sto costruendo la mia carriera nell'AI,
approfondendo Machine Learning, LLM e automazione intelligente.

Ho un background in sviluppo front-end con JavaScript e React, e ora mi sto
concentrando su Python, Data Science e AI. Utilizzo strumenti come Cursor e
Obsidian per organizzare progetti e conoscenze.

Sono una super nerd, fan di serie TV, fumetti e Magic: The Gathering,
con una debolezza per i Lego!
Amo il sushi e la pizza. Amo perdermi nella musica, nelle onde e nella natura.
"""


def load_personal_summary() -> str:
    """Carica il summary personale dal template"""
    # Path assoluto relativo a questo file: utils/prompts.py -> utils/templates/personal_summary.txt
    summary_path = Path(__file__).parent / "templates" / "personal_summary.txt"

    try:
        if summary_path.exists():
            logger.info(f"Caricamento summary personale da: {summary_path}")
            with open(summary_path, "r", encoding="utf-8") as f:
                content = f.read()
                logger.info("Summary personale caricato con successo")
                return content
        else:
            logger.info(f"File summary non trovato ({summary_path}), uso default")
            return DEFAULT_SUMMARY.strip()
    except Exception as e:
        logger.error(f"Errore nel caricamento summary da {summary_path}: {e}")
        return "Sono Veronica Schembri, AI Engineer appassionata di tecnologia e intelligenza artificiale."


def load_system_prompt_template() -> str:
    """Carica il template del system prompt da file"""
    template_path = Path(__file__).parent / "templates" / "system_prompt.txt"

    try:
        if template_path.exists():
            logger.info(f"Caricamento template system prompt da: {template_path}")
            with open(template_path, "r", encoding="utf-8") as f:
                content = f.read()
                logger.info("Template system prompt caricato con successo")
                return content
        else:
            logger.warning(f"Template prompt non trovato: {template_path}")
            # Fallback inline se template mancante
            return """🤖 Tu sei l'assistente AI di Veronica Schembri, AI Engineer.

{personal_summary}

Usa i tool disponibili per rispondere alle domande su progetti, certificazioni, articoli e esperienze di Veronica.
Sii professionale, preciso e usa sempre i tool invece di inventare informazioni."""
    except Exception as e:
        logger.error(f"Errore caricamento template prompt: {e}")
        # Fallback minimale
        return "Tu sei l'assistente AI di Veronica Schembri. {personal_summary}"


def create_system_prompt() -> str:
    """Crea il system prompt interpolando il template con dati dinamici"""
    personal_summary = load_personal_summary()
    template = load_system_prompt_template()

    # Interpola il template con variabili dinamiche
    prompt = template.format(personal_summary=personal_summary)

    logger.info(f"System prompt generato: {len(prompt)} caratteri")
    return prompt
