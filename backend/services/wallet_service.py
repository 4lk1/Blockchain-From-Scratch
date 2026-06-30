"""Wallet creation, lookup, and encrypted persistence."""

from typing import TYPE_CHECKING, Dict, List, Optional

from ..persistence.wallet_store import WalletStore
from ..utils import logger
from ..wallet import Wallet

if TYPE_CHECKING:
    from .blockchain_service import BlockchainService


class WalletService:
    """Service for wallet management."""

    def __init__(
        self,
        blockchain_service: "BlockchainService",
        wallet_store: WalletStore | None = None,
    ) -> None:
        self._blockchain_service = blockchain_service
        self._wallet_store = wallet_store or WalletStore()
        self.wallets: Dict[str, Wallet] = {}
        self.wallet_names: Dict[str, str] = {}
        self.logger = logger
        self._load_wallets()

    def _load_wallets(self) -> None:
        wallets, names = self._wallet_store.load()
        self.wallets.update(wallets)
        self.wallet_names.update(names)

    def _persist_wallets(self) -> None:
        self._wallet_store.save(self.wallets, self.wallet_names)

    def create_wallet(self, name: str) -> Dict[str, Optional[str] | float]:
        wallet = Wallet()
        address = wallet.get_address()

        self.wallets[address] = wallet
        self.wallet_names[address] = name
        self._persist_wallets()

        self.logger.info(f"Created wallet '{name}' at address {address}")

        return {
            "address": address,
            "name": name,
            "public_key": (
                wallet.get_public_key().decode() if wallet.get_public_key() else None
            ),
            "balance": self.get_wallet_balance(address),
        }

    def get_wallet(self, address: str) -> Optional[Wallet]:
        return self.wallets.get(address)

    def get_wallet_balance(self, address: str) -> float:
        return self._blockchain_service.get_balance(address)

    def get_all_wallets(self) -> List[Dict[str, Optional[str] | float]]:
        wallets_list: List[Dict[str, Optional[str] | float]] = []
        for address, wallet in self.wallets.items():
            wallets_list.append(
                {
                    "address": address,
                    "name": self.wallet_names.get(address, "Unknown"),
                    "balance": self.get_wallet_balance(address),
                    "public_key": (
                        wallet.get_public_key().decode()
                        if wallet.get_public_key()
                        else None
                    ),
                }
            )
        return wallets_list

    def clear(self) -> None:
        self.wallets.clear()
        self.wallet_names.clear()
        self._persist_wallets()

    def validate_wallet_exists(self, address: str) -> bool:
        return address in self.wallets

    def get_wallet_by_name(self, name: str) -> Optional[Dict[str, Optional[str] | float]]:
        for address, wallet_name in self.wallet_names.items():
            if wallet_name == name:
                wallet = self.wallets.get(address)
                return {
                    "address": address,
                    "name": wallet_name,
                    "balance": self.get_wallet_balance(address),
                    "public_key": (
                        wallet.get_public_key().decode()
                        if wallet and wallet.get_public_key()
                        else None
                    ),
                }
        return None
