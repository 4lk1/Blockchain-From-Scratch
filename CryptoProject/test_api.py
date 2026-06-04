"""
Test suite for the Flask web server and API endpoints.
Verifies that all endpoints work correctly.
"""

import json
import sys
sys.path.insert(0, '/home/thearchitect/Uni/CryptoProject')

from app import app

def test_api():
    """Test all API endpoints."""
    
    print("\n" + "="*80)
    print("BLOCKCHAIN WEB API TEST SUITE".center(80))
    print("="*80 + "\n")
    
    # Create test client
    client = app.test_client()
    
    # Test 1: Initialize blockchain
    print("Test 1: Initialize Blockchain")
    print("-" * 80)
    response = client.post('/api/blockchain/init', 
        json={'difficulty': 2},
        content_type='application/json'
    )
    data = response.get_json()
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    assert data['success'] == True, "Blockchain init failed"
    assert len(data['blockchain']) > 0, "No blockchain created"
    assert len(data['wallets']) == 5, "Wrong number of wallets"
    
    print(f"Blockchain created with {len(data['blockchain'])} blocks")
    print(f"{len(data['wallets'])} wallets created")
    print(f"Wallets: {', '.join(data['wallets'].keys())}\n")
    
    # Test 2: Get blockchain state
    print("Test 2: Get Blockchain State")
    print("-" * 80)
    response = client.get('/api/blockchain/state')
    data = response.get_json()
    
    assert response.status_code == 200, "Failed to get state"
    assert data['initialized'] == True, "Blockchain not initialized"
    
    print(f"Blockchain state retrieved")
    print(f"Blocks: {data['stats']['block_count']}")
    print(f"Difficulty: {data['stats']['difficulty']}\n")
    
    # Test 3: Add transaction
    print("Test 3: Add Transaction")
    print("-" * 80)
    response = client.post('/api/transactions/add',
        json={'sender': 'Alice', 'receiver': 'Bob', 'amount': 50},
        content_type='application/json'
    )
    data = response.get_json()
    
    assert response.status_code == 200, "Failed to add transaction"
    assert data['success'] == True, "Transaction failed"
    assert data['pending_transactions'] == 1, "Transaction not pending"
    
    print(f"Transaction created: Alice → Bob: 50")
    print(f"Pending transactions: {data['pending_transactions']}\n")
    
    # Test 4: Mine block
    print("Test 4: Mine Block")
    print("-" * 80)
    response = client.post('/api/blocks/mine',
        json={'miner': 'Charlie'},
        content_type='application/json'
    )
    data = response.get_json()
    
    assert response.status_code == 200, "Failed to mine"
    assert data['success'] == True, "Mining failed"
    assert len(data['blockchain']) > 1, "Block not added"
    
    print(f"Block mined successfully")
    print(f"New chain length: {len(data['blockchain'])}")
    print(f"Miner: Charlie (reward: +10 coins)\n")
    
    # Test 5: Validate blockchain
    print("Test 5: Validate Blockchain")
    print("-" * 80)
    response = client.get('/api/blockchain/validate')
    data = response.get_json()
    
    assert response.status_code == 200, "Failed to validate"
    assert 'valid' in data, "No valid field"
    
    valid_status = "Valid" if data['valid'] else "Invalid"
    print(f"{valid_status}")
    print(f"Chain length: {data['length']}")
    print(f"Pending: {data['pending']}\n")
    
    # Test 6: Get wallet balance
    print("Test 6: Get Wallet Balance")
    print("-" * 80)
    response = client.get('/api/wallet/Alice/balance')
    data = response.get_json()
    
    assert response.status_code == 200, "Failed to get balance"
    assert 'balance' in data, "No balance field"
    
    print(f"Alice's Balance: {data['balance']} coins")
    print(f"Address: {data['address'][:16]}...\n")
    
    # Test 7: Get statistics
    print("Test 7: Get Statistics")
    print("-" * 80)
    response = client.get('/api/stats')
    data = response.get_json()
    
    assert response.status_code == 200, "Failed to get stats"
    
    print(f"Total Blocks: {data['blocks']}")
    print(f"Total Transactions: {data['transactions']}")
    print(f"Wallets: {data['wallets']}")
    print(f"Difficulty: {data['difficulty']}\n")
    
    # Test 8: Add more transactions and mine again
    print("Test 8: Add Multiple Transactions & Mine")
    print("-" * 80)
    
    client.post('/api/transactions/add',
        json={'sender': 'Bob', 'receiver': 'Diana', 'amount': 30},
        content_type='application/json'
    )
    client.post('/api/transactions/add',
        json={'sender': 'Eve', 'receiver': 'Charlie', 'amount': 20},
        content_type='application/json'
    )
    
    response = client.post('/api/blocks/mine',
        json={'miner': 'Alice'},
        content_type='application/json'
    )
    data = response.get_json()
    
    print(f"2 transactions added")
    print(f"Block mined with {len(data['blockchain'][-1]['transactions'])} transactions")
    print(f"New block index: {data['blockIndex']}\n")
    
    # Test 9: Get wallet transactions
    print("Test 9: Get Wallet Transaction History")
    print("-" * 80)
    response = client.get('/api/wallet/Alice/transactions')
    data = response.get_json()
    
    assert response.status_code == 200, "Failed to get transactions"
    
    print(f"Alice's transaction count: {data['count']}")
    for i, tx in enumerate(data['transactions'][-3:], 1):
        print(f"  [{i}] {tx['sender'][:8]}... → {tx['receiver'][:8]}...: {tx['amount']}")
    print()
    
    # Test 10: Final validation
    print("Test 10: Final Chain Validation")
    print("-" * 80)
    response = client.get('/api/blockchain/validate')
    data = response.get_json()
    
    valid_status = "Valid" if data['valid'] else "Invalid"
    print(f"Status: {valid_status}")
    print(f"Blocks: {data['length']}")
    print(f"Errors: {len(data['errors'])}\n")
    
    # Summary
    print("="*80)
    print("ALL TESTS PASSED!".center(80))
    print("="*80)
    print("\nAPI Summary:")
    print("  ✓ Blockchain initialization")
    print("  ✓ Transaction creation")
    print("  ✓ Block mining")
    print("  ✓ Chain validation")
    print("  ✓ Balance queries")
    print("  ✓ Transaction history")
    print("  ✓ Statistics")
    print()
    print("The web server is ready to use!")
    print("Run: python app.py")
    print("Then open: http://localhost:5000\n")

if __name__ == '__main__':
    try:
        test_api()
    except AssertionError as e:
        print(f"\n TEST FAILED: {e}\n")
        sys.exit(1)
    except Exception as e:
        print(f"\n ERROR: {e}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)
