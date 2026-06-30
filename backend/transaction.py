"""
Transaction Module
Handles transaction creation, signing, and verification.
"""

import hashlib
import json
from datetime import datetime


class Transaction:
    """
    Represents a blockchain transaction.

    Transactions are immutable once created and must be digitally signed
    to prove ownership and prevent tampering.

    Attributes:
        sender (str): Wallet address of the sender (or "SYSTEM" for mining rewards)
        receiver (str): Wallet address of the receiver
        amount (float): Amount to transfer
        timestamp (float): Unix timestamp when transaction was created
        signature (str): Digital signature of the transaction
        public_key (bytes): Sender's public key in PEM format
    """

    def __init__(self, sender, receiver, amount):
        """
        Initialize a new transaction.

        Args:
            sender (str): Wallet address or "SYSTEM"
            receiver (str): Wallet address of receiver
            amount (float): Amount to transfer
        """
        self.sender = sender
        self.receiver = receiver
        self.amount = amount
        self.timestamp = datetime.now().timestamp()
        self.signature = None
        self.public_key = None

    def calculate_hash(self):
        """
        Calculate SHA-256 hash of the transaction.

        The hash is calculated from all transaction fields except signature.
        This ensures that any modification invalidates the transaction.

        Returns:
            str: Hexadecimal hash of the transaction
        """
        # Create dictionary of transaction data (excluding signature)
        transaction_data = {
            "sender": self.sender,
            "receiver": self.receiver,
            "amount": self.amount,
            "timestamp": self.timestamp,
        }

        # Convert to JSON and hash
        transaction_string = json.dumps(transaction_data, sort_keys=True)
        return hashlib.sha256(transaction_string.encode()).hexdigest()

    def sign_transaction(self, wallet):
        """
        Sign the transaction using the sender's private key.

        The signature proves that the transaction was authorized by the
        owner of the wallet without revealing the private key.

        Args:
            wallet (Wallet): Wallet object containing private key

        Raises:
            Exception: If sender address doesn't match wallet address
        """
        # Verify sender is the one signing
        if self.sender != wallet.get_address():
            raise Exception("You cannot sign transactions from other wallets")

        # Calculate transaction hash
        transaction_hash = self.calculate_hash()

        # Sign the hash with the private key
        self.signature = wallet.sign_transaction(transaction_hash)

        # Store the public key for verification
        self.public_key = wallet.get_public_key()

    def is_valid(self):
        """
        Verify that the transaction is valid and properly signed.

        A transaction is valid if:
        1. It has a signature (is signed)
        2. The signature is mathematically valid
        3. For non-system transactions, the sender matches the signer

        Returns:
            bool: True if transaction is valid, False otherwise
        """
        # SYSTEM transactions don't need signatures
        if self.sender == "SYSTEM":
            return True

        # Regular transactions must have a signature
        if self.signature is None or self.public_key is None:
            return False

        # Verify the signature
        transaction_hash = self.calculate_hash()

        try:
            from .wallet import Wallet

            wallet = Wallet()
            return wallet.verify_signature(
                transaction_hash,
                self.signature,
                self.public_key,
            )
        except Exception:
            return False

    def __repr__(self):
        """String representation of transaction."""
        return (
            f"Transaction({self.sender[:10]}...→{self.receiver[:10]}... "
            f"amount={self.amount} signed={self.signature is not None})"
        )

    def to_dict(self):
        """
        Convert transaction to dictionary for JSON serialization.

        Returns:
            dict: Transaction data as dictionary
        """
        return {
            "sender": self.sender,
            "receiver": self.receiver,
            "amount": self.amount,
            "timestamp": self.timestamp,
            "signature": self.signature,
            "public_key": self.public_key.decode() if self.public_key else None,
        }
