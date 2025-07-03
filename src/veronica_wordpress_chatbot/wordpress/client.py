"""
WordPress API client - moved from chatbot.py
"""

import json
import requests
from typing import Dict, List, Optional
from ..config import WORDPRESS_FIELD_CONFIGS, DEFAULT_REQUEST_PARAMS, REQUEST_TIMEOUT


class OptimizedWordPressClient:
    """Client WordPress ottimizzato con tutti gli endpoint specifici"""

    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.wp_api_base = f"{self.base_url}/wp-json/wp/v2"

        # Field configurations ottimizzate per ogni endpoint
        self.field_configs = WORDPRESS_FIELD_CONFIGS

    def _make_request(self, endpoint: str, params: dict = None) -> Optional[List[Dict]]:
        """Effettua richiesta ottimizzata all'API WordPress"""
        try:
            url = f"{self.wp_api_base}/{endpoint}"
            print(f"🔍 WordPress API Request: {url}")

            # Aggiungi parametri default ottimizzati
            default_params = DEFAULT_REQUEST_PARAMS.copy()

            if params:
                default_params.update(params)

            response = requests.get(url, params=default_params, timeout=REQUEST_TIMEOUT)
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