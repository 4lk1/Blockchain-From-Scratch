"""Serialize and deserialize core blockchain objects."""

from typing import Any, Dict, List

from .block import Block
from .transaction import Transaction


def transaction_to_dict(tx: Transaction) -> Dict[str, Any]:
    return tx.to_dict()


def transaction_from_dict(data: Dict[str, Any]) -> Transaction:
    tx = Transaction(data["sender"], data["receiver"], float(data["amount"]))
    tx.timestamp = float(data["timestamp"])
    tx.signature = data.get("signature")
    public_key = data.get("public_key")
    tx.public_key = public_key.encode("utf-8") if public_key else None
    return tx


def block_to_dict(block: Block) -> Dict[str, Any]:
    return {
        "index": block.index,
        "timestamp": block.timestamp,
        "transactions": [transaction_to_dict(tx) for tx in block.transactions],
        "previous_hash": block.previous_hash,
        "nonce": block.nonce,
        "hash": block.hash,
        "difficulty": getattr(block, "difficulty", 0),
        "hash_attempts": getattr(block, "hash_attempts", 0),
        "mining_time": getattr(block, "mining_time", 0.0),
    }


def block_from_dict(data: dict) -> Block:
    transactions = [transaction_from_dict(item) for item in data["transactions"]]
    block = Block.__new__(Block)
    block.index = int(data["index"])
    block.timestamp = float(data["timestamp"])
    block.transactions = transactions
    block.previous_hash = data["previous_hash"]
    block.nonce = int(data["nonce"])
    block.hash = data["hash"]
    block.difficulty = int(data.get("difficulty", 0))
    block.hash_attempts = int(data.get("hash_attempts", 0))
    block.mining_time = float(data.get("mining_time", 0.0))
    return block


def chain_to_dict(blocks: List[Block]) -> List[Dict[str, Any]]:
    return [block_to_dict(block) for block in blocks]


def chain_from_dict(items: List[Dict[str, Any]]) -> List[Block]:
    return [block_from_dict(item) for item in items]
