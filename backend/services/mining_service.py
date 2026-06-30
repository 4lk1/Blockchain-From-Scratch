"""Block mining operations."""

from typing import TYPE_CHECKING, Any, Dict

from ..miner import Miner
from ..utils import get_current_timestamp, logger

if TYPE_CHECKING:
    from .blockchain_service import BlockchainService
    from .wallet_service import WalletService


class MiningService:
    """Service for mining operations."""

    def __init__(
        self,
        blockchain_service: "BlockchainService",
        wallet_service: "WalletService",
    ) -> None:
        self.blockchain_service = blockchain_service
        self.wallet_service = wallet_service
        self.logger = logger

    def mine_block(self, miner_address: str) -> Dict[str, Any]:
        if not self.wallet_service.validate_wallet_exists(miner_address):
            raise ValueError(f"Miner wallet not found: {miner_address}")

        blockchain = self.blockchain_service.blockchain
        miner = Miner(miner_address)

        start_time = get_current_timestamp()
        block = miner.mine_block(blockchain)
        mining_time = get_current_timestamp() - start_time

        if block is None:
            raise ValueError("Mining failed")

        self.logger.info(
            f"Mined block #{block.index} in {mining_time:.2f}s "
            f"with nonce {block.nonce}"
        )

        return {
            "block": {
                "index": block.index,
                "hash": block.hash,
                "nonce": block.nonce,
                "transactions": len(block.transactions),
                "mining_time": mining_time,
                "difficulty": getattr(block, "difficulty", blockchain.difficulty),
            }
        }
