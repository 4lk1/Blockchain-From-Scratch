"""Transaction creation and pending pool access."""

from typing import TYPE_CHECKING, Any, Dict, List

from ..transaction import Transaction
from ..utils import logger, validate_address, validate_amount

if TYPE_CHECKING:
    from .blockchain_service import BlockchainService
    from .wallet_service import WalletService


class TransactionService:
    """Service for transaction management."""

    def __init__(
        self,
        blockchain_service: "BlockchainService",
        wallet_service: "WalletService",
    ) -> None:
        self.blockchain_service = blockchain_service
        self.wallet_service = wallet_service
        self.logger = logger

    def _pending_outgoing(self, sender_address: str) -> float:
        return self.blockchain_service.blockchain.mempool.pending_outgoing(sender_address)

    def create_transaction(
        self,
        sender_address: str,
        receiver_address: str,
        amount: float,
    ) -> Dict[str, Any]:
        if not validate_address(sender_address):
            raise ValueError("Invalid sender address")
        if not validate_address(receiver_address):
            raise ValueError("Invalid receiver address")
        if not validate_amount(amount):
            raise ValueError("Amount must be positive")

        sender_wallet = self.wallet_service.get_wallet(sender_address)
        if not sender_wallet:
            raise ValueError(f"Sender wallet not found: {sender_address}")

        if not self.wallet_service.validate_wallet_exists(receiver_address):
            raise ValueError(f"Receiver wallet not found: {receiver_address}")

        available_balance = (
            self.wallet_service.get_wallet_balance(sender_address)
            - self._pending_outgoing(sender_address)
        )
        if available_balance < amount:
            raise ValueError(
                f"Insufficient available balance. Have {available_balance}, need {amount}"
            )

        tx = Transaction(sender_address, receiver_address, amount)
        tx.sign_transaction(sender_wallet)

        if not self.blockchain_service.blockchain.add_transaction(tx):
            raise ValueError("Transaction rejected: invalid or duplicate transaction")

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

    def get_pending_transactions(self) -> List[Dict[str, Any]]:
        transactions: List[Dict[str, Any]] = []
        for tx in self.blockchain_service.blockchain.mempool.list_transactions():
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
