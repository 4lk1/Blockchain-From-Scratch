"""
Business logic services for blockchain operations.

This module contains services that handle blockchain operations,
wallet management, transaction processing, and attack simulations.
"""

from typing import Dict, List, Optional

from .blockchain import Blockchain
from .wallet import Wallet
from .transaction import Transaction
from .attack import Attack51Percent
from .utils import (
    get_current_timestamp,
    validate_amount,
    validate_address,
    logger,
)


# ============================================================================
# Blockchain Service
# ============================================================================

class BlockchainService:
    """Service for blockchain operations."""

    def __init__(self, difficulty: int = 3, mining_reward: float = 10.0):
        """Initialize blockchain service."""
        self.blockchain = Blockchain(difficulty=difficulty, mining_reward=mining_reward)
        self.logger = logger

    def get_chain(self):
        """Get the blockchain object."""
        return self.blockchain

    def get_blocks(self) -> List:
        """Get all blocks in the blockchain."""
        return self.blockchain.chain

    def get_block(self, index: int):
        """Get a specific block by index."""
        if 0 <= index < len(self.blockchain.chain):
            return self.blockchain.chain[index]
        raise ValueError(f"Block index {index} out of range")

    def get_chain_length(self) -> int:
        """Get the number of blocks in the chain."""
        return len(self.blockchain.chain)

    def get_pending_transactions_count(self) -> int:
        """Get count of pending transactions."""
        return len(self.blockchain.pending_transactions)

    def validate_chain(self) -> Dict:
        """
        Validate the entire blockchain.

        Returns:
            Dictionary with validation result
        """
        is_valid, error_message = self.blockchain.is_chain_valid()

        return {
            "is_valid": is_valid,
            "chain_length": len(self.blockchain.chain),
            "total_blocks": len(self.blockchain.chain),
            "total_transactions": self.blockchain.get_total_transaction_count(),
            "error_message": error_message,
            "invalid_blocks": [],
        }

    def get_chain_stats(self) -> Dict:
        """
        Get blockchain statistics.

        Returns:
            Dictionary with blockchain stats
        """
        blockchain = self.blockchain
        blocks = blockchain.chain

        # Calculate stats
        total_transactions = sum(len(block.transactions) for block in blocks)
        total_value = sum(sum(tx.amount for tx in block.transactions) for block in blocks)

        # Calculate average block time
        if len(blocks) > 1:
            time_span = blocks[-1].timestamp - blocks[0].timestamp
            avg_block_time = time_span / (len(blocks) - 1) if len(blocks) > 1 else 0
        else:
            avg_block_time = 0
        chain_valid = self.validate_chain()["is_valid"]

        return {
            "total_blocks": len(blocks),
            "total_transactions": total_transactions,
            "pending_transactions": len(blockchain.pending_transactions),
            "mining_difficulty": blockchain.difficulty,
            "difficulty": blockchain.difficulty,
            "mining_reward": blockchain.mining_reward,
            "chain_valid": chain_valid,
            "is_valid": chain_valid,
            "total_value": total_value,
            "average_block_time": avg_block_time,
            "nonce": getattr(blocks[-1], "nonce", 0) if blocks else 0,
            "hash_attempts": getattr(blocks[-1], "hash_attempts", 0) if blocks else 0,
            "mining_time": getattr(blocks[-1], "mining_time", 0.0) if blocks else 0.0,
        }

    def get_chain_status(self) -> Dict:
        """Get compact blockchain status."""
        blocks = self.blockchain.chain
        last_block = blocks[-1] if blocks else None
        validation = self.validate_chain()

        return {
            "is_valid": validation["is_valid"],
            "chain_length": len(blocks),
            "pending_transactions": len(self.blockchain.pending_transactions),
            "last_block_hash": last_block.hash if last_block else None,
            "last_block_index": last_block.index if last_block else None,
            "error_message": validation["error_message"],
        }

    def reset_blockchain(self):
        """Reset blockchain to genesis state."""
        self.blockchain = Blockchain(
            difficulty=self.blockchain.difficulty,
            mining_reward=self.blockchain.mining_reward,
        )
        self.logger.info("Blockchain reset to genesis state")


# ============================================================================
# Wallet Service
# ============================================================================

