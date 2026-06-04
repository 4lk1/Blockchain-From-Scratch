"""
Comprehensive blockchain example script.
Demonstrates all features in a single integrated example.
"""

from blockchain import Blockchain
from transaction import Wallet


def print_header(title):
    """Print a formatted header."""
    print("\n" + "═"*80)
    print(f"  {title}".center(80))
    print("═"*80 + "\n")


def example_complete_workflow():
    """Run a complete blockchain workflow example."""
    
    print_header("COMPLETE BLOCKCHAIN WORKFLOW EXAMPLE")
    
    # Step 1: Initialize blockchain
    print("STEP 1: Initialize Blockchain")
    print("-" * 80)
    blockchain = Blockchain(difficulty=3)
    print(f"Blockchain created with difficulty {blockchain.difficulty}")
    print(f"Mining reward per block: {blockchain.mining_reward} coins\n")
    
    # Step 2: Create user wallets
    print("STEP 2: Create User Wallets")
    print("-" * 80)
    wallets = {
        'Alice': Wallet(),
        'Bob': Wallet(),
        'Charlie': Wallet(),
        'Diana': Wallet(),
    }
    
    for name, wallet in wallets.items():
        address = wallet.get_public_key_string()
        print(f"{name:10} → {address}")
    print()
    
    # Step 3: Create and mine blocks with various transactions
    print("STEP 3: Execute Transactions and Mine Blocks")
    print("-" * 80)
    
    # Block 1: Alice transfers to Bob
    print("\n[Block 1] Alice sends 75 to Bob")
    tx1 = wallets['Alice'].create_transaction(wallets['Bob'].get_public_key_string(), 75)
    blockchain.add_transaction(tx1)
    blockchain.mine_pending_transactions(wallets['Alice'].get_public_key_string())
    
    # Block 2: Multiple transactions
    print("\n[Block 2] Multiple parallel transactions:")
    tx2a = wallets['Bob'].create_transaction(wallets['Charlie'].get_public_key_string(), 30)
    print(f"  - Bob → Charlie: 30")
    blockchain.add_transaction(tx2a)
    
    tx2b = wallets['Charlie'].create_transaction(wallets['Diana'].get_public_key_string(), 20)
    print(f"  - Charlie → Diana: 20")
    blockchain.add_transaction(tx2b)
    
    blockchain.mine_pending_transactions(wallets['Bob'].get_public_key_string())
    
    # Block 3: More transactions
    print("\n[Block 3] Final transactions:")
    tx3a = wallets['Diana'].create_transaction(wallets['Alice'].get_public_key_string(), 10)
    print(f"  - Diana → Alice: 10")
    blockchain.add_transaction(tx3a)
    
    tx3b = wallets['Alice'].create_transaction(wallets['Diana'].get_public_key_string(), 5)
    print(f"  - Alice → Diana: 5")
    blockchain.add_transaction(tx3b)
    
    blockchain.mine_pending_transactions(wallets['Charlie'].get_public_key_string())
    
    # Step 4: Display blockchain state
    print("\n" + "─"*80)
    blockchain.print_chain()
    
    # Step 5: Show balances
    print("STEP 4: Account Balances")
    print("-" * 80)
    for name, wallet in wallets.items():
        address = wallet.get_public_key_string()
        balance = blockchain.get_balance(address)
        print(f"{name:10} → {balance:8.0f} coins")
    print()
    
    # Step 6: Validate blockchain
    print("STEP 5: Blockchain Validation")
    print("-" * 80)
    is_valid = blockchain.is_chain_valid()
    print()
    
    # Step 7: Show transaction history
    print("STEP 6: Transaction History")
    print("-" * 80)
    
    for name, wallet in wallets.items():
        address = wallet.get_public_key_string()
        history = blockchain.get_transaction_history(address)
        
        print(f"\n{name}'s Transactions:")
        for tx in history:
            sender_name = next((n for n, w in wallets.items() 
                              if w.get_public_key_string() == tx['sender']), tx['sender'][:8])
            receiver_name = next((n for n, w in wallets.items() 
                                if w.get_public_key_string() == tx['receiver']), tx['receiver'][:8])
            
            direction = "→" if tx['sender'] == address else "←"
            print(f"  {sender_name:10} {direction} {receiver_name:10}: {tx['amount']:5.0f} coins")
    print()
    
    # Step 8: Statistics
    blockchain.print_stats()
    
    return blockchain, wallets


