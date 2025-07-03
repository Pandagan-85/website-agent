"""
WordPress content processor - moved from chatbot.py
"""

import re
from typing import Dict


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