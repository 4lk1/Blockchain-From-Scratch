"""
Wallet Module
Handles wallet creation, key generation, and transaction signing using ECDSA.
"""

import ecdsa
import hashlib
from ecdsa.util import sigencode_string, sigdecode_string


class Wallet:
    """
    A wallet that generates and manages ECDSA key pairs.

    Attributes:
        private_key (SigningKey): ECDSA private key for signing
        public_key (VerifyingKey): ECDSA public key for verification
        address (str): Wallet address derived from public key hash
    """

    def __init__(self):
        """Initialize a new wallet with generated ECDSA key pair."""
        # Generate ECDSA key pair using NIST256p curve
        self.private_key = ecdsa.SigningKey.generate(
            curve=ecdsa.NIST256p,
            hashfunc=hashlib.sha256,
        )
        self.public_key = self.private_key.get_verifying_key()

        # Derive wallet address from public key hash
        self.address = self._derive_address()

    def _derive_address(self):
        """
        Derive wallet address from public key using SHA-256.

        Returns:
            str: Hexadecimal string of hashed public key (first 40 chars)
        """
        public_key_bytes = self.public_key.to_string()
        address_hash = hashlib.sha256(public_key_bytes).hexdigest()
        # Use first 40 characters for address (similar to Bitcoin)
        return address_hash[:40]

    @classmethod
    def from_private_key_pem(cls, private_key_pem: bytes) -> "Wallet":
        """Restore a wallet from an encrypted-at-rest private key."""
        wallet = cls.__new__(cls)
        wallet.private_key = ecdsa.SigningKey.from_pem(private_key_pem)
        wallet.public_key = wallet.private_key.get_verifying_key()
        wallet.address = wallet._derive_address()
        return wallet

    @staticmethod
    def address_from_public_key_pem(public_key_pem: bytes) -> str:
        public_key = ecdsa.VerifyingKey.from_pem(public_key_pem)
        public_key_bytes = public_key.to_string()
        address_hash = hashlib.sha256(public_key_bytes).hexdigest()
        return address_hash[:40]

    @staticmethod
    def address_matches_public_key(address: str, public_key_pem: bytes) -> bool:
        return address == Wallet.address_from_public_key_pem(public_key_pem)

    def get_address(self):
        """
        Get the wallet's public address.

        Returns:
            str: The wallet address
        """
        return self.address

    def get_public_key(self):
        """
        Get the wallet's public key in PEM format.

        Returns:
            bytes: Public key in PEM format
        """
        return self.public_key.to_pem()

    def get_private_key(self):
        """
        Get the wallet's private key in PEM format.

        WARNING: This should never be exposed in production!

        Returns:
            bytes: Private key in PEM format
        """
        return self.private_key.to_pem()

    def sign_transaction(self, transaction_hash):
        """
        Sign a transaction hash using the private key.

        Args:
            transaction_hash (str): Hexadecimal hash of the transaction

        Returns:
            str: Hexadecimal signature string
        """
        # Convert hash string to bytes
        hash_bytes = bytes.fromhex(transaction_hash)

        # Sign the hash using sign_digest_deterministic
        signature = self.private_key.sign_digest_deterministic(
            hash_bytes,
            hashfunc=hashlib.sha256,
            sigencode=sigencode_string,
        )

        # Return signature as hex string
        return signature.hex()

    @staticmethod
    def verify_signature(transaction_hash, signature_hex, public_key_pem):
        """
        Verify a transaction signature using a public key.

        Args:
            transaction_hash (str): Hexadecimal hash of the transaction
            signature_hex (str): Hexadecimal signature string
            public_key_pem (bytes): Public key in PEM format

        Returns:
            bool: True if signature is valid, False otherwise
        """
        try:
            # Reconstruct public key from PEM
            public_key = ecdsa.VerifyingKey.from_pem(public_key_pem)

            # Convert hash and signature to bytes
            hash_bytes = bytes.fromhex(transaction_hash)
            signature_bytes = bytes.fromhex(signature_hex)

            # Verify the signature
            public_key.verify_digest(
                signature_bytes,
                hash_bytes,
                sigdecode=sigdecode_string,
            )
            return True
        except ecdsa.BadSignatureError:
            return False
        except Exception:
            return False

    def __repr__(self):
        """String representation of wallet."""
        return f"Wallet(address={self.address[:10]}...)"
