"""
Transaction Module
Handles transaction creation, signing, and verification.
"""

from datetime import datetime
from typing import Optional

from .config import CONFIG
from .crypto.hashing import sha256_dict


class Transaction:
    """A signed value transfer between two addresses."""

    def __init__(self, sender: str, receiver: str, amount: float):
        self.sender = sender
        self.receiver = receiver
        self.amount = float(amount)
        self.timestamp = datetime.now().timestamp()
        self.signature: Optional[str] = None
        self.public_key: Optional[bytes] = None

    @property
    def transaction_id(self) -> str:
        """Stable identifier used for mempool deduplication."""
        return self.calculate_hash()

    def calculate_hash(self) -> str:
        """Hash of the unsigned transaction payload."""
        transaction_data = {
            "sender": self.sender,
            "receiver": self.receiver,
            "amount": self.amount,
            "timestamp": self.timestamp,
        }
        return sha256_dict(transaction_data, legacy=True)

    def sign_transaction(self, wallet) -> None:
        if self.sender != wallet.get_address():
            raise Exception("You cannot sign transactions from other wallets")

        transaction_hash = self.calculate_hash()
        self.signature = wallet.sign_transaction(transaction_hash)
        self.public_key = wallet.get_public_key()

    def is_valid(self) -> bool:
        if self.sender == CONFIG.system_wallet_name:
            return self.amount >= 0

        if self.amount <= 0:
            return False

        if self.sender == self.receiver:
            return False

        if self.signature is None or self.public_key is None:
            return False

        from .wallet import Wallet

        if not Wallet.address_matches_public_key(self.sender, self.public_key):
            return False

        transaction_hash = self.calculate_hash()
        try:
            return Wallet.verify_signature(
                transaction_hash,
                self.signature,
                self.public_key,
            )
        except Exception:
            return False

    def __repr__(self) -> str:
        return (
            f"Transaction({self.sender[:10]}...→{self.receiver[:10]}... "
            f"amount={self.amount} signed={self.signature is not None})"
        )

    def to_dict(self) -> dict:
        return {
            "sender": self.sender,
            "receiver": self.receiver,
            "amount": self.amount,
            "timestamp": self.timestamp,
            "signature": self.signature,
            "transaction_id": self.transaction_id,
            "public_key": self.public_key.decode() if self.public_key else None,
        }
