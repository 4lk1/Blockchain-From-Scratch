"""
Block Module
Represents a single block in the blockchain with Proof-of-Work mining.
"""

import time
from datetime import datetime
from typing import List

from .crypto.hashing import sha256_dict
from .transaction import Transaction


class Block:
    """A block in the blockchain with Proof-of-Work."""

    def __init__(self, index: int, transactions: List[Transaction], previous_hash: str):
        self.index = index
        self.timestamp = datetime.now().timestamp()
        self.transactions = transactions
        self.previous_hash = previous_hash
        self.nonce = 0
        self.difficulty = 0
        self.hash_attempts = 0
        self.mining_time = 0.0
        self.hash = self.calculate_hash()

    def calculate_hash(self) -> str:
        """Calculate SHA-256 hash of canonical block payload."""
        transactions_data = []
        for tx in self.transactions:
            transactions_data.append(
                {
                    "sender": tx.sender,
                    "receiver": tx.receiver,
                    "amount": tx.amount,
                    "timestamp": tx.timestamp,
                    "signature": tx.signature,
                }
            )

        block_data = {
            "index": self.index,
            "timestamp": self.timestamp,
            "transactions": transactions_data,
            "previous_hash": self.previous_hash,
            "nonce": self.nonce,
        }
        return sha256_dict(block_data, legacy=True)

    def mine_block(self, difficulty: int) -> None:
        """Mine the block using Proof-of-Work."""
        target = "0" * difficulty

        print(f"\n  Mining Block #{self.index}...")
        print(f"   Difficulty: {difficulty} (requires {difficulty} leading zeros)")

        attempt = 0
        start_time = time.time()

        while self.hash[:difficulty] != target:
            self.nonce += 1
            self.hash = self.calculate_hash()
            attempt += 1

            if attempt % 100000 == 0:
                print(f"   Attempts: {attempt:,}")

        mining_time = time.time() - start_time
        self.difficulty = difficulty
        self.hash_attempts = attempt
        self.mining_time = mining_time

        print("   Block mined successfully!")
        print(f"   Nonce: {self.nonce:,}")
        print(f"   Hash: {self.hash}")
        print(f"   Mining time: {mining_time:.2f} seconds")

    def get_transaction_count(self) -> int:
        return len(self.transactions)

    def __repr__(self) -> str:
        return (
            f"Block(index={self.index}, "
            f"transactions={len(self.transactions)}, "
            f"hash={self.hash[:16]}...)"
        )