class WalletService:
    """Service for wallet management."""

    def __init__(self):
        """Initialize wallet service."""
        self.wallets: Dict[str, Wallet] = {}
        self.wallet_names: Dict[str, str] = {}
        self.wallet_balances: Dict[str, float] = {}  # Track balances separately
        self.logger = logger

    def create_wallet(self, name: str) -> Dict:
        """
        Create a new wallet.

        Args:
            name: Wallet name

        Returns:
            Dictionary with wallet info
        """
        wallet = Wallet()
        address = wallet.get_address()

        self.wallets[address] = wallet
        self.wallet_names[address] = name
        self.wallet_balances[address] = 0.0  # Initialize balance to 0

        self.logger.info(f"Created wallet '{name}' at address {address}")

        return {
            "address": address,
            "name": name,
            "public_key": (
                wallet.get_public_key().decode() if wallet.get_public_key() else None
            ),
            "balance": 0.0,
        }

    def get_wallet(self, address: str) -> Optional[Wallet]:
        """Get wallet by address."""
        return self.wallets.get(address)

    def get_all_wallets(self) -> List[Dict]:
        """Get all wallets with their info."""
        wallets_list = []
        for address, wallet in self.wallets.items():
            wallets_list.append(
                {
                    "address": address,
                    "name": self.wallet_names.get(address, "Unknown"),
                    "balance": self.wallet_balances.get(address, 0.0),
                    "public_key": (
                        wallet.get_public_key().decode()
                        if wallet.get_public_key()
                        else None
                    ),
                }
            )
        return wallets_list

    def get_wallet_balance(self, address: str) -> float:
        """Get wallet balance."""
        return self.wallet_balances.get(address, 0.0)

    def update_wallet_balance(self, address: str, amount: float):
        """Update wallet balance."""
        if address in self.wallets:
            self.wallet_balances[address] = amount

    def apply_transaction(self, tx: Transaction):
        """Apply a mined transaction to tracked wallet balances."""
        if tx.sender != "SYSTEM" and tx.sender in self.wallets:
            self.wallet_balances[tx.sender] = (
                self.wallet_balances.get(tx.sender, 0.0) - tx.amount
            )

        if tx.receiver in self.wallets:
            self.wallet_balances[tx.receiver] = (
                self.wallet_balances.get(tx.receiver, 0.0) + tx.amount
            )

    def clear(self):
        """Remove all wallet state."""
        self.wallets.clear()
        self.wallet_names.clear()
        self.wallet_balances.clear()

    def validate_wallet_exists(self, address: str) -> bool:
        """Check if wallet exists."""
        return address in self.wallets

    def get_wallet_by_name(self, name: str) -> Optional[Dict]:
        """Get wallet info by its friendly name."""
        for address, nm in self.wallet_names.items():
            if nm == name:
                wallet = self.wallets.get(address)
                return {
                    "address": address,
                    "name": nm,
                    "balance": self.wallet_balances.get(address, 0.0),
                    "public_key": (
                        wallet.get_public_key().decode()
                        if wallet and wallet.get_public_key()
                        else None
                    ),
                }
        return None


# ============================================================================
# Transaction Service
# ============================================================================

class TransactionService:
    """Service for transaction management."""

    def __init__(self, blockchain_service: BlockchainService, wallet_service: WalletService):
        """Initialize transaction service."""
        self.blockchain_service = blockchain_service
        self.wallet_service = wallet_service
        self.logger = logger

    def create_transaction(
        self,
        sender_address: str,
        receiver_address: str,
        amount: float,
    ) -> Dict:
        """
        Create and add a transaction.

        Args:
            sender_address: Sender wallet address
            receiver_address: Receiver wallet address
            amount: Transaction amount

        Returns:
            Dictionary with transaction info

        Raises:
            ValueError: If transaction is invalid
        """
        # Validate inputs
        if not validate_address(sender_address):
            raise ValueError("Invalid sender address")
        if not validate_address(receiver_address):
            raise ValueError("Invalid receiver address")
        if not validate_amount(amount):
            raise ValueError("Amount must be positive")

        # Check sender wallet exists
        sender_wallet = self.wallet_service.get_wallet(sender_address)
        if not sender_wallet:
            raise ValueError(f"Sender wallet not found: {sender_address}")

        if not self.wallet_service.validate_wallet_exists(receiver_address):
            raise ValueError(f"Receiver wallet not found: {receiver_address}")

        # Reserve pending outgoing transactions so wallets cannot overspend.
        sender_balance = self.wallet_service.get_wallet_balance(sender_address)
        pending_outgoing = sum(
            tx.amount
            for tx in self.blockchain_service.blockchain.pending_transactions
            if tx.sender == sender_address
        )
        available_balance = sender_balance - pending_outgoing
        if available_balance < amount:
            raise ValueError(
                f"Insufficient available balance. Have {available_balance}, need {amount}"
            )

        # Create transaction
        tx = Transaction(sender_address, receiver_address, amount)
        # Sign using the Wallet object
        tx.sign_transaction(sender_wallet)

        # Add to blockchain
        self.blockchain_service.blockchain.add_transaction(tx)

        self.logger.info(
            f"Created transaction: {amount} from {sender_address} to {receiver_address}"
        )

        return {
            "transaction": {
                "sender": sender_address,
                "receiver": receiver_address,
                "amount": amount,
                "signature": tx.signature,
                "is_valid": tx.is_valid(),
            }
        }

    def get_pending_transactions(self) -> List[Dict]:
        """Get all pending transactions."""
        transactions = []
        for tx in self.blockchain_service.blockchain.pending_transactions:
            transactions.append(
                {
                    "sender": tx.sender,
                    "receiver": tx.receiver,
                    "amount": tx.amount,
                    "timestamp": tx.timestamp,
                    "signature": tx.signature[:16] + "..." if tx.signature else "",
                    "is_valid": tx.is_valid(),
                }
            )
        return transactions


