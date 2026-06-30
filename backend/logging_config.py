"""Central logging configuration for the blockchain backend."""

import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any

from .settings import SETTINGS


class JsonFormatter(logging.Formatter):
    """Structured JSON log lines for production-style aggregation."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        for key in ("request_id", "method", "path", "status_code", "duration_ms"):
            if hasattr(record, key):
                payload[key] = getattr(record, key)
        return json.dumps(payload, default=str)


def configure_logging() -> logging.Logger:
    """Configure the root blockchain logger once and return it."""
    logger = logging.getLogger("blockchain")
    level = getattr(logging, SETTINGS.log_level.upper(), logging.INFO)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        if SETTINGS.log_format.lower() == "json":
            handler.setFormatter(JsonFormatter())
        else:
            handler.setFormatter(
                logging.Formatter(
                    "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
                    datefmt="%Y-%m-%d %H:%M:%S",
                )
            )
        logger.addHandler(handler)
        logger.setLevel(level)
        logger.propagate = False

    if SETTINGS.debug:
        logging.getLogger("uvicorn.access").setLevel(logging.INFO)
        logger.debug("Debug mode enabled (CHAIN_DEBUG=true)")

    return logger


def get_logger(name: str = "blockchain") -> logging.Logger:
    """Return a named child logger under the blockchain namespace."""
    return logging.getLogger(name if name.startswith("blockchain") else f"blockchain.{name}")
