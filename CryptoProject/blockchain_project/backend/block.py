"""
Block Module
Represents a single block in the blockchain with Proof-of-Work mining.
"""

import hashlib
import json
from datetime import datetime


class Block:
    """
    Represents a block in the blockchain.

    Each block contains a list of transactions, a reference to the previous block,
    and a Proof-of-Work nonce. Blocks are immutable once created and mined.

    Attributes:
        index (int): Position of the block in the chain
        timestamp (float): Unix timestamp when block was created
        transactions (list): List of Transaction objects in this block
        previous_hash (str): SHA-256 hash of the previous block
        nonce (int): Number used for Proof-of-Work
        hash (str): SHA-256 hash of this block
    """

    def __init__(self, index, transactions, previous_hash):
        """
        Initialize a new block.

        Args:
            index (int): Position in the blockchain
            transactions (list): List of Transaction objects
            previous_hash (str): Hash of the previous block
        """
        self.index = index
        self.timestamp = datetime.now().timestamp()
        self.transactions = transactions
        self.previous_hash = previous_hash
        self.nonce = 0
        self.difficulty = 0
        self.hash_attempts = 0
        self.mining_time = 0.0
        self.hash = self.calculate_hash()

    def calculate_hash(self):
        """
        Calculate SHA-256 hash of the block.

        The hash is calculated from all block fields. Changing any field
        will completely change the hash, making tampering obvious.

        Returns:
            str: Hexadecimal hash of the block
        """
        # Convert transactions to dictionaries for serialization
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

        # Create block data dictionary
        block_data = {
            "index": self.index,
            "timestamp": self.timestamp,
            "transactions": transactions_data,
            "previous_hash": self.previous_hash,
            "nonce": self.nonce,
        }

        # Convert to JSON string and hash
        block_string = json.dumps(block_data, sort_keys=True)
        return hashlib.sha256(block_string.encode()).hexdigest()

    def mine_block(self, difficulty):
        """
        Mine the block using Proof-of-Work.

        The Proof-of-Work requires finding a nonce such that the block's hash
        has a specific number of leading zeros. This is computationally expensive
        and is what gives Proof-of-Work its security properties.

        Args:
            difficulty (int): Number of leading zeros required in the hash
        """
        # Create a target string with the required number of zeros
        target = "0" * difficulty

        print(f"\n  Mining Block #{self.index}...")
        print(f"   Difficulty: {difficulty} (requires {difficulty} leading zeros)")

        attempt = 0
        import time

        start_time = time.time()

        # Keep incrementing nonce until we find a valid hash
        while self.hash[:difficulty] != target:
            self.nonce += 1
            self.hash = self.calculate_hash()
            attempt += 1

            # Print progress every 100,000 attempts
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

    def get_transaction_count(self):
        """
        Get the number of transactions in this block.

        Returns:
            int: Number of transactions
        """
        return len(self.transactions)

    def get_block_size(self):
        """
        Get the approximate size of the block in bytes.

        Returns:
            int: Approximate size in bytes
        """
        block_data = {
            "index": self.index,
            "timestamp": self.timestamp,
            "transactions": len(self.transactions),
            "previous_hash": self.previous_hash,
            "nonce": self.nonce,
            "hash": self.hash,
        }
        return len(json.dumps(block_data).encode())

    def __repr__(self):
        """String representation of block."""
        return (
            f"Block(index={self.index}, "
            f"transactions={len(self.transactions)}, "
            f"hash={self.hash[:16]}...)"
        )
