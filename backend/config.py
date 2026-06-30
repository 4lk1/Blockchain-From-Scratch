"""
Application-wide blockchain configuration.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict

from .settings import SETTINGS


@dataclass(frozen=True)
class BlockchainConfig:
    """Immutable defaults for the simulator."""

    initial_difficulty: int = 3
    mining_reward: float = 10.0
    max_difficulty: int = 7
    min_difficulty: int = 1
    max_block_size: int = 1000
    max_mempool_size: int = 500
    transaction_timeout: float = 3600.0
    block_target_time: float = 2.5
    system_wallet: str = "0x0"
    system_wallet_name: str = "SYSTEM"
    persistence_enabled: bool = True
    data_dir: Path = Path("data")
    peer_sync_timeout: float = 5.0
    max_peer_count: int = 20


def _config_from_settings() -> BlockchainConfig:
    return BlockchainConfig(
        initial_difficulty=SETTINGS.initial_difficulty,
        mining_reward=SETTINGS.mining_reward,
        max_difficulty=SETTINGS.max_difficulty,
        min_difficulty=SETTINGS.min_difficulty,
        max_block_size=SETTINGS.max_block_size,
        max_mempool_size=SETTINGS.max_mempool_size,
        transaction_timeout=SETTINGS.transaction_timeout,
        block_target_time=SETTINGS.block_target_time,
        system_wallet=SETTINGS.system_wallet,
        system_wallet_name=SETTINGS.system_wallet_name,
        persistence_enabled=SETTINGS.persistence_enabled,
        data_dir=SETTINGS.data_dir,
        peer_sync_timeout=SETTINGS.peer_sync_timeout,
        max_peer_count=SETTINGS.max_peer_count,
    )


CONFIG = _config_from_settings()


def get_config() -> Dict[str, Any]:
    """Return configuration as a plain dictionary (safe for public API)."""
    return {
        "initial_difficulty": CONFIG.initial_difficulty,
        "mining_reward": CONFIG.mining_reward,
        "max_difficulty": CONFIG.max_difficulty,
        "min_difficulty": CONFIG.min_difficulty,
        "max_block_size": CONFIG.max_block_size,
        "block_target_time": CONFIG.block_target_time,
        "system_wallet": CONFIG.system_wallet,
        "persistence_enabled": CONFIG.persistence_enabled,
        "data_dir": str(CONFIG.data_dir),
        "max_mempool_size": CONFIG.max_mempool_size,
        "debug": SETTINGS.debug,
        "log_level": SETTINGS.log_level,
    }
