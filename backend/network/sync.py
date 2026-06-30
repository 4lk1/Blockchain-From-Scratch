"""
HTTP-based chain synchronization.

Assumption: peers expose the existing REST API (`GET /blocks`, `GET /chain`).
This is not a full P2P protocol; it is sufficient for educational multi-node demos.
"""

import json
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional, Tuple

from ..block import Block
from ..config import CONFIG
from ..serialization import block_from_dict, chain_from_dict
from ..utils import logger


class ChainSynchronizer:
    """Fetch and compare chains from peer nodes."""

    def __init__(self, timeout: float = CONFIG.peer_sync_timeout) -> None:
        self.timeout = timeout

    def _fetch_json(self, url: str) -> Any:
        request = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(request, timeout=self.timeout) as response:
            return json.loads(response.read().decode("utf-8"))

    def fetch_peer_chain(self, peer_url: str) -> Optional[List[Block]]:
        endpoint = f"{peer_url.rstrip('/')}/blocks"
        try:
            payload = self._fetch_json(endpoint)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            logger.warning("Failed to fetch chain from %s: %s", peer_url, exc)
            return None

        if not isinstance(payload, list):
            return None

        try:
            return chain_from_dict(payload)
        except (KeyError, TypeError, ValueError) as exc:
            logger.warning("Invalid chain payload from %s: %s", peer_url, exc)
            return None

    def fetch_peer_status(self, peer_url: str) -> Optional[Dict[str, Any]]:
        endpoint = f"{peer_url.rstrip('/')}/chain"
        try:
            payload = self._fetch_json(endpoint)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
            return None
        return payload if isinstance(payload, dict) else None

    def find_longest_peer_chain(
        self,
        peer_urls: List[str],
        local_length: int,
    ) -> Tuple[Optional[List[Block]], Optional[str]]:
        best_chain: Optional[List[Block]] = None
        best_peer: Optional[str] = None

        for peer_url in peer_urls:
            chain = self.fetch_peer_chain(peer_url)
            if not chain:
                continue
            if len(chain) <= local_length:
                continue
            if best_chain is None or len(chain) > len(best_chain):
                best_chain = chain
                best_peer = peer_url

        return best_chain, best_peer
