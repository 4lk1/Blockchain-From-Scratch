"""Wallet persistence with optional encryption at rest."""

import json
import os
from pathlib import Path
from typing import Dict, Tuple

from cryptography.fernet import Fernet, InvalidToken

from ..config import CONFIG
from ..utils import logger
from ..wallet import Wallet


class WalletStore:
    """
    Stores wallet private keys encrypted on disk.

    Assumption: this is an educational simulator; encryption protects casual
    disk access but the key file must still be guarded on the server.
    """

    def __init__(self, data_dir: Path | None = None) -> None:
        self.data_dir = data_dir or CONFIG.data_dir
        self.wallet_path = self.data_dir / "wallets.enc"
        self.key_path = self.data_dir / ".wallet_key"

    def _load_cipher(self) -> Fernet:
        key = os.environ.get("BLOCKCHAIN_WALLET_KEY")
        if key:
            return Fernet(key.encode("utf-8"))

        if self.key_path.exists():
            return Fernet(self.key_path.read_bytes())

        self.data_dir.mkdir(parents=True, exist_ok=True)
        generated = Fernet.generate_key()
        self.key_path.write_bytes(generated)
        os.chmod(self.key_path, 0o600)
        logger.warning(
            "Generated wallet encryption key at %s (set BLOCKCHAIN_WALLET_KEY in production)",
            self.key_path,
        )
        return Fernet(generated)

    def save(self, wallets: Dict[str, Wallet], wallet_names: Dict[str, str]) -> None:
        if not CONFIG.persistence_enabled:
            return

        payload = {
            "wallets": [
                {
                    "address": address,
                    "name": wallet_names.get(address, "Unknown"),
                    "private_key": wallet.get_private_key().decode("utf-8"),
                }
                for address, wallet in wallets.items()
            ]
        }
        cipher = self._load_cipher()
        token = cipher.encrypt(json.dumps(payload).encode("utf-8"))
        self.wallet_path.write_bytes(token)
        os.chmod(self.wallet_path, 0o600)

    def load(self) -> Tuple[Dict[str, Wallet], Dict[str, str]]:
        if not CONFIG.persistence_enabled or not self.wallet_path.exists():
            return {}, {}

        cipher = self._load_cipher()
        try:
            decrypted = cipher.decrypt(self.wallet_path.read_bytes())
        except InvalidToken:
            logger.error("Unable to decrypt wallet store; starting with empty wallets")
            return {}, {}

        payload = json.loads(decrypted.decode("utf-8"))
        wallets: Dict[str, Wallet] = {}
        names: Dict[str, str] = {}

        for item in payload.get("wallets", []):
            wallet = Wallet.from_private_key_pem(item["private_key"].encode("utf-8"))
            address = wallet.get_address()
            wallets[address] = wallet
            names[address] = item.get("name", "Unknown")

        return wallets, names
