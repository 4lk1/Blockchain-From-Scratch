"""
Main Blockchain implementation with Proof-of-Work.
Includes chain validation and security mechanisms.
"""

from block import Block
from transaction import Transaction
from typing import List, Optional
import json


class Blockchain:
    """Main blockchain class with Proof-of-Work and validation."""
    
    def __init__(self, difficulty: int = 4):
        """
        Initialize the blockchain.
        
        Args:
            difficulty: Difficulty level for Proof-of-Work (number of leading zeros)
        """
        self.chain: List[Block] = []
        self.pending_transactions: List[Transaction] = []
        self.difficulty = difficulty
        self.mining_reward = 10
        
        # Create genesis block
        self.create_genesis_block()
    
    def create_genesis_block(self) -> None:
        """Create the first block in the blockchain."""
        genesis_block = Block(
            index=0,
            transactions=[],
            previous_hash="0"
        )
        genesis_block.mine_block(self.difficulty)
        self.chain.append(genesis_block)
        print("Genesis block created!\n")
    
    def get_latest_block(self) -> Block:
        """Get the most recent block in the chain."""
        return self.chain[-1]
    
    def add_transaction(self, transaction: Transaction) -> bool:
        """
        Add a transaction to the pending transactions pool.
        
        Args:
            transaction: Transaction to add
            
        Returns:
            True if transaction is valid and added
        """
        # In a real blockchain, verify transaction signature here
        # For this demo, we accept all properly formed transactions
        if transaction.sender and transaction.receiver and transaction.amount > 0:
            self.pending_transactions.append(transaction)
            return True
        return False
    
    def mine_pending_transactions(self, miner_address: str) -> bool:
        """
        Mine pending transactions and create a new block.
        
        Args:
            miner_address: Address of the miner
            
        Returns:
            True if block was successfully mined
        """
        if not self.pending_transactions:
            print("No pending transactions to mine.")
            return False
        
        # Create reward transaction for miner
        reward_tx = Transaction("SYSTEM", miner_address, self.mining_reward)
        transactions_to_mine = self.pending_transactions + [reward_tx]
        
        # Convert transactions to dictionary format for block
        tx_dicts = [tx.to_dict() for tx in transactions_to_mine]
        
        new_block = Block(
            index=len(self.chain),
            transactions=tx_dicts,
            previous_hash=self.get_latest_block().hash
        )
        
        new_block.mine_block(self.difficulty)
        self.chain.append(new_block)
        
        # Clear pending transactions
        self.pending_transactions = []
        
        return True
    
    def is_chain_valid(self) -> bool:
        """
        Validate the entire blockchain.
        Checks:
        - Each block's hash is correct
        - Each block's previous_hash matches the previous block's hash
        - Each block's hash meets the difficulty requirement
        
        Returns:
            True if chain is valid, False otherwise
        """
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i - 1]
            
            # Verify current block's hash
            if current_block.hash != current_block.calculate_hash():
                print(f"Block {i}: Hash is incorrect!")
                return False
            
            # Verify chain linkage
            if current_block.previous_hash != previous_block.hash:
                print(f"Block {i}: Previous hash doesn't match!")
                return False
            
            # Verify Proof-of-Work
            if current_block.hash[:self.difficulty] != '0' * self.difficulty:
                print(f"Block {i}: Proof-of-Work is invalid!")
                return False
        
        print("Blockchain is valid!")
        return True
    
    def get_balance(self, address: str) -> float:
        """
        Calculate balance for an address.
        
        Args:
            address: Account address
            
        Returns:
            Balance amount
        """
        balance = 0
        
        for block in self.chain:
            for tx in block.transactions:
                if tx.get('sender') == address:
                    balance -= tx.get('amount', 0)
                if tx.get('receiver') == address:
                    balance += tx.get('amount', 0)
        
        return balance
    
    def get_transaction_history(self, address: str) -> List[dict]:
        """Get all transactions involving an address."""
        history = []
        
        for block in self.chain:
            for tx in block.transactions:
                if tx.get('sender') == address or tx.get('receiver') == address:
                    history.append(tx)
        
        return history
    
    def print_chain(self) -> None:
        """Print all blocks in the chain."""
        print("\n" + "="*80)
        print("BLOCKCHAIN CONTENTS".center(80))
        print("="*80)
        for block in self.chain:
            print(f"\nBlock #{block.index}")
            print(f"  Hash:          {block.hash}")
            print(f"  Previous Hash: {block.previous_hash}")
            print(f"  Nonce:         {block.nonce}")
            print(f"  Timestamp:     {block.timestamp}")
            print(f"  Transactions:  {len(block.transactions)}")
            for i, tx in enumerate(block.transactions):
                print(f"    [{i}] {tx['sender'][:8]}... → {tx['receiver'][:8]}...: {tx['amount']}")
        print("="*80 + "\n")
    
    def print_stats(self) -> None:
        """Print blockchain statistics."""
        print("\n" + "="*80)
        print("BLOCKCHAIN STATISTICS".center(80))
        print("="*80)
        print(f"Chain Length:           {len(self.chain)} blocks")
        print(f"Difficulty:             {self.difficulty}")
        print(f"Total Transactions:     {sum(len(b.transactions) for b in self.chain)}")
        print(f"Pending Transactions:   {len(self.pending_transactions)}")
        print(f"Mining Reward:          {self.mining_reward}")
        print("="*80 + "\n")
    
    def __repr__(self) -> str:
        return f"Blockchain(length={len(self.chain)}, difficulty={self.difficulty})"
