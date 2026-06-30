"""Known peer registry for HTTP synchronization."""

from typing import List, Set

from ..config import CONFIG
from ..persistence.store import ChainStore
from ..utils import logger


class PeerRegistry:
    """Tracks peer node base URLs for REST-based chain sync."""

    def __init__(self, store: ChainStore | None = None) -> None:
        self._store = store or ChainStore()
        self._peers: Set[str] = set(self._store.load_peers())

    def list_peers(self) -> List[str]:
        return sorted(self._peers)

    def register(self, peer_url: str) -> List[str]:
        normalized = peer_url.rstrip("/")
        if not normalized.startswith(("http://", "https://")):
            raise ValueError("Peer URL must start with http:// or https://")

        self._peers.add(normalized)
        self._store.save_peers(self.list_peers())
        logger.info("Registered peer %s", normalized)
        return self.list_peers()

    def remove(self, peer_url: str) -> List[str]:
        self._peers.discard(peer_url.rstrip("/"))
        self._store.save_peers(self.list_peers())
        return self.list_peers()
