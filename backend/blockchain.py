"""
Blockchain Module
Manages the blockchain, including chain validation, transaction management, and mining rewards.
"""

from typing import Callable, Dict, List, Optional, Tuple

from .block import Block
from .config import CONFIG
from .mempool import Mempool
from .transaction import Transaction
from .validation import _apply_transaction_to_balances, validate_block_structure
from .utils import logger


class Blockchain:
    """In-memory blockchain with PoW consensus and account-based balances."""

    def __init__(
        self,
        difficulty: int = CONFIG.initial_difficulty,
        mining_reward: float = CONFIG.mining_reward,
        create_genesis: bool = True,
    ):
        self.chain: List[Block] = []
        self.mempool = Mempool()
        self.difficulty = difficulty
        self.mining_reward = mining_reward
        self._balance_cache: Dict[str, float] = {}
        self._balances_dirty = True
        self._on_change: Optional[Callable[[], None]] = None

        if create_genesis:
            self.create_genesis_block()

    @property
    def pending_transactions(self) -> List[Transaction]:
        """Backward-compatible view of the mempool."""
        return self.mempool.list_transactions()

    def set_change_listener(self, callback: Callable[[], None]) -> None:
        self._on_change = callback

    def _notify_change(self) -> None:
        if self._on_change:
            self._on_change()

    def create_genesis_block(self) -> None:
        genesis_block = Block(0, [], "0")
        genesis_block.mine_block(self.difficulty)
        self.chain.append(genesis_block)
        self._mark_balances_dirty()
        self._notify_change()

    @classmethod
    def from_snapshot(
        cls,
        chain: List[Block],
        mempool: Mempool,
        difficulty: int,
        mining_reward: float,
    ) -> "Blockchain":
        blockchain = cls(
            difficulty=difficulty,
            mining_reward=mining_reward,
            create_genesis=False,
        )
        blockchain.chain = chain
        blockchain.mempool = mempool
        blockchain._mark_balances_dirty()
        return blockchain

    def get_latest_block(self) -> Block:
        return self.chain[-1]

    def add_transaction(self, transaction: Transaction) -> bool:
        added, reason = self.mempool.add(transaction)
        if not added:
            logger.info("Transaction rejected: %s", reason)
            return False

        logger.info(
            "Transaction added: %s...→%s... (%s)",
            transaction.sender[:10],
            transaction.receiver[:10],
            transaction.amount,
        )
        self._notify_change()
        return True

    def mine_pending_transactions(self, miner_address: str) -> Block:
        pending = self.mempool.take_all()
        max_user_transactions = max(CONFIG.max_block_size - 1, 0)
        if len(pending) > max_user_transactions:
            overflow = pending[max_user_transactions:]
            pending = pending[:max_user_transactions]
            for tx in overflow:
                self.mempool.add(tx)

        reward_transaction = Transaction(
            CONFIG.system_wallet_name,
            miner_address,
            self.mining_reward,
        )
        block_transactions = pending + [reward_transaction]

        new_block = Block(
            len(self.chain),
            block_transactions,
            self.get_latest_block().hash,
        )
        new_block.mine_block(self.difficulty)
        new_block.difficulty = self.difficulty

        self.chain.append(new_block)
        self._mark_balances_dirty()
        self._notify_change()
        return new_block

    def _mark_balances_dirty(self) -> None:
        self._balances_dirty = True

    def _rebuild_balance_cache(self) -> None:
        balances: Dict[str, float] = {}
        for block in self.chain:
            for transaction in block.transactions:
                _apply_transaction_to_balances(transaction, balances)
        self._balance_cache = balances
        self._balances_dirty = False

    def get_balance(self, address: str) -> float:
        if self._balances_dirty:
            self._rebuild_balance_cache()
        return self._balance_cache.get(address, 0.0)

    def is_chain_valid(self, quiet: bool = False) -> Tuple[bool, str]:
        if not self.chain:
            return False, "Chain is empty"

        running_balances: Dict[str, float] = {}

        for index, current_block in enumerate(self.chain):
            stored_hash = current_block.hash
            recalculated_hash = current_block.calculate_hash()
            block_difficulty = getattr(current_block, "difficulty", self.difficulty)
            expected_previous = "0" if index == 0 else self.chain[index - 1].hash

            ok, error_msg = validate_block_structure(
                block_index=current_block.index,
                expected_index=index,
                previous_hash=current_block.previous_hash,
                expected_previous_hash=expected_previous,
                block_hash=stored_hash,
                recalculated_hash=recalculated_hash,
                difficulty=block_difficulty,
            )
            if not ok:
                if not quiet:
                    print(error_msg)
                return False, error_msg

            if len(current_block.transactions) > CONFIG.max_block_size:
                error_msg = f"Block #{index}: exceeds max transaction count"
                if not quiet:
                    print(error_msg)
                return False, error_msg

            for tx_index, transaction in enumerate(current_block.transactions):
                if not transaction.is_valid():
                    error_msg = f"Block #{index}, Transaction #{tx_index}: Invalid signature"
                    if not quiet:
                        print(error_msg)
                    return False, error_msg

                ok, error_msg = _apply_transaction_to_balances(
                    transaction,
                    running_balances,
                )
                if not ok:
                    error_msg = f"Block #{index}, Transaction #{tx_index}: {error_msg}"
                    if not quiet:
                        print(error_msg)
                    return False, error_msg

            if not quiet:
                print(f"✓ Block #{index}: Valid (hash={current_block.hash[:16]}...)")

        if not quiet:
            print(f"\n✓ Blockchain is valid! All {len(self.chain)} blocks verified.\n")
        return True, ""

    def replace_chain_if_longer(self, candidate_chain: List[Block]) -> Tuple[bool, str]:
        if len(candidate_chain) <= len(self.chain):
            return False, "Candidate chain is not longer than the local chain"

        previous_chain = self.chain
        previous_mempool = self.mempool
        previous_dirty = self._balances_dirty

        self.chain = candidate_chain
        self.mempool.clear()
        self._mark_balances_dirty()

        is_valid, error = self.is_chain_valid(quiet=True)
        if not is_valid:
            self.chain = previous_chain
            self.mempool = previous_mempool
            self._balances_dirty = previous_dirty
            return False, error or "Candidate chain failed validation"

        self._notify_change()
        return True, f"Replaced local chain with {len(candidate_chain)} blocks"

    def get_chain_length(self) -> int:
        return len(self.chain)

    def get_pending_transaction_count(self) -> int:
        return len(self.mempool)

    def get_total_transaction_count(self) -> int:
        return sum(len(block.transactions) for block in self.chain)

    def __repr__(self) -> str:
        return (
            f"Blockchain(blocks={len(self.chain)}, "
            f"pending_txs={len(self.mempool)}, "
            f"difficulty={self.difficulty})"
        )
