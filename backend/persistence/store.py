"""Filesystem persistence for chain and wallet metadata."""

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

from ..config import CONFIG
from ..serialization import chain_from_dict, chain_to_dict, transaction_from_dict, transaction_to_dict
from ..mempool import Mempool
from ..utils import logger


class ChainStore:
    """JSON persistence for blockchain state."""

    SNAPSHOT_VERSION = 1

    def __init__(self, data_dir: Path | None = None) -> None:
        self.data_dir = data_dir or CONFIG.data_dir
        self.chain_path = self.data_dir / "chain.json"
        self.peers_path = self.data_dir / "peers.json"

    def ensure_data_dir(self) -> None:
        self.data_dir.mkdir(parents=True, exist_ok=True)

    def save(
        self,
        chain: List[Any],
        mempool: Mempool,
        difficulty: int,
        mining_reward: float,
    ) -> None:
        if not CONFIG.persistence_enabled:
            return

        self.ensure_data_dir()
        payload = {
            "version": self.SNAPSHOT_VERSION,
            "difficulty": difficulty,
            "mining_reward": mining_reward,
            "chain": chain_to_dict(chain),
            "mempool": [transaction_to_dict(tx) for tx in mempool.list_transactions()],
        }
        temp_path = self.chain_path.with_suffix(".tmp")
        temp_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        temp_path.replace(self.chain_path)
        logger.info("Persisted blockchain snapshot to %s", self.chain_path)

    def load(self) -> Optional[Dict[str, Any]]:
        if not CONFIG.persistence_enabled or not self.chain_path.exists():
            return None

        payload = json.loads(self.chain_path.read_text(encoding="utf-8"))
        if payload.get("version") != self.SNAPSHOT_VERSION:
            logger.warning("Unsupported chain snapshot version; starting fresh")
            return None

        chain = chain_from_dict(payload["chain"])
        mempool = Mempool()
        for item in payload.get("mempool", []):
            tx = transaction_from_dict(item)
            mempool.add(tx)

        return {
            "chain": chain,
            "mempool": mempool,
            "difficulty": int(payload["difficulty"]),
            "mining_reward": float(payload["mining_reward"]),
        }

    def save_peers(self, peers: List[str]) -> None:
        if not CONFIG.persistence_enabled:
            return

        self.ensure_data_dir()
        self.peers_path.write_text(json.dumps({"peers": peers}, indent=2), encoding="utf-8")

    def load_peers(self) -> List[str]:
        if not self.peers_path.exists():
            return []

        payload = json.loads(self.peers_path.read_text(encoding="utf-8"))
        return list(payload.get("peers", []))
