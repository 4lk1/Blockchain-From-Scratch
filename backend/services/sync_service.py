"""HTTP peer synchronization orchestration."""

from typing import Any, Dict, List

from ..config import CONFIG
from ..network.peer_registry import PeerRegistry
from ..network.sync import ChainSynchronizer
from ..utils import logger

from .blockchain_service import BlockchainService


class SyncService:
    """Coordinates peer registration and longest-chain sync."""

    def __init__(
        self,
        blockchain_service: BlockchainService,
        peer_registry: PeerRegistry | None = None,
        synchronizer: ChainSynchronizer | None = None,
    ) -> None:
        self.blockchain_service = blockchain_service
        self.peer_registry = peer_registry or PeerRegistry()
        self.synchronizer = synchronizer or ChainSynchronizer()

    def register_peer(self, peer_url: str) -> List[str]:
        if len(self.peer_registry.list_peers()) >= CONFIG.max_peer_count:
            raise ValueError(f"Peer limit reached ({CONFIG.max_peer_count})")
        return self.peer_registry.register(peer_url)

    def list_peers(self) -> List[str]:
        return self.peer_registry.list_peers()

    def sync_with_peers(self) -> Dict[str, Any]:
        peers = self.peer_registry.list_peers()
        local_length = self.blockchain_service.get_chain_length()
        candidate_chain, source_peer = self.synchronizer.find_longest_peer_chain(
            peers,
            local_length,
        )

        if not candidate_chain:
            return {
                "success": False,
                "message": "No longer valid peer chain found",
                "local_chain_length": local_length,
                "source_peer": None,
            }

        replaced, message = self.blockchain_service.replace_chain_if_longer(
            candidate_chain
        )
        return {
            "success": replaced,
            "message": message,
            "local_chain_length": self.blockchain_service.get_chain_length(),
            "source_peer": source_peer,
        }
