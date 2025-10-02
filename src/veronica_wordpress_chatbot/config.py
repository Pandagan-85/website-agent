"""
Configuration module for Veronica WordPress Chatbot
Centralizes all configuration classes and constants
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List


@dataclass
class Configuration:
    """Configuration for the chatbot"""

    model: str = field(
        default="gpt-4o-mini",
        metadata={"description": "The LLM model to use."},
    )

    wordpress_base_url: str = field(
        default="https://www.veronicaschembri.com",
        metadata={"description": "WordPress site base URL"},
    )


# WordPress API field configurations for each endpoint
WORDPRESS_FIELD_CONFIGS = {
    "posts": {
        "fields": "id,date,title,content,excerpt,link,categories,tags,author,featured_media,yoast_head_json",
        "description": "Articoli del blog completi",
    },
    "projects": {
        "fields": "id,date,title,content,excerpt,link,acf,project-category,featured_media",
        "acf_fields": [
            "project_external_url",
            "project_preview_text",
            "project_repository",
            "project_frontend",
            "project_single_page",
        ],
        "description": "Progetti portfolio con ACF",
    },
    "certifications": {
        "fields": "id,date,title,content,link,acf",
        "acf_fields": [
            "ente_certificazione",
            "descrizione_certificazione",
            "start_corso",
            "end_corso",
            "link_corso",
            "link_progetto",
        ],
        "description": "Certificazioni e formazione",
    },
    "work-experiences": {
        "fields": "id,date,title,content,link,acf",
        "acf_fields": ["qualifica_work", "azienda_work", "descrizione_work", "start_work", "end_work"],
        "description": "Esperienze lavorative",
    },
    "books": {
        "fields": "id,date,title,content,excerpt,link,acf,book-category",
        "acf_fields": ["books_author", "book_rating", "book_review", "book_status"],
        "description": "Libri letti e recensiti",
    },
    "tools": {
        "fields": "id,date,title,content,tool-category",
        "acf_fields": [],  # Non ci sono campi ACF per tools
        "categories": {
            13: "Strumenti",
            14: "Have fun",
            15: "Organizzare",
            16: "Catturare"
        },
        "description": "Strumenti personali divisi per categoria",
    },
    "stacks": {
        "fields": "id,date,title,content,stack-category",
        "acf_fields": [],  # Non ci sono campi ACF per stacks
        "categories": {
            2: "AI Engineering & Machine Learning",
            25: "Design",
            27: "Development Tools",
            12: "Front-End Dev",
            92: "MLOps & DevOps"
        },
        "description": "Stack tecnologico professionale diviso per categoria",
    },
}

# API constants
DEFAULT_REQUEST_PARAMS = {
    "per_page": 50,
    "orderby": "date",
    "order": "desc",
}

# Request timeouts
REQUEST_TIMEOUT = 15

# Contact information
CONTACT_INFO = {
    "website": "https://www.veronicaschembri.com",
    'github': "https://github.com/Pandagan-85/",
    "email": "veronicaschembri@gmail.com",
    "linkedin": "https://www.linkedin.com/in/veronicaschembri/",
    "location": "Palermo, Sicilia",
    "availability": "Aperta a collaborazioni e progetti interessanti nel campo AI/ML",
}
