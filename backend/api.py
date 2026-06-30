"""
FastAPI Backend for Blockchain Simulator.

A production-quality REST API for blockchain operations with complete
separation of concerns, type safety, and comprehensive error handling.

API Documentation available at: /docs (Swagger UI) or /redoc (ReDoc)
"""

import time

from fastapi import Body, FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import CONFIG, get_config
from .exceptions import AppError
from .logging_config import configure_logging, get_logger
from .middleware import RequestLoggingMiddleware
from .settings import SETTINGS
from .models import (
    CreateWalletRequest,
    CreateTransactionRequest,
    MineBlockRequest,
    SetDifficultyRequest,
    TamperBlockRequest,
    Attack51Request,
    RegisterPeerRequest,
    SyncResponse,
    WalletResponse,
    TransactionResponse,
    BlockResponse,
    BlockchainStatusResponse,
    BlockchainStatsResponse,
    ChainValidationResponse,
    TamperResultResponse,
    Attack51ResultResponse,
    HealthResponse,
    AnalyticsResponse,
)
from .services import (
    AnalyticsService,
    BlockchainService,
    WalletService,
    TransactionService,
    MiningService,
    AttackService,
    TamperService,
    SyncService,
)
from .utils import (
    get_current_timestamp,
    serialize_block,
    serialize_block_summary,
)

logger = configure_logging()
api_logger = get_logger("api")


# ============================================================================
# FastAPI Application Setup
# ============================================================================

app = FastAPI(
    title="Blockchain Simulator API",
    description="Blockchain REST API with complete visualization support",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=SETTINGS.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestLoggingMiddleware)


# ============================================================================
# Service Initialization
# ============================================================================

SERVER_STARTED_AT = time.time()

blockchain_service = BlockchainService(
    difficulty=CONFIG.initial_difficulty,
    mining_reward=CONFIG.mining_reward,
)
wallet_service = WalletService(blockchain_service)
transaction_service = TransactionService(blockchain_service, wallet_service)
mining_service = MiningService(blockchain_service, wallet_service)
attack_service = AttackService(blockchain_service, wallet_service)
tamper_service = TamperService(blockchain_service)
sync_service = SyncService(blockchain_service)
analytics_service = AnalyticsService(
    blockchain_service,
    wallet_service,
    sync_service,
    SERVER_STARTED_AT,
)


# ============================================================================
# Health & Status Endpoints
# ============================================================================

@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Health Check",
    description="Check if the API is running and healthy",
)
def health_check() -> HealthResponse:
    """Get API health status."""
    now = get_current_timestamp()
    return HealthResponse(
        status="healthy",
        version="2.0.0",
        timestamp=now,
        uptime_seconds=round(now - SERVER_STARTED_AT, 1),
        server_started_at=SERVER_STARTED_AT,
    )


@app.get(
    "/config",
    summary="Public Configuration",
    description="Non-sensitive runtime configuration for clients and developers",
)
def get_public_config():
    """Expose safe configuration values."""
    return {
        "success": True,
        "config": get_config(),
        "features": {
            "persistence": CONFIG.persistence_enabled,
            "peer_sync": True,
            "analytics": True,
        },
    }


@app.get(
    "/debug/info",
    summary="Debug Information",
    description="Detailed diagnostics — only available when CHAIN_DEBUG=true",
    include_in_schema=SETTINGS.debug,
)
def debug_info():
    """Return diagnostic info for developers (debug mode only)."""
    if not SETTINGS.debug:
        raise HTTPException(status_code=404, detail="Not found")

    chain = blockchain_service.blockchain
    return {
        "debug": True,
        "chain_length": len(chain.chain),
        "mempool_size": len(chain.pending_transactions),
        "peer_count": len(sync_service.list_peers()),
        "wallet_count": len(wallet_service.get_all_wallets()),
        "difficulty": chain.difficulty,
        "data_dir": str(CONFIG.data_dir),
        "persistence_enabled": CONFIG.persistence_enabled,
        "log_level": SETTINGS.log_level,
        "uptime_seconds": round(get_current_timestamp() - SERVER_STARTED_AT, 1),
    }


@app.get(
    "/",
    summary="Root Endpoint",
    description="API information and status",
)
def root():
    """Root endpoint with API information."""
    return {
        "name": "Blockchain Simulator API",
        "version": "2.0.0",
        "status": "running",
        "documentation": "/docs",
        "endpoints": {
            "health": "/health",
            "chain": "/chain",
            "blocks": "/blocks",
            "transactions": "/transactions",
            "wallets": "/wallets",
            "stats": "/stats",
            "analytics": "/analytics",
            "validate": "/validate",
            "config": "/config",
        },
    }


# ============================================================================
# Blockchain Endpoints
# ============================================================================

@app.get(
    "/chain",
    response_model=BlockchainStatusResponse,
    summary="Get Chain Status",
    description="Get current blockchain state and validity",
)
def get_chain() -> BlockchainStatusResponse:
    """Get blockchain status."""
    status_data = blockchain_service.get_chain_status()
    return BlockchainStatusResponse(**status_data)


