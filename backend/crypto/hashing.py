"""
Deterministic hashing utilities.

Assumption: payloads are JSON-serializable dicts with stable key ordering.
"""

import hashlib
import json
from typing import Any


def canonical_json(payload: dict[str, Any]) -> str:
    """Serialize a dict to a deterministic JSON string for hashing."""
    return json.dumps(payload, sort_keys=True, separators=(",", ":"))


def stable_json(payload: dict[str, Any]) -> str:
    """
    Legacy-compatible JSON encoding used by block and transaction hashes.

    Keeps Phase 3 improvements backward-compatible with existing chains.
    """
    return json.dumps(payload, sort_keys=True)


def sha256_hex(data: str) -> str:
    """Return the SHA-256 hex digest of a UTF-8 string."""
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


def sha256_dict(payload: dict[str, Any], *, legacy: bool = False) -> str:
    """Hash a dictionary using deterministic JSON encoding."""
    encoded = stable_json(payload) if legacy else canonical_json(payload)
    return sha256_hex(encoded)
