"""
Data models and schemas for the blockchain API.

This module contains Pydantic models for request/response validation,
type safety, and automatic API documentation.
"""

from dataclasses import dataclass
from typing import List, Optional

from pydantic import BaseModel, Field


# ============================================================================
# Request Models
# ============================================================================


class CreateWalletRequest(BaseModel):
    """Schema for wallet creation request."""

    name: str = Field(..., min_length=1, max_length=50, description="Wallet name")


class CreateTransactionRequest(BaseModel):
    """Schema for transaction creation request."""

    sender_address: str = Field(..., description="Sender wallet address")
    receiver_address: str = Field(..., description="Receiver wallet address")
    amount: float = Field(..., gt=0, description="Transaction amount")


class MineBlockRequest(BaseModel):
    """Schema for mining a block request."""

    miner_address: str = Field(..., description="Miner wallet address")


class SetDifficultyRequest(BaseModel):
    """Schema for setting mining difficulty."""

    difficulty: int = Field(
        ...,
        ge=1,
        description="New mining difficulty (number of leading zeros)",
    )


class TamperBlockRequest(BaseModel):
    """Schema for tampering with a block (demo purposes)."""

    block_index: int = Field(..., ge=0, description="Block index to tamper with")
    transaction_index: int = Field(..., ge=0, description="Transaction index within block")
    new_amount: float = Field(..., gt=0, description="New transaction amount")


class Attack51Request(BaseModel):
    """Schema for 51% attack simulation."""

    pass  # No parameters needed - uses system defaults


class RegisterPeerRequest(BaseModel):
    """Schema for registering a peer node URL."""

    peer_url: str = Field(..., min_length=8, description="Base URL of a peer node")


class SyncResponse(BaseModel):
    """Response model for peer synchronization."""

    success: bool
    message: str
    local_chain_length: int
    source_peer: Optional[str] = None


class MinerStatResponse(BaseModel):
    """Miner leaderboard entry."""

    address: str
    name: str
    label: str
    blocks_mined: int
    total_rewards: float


class AnalyticsSummaryResponse(BaseModel):
    """High-level analytics KPIs."""

    total_blocks: int
    chain_height: int
    average_block_time: float
    transaction_throughput: float
    pending_transactions: int
    wallet_count: int
    peer_count: int
    reachable_peers: int
    network_health: str
    chain_valid: bool
    difficulty: int
    estimated_hash_rate: float
    total_fees_rewards: float
    storage_bytes: int
    storage_kb: float
    node_uptime_seconds: float
    sync_progress_percent: float
    longest_peer_chain: int
    mining_reward: float


class AnalyticsTimeseriesResponse(BaseModel):
    """Chart-ready time series."""

    block_labels: List[str]
    block_times: List[float]
    tx_counts: List[int]
    cumulative_txs: List[int]
    hash_rates: List[float]
    rewards_per_block: List[float]


class AnalyticsResponse(BaseModel):
    """Full analytics payload for dashboard charts."""

    summary: AnalyticsSummaryResponse
    timeseries: AnalyticsTimeseriesResponse
    miners: List[MinerStatResponse]
    peers: List[str]


# ============================================================================
# Response Models
# ============================================================================


class TransactionResponse(BaseModel):
    """Response model for a transaction."""

    sender: str
    receiver: str
    amount: float
    timestamp: float
    signature: str
    is_valid: bool

    class Config:
        json_schema_extra = {
            "example": {
                "sender": "0x1234...",
                "receiver": "0x5678...",
                "amount": 50.0,
                "timestamp": 1234567890.0,
                "signature": "sig...",
                "is_valid": True,
            }
        }


class BlockResponse(BaseModel):
    """Response model for a block."""

    index: int
    timestamp: float
    transactions: List[TransactionResponse]
    previous_hash: str
    hash: str
    nonce: int
    difficulty: int
    miner_address: Optional[str] = None
    mining_time: Optional[float] = None

    class Config:
        json_schema_extra = {
            "example": {
                "index": 1,
                "timestamp": 1234567890.0,
                "transactions": [],
                "previous_hash": "abc123...",
                "hash": "def456...",
                "nonce": 12345,
                "difficulty": 3,
                "miner_address": "0x1234...",
                "mining_time": 2.5,
            }
        }