@app.get(
    "/blocks",
    summary="Get All Blocks",
    description="Retrieve blocks. Use summary=true for lightweight payloads without transaction bodies.",
)
def get_blocks(
    summary: bool = Query(False, description="Omit full transaction data"),
    limit: int | None = Query(None, ge=1, le=2000, description="Max blocks to return"),
    offset: int = Query(0, ge=0, description="Skip first N blocks"),
):
    """Get blockchain blocks with optional pagination and summary mode."""
    blocks = blockchain_service.get_blocks()
    serializer = serialize_block_summary if summary else serialize_block
    result = [serializer(block) for block in blocks]

    if limit is not None:
        result = result[offset: offset + limit]
    elif offset:
        result = result[offset:]

    return result


@app.get(
    "/blocks/{block_index}",
    summary="Get Block by Index",
    description="Retrieve a specific block by its index",
)
def get_block(block_index: int):
    """Get a specific block by index."""
    try:
        block = blockchain_service.get_block(block_index)
        return serialize_block(block)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get(
    "/stats",
    response_model=BlockchainStatsResponse,
    summary="Get Blockchain Statistics",
    description="Get comprehensive blockchain statistics",
)
def get_stats(response: Response) -> BlockchainStatsResponse:
    """Get blockchain statistics."""
    response.headers["Cache-Control"] = "private, max-age=1"
    stats = blockchain_service.get_chain_stats()
    stats["total_wallets"] = len(wallet_service.get_all_wallets())
    return BlockchainStatsResponse(**stats)


@app.get(
    "/analytics",
    response_model=AnalyticsResponse,
    summary="Get Analytics Dashboard Data",
    description="Aggregated metrics and chart series for the analytics dashboard",
)
def get_analytics() -> AnalyticsResponse:
    """Get analytics dashboard payload."""
    data = analytics_service.get_analytics()
    return AnalyticsResponse(**data)


@app.get(
    "/validate",
    response_model=ChainValidationResponse,
    summary="Validate Blockchain",
    description="Validate the entire blockchain integrity",
)
def validate_blockchain() -> ChainValidationResponse:
    """Validate the blockchain."""
    validation = blockchain_service.validate_chain()
    return ChainValidationResponse(**validation)


# ============================================================================
# Wallet Endpoints
# ============================================================================

@app.get(
    "/wallets",
    response_model=list[WalletResponse],
    summary="Get All Wallets",
    description="Retrieve all wallets with their balances",
)
def get_wallets() -> list[WalletResponse]:
    """Get all wallets."""
    wallets = wallet_service.get_all_wallets()
    return [WalletResponse(**w) for w in wallets]


@app.get(
    "/wallets/{address}",
    response_model=WalletResponse,
    summary="Get Wallet by Address",
    description="Get a specific wallet's information",
)
def get_wallet(address: str) -> WalletResponse:
    """Get a specific wallet."""
    wallet_data = None
    for w in wallet_service.get_all_wallets():
        if w["address"] == address:
            wallet_data = w
            break

    if not wallet_data:
        raise HTTPException(status_code=404, detail="Wallet not found")

    return WalletResponse(**wallet_data)


@app.get(
    "/wallets/name/{name}",
    response_model=WalletResponse,
    summary="Get Wallet by Name",
    description="Get a specific wallet's information by friendly name",
)
def get_wallet_by_name(name: str) -> WalletResponse:
    """Get a wallet by its name."""
    wallet_data = wallet_service.get_wallet_by_name(name)
    if not wallet_data:
        raise HTTPException(status_code=404, detail="Wallet not found")
    return WalletResponse(**wallet_data)


