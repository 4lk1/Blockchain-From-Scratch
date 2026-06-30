"""Tampering demonstration for educational validation."""

from typing import TYPE_CHECKING, Any, Dict

from ..utils import logger

if TYPE_CHECKING:
    from .blockchain_service import BlockchainService


class TamperService:
    """Service for tamper demonstrations."""

    def __init__(self, blockchain_service: "BlockchainService") -> None:
        self.blockchain_service = blockchain_service
        self.logger = logger

    def tamper_block(
        self,
        block_index: int,
        transaction_index: int,
        new_amount: float,
    ) -> Dict[str, Any]:
        blockchain = self.blockchain_service.blockchain

        if not (0 <= block_index < len(blockchain.chain)):
            raise ValueError(f"Invalid block index: {block_index}")

        block = blockchain.chain[block_index]

        if not (0 <= transaction_index < len(block.transactions)):
            raise ValueError(f"Invalid transaction index: {transaction_index}")

        tx = block.transactions[transaction_index]
        original_amount = tx.amount
        original_hash = block.hash

        tx.amount = new_amount
        new_block_hash = block.calculate_hash()
        block.hash = new_block_hash

        is_valid, error = blockchain.is_chain_valid()

        tx.amount = original_amount
        block.hash = original_hash

        self.logger.warning(
            f"Tampering demonstration: Block #{block_index}, TX #{transaction_index}: "
            f"{original_amount} -> {new_amount}"
        )

        return {
            "before": {
                "amount": original_amount,
                "hash": original_hash[:16] + "...",
            },
            "after": {
                "amount": new_amount,
                "hash": new_block_hash[:16] + "...",
            },
            "chain_valid": is_valid,
            "error_message": error,
        }
