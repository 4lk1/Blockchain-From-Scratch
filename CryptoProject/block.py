"""
Block class for the blockchain implementation.
Handles block structure, hashing, and Proof-of-Work.
"""

import hashlib
import json
from datetime import datetime
from typing import List, Any


class Block:
    """Represents a single block in the blockchain."""
    
    def __init__(self, index: int, transactions: List[dict], previous_hash: str, 
                 nonce: int = 0, timestamp: str = None):
        """
        Initialize a block.
        
        Args:
            index: Block number in the chain
            transactions: List of transactions in the block
            previous_hash: Hash of the previous block
            nonce: Number used once for Proof-of-Work
            timestamp: Block creation time
        """
        self.index = index
        self.transactions = transactions
        self.previous_hash = previous_hash
        self.nonce = nonce
        self.timestamp = timestamp or datetime.now().isoformat()
        self.hash = self.calculate_hash()
    
    def calculate_hash(self) -> str:
        """
        Calculate the SHA-256 hash of the block.
        
        Returns:
            Hexadecimal hash string
        """
        block_string = json.dumps({
            'index': self.index,
            'transactions': self.transactions,
            'previous_hash': self.previous_hash,
            'nonce': self.nonce,
            'timestamp': self.timestamp
        }, sort_keys=True)
        
        return hashlib.sha256(block_string.encode()).hexdigest()
    
    def mine_block(self, difficulty: int) -> None:
        """
        Perform Proof-of-Work to mine the block.
        Find a nonce such that the hash starts with 'difficulty' zeros.
        
        Args:
            difficulty: Number of leading zeros required in the hash
        """
        target = '0' * difficulty
        
        print(f"Mining block {self.index}...")
        while self.hash[:difficulty] != target:
            self.nonce += 1
            self.hash = self.calculate_hash()
        
        print(f"✓ Block {self.index} mined! Hash: {self.hash}")
    
    def to_dict(self) -> dict:
        """Convert block to dictionary representation."""
        return {
            'index': self.index,
            'timestamp': self.timestamp,
            'transactions': self.transactions,
            'previous_hash': self.previous_hash,
            'nonce': self.nonce,
            'hash': self.hash
        }
    
    def __repr__(self) -> str:
        return f"Block(index={self.index}, hash={self.hash[:8]}..., nonce={self.nonce})"