@app.post(
    "/wallet/create",
    summary="Create Wallet",
    description="Create a new cryptocurrency wallet",
)
def create_wallet(request: CreateWalletRequest):
    """Create a new wallet."""
    try:
        wallet = wallet_service.create_wallet(request.name)
        return {
            "success": True,
            "wallet": wallet,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================================
# Transaction Endpoints
# ============================================================================

@app.get(
    "/transactions",
    summary="Get Pending Transactions",
    description="Get all pending transactions awaiting mining",
)
def get_transactions():
    """Get pending transactions."""
    transactions = transaction_service.get_pending_transactions()
    return {
        "count": len(transactions),
        "transactions": transactions,
    }


@app.post(
    "/transaction/create",
    summary="Create Transaction",
    description="Create and sign a new blockchain transaction",
)
def create_transaction(request: CreateTransactionRequest):
    """Create a new transaction."""
    try:
        result = transaction_service.create_transaction(
            request.sender_address,
            request.receiver_address,
            request.amount,
        )
        return {
            "success": True,
            **result,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================================
# Mining Endpoints
# ============================================================================

@app.post(
    "/mine",
    summary="Mine Block",
    description="Mine a new block with pending transactions",
)
def mine_block(request: MineBlockRequest):
    """Mine a new block."""
    try:
        result = mining_service.mine_block(request.miner_address)
        return {
            "success": True,
            **result,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================================
# Tampering Demonstration Endpoints
# ============================================================================

@app.post(
    "/tamper",
    response_model=TamperResultResponse,
    summary="Tamper Demonstration",
    description="Educational demonstration of how tampering breaks blockchain integrity",
)
def tamper_block(request: TamperBlockRequest) -> TamperResultResponse:
    """Demonstrate tampering detection."""
    try:
        result = tamper_service.tamper_block(
            request.block_index,
            request.transaction_index,
            request.new_amount,
        )
        return TamperResultResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================================
# Attack Simulation Endpoints
# ============================================================================

@app.post(
    "/attack/51percent",
    response_model=Attack51ResultResponse,
    summary="51% Attack Simulation",
    description="Simulate a 51% attack demonstrating double-spending vulnerability",
)
def attack_51_percent(
    request: Attack51Request = Body(default_factory=Attack51Request),
) -> Attack51ResultResponse:
    """Simulate a 51% attack."""
    try:
        result = attack_service.simulate_51_percent_attack()
        return Attack51ResultResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================================
# Network Endpoints
# ============================================================================

@app.get(
    "/peers",
    summary="List Peer Nodes",
    description="List registered peer node URLs for HTTP chain sync",
)
def list_peers():
    return {"peers": sync_service.list_peers()}


@app.post(
    "/peers/register",
    summary="Register Peer Node",
    description="Register another simulator instance for chain synchronization",
)
def register_peer(request: RegisterPeerRequest):
    try:
        peers = sync_service.register_peer(request.peer_url)
        return {"success": True, "peers": peers}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post(
    "/network/sync",
    response_model=SyncResponse,
    summary="Synchronize With Peers",
    description="Adopt the longest valid chain from registered peers",
)
def sync_network() -> SyncResponse:
    result = sync_service.sync_with_peers()
    return SyncResponse(**result)


# ============================================================================
# System Endpoints
# ============================================================================

@app.post(
    "/reset",
    summary="Reset Blockchain",
    description="Reset blockchain to genesis state (CAUTION: Irreversible)",
)
def reset_blockchain():
    """Reset blockchain to genesis state."""
    blockchain_service.reset_blockchain()
    wallet_service.clear()

    logger.warning("Blockchain completely reset!")

    return {
        "success": True,
        "message": "Blockchain reset to genesis state",
    }


# ============================================================================
# Error Handlers
# ============================================================================


def _error_body(
    message: str,
    *,
    error_type: str = "Error",
    code: str = "ERROR",
    details: dict | None = None,
    request_id: str | None = None,
) -> dict:
    body = {
        "error": {
            "type": error_type,
            "code": code,
            "message": message,
            "timestamp": get_current_timestamp(),
        }
    }
    if details:
        body["error"]["details"] = details
    if request_id:
        body["error"]["request_id"] = request_id
    return body


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    """Handle structured application errors."""
    request_id = request.headers.get("X-Request-ID")
    api_logger.warning("AppError [%s]: %s", exc.code, exc.message)
    return JSONResponse(
        status_code=exc.status_code,
        content=_error_body(
            exc.message,
            error_type=exc.__class__.__name__,
            code=exc.code,
            details=exc.details or None,
            request_id=request_id,
        ),
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Normalize FastAPI HTTPException responses."""
    request_id = request.headers.get("X-Request-ID")
    detail = exc.detail
    if isinstance(detail, dict):
        message = detail.get("message", str(detail))
        code = detail.get("code", "HTTP_ERROR")
    else:
        message = str(detail)
        code = "HTTP_ERROR"

    return JSONResponse(
        status_code=exc.status_code,
        content=_error_body(message, code=code, request_id=request_id),
    )


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    """Handle ValueError exceptions."""
    request_id = request.headers.get("X-Request-ID")
    return JSONResponse(
        status_code=400,
        content=_error_body(
            str(exc),
            error_type="ValidationError",
            code="VALIDATION_ERROR",
            request_id=request_id,
        ),
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions."""
    request_id = request.headers.get("X-Request-ID")
    api_logger.exception("Unhandled exception: %s", exc)
    message = str(exc) if SETTINGS.debug else "An unexpected error occurred"
    return JSONResponse(
        status_code=500,
        content=_error_body(
            message,
            error_type="InternalError",
            code="INTERNAL_ERROR",
            request_id=request_id,
        ),
    )


@app.post(
    "/settings/difficulty",
    summary="Set Mining Difficulty",
    description="Update the mining difficulty (number of leading zeros)",
)
def set_difficulty(request: SetDifficultyRequest):
    """Update mining difficulty."""
    try:
        blockchain_service.blockchain.difficulty = int(request.difficulty)
        blockchain_service.persist()
        return {"success": True, "difficulty": blockchain_service.blockchain.difficulty}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host=SETTINGS.api_host,
        port=SETTINGS.api_port,
        reload=SETTINGS.debug,
        log_level=SETTINGS.log_level.lower(),
    )
