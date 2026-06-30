"""
Environment-driven application settings.

Override via environment variables prefixed with CHAIN_ or a `.env` file
in the project root. Example: CHAIN_LOG_LEVEL=DEBUG CHAIN_DEBUG=true
"""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    """Runtime configuration loaded from environment."""

    model_config = SettingsConfigDict(
        env_prefix="CHAIN_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Server
    debug: bool = False
    log_level: str = "INFO"
    log_format: str = "text"  # text | json
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = "*"

    # Blockchain
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

    @property
    def cors_origin_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


SETTINGS = AppSettings()
