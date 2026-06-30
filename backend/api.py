"""
FastAPI Backend for Blockchain Simulator.

A production-quality REST API for blockchain operations with complete
separation of concerns, type safety, and comprehensive error handling.

API Documentation available at: /docs (Swagger UI) or /redoc (ReDoc)
"""

import logging

from fastapi import Body, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .models import (
    CreateWalletRequest,
    CreateTransactionRequest,
    MineBlockRequest,
    SetDifficultyRequest,
    TamperBlockRequest,
    Attack51Request,
    WalletResponse,
    TransactionResponse,
    BlockResponse,
    BlockchainStatusResponse,
    BlockchainStatsResponse,
    ChainValidationResponse,
    TamperResultResponse,
    Attack51ResultResponse,
    HealthResponse,
)
from .services import (
    BlockchainService,
    WalletService,
    TransactionService,
    MiningService,
    AttackService,
    TamperService,
)
from .utils import (
    get_current_timestamp,
    logger,
    serialize_block,
)


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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)


# ============================================================================
# Service Initialization
# ============================================================================

blockchain_service = BlockchainService(difficulty=3, mining_reward=10.0)
wallet_service = WalletService()
transaction_service = TransactionService(blockchain_service, wallet_service)
mining_service = MiningService(blockchain_service, wallet_service)
attack_service = AttackService(blockchain_service, wallet_service)
tamper_service = TamperService(blockchain_service)


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
    return HealthResponse(
        status="healthy",
        version="2.0.0",
        timestamp=get_current_timestamp(),
    )


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
            "validate": "/validate",
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
    description="Retrieve all blocks in the blockchain",
)
def get_blocks():
    """Get all blocks in the blockchain."""
    blocks = blockchain_service.get_blocks()
    return [serialize_block(block) for block in blocks]


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
def get_stats() -> BlockchainStatsResponse:
    """Get blockchain statistics."""
    stats = blockchain_service.get_chain_stats()
    # Add wallet count to stats
    stats["total_wallets"] = len(wallet_service.get_all_wallets())
    return BlockchainStatsResponse(**stats)


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

@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    """Handle ValueError exceptions."""
    return JSONResponse(
        status_code=400,
        content={
            "error": {
                "type": "ValidationError",
                "message": str(exc),
                "timestamp": get_current_timestamp(),
            }
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions."""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "type": "InternalError",
                "message": "An unexpected error occurred",
                "timestamp": get_current_timestamp(),
            }
        },
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
        return {"success": True, "difficulty": blockchain_service.blockchain.difficulty}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
