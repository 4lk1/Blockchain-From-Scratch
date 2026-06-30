"""
Blockchain validation helpers.

Assumptions:
- Account-based balances (not UTXO).
- SYSTEM transactions mint rewards without signatures.
- Float amounts are compared with a small epsilon.
"""

from typing import Dict, Tuple

from .config import CONFIG
from .transaction import Transaction
from .utils import verify_proof_of_work

BALANCE_EPSILON = 1e-9


def _apply_transaction_to_balances(
    tx: Transaction,
    balances: Dict[str, float],
) -> Tuple[bool, str]:
    if tx.sender == CONFIG.system_wallet_name:
        if tx.amount < 0:
            return False, "SYSTEM transaction amount must be non-negative"
        balances[tx.receiver] = balances.get(tx.receiver, 0.0) + tx.amount
        return True, ""

    if tx.amount <= 0:
        return False, "Transaction amount must be positive"

    sender_balance = balances.get(tx.sender, 0.0)
    if sender_balance + BALANCE_EPSILON < tx.amount:
        return False, f"Insufficient balance for {tx.sender}"

    balances[tx.sender] = sender_balance - tx.amount
    balances[tx.receiver] = balances.get(tx.receiver, 0.0) + tx.amount
    return True, ""


def validate_block_economics(
    transactions: list[Transaction],
    initial_balances: Dict[str, float] | None = None,
) -> Tuple[bool, str]:
    """Replay transactions and ensure balances never go negative."""
    balances = dict(initial_balances or {})

    for index, tx in enumerate(transactions):
        ok, message = _apply_transaction_to_balances(tx, balances)
        if not ok:
            return False, f"Transaction #{index}: {message}"

    return True, ""


def validate_block_structure(
    block_index: int,
    expected_index: int,
    previous_hash: str,
    expected_previous_hash: str,
    block_hash: str,
    recalculated_hash: str,
    difficulty: int,
) -> Tuple[bool, str]:
    if block_index != expected_index:
        return False, (
            f"Block index mismatch: expected {expected_index}, got {block_index}"
        )

    if block_index == 0 and previous_hash != "0":
        return False, "Genesis block must have previous_hash '0'"

    if block_index > 0 and previous_hash != expected_previous_hash:
        return False, "Previous hash link is broken"

    if block_hash != recalculated_hash:
        return False, "Block hash does not match payload"

    if not verify_proof_of_work(block_hash, difficulty):
        return False, "Invalid Proof-of-Work"

    return True, ""
