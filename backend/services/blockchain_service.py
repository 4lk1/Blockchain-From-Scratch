"""Blockchain state, persistence, and validation operations."""

from typing import Any, Dict, List, Optional, Tuple

from ..blockchain import Blockchain
from ..config import CONFIG
from ..persistence.store import ChainStore
from ..utils import logger


class BlockchainService:
    """Service for blockchain operations."""

    def __init__(
        self,
        difficulty: int = CONFIG.initial_difficulty,
        mining_reward: float = CONFIG.mining_reward,
        chain_store: ChainStore | None = None,
    ) -> None:
        self._chain_store = chain_store or ChainStore()
        self.logger = logger
        self.blockchain = self._load_or_create(difficulty, mining_reward)
        self.blockchain.set_change_listener(self.persist)

    def _load_or_create(self, difficulty: int, mining_reward: float) -> Blockchain:
        snapshot = self._chain_store.load()
        if snapshot:
            self.logger.info(
                "Loaded blockchain snapshot (%s blocks)",
                len(snapshot["chain"]),
            )
            return Blockchain.from_snapshot(
                chain=snapshot["chain"],
                mempool=snapshot["mempool"],
                difficulty=snapshot["difficulty"],
                mining_reward=snapshot["mining_reward"],
            )

        return Blockchain(difficulty=difficulty, mining_reward=mining_reward)

    def persist(self) -> None:
        self._chain_store.save(
            chain=self.blockchain.chain,
            mempool=self.blockchain.mempool,
            difficulty=self.blockchain.difficulty,
            mining_reward=self.blockchain.mining_reward,
        )

    def get_chain(self) -> Blockchain:
        return self.blockchain

    def get_blocks(self) -> List[Any]:
        return self.blockchain.chain

    def get_block(self, index: int) -> Any:
        if 0 <= index < len(self.blockchain.chain):
            return self.blockchain.chain[index]
        raise ValueError(f"Block index {index} out of range")

    def get_chain_length(self) -> int:
        return len(self.blockchain.chain)

    def get_pending_transactions_count(self) -> int:
        return len(self.blockchain.mempool)

    def get_balance(self, address: str) -> float:
        return self.blockchain.get_balance(address)

    def _validate(self, quiet: bool = True) -> Tuple[bool, str]:
        return self.blockchain.is_chain_valid(quiet=quiet)

    def validate_chain(self) -> Dict[str, Any]:
        is_valid, error_message = self.blockchain.is_chain_valid(quiet=False)
        chain_length = len(self.blockchain.chain)

        return {
            "is_valid": is_valid,
            "chain_length": chain_length,
            "total_blocks": chain_length,
            "total_transactions": self.blockchain.get_total_transaction_count(),
            "error_message": error_message,
            "invalid_blocks": [],
        }

    def get_chain_stats(self) -> Dict[str, Any]:
        blockchain = self.blockchain
        blocks = blockchain.chain

        total_transactions = sum(len(block.transactions) for block in blocks)
        total_value = sum(
            sum(tx.amount for tx in block.transactions) for block in blocks
        )

        if len(blocks) > 1:
            time_span = blocks[-1].timestamp - blocks[0].timestamp
            avg_block_time = time_span / (len(blocks) - 1)
        else:
            avg_block_time = 0.0

        is_valid, _ = self._validate(quiet=True)
        last_block = blocks[-1] if blocks else None

        return {
            "total_blocks": len(blocks),
            "total_transactions": total_transactions,
            "pending_transactions": len(blockchain.mempool),
            "mining_difficulty": blockchain.difficulty,
            "difficulty": blockchain.difficulty,
            "mining_reward": blockchain.mining_reward,
            "chain_valid": is_valid,
            "is_valid": is_valid,
            "total_value": total_value,
            "average_block_time": avg_block_time,
            "nonce": getattr(last_block, "nonce", 0) if last_block else 0,
            "hash_attempts": getattr(last_block, "hash_attempts", 0) if last_block else 0,
            "mining_time": getattr(last_block, "mining_time", 0.0) if last_block else 0.0,
        }

    def get_chain_status(self) -> Dict[str, Any]:
        blocks = self.blockchain.chain
        last_block = blocks[-1] if blocks else None
        is_valid, error_message = self._validate(quiet=True)

        return {
            "is_valid": is_valid,
            "chain_length": len(blocks),
            "pending_transactions": len(self.blockchain.mempool),
            "last_block_hash": last_block.hash if last_block else None,
            "last_block_index": last_block.index if last_block else None,
            "error_message": error_message,
        }

    def replace_chain_if_longer(self, candidate_chain: List[Any]) -> Tuple[bool, str]:
        replaced, message = self.blockchain.replace_chain_if_longer(candidate_chain)
        if replaced:
            self.persist()
        return replaced, message

    def reset_blockchain(self) -> None:
        self.blockchain = Blockchain(
            difficulty=self.blockchain.difficulty,
            mining_reward=self.blockchain.mining_reward,
        )
        self.blockchain.set_change_listener(self.persist)
        self.persist()
        self.logger.info("Blockchain reset to genesis state")
