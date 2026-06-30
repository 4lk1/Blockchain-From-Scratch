"""Attack simulation orchestration."""

from typing import TYPE_CHECKING, Any, Dict

from ..attack import Attack51Percent
from ..utils import logger

if TYPE_CHECKING:
    from .blockchain_service import BlockchainService
    from .wallet_service import WalletService


class AttackService:
    """Service for attack simulations."""

    def __init__(
        self,
        blockchain_service: "BlockchainService",
        wallet_service: "WalletService",
    ) -> None:
        self.blockchain_service = blockchain_service
        self.wallet_service = wallet_service
        self.logger = logger

    def simulate_51_percent_attack(self) -> Dict[str, Any]:
        attack = Attack51Percent(
            difficulty=self.blockchain_service.blockchain.difficulty
        )
        result = attack.execute_attack()

        self.logger.info(
            f"51% attack simulation completed: Success={result.get('success', False)}"
        )

        return result
