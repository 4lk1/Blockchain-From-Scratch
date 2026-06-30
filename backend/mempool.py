"""
Pending transaction pool (mempool).

Assumption: deduplication is based on transaction_id (payload hash).
"""

from typing import List, Tuple

from .config import CONFIG
from .transaction import Transaction


class Mempool:
    """In-memory FIFO mempool with deduplication and capacity limits."""

    def __init__(self, max_size: int = CONFIG.max_mempool_size) -> None:
        self.max_size = max_size
        self._transactions: List[Transaction] = []
        self._seen_ids: set[str] = set()

    def __len__(self) -> int:
        return len(self._transactions)

    def list_transactions(self) -> List[Transaction]:
        return list(self._transactions)

    def pending_outgoing(self, sender_address: str) -> float:
        return sum(
            tx.amount
            for tx in self._transactions
            if tx.sender == sender_address
        )

    def add(self, transaction: Transaction) -> Tuple[bool, str]:
        if len(self._transactions) >= self.max_size:
            return False, "Mempool is full"

        tx_id = transaction.transaction_id
        if tx_id in self._seen_ids:
            return False, "Duplicate transaction"

        if not transaction.is_valid():
            return False, "Invalid transaction signature"

        self._transactions.append(transaction)
        self._seen_ids.add(tx_id)
        return True, ""

    def take_all(self) -> List[Transaction]:
        transactions = list(self._transactions)
        self.clear()
        return transactions

    def clear(self) -> None:
        self._transactions.clear()
        self._seen_ids.clear()
