"""
WordPress API client - optimized requests and endpoints
"""

import json
from typing import Any, Dict, List, Optional

import requests

from ..config import DEFAULT_REQUEST_PARAMS, REQUEST_TIMEOUT, WORDPRESS_FIELD_CONFIGS
from ..utils.logging_config import setup_logging

logger = setup_logging(__name__)


class OptimizedWordPressClient:
    """Client WordPress ottimizzato con tutti gli endpoint specifici"""

    base_url: str
    wp_api_base: str
    field_configs: Dict[str, Any]

    def __init__(self, base_url: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.wp_api_base = f"{self.base_url}/wp-json/wp/v2"

        # Field configurations ottimizzate per ogni endpoint
        self.field_configs = WORDPRESS_FIELD_CONFIGS

    def _make_request(
        self, endpoint: str, params: Optional[Dict[str, Any]] = None
    ) -> Optional[List[Dict[str, Any]]]:
        """Effettua richiesta ottimizzata all'API WordPress"""
        try:
            url = f"{self.wp_api_base}/{endpoint}"
            logger.debug(f"WordPress API Request: {url}")

            # Aggiungi parametri default ottimizzati
            default_params = DEFAULT_REQUEST_PARAMS.copy()

            if params:
                default_params.update(params)

            response = requests.get(
                url,
                params=default_params,  # type: ignore[arg-type]
                timeout=REQUEST_TIMEOUT,
            )
            response.raise_for_status()

            data: List[Dict[str, Any]] = response.json()
            item_count = len(data) if isinstance(data, list) else 1
            logger.info(f"WordPress API Success: {endpoint} - {item_count} items")
            return data

        except requests.exceptions.RequestException as e:
            logger.error(f"WordPress API Error for {endpoint}: {e}")
            return None
        except json.JSONDecodeError as e:
            logger.error(f"JSON Decode Error for {endpoint}: {e}")
            return None

    def get_posts(
        self, params: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Recupera post del blog ottimizzato"""
        return self._make_request("posts", params) or []

    def get_projects(
        self, params: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Recupera progetti del portfolio ottimizzato"""
        return self._make_request("projects", params) or []

    def get_certifications(
        self, params: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Recupera certificazioni ottimizzato (endpoint: certifications)"""
        return self._make_request("certifications", params) or []

    def get_work_experiences(
        self, params: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Recupera esperienze lavorative ottimizzato"""
        return self._make_request("work-experiences", params) or []

    def get_books(
        self, params: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Recupera libri letti ottimizzato"""
        return self._make_request("books", params) or []

    def get_tools(
        self, params: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Recupera strumenti personali ottimizzato"""
        return self._make_request("tools", params) or []

    def get_stacks(
        self, params: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Recupera stack tecnologico professionale ottimizzato"""
        return self._make_request("stacks", params) or []