class WalletResponse(BaseModel):
    """Response model for a wallet."""

    address: str
    name: str
    balance: float
    public_key: str
    transactions_sent: int = 0
    transactions_received: int = 0

    class Config:
        json_schema_extra = {
            "example": {
                "address": "0x1234...",
                "name": "Alice",
                "balance": 100.0,
                "public_key": "pk...",
                "transactions_sent": 5,
                "transactions_received": 3,
            }
        }


class ChainValidationResponse(BaseModel):
    """Response model for chain validation."""

    is_valid: bool
    chain_length: int
    total_blocks: Optional[int] = None
    total_transactions: int = 0
    error_message: Optional[str] = None
    invalid_blocks: List[dict] = Field(default_factory=list)

    class Config:
        json_schema_extra = {
            "example": {
                "is_valid": True,
                "chain_length": 5,
                "total_blocks": 5,
                "error_message": None,
                "invalid_blocks": [],
            }
        }

    def __init__(self, **data):
        super().__init__(**data)
        # Set total_blocks to chain_length if not provided
        if self.total_blocks is None:
            self.total_blocks = self.chain_length


class BlockchainStatsResponse(BaseModel):
    """Response model for blockchain statistics."""

    total_blocks: int
    total_transactions: int
    total_wallets: int
    pending_transactions: int
    mining_difficulty: int
    difficulty: int
    mining_reward: float
    chain_valid: bool
    is_valid: bool
    total_value: float
    average_block_time: float
    nonce: int = 0
    hash_attempts: int = 0
    mining_time: float = 0.0

    class Config:
        json_schema_extra = {
            "example": {
                "total_blocks": 5,
                "total_transactions": 12,
                "total_wallets": 3,
                "pending_transactions": 2,
                "mining_difficulty": 3,
                "mining_reward": 10.0,
                "chain_valid": True,
                "total_value": 500.0,
                "average_block_time": 2.5,
            }
        }


class BlockchainStatusResponse(BaseModel):
    """Response model for blockchain status."""

    is_valid: bool
    chain_length: int
    pending_transactions: int
    last_block_hash: Optional[str] = None
    last_block_index: Optional[int] = None
    error_message: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "is_valid": True,
                "chain_length": 5,
                "pending_transactions": 2,
                "last_block_hash": "abc123...",
                "last_block_index": 4,
                "error_message": None,
            }
        }


class TamperResultResponse(BaseModel):
    """Response model for tampering result."""

    before: dict
    after: dict
    chain_valid: bool
    error_message: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "before": {"amount": 50.0, "hash": "abc123..."},
                "after": {"amount": 100.0, "hash": "def456..."},
                "chain_valid": False,
                "error_message": "Hash mismatch",
            }
        }


class Attack51ResultResponse(BaseModel):
    """Response model for 51% attack simulation."""

    attacker_address: str
    victim_address: str
    public_chain_length: int
    attacker_chain_length: int
    initial_victim_balance: float
    final_victim_balance: float
    initial_attacker_balance: float
    final_attacker_balance: float
    double_spend_amount: float
    success: bool

    class Config:
        json_schema_extra = {
            "example": {
                "attacker_address": "0xattacker...",
                "victim_address": "0xvictim...",
                "public_chain_length": 5,
                "attacker_chain_length": 7,
                "initial_victim_balance": 100.0,
                "final_victim_balance": 80.0,
                "initial_attacker_balance": 50.0,
                "final_attacker_balance": 60.0,
                "double_spend_amount": 20.0,
                "success": True,
            }
        }


class HealthResponse(BaseModel):
    """Response model for health check."""

    status: str
    version: str
    timestamp: float
    uptime_seconds: float = 0.0
    server_started_at: float = 0.0

    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "version": "2.0.0",
                "timestamp": 1234567890.0,
            }
        }


# ============================================================================
# Internal Data Classes (non-Pydantic, used in services)
# ============================================================================

@dataclass
class MiningResult:
    """Result of a mining operation."""

    block_index: int
    hash: str
    nonce: int
    mining_time: float
    difficulty: int
    transaction_count: int


@dataclass
class ValidationResult:
    """Result of chain validation."""

    is_valid: bool
    chain_length: int
    error_message: Optional[str] = None
    invalid_blocks: Optional[List[dict]] = None


@dataclass
class AttackResult:
    """Result of a 51% attack simulation."""

    success: bool
    attacker_won: bool
    public_chain_length: int
    attacker_chain_length: int
    double_spend_successful: bool
    details: dict
