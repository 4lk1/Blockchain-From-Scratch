"""
Transaction and Digital Signature module.
Implements transactions with RSA digital signatures.
"""

import hashlib
import json
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend
from datetime import datetime


class Transaction:
    """Represents a transaction with digital signature."""
    
    def __init__(self, sender: str, receiver: str, amount: float, timestamp: str = None):
        """
        Initialize a transaction.
        
        Args:
            sender: Public key of sender (as string)
            receiver: Public key of receiver
            amount: Amount to transfer
            timestamp: Transaction time
        """
        self.sender = sender
        self.receiver = receiver
        self.amount = amount
        self.timestamp = timestamp or datetime.now().isoformat()
        self.signature = None
    
    def to_dict(self) -> dict:
        """Convert transaction to dictionary."""
        return {
            'sender': self.sender,
            'receiver': self.receiver,
            'amount': self.amount,
            'timestamp': self.timestamp
        }
    
    def calculate_transaction_hash(self) -> str:
        """Calculate hash of the transaction (without signature)."""
        tx_string = json.dumps(self.to_dict(), sort_keys=True)
        return hashlib.sha256(tx_string.encode()).hexdigest()
    
    def sign_transaction(self, private_key) -> None:
        """
        Sign the transaction with sender's private key.
        
        Args:
            private_key: RSA private key object
        """
        message = self.calculate_transaction_hash().encode()
        self.signature = private_key.sign(
            message,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
    
    def verify_signature(self, public_key) -> bool:
        """
        Verify the transaction signature.
        
        Args:
            public_key: RSA public key object of sender
            
        Returns:
            True if signature is valid, False otherwise
        """
        if self.signature is None:
            return False
        
        try:
            message = self.calculate_transaction_hash().encode()
            public_key.verify(
                self.signature,
                message,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            return True
        except Exception:
            return False
    
    def __repr__(self) -> str:
        return f"Transaction({self.sender[:8]}... -> {self.receiver[:8]}...: {self.amount})"


class Wallet:
    """Represents a user's wallet with public/private key pair."""
    
    def __init__(self):
        """Initialize a new wallet with RSA key pair."""
        self.private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        self.public_key = self.private_key.public_key()
    
    def get_public_key_string(self) -> str:
        """
        Get public key as string for use as address.
        
        Returns:
            PEM-encoded public key string (truncated for display)
        """
        public_pem = self.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode()
        # Return first 32 chars as simplified address
        return hashlib.sha256(public_pem.encode()).hexdigest()[:32]
    
    def create_transaction(self, receiver_address: str, amount: float) -> Transaction:
        """
        Create and sign a new transaction.
        
        Args:
            receiver_address: Receiver's public key address
            amount: Amount to send
            
        Returns:
            Signed transaction object
        """
        tx = Transaction(self.get_public_key_string(), receiver_address, amount)
        tx.sign_transaction(self.private_key)
        return tx
    
    def __repr__(self) -> str:
        return f"Wallet({self.get_public_key_string()[:8]}...)"
