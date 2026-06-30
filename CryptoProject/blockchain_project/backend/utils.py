"""
Utility functions and helpers for the blockchain backend.

This module contains helper functions for:
- Logging configuration
- Error handling
- Data validation
- Conversion utilities
"""

import logging
import hashlib
import time
from typing import Optional, Dict, Any
from datetime import datetime


# ============================================================================
# Logging Setup
# ============================================================================


def setup_logging(level: str = "INFO") -> logging.Logger:
    """
    Configure logging for the blockchain backend.

    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger("blockchain")

    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(level)
        logger.propagate = False

    return logger


logger = setup_logging()


# ============================================================================
# Hash Utilities
# ============================================================================


def calculate_hash(data: str) -> str:
    """
    Calculate SHA-256 hash of data.

    Args:
        data: String data to hash

    Returns:
        Hexadecimal hash string
    """
    return hashlib.sha256(data.encode()).hexdigest()


def verify_hash(data: str, hash_value: str) -> bool:
    """
    Verify that data matches the given hash.

    Args:
        data: Original data
        hash_value: Hash to verify against

    Returns:
        True if hash matches, False otherwise
    """
    return calculate_hash(data) == hash_value


# ============================================================================
# Block Utilities
# ============================================================================


def format_hash_display(hash_value: str, length: int = 8) -> str:
    """
    Format hash for display (first N characters + ...).

    Args:
        hash_value: Full hash string
        length: Number of characters to display

    Returns:
        Formatted hash string
    """
    if len(hash_value) <= length:
        return hash_value
    return f"{hash_value[:length]}..."


def is_valid_hash(hash_value: str) -> bool:
    """
    Validate that a string is a valid SHA-256 hash.

    Args:
        hash_value: Hash string to validate

    Returns:
        True if valid hex string of length 64, False otherwise
    """
    if not isinstance(hash_value, str):
        return False
    if len(hash_value) != 64:
        return False
    try:
        int(hash_value, 16)
        return True
    except ValueError:
        return False


# ============================================================================
# Nonce Utilities
# ============================================================================


def verify_proof_of_work(
    hash_value: str,
    difficulty: int,
) -> bool:
    """
    Verify that a hash meets the proof-of-work difficulty.

    Args:
        hash_value: Hash to verify
        difficulty: Required leading zeros

    Returns:
        True if hash has required leading zeros, False otherwise
    """
    return hash_value.startswith("0" * difficulty)


def get_difficulty_string(difficulty: int) -> str:
    """Get the difficulty requirement as a string of zeros."""
    return "0" * difficulty


# ============================================================================
# Time Utilities
# ============================================================================


def get_current_timestamp() -> float:
    """Get current Unix timestamp."""
    return time.time()


def format_timestamp(timestamp: float) -> str:
    """
    Format Unix timestamp for display.

    Args:
        timestamp: Unix timestamp

    Returns:
        Formatted datetime string
    """
    return datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")


def calculate_time_duration(start_time: float, end_time: float) -> float:
    """Calculate duration between two timestamps."""
    return max(0, end_time - start_time)


# ============================================================================
# Validation Utilities
# ============================================================================

class ValidationError(Exception):
    """Custom exception for validation errors."""

    pass


def validate_address(address: str) -> bool:
    """
    Validate that a string is a valid wallet address.

    Args:
        address: Address string to validate

    Returns:
        True if valid hex string, False otherwise
    """
    if not isinstance(address, str) or len(address) == 0:
        return False
    try:
        int(address, 16)
        return True
    except ValueError:
        return False


def validate_amount(amount: float) -> bool:
    """
    Validate that an amount is positive.

    Args:
        amount: Amount to validate

    Returns:
        True if positive number, False otherwise
    """
    try:
        return float(amount) > 0
    except (ValueError, TypeError):
        return False


# ============================================================================
# Serialization Utilities
# ============================================================================


def serialize_transaction(tx: Any) -> Dict[str, Any]:
    """
    Serialize a transaction object to dictionary.

    Args:
        tx: Transaction object

    Returns:
        Dictionary representation of transaction
    """
    return {
        "sender": tx.sender,
        "receiver": tx.receiver,
        "amount": tx.amount,
        "timestamp": tx.timestamp,
        "signature": tx.signature,
        "is_valid": tx.is_valid(),
    }


def serialize_block(block: Any) -> Dict[str, Any]:
    """
    Serialize a block object to dictionary.

    Args:
        block: Block object

    Returns:
        Dictionary representation of block
    """
    # Attempt to detect miner (reward transaction from SYSTEM)
    miner_address = None
    for tx in getattr(block, "transactions", []):
        try:
            if tx.sender == "SYSTEM":
                miner_address = tx.receiver
                break
        except Exception:
            continue

    total_value = sum(
        getattr(tx, "amount", 0)
        for tx in getattr(block, "transactions", [])
    )

    return {
        "index": block.index,
        "timestamp": block.timestamp,
        "transactions": [serialize_transaction(tx) for tx in block.transactions],
        "previous_hash": block.previous_hash,
        "hash": block.hash,
        "nonce": block.nonce,
        "transaction_count": len(block.transactions),
        "total_value": total_value,
        "miner_address": miner_address,
        "difficulty": getattr(block, "difficulty", None),
    }


# ============================================================================
# Configuration Utilities
# ============================================================================

class Config:
    """Blockchain configuration."""

    # Mining parameters
    INITIAL_DIFFICULTY: int = 3
    MINING_REWARD: float = 10.0
    MAX_DIFFICULTY: int = 7
    MIN_DIFFICULTY: int = 1

    # Validation parameters
    MAX_BLOCK_SIZE: int = 1000  # Maximum transactions per block
    TRANSACTION_TIMEOUT: float = 3600  # 1 hour

    # Network parameters
    BLOCK_TARGET_TIME: float = 2.5  # Seconds (for difficulty adjustment)

    # System addresses
    SYSTEM_WALLET: str = "0x0"
    SYSTEM_WALLET_NAME: str = "SYSTEM"


def get_config() -> Dict[str, Any]:
    """Get blockchain configuration as dictionary."""
    return {
        "initial_difficulty": Config.INITIAL_DIFFICULTY,
        "mining_reward": Config.MINING_REWARD,
        "max_difficulty": Config.MAX_DIFFICULTY,
        "min_difficulty": Config.MIN_DIFFICULTY,
        "max_block_size": Config.MAX_BLOCK_SIZE,
        "block_target_time": Config.BLOCK_TARGET_TIME,
        "system_wallet": Config.SYSTEM_WALLET,
    }


# ============================================================================
# Error Response Utilities
# ============================================================================


def create_error_response(
    message: str,
    error_code: str = "UNKNOWN_ERROR",
    details: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Create a standardized error response.

    Args:
        message: Error message
        error_code: Error code identifier
        details: Additional error details

    Returns:
        Error response dictionary
    """
    response = {
        "error": {
            "message": message,
            "code": error_code,
            "timestamp": get_current_timestamp(),
        }
    }

    if details:
        response["error"]["details"] = details

    return response


# ============================================================================
# Type Conversion Utilities
# ============================================================================

def safe_float(value: Any, default: float = 0.0) -> float:
    """Safely convert value to float."""
    try:
        return float(value)
    except (ValueError, TypeError):
        return default


def safe_int(value: Any, default: int = 0) -> int:
    """Safely convert value to int."""
    try:
        return int(value)
    except (ValueError, TypeError):
        return default
