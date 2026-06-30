"""Aggregated metrics for the analytics dashboard."""

import json
import time
from collections import defaultdict
from typing import TYPE_CHECKING, Any, Dict, List

from ..network.sync import ChainSynchronizer
from ..serialization import chain_to_dict
from ..utils import format_hash_display

if TYPE_CHECKING:
    from .blockchain_service import BlockchainService
    from .sync_service import SyncService
    from .wallet_service import WalletService


class AnalyticsService:
    """Computes network, chain, and miner analytics."""

    def __init__(
        self,
        blockchain_service: "BlockchainService",
        wallet_service: "WalletService",
        sync_service: "SyncService",
        server_started_at: float,
    ) -> None:
        self.blockchain_service = blockchain_service
        self.wallet_service = wallet_service
        self.sync_service = sync_service
        self.server_started_at = server_started_at
        self._synchronizer = ChainSynchronizer()

    def _estimate_storage_bytes(self, blocks: List[Any]) -> int:
        payload = json.dumps(chain_to_dict(blocks))
        return len(payload.encode("utf-8"))

    def _miner_stats(self, blocks: List[Any]) -> List[Dict[str, Any]]:
        counts: dict[str, int] = defaultdict(int)
        rewards: dict[str, float] = defaultdict(float)

        for block in blocks:
            miner = None
            block_reward = 0.0
            for tx in getattr(block, "transactions", []):
                if tx.sender == "SYSTEM":
                    miner = tx.receiver
                    block_reward += tx.amount
            if miner:
                counts[miner] += 1
                rewards[miner] += block_reward

        wallet_names = self.wallet_service.wallet_names
        leaderboard = []
        for address, mined in sorted(counts.items(), key=lambda item: item[1], reverse=True):
            wallet_name = wallet_names.get(address)
            leaderboard.append(
                {
                    "address": address,
                    "name": wallet_name or format_hash_display(address, 8),
                    "label": format_hash_display(address, 8),
                    "blocks_mined": mined,
                    "total_rewards": rewards[address],
                }
            )
        return leaderboard

    def _peer_metrics(self, local_length: int) -> Dict[str, Any]:
        peers = self.sync_service.list_peers()
        reachable = 0
        longest_peer = local_length

        for peer in peers:
            status = self._synchronizer.fetch_peer_status(peer)
            if status is None:
                continue
            reachable += 1
            peer_length = int(status.get("chain_length", 0))
            longest_peer = max(longest_peer, peer_length)

        if not peers:
            sync_progress = 100.0
        elif longest_peer <= local_length:
            sync_progress = 100.0
        else:
            sync_progress = round(min(100.0, (local_length / longest_peer) * 100), 1)

        return {
            "peer_count": len(peers),
            "reachable_peers": reachable,
            "longest_peer_chain": longest_peer,
            "sync_progress_percent": sync_progress,
            "peers": peers,
        }

    def get_analytics(self) -> Dict[str, Any]:
        blockchain = self.blockchain_service.blockchain
        blocks = blockchain.chain
        is_valid, _ = blockchain.is_chain_valid(quiet=True)
        local_length = len(blocks)
        chain_height = blocks[-1].index if blocks else 0

        block_labels: List[str] = []
        block_times: List[float] = []
        tx_counts: List[int] = []
        hash_rates: List[float] = []
        rewards_per_block: List[float] = []
        cumulative_txs: List[int] = []
        running_tx_total = 0

        for index, block in enumerate(blocks):
            block_labels.append(f"#{block.index}")
            tx_count = len(block.transactions)
            tx_counts.append(tx_count)
            running_tx_total += tx_count
            cumulative_txs.append(running_tx_total)

            reward = sum(
                tx.amount for tx in block.transactions if tx.sender == "SYSTEM"
            )
            rewards_per_block.append(reward)

            if index == 0:
                block_times.append(0.0)
            else:
                block_times.append(max(0.0, block.timestamp - blocks[index - 1].timestamp))

            attempts = float(getattr(block, "hash_attempts", 0))
            mining_time = float(getattr(block, "mining_time", 0.0))
            hash_rates.append(
                round(attempts / max(mining_time, 0.001), 2) if index > 0 else 0.0
            )

        average_block_time = (
            sum(block_times[1:]) / len(block_times[1:])
            if len(block_times) > 1
            else 0.0
        )

        total_transactions = sum(tx_counts)
        blocks_with_txs = max(local_length - 1, 1)
        throughput = round(total_transactions / blocks_with_txs, 2)

        last_block = blocks[-1] if blocks else None
        last_hash_rate = hash_rates[-1] if hash_rates else 0.0
        total_rewards = sum(rewards_per_block)

        peer_metrics = self._peer_metrics(local_length)
        storage_bytes = self._estimate_storage_bytes(blocks)
        uptime = max(0.0, time.time() - self.server_started_at)

        health = "healthy"
        if not is_valid:
            health = "degraded"
        elif peer_metrics["peer_count"] > 0 and peer_metrics["reachable_peers"] == 0:
            health = "degraded"
        elif peer_metrics["sync_progress_percent"] < 100:
            health = "syncing"

        return {
            "summary": {
                "total_blocks": local_length,
                "chain_height": chain_height,
                "average_block_time": round(average_block_time, 2),
                "transaction_throughput": throughput,
                "pending_transactions": len(blockchain.mempool),
                "wallet_count": len(self.wallet_service.wallets),
                "peer_count": peer_metrics["peer_count"],
                "reachable_peers": peer_metrics["reachable_peers"],
                "network_health": health,
                "chain_valid": is_valid,
                "difficulty": blockchain.difficulty,
                "estimated_hash_rate": last_hash_rate,
                "total_fees_rewards": total_rewards,
                "storage_bytes": storage_bytes,
                "storage_kb": round(storage_bytes / 1024, 2),
                "node_uptime_seconds": round(uptime, 1),
                "sync_progress_percent": peer_metrics["sync_progress_percent"],
                "longest_peer_chain": peer_metrics["longest_peer_chain"],
                "mining_reward": blockchain.mining_reward,
            },
            "timeseries": {
                "block_labels": block_labels,
                "block_times": [round(v, 2) for v in block_times],
                "tx_counts": tx_counts,
                "cumulative_txs": cumulative_txs,
                "hash_rates": hash_rates,
                "rewards_per_block": rewards_per_block,
            },
            "miners": self._miner_stats(blocks),
            "peers": peer_metrics["peers"],
        }