def example_security_analysis(blockchain, wallets):
    """Demonstrate security properties."""
    
    print_header("SECURITY ANALYSIS")
    
    # Create backup of legitimate blockchain
    import copy
    backup_chain = copy.deepcopy(blockchain.chain)
    
    print("TEST 1: Detect Single Block Tampering")
    print("-" * 80)
    print(f"Original Block 1 hash: {blockchain.chain[1].hash[:16]}...")
    
    # Tamper with a transaction
    print("Modifying Block 1: Changing transaction amount (30 → 1000)...\n")
    blockchain.chain[1].transactions[0]['amount'] = 1000
    
    print("If we only modify the transaction without updating the hash:")
    print(f"  Block 1 hash (stored): {blockchain.chain[1].hash[:16]}...")
    print(f"  Block 1 hash (should be): {blockchain.chain[1].calculate_hash()[:16]}...")
    print(f"  Hashes match: {blockchain.chain[1].hash == blockchain.chain[1].calculate_hash()}")
    
    print("\nValidating blockchain...\n")
    is_valid = blockchain.is_chain_valid()
    print()
    
    # Restore
    blockchain.chain = backup_chain
    
    # Test 2: Show attack cost
    print("TEST 2: Cost of Attacking the Blockchain")
    print("-" * 80)
    
    print(f"Current blockchain has {len(blockchain.chain)} blocks")
    print(f"If an attacker wants to:")
    print(f"  1. Modify Block 1")
    print(f"  2. All {len(blockchain.chain) - 1} subsequent blocks must be re-mined")
    print(f"  3. Total mining work required: ~{(len(blockchain.chain) - 1) * (2 ** blockchain.difficulty)} hash attempts")
    print(f"\nWith difficulty {blockchain.difficulty}, this is computationally expensive!\n")
    
    # Test 3: Signature verification
    print("TEST 3: Transaction Digital Signatures")
    print("-" * 80)
    
    # Get a transaction from Block 2
    tx = blockchain.chain[2].transactions[0]
    print(f"Transaction from Block 2:")
    print(f"  From: {tx['sender'][:16]}...")
    print(f"  To:   {tx['receiver'][:16]}...")
    print(f"  Amount: {tx['amount']}")
    print(f"\nNote: In a real implementation, each transaction includes a digital signature")
    print(f"      that would be verified with the sender's public key.")
    print(f"      This ensures only the owner can spend their coins.")
    print()


def example_blockchain_properties():
    """Demonstrate key blockchain properties."""
    
    print_header("BLOCKCHAIN PROPERTIES & CONCEPTS")
    
    print("1. IMMUTABILITY")
    print("-" * 80)
    print("""
Blockchain achieves immutability through:
  • Cryptographic hashing: Each block contains hash of previous block
  • Chain linking: Breaking one block breaks the entire chain
  • Proof-of-Work: Making re-mining expensive
  
Result: Changing past transactions requires more computation than 
        the entire honest network can perform.
""")
    
    print("\n2. DECENTRALIZATION & CONSENSUS")
    print("-" * 80)
    print("""
The blockchain uses Proof-of-Work consensus:
  • Longest chain rule: Node accepts the longest valid chain
  • Distributed: No single authority controls the chain
  • Fork resolution: When conflicts happen, longest chain wins
  
Result: No single point of failure, Byzantine Fault Tolerance up to 33%
""")
    
    print("\n3. TRANSPARENCY & AUDITABILITY")
    print("-" * 80)
    print("""
The blockchain is transparent:
  • All transactions are visible (though pseudonymous)
  • Anyone can verify the entire chain
  • Complete audit trail is maintained
  
Result: Perfect monitorability, programmable via smart contracts
""")
    
    print("\n4. SCALABILITY CHALLENGES")
    print("-" * 80)
    print("""
Tradeoffs in blockchain design:
  • Storage: Every node stores complete history
  • Throughput: Limited by block size and mining time
  • Latency: Confirmation requires multiple blocks (finality)
  
Solutions: Layer 2, sharding, different consensus mechanisms
""")
    
    print("\n5. PROOF-OF-WORK ECONOMICS")
    print("-" * 80)
    print("""
Why PoW is economically secure:
  • Miners invest in hardware and electricity
  • Incentive: Earn block reward + transaction fees
  • 51% attack costs: Must spend more than profits from attack
  • If profitable to attack, more profitable to mine honestly
  
Result: Economic game theory ensures security
""")
    
    print("\n6. DIGITAL SIGNATURES")
    print("-" * 80)
    print("""
Ensures transaction authenticity:
  • Sender signs with private key: Only sender can sign
  • Receiver verifies with public key: Signature uniquely links to sender
  • Can't deny having sent (non-repudiation)
  
Result: Prevents unauthorized transactions and ensures accountability
""")
    print()


if __name__ == "__main__":
    try:
        # Run complete workflow
        blockchain, wallets = example_complete_workflow()
        
        # Analyze security
        example_security_analysis(blockchain, wallets)
        
        # Show properties
        example_blockchain_properties()
        
        print("═"*80)
        print("EXAMPLE COMPLETED SUCCESSFULLY".center(80))
        print("═"*80 + "\n")
        
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
