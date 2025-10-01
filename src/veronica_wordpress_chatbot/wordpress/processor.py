"""
WordPress content processor - optimized for each post type
"""

import re
from typing import Any, Dict


class ContentProcessor:
    """Processore di contenuti ottimizzato per ogni tipo di post"""

    @staticmethod
    def clean_html(html_content: str) -> str:
        """Pulizia HTML avanzata"""
        if not html_content:
            return ""

        # Rimuovi tag HTML
        clean_text = re.sub(r"<[^>]+>", "", html_content)

        # Pulisci entità HTML
        clean_text = clean_text.replace("&nbsp;", " ")
        clean_text = clean_text.replace("&amp;", "&")
        clean_text = clean_text.replace("&lt;", "<")
        clean_text = clean_text.replace("&gt;", ">")
        clean_text = clean_text.replace("&quot;", '"')

        # Rimuovi spazi multipli e caratteri speciali
        clean_text = re.sub(r"\s+", " ", clean_text)
        clean_text = clean_text.strip()

        return clean_text

    @staticmethod
    def process_post(post: Dict[str, Any]) -> Dict[str, Any]:
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
            clean_excerpt = (
                clean_content[:300] + "..."
                if len(clean_content) > 300
                else clean_content
            )

        return {
            "title": title,
            "content_preview": (
                clean_content[:500] + "..."
                if len(clean_content) > 500
                else clean_content
            ),
            "excerpt": clean_excerpt,
            "link": link,
            "date": date[:10] if date else "",
            "type": "article",
        }

    @staticmethod
    def process_project(project: Dict[str, Any]) -> Dict[str, Any]:
        """Processa un progetto del portfolio"""
        title = project.get("title", {}).get("rendered", "")
        content = project.get("content", {}).get("rendered", "")
        link = project.get("link", "")
        date = project.get("date", "")

        # Estrai campi ACF
        acf = project.get("acf", {})

        return {
            "title": title,
            "description": (
                ContentProcessor.clean_html(content)[:400] + "..."
                if len(ContentProcessor.clean_html(content)) > 400
                else ContentProcessor.clean_html(content)
            ),
            "repository": acf.get("project_repository", ""),
            "external_url": acf.get("project_external_url", ""),
            "frontend_url": acf.get("project_frontend", ""),
            "preview_text": acf.get("project_preview_text", ""),
            "link": link,
            "date": date[:10] if date else "",
            "type": "project",
        }

    @staticmethod
    def process_certification(cert: Dict[str, Any]) -> Dict[str, Any]:
        """Processa una certificazione"""
        title = cert.get("title", {}).get("rendered", "")
        content = cert.get("content", {}).get("rendered", "")
        date = cert.get("date", "")

        # Estrai campi ACF
        acf = cert.get("acf", {})

        return {
            "title": title,
            "issuer": acf.get("ente_certificazione", ""),
            "description": ContentProcessor.clean_html(
                acf.get("descrizione_certificazione", "") or content
            ),
            "start_date": acf.get("start_corso", ""),
            "end_date": acf.get("end_corso", ""),
            "course_link": acf.get("link_corso", ""),
            "project_link": acf.get("link_progetto", ""),
            "date": date[:10] if date else "",
            "type": "certification",
        }

    @staticmethod
    def process_work_experience(exp: Dict[str, Any]) -> Dict[str, Any]:
        """Processa un'esperienza lavorativa"""
        title = exp.get("title", {}).get("rendered", "")
        date = exp.get("date", "")

        # Estrai campi ACF
        acf = exp.get("acf", {})

        return {
            "title": title,
            "company": acf.get("azienda_work", ""),
            "role": acf.get("qualifica_work", ""),
            "description": ContentProcessor.clean_html(acf.get("descrizione_work", "")),
            "start_date": acf.get("start_work", ""),
            "end_date": acf.get("end_work", ""),
            "date": date[:10] if date else "",
            "type": "work_experience",
        }

    @staticmethod
    def process_book(book: Dict[str, Any]) -> Dict[str, Any]:
        """Processa un libro"""
        title = book.get("title", {}).get("rendered", "")
        content = book.get("content", {}).get("rendered", "")
        date = book.get("date", "")

        # Estrai campi ACF (WordPress usa "books_" con s)
        acf = book.get("acf", {})

        return {
            "title": title,
            "author": acf.get("books_author", ""),
            "external_link": acf.get("books_link", ""),  # Link Amazon/editore
            "review": ContentProcessor.clean_html(content),
            "date": date[:10] if date else "",
            "type": "book",
        }

    @staticmethod
    def process_tool(tool: Dict[str, Any]) -> Dict[str, Any]:
        """Processa uno strumento personale"""
        title = tool.get("title", {}).get("rendered", "")
        content = tool.get("content", {}).get("rendered", "")
        date = tool.get("date", "")

        # Tool-category è un array di ID categorie
        # Mappatura ID → Nome categorie tool
        category_mapping = {
            13: "Strumenti",
            14: "Have fun",
            15: "Organizzare",
            16: "Catturare"
        }

        category_ids = tool.get("tool-category", [])
        categories = [
            category_mapping.get(cat_id, f"Categoria {cat_id}")
            for cat_id in category_ids
        ]

        return {
            "title": title,
            "description": ContentProcessor.clean_html(content),
            "categories": categories,
            "date": date[:10] if date else "",
            "type": "tool",
        }

    @staticmethod
    def process_stack(stack: Dict[str, Any]) -> Dict[str, Any]:
        """Processa uno stack tecnologico professionale"""
        title = stack.get("title", {}).get("rendered", "")
        content = stack.get("content", {}).get("rendered", "")
        date = stack.get("date", "")

        # Stack-category è un array di ID categorie
        # Mappatura ID → Nome categorie stack
        category_mapping = {
            2: "AI Engineering & Machine Learning",
            25: "Design",
            27: "Development Tools",
            12: "Front-End Dev",
            92: "MLOps & DevOps"
        }

        category_ids = stack.get("stack-category", [])
        categories = [
            category_mapping.get(cat_id, f"Categoria {cat_id}")
            for cat_id in category_ids
        ]

        return {
            "title": title,
            "description": ContentProcessor.clean_html(content),
            "categories": categories,
            "date": date[:10] if date else "",
            "type": "stack",
        }