# ============================================================================
# Mining Service
# ============================================================================

class MiningService:
    """Service for mining operations."""

    def __init__(
        self,
        blockchain_service: BlockchainService,
        wallet_service: WalletService,
    ):
        """Initialize mining service."""
        self.blockchain_service = blockchain_service
        self.wallet_service = wallet_service
        self.logger = logger

    def mine_block(self, miner_address: str) -> Dict:
        """
        Mine a new block.

        Args:
            miner_address: Address of the miner

        Returns:
            Dictionary with mining result

        Raises:
            ValueError: If mining fails
        """
        # Validate miner wallet
        if not self.wallet_service.validate_wallet_exists(miner_address):
            raise ValueError(f"Miner wallet not found: {miner_address}")

        # Mine block (blockchain will append a reward tx even if none exist)
        blockchain = self.blockchain_service.blockchain
        start_time = get_current_timestamp()
        block = blockchain.mine_pending_transactions(miner_address)
        mining_time = get_current_timestamp() - start_time

        for tx in block.transactions:
            self.wallet_service.apply_transaction(tx)

        self.logger.info(
            f"Mined block #{block.index} in {mining_time:.2f}s "
            f"with nonce {block.nonce}"
        )

        return {
            "block": {
                "index": block.index,
                "hash": block.hash,
                "nonce": block.nonce,
                "transactions": len(block.transactions),
                "mining_time": mining_time,
                "difficulty": getattr(block, "difficulty", blockchain.difficulty),
            }
        }


# ============================================================================
# Attack Service
# ============================================================================

class AttackService:
    """Service for attack simulations."""

    def __init__(
        self,
        blockchain_service: BlockchainService,
        wallet_service: WalletService,
    ):
        """Initialize attack service."""
        self.blockchain_service = blockchain_service
        self.wallet_service = wallet_service
        self.logger = logger

    def simulate_51_percent_attack(self) -> Dict:
        """
        Simulate a 51% attack.

        Returns:
            Dictionary with attack result
        """
        # Run attack simulation using the attack module
        attack = Attack51Percent(difficulty=self.blockchain_service.blockchain.difficulty)
        result = attack.execute_attack()

        self.logger.info(
            f"51% attack simulation completed: "
            f"Success={result.get('success', False)}"
        )

        return result


# ============================================================================
# Tamper Service
# ============================================================================

class TamperService:
    """Service for tamper demonstrations."""

    def __init__(self, blockchain_service: BlockchainService):
        """Initialize tamper service."""
        self.blockchain_service = blockchain_service
        self.logger = logger

    def tamper_block(
        self,
        block_index: int,
        transaction_index: int,
        new_amount: float,
    ) -> Dict:
        """
        Tamper with a block transaction for demonstration.

        Args:
            block_index: Block to modify
            transaction_index: Transaction within block
            new_amount: New amount value

        Returns:
            Dictionary with before/after comparison
        """
        blockchain = self.blockchain_service.blockchain

        # Validate indices
        if not (0 <= block_index < len(blockchain.chain)):
            raise ValueError(f"Invalid block index: {block_index}")

        block = blockchain.chain[block_index]

        if not (0 <= transaction_index < len(block.transactions)):
            raise ValueError(f"Invalid transaction index: {transaction_index}")

        # Get original values
        tx = block.transactions[transaction_index]
        original_amount = tx.amount
        original_hash = block.hash

        # Tamper with transaction (temporarily)
        tx.amount = new_amount
        new_block_hash = block.calculate_hash()

        # Apply tampered hash to block so validation will detect change
        block.hash = new_block_hash

        # Validate chain while tampered
        is_valid, error = blockchain.is_chain_valid()

        # Restore original transaction and block hash to avoid permanent modification
        tx.amount = original_amount
        block.hash = original_hash

        self.logger.warning(
            f"Tampering demonstration: "
            f"Block #{block_index}, TX #{transaction_index}: "
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
