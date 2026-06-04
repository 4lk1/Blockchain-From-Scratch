"""
Security demonstrations for the blockchain.
Shows resistance to manipulation and 51% attack simulation.
"""

from blockchain import Blockchain
from transaction import Wallet
import time
import copy


def demo_resistance_to_manipulation():
    """
    Demonstrate that the blockchain resists manipulation attempts.
    Shows how modifying a block breaks the chain.
    """
    print("\n" + "="*80)
    print("DEMONSTRATION 1: RESISTANCE TO MANIPULATION".center(80))
    print("="*80 + "\n")
    
    # Create blockchain and add some blocks
    blockchain = Blockchain(difficulty=3)
    
    print("Creating wallets...")
    wallet_alice = Wallet()
    wallet_bob = Wallet()
    wallet_charlie = Wallet()
    
    print(f"Alice:   {wallet_alice.get_public_key_string()[:16]}...")
    print(f"Bob:     {wallet_bob.get_public_key_string()[:16]}...")
    print(f"Charlie: {wallet_charlie.get_public_key_string()[:16]}...\n")
    
    # Add transactions and mine blocks
    print("--- Phase 1: Creating legitimate transactions ---\n")
    
    tx1 = wallet_alice.create_transaction(wallet_bob.get_public_key_string(), 50)
    blockchain.add_transaction(tx1)
    print(f"Transaction: Alice sends 50 to Bob")
    blockchain.mine_pending_transactions(wallet_alice.get_public_key_string())
    
    tx2 = wallet_bob.create_transaction(wallet_charlie.get_public_key_string(), 30)
    blockchain.add_transaction(tx2)
    print(f"Transaction: Bob sends 30 to Charlie")
    blockchain.mine_pending_transactions(wallet_bob.get_public_key_string())
    
    tx3 = wallet_charlie.create_transaction(wallet_alice.get_public_key_string(), 10)
    blockchain.add_transaction(tx3)
    print(f"Transaction: Charlie sends 10 to Alice")
    blockchain.mine_pending_transactions(wallet_charlie.get_public_key_string())
    
    print("\n Three blocks mined successfully!")
    print(f"\nBlockchain length: {len(blockchain.chain)}")
    print(f"Blockchain valid: {blockchain.is_chain_valid()}\n")
    
    # Now attempt to manipulate a transaction in Block 1
    print("--- Phase 2: Attempting to manipulate Block 1 ---\n")
    print("Attacker tries to modify Block 1 transaction amount (50 → 500)...\n")
    
    # Save original hash
    original_hash = blockchain.chain[1].hash
    
    # Modify transaction
    blockchain.chain[1].transactions[0]['amount'] = 500
    print(f"Original Block Hash: {original_hash[:16]}...")
    print(f"Block Hash after modification: {blockchain.chain[1].hash[:16]}...")
    print(f"Hashes match: {original_hash == blockchain.chain[1].hash}\n")
    
    # Validate blockchain
    print("Validating blockchain after manipulation...\n")
    is_valid = blockchain.is_chain_valid()
    
    if not is_valid:
        print(" Manipulation detected! Blockchain is now INVALID.")
        print("  This is because Block 1's hash no longer matches the stored value.")
        print("  Block 2 still references the original Block 1 hash, creating a break in the chain.")
    
    print("\n" + "─"*80 + "\n")
    
    # Demonstrate that chain breaks even if we recalculate the modified block's hash
    print("--- Phase 3: Even if we fix Block 1's hash, the chain still breaks ---\n")
    
    tx_amount_data = blockchain.chain[1].transactions[0]
    print(f"Current transaction amount: {tx_amount_data['amount']}")
    
    # Recalculate hash for Block 1
    blockchain.chain[1].hash = blockchain.chain[1].calculate_hash()
    print(f"Block 1 hash recalculated: {blockchain.chain[1].hash[:16]}...")
    print(f"\nNow Block 2's previous_hash ({blockchain.chain[2].previous_hash[:16]}...) ")
    print(f"doesn't match Block 1's new hash ({blockchain.chain[1].hash[:16]}...)")
    
    print("\nValidating blockchain...\n")
    is_valid = blockchain.is_chain_valid()
    
    if not is_valid:
        print(" Chain is broken! To fix Block 2, we'd need to:")
        print("  1. Update Block 2's previous_hash")
        print("  2. Recalculate Block 2's hash")
        print("  3. But this breaks Block 3, and so on...")
        print("  4. We'd need to re-mine ALL blocks after the modification!")
    
    return blockchain


def demo_51_percent_attack():
    """
    Demonstrate a 51% attack where an attacker creates an alternative chain
    and tries to override the legitimate chain.
    """
    print("\n\n" + "="*80)
    print("DEMONSTRATION 2: 51% ATTACK SIMULATION".center(80))
    print("="*80 + "\n")
    
    print("Scenario: Attacker controls 51% of mining power\n")
    
    # Create legitimate blockchain
    legitimate_chain = Blockchain(difficulty=2)
    
    wallet_alice = Wallet()
    wallet_bob = Wallet()
    wallet_attacker = Wallet()
    
    print("--- Phase 1: Legitimate blockchain with honest miners ---\n")
    
    # Alice sends money to Bob
    tx1 = wallet_alice.create_transaction(wallet_bob.get_public_key_string(), 100)
    legitimate_chain.add_transaction(tx1)
    print(f"Transaction 1: Alice sends 100 to Bob")
    legitimate_chain.mine_pending_transactions(wallet_alice.get_public_key_string())
    
    # Bob sends money to Attacker
    tx2 = wallet_bob.create_transaction(wallet_attacker.get_public_key_string(), 80)
    legitimate_chain.add_transaction(tx2)
    print(f"Transaction 2: Bob sends 80 to Attacker")
    legitimate_chain.mine_pending_transactions(wallet_bob.get_public_key_string())
    
    # Attacker sends money to themselves
    tx3 = wallet_attacker.create_transaction(wallet_attacker.get_public_key_string(), 80)
    legitimate_chain.add_transaction(tx3)
    print(f"Transaction 3: Attacker sends 80 to themselves")
    legitimate_chain.mine_pending_transactions(wallet_attacker.get_public_key_string())
    
    print(f"\n Legitimate chain: {len(legitimate_chain.chain)} blocks")
    print(f"  Block hashes: {[b.hash[:8] + '...' for b in legitimate_chain.chain]}\n")
    
    print("--- Phase 2: Attacker creates a forked chain ---\n")
    print("Attacker has the computational power to mine faster.")
    print("They create an alternative history starting from Block 1:\n")
    
    # Create attacker's fork starting from genesis block
    attacker_chain = Blockchain(difficulty=2)
    
    # Attacker mines blocks faster and creates different transaction
    # Block 1: Different transaction (attacker sends reward to themselves)
    tx_fork1 = wallet_attacker.create_transaction(
        wallet_attacker.get_public_key_string(), 1
    )
    attacker_chain.add_transaction(tx_fork1)
    print(f"Forked Block 1: Attacker creates alternative transaction")
    attacker_chain.mine_pending_transactions(wallet_attacker.get_public_key_string())
    
    # Block 2: Attacker mines a block for themselves
    tx_fork2 = wallet_attacker.create_transaction(
        wallet_attacker.get_public_key_string(), 1
    )
    attacker_chain.add_transaction(tx_fork2)
    print(f"Forked Block 2: Attacker mines another block")
    attacker_chain.mine_pending_transactions(wallet_attacker.get_public_key_string())
    
    # Block 3: Attacker mines a third block (51% attack - 3 blocks vs 3 blocks)
    tx_fork3 = wallet_attacker.create_transaction(
        wallet_attacker.get_public_key_string(), 1
    )
    attacker_chain.add_transaction(tx_fork3)
    print(f"Forked Block 3: Attacker mines a third block (now has more blocks!)\n")
    attacker_chain.mine_pending_transactions(wallet_attacker.get_public_key_string())
    
    # Block 4: Fourth block to exceed legitimate chain
    tx_fork4 = wallet_attacker.create_transaction(
        wallet_attacker.get_public_key_string(), 1
    )
    attacker_chain.add_transaction(tx_fork4)
    print(f"Forked Block 4: Attacker's chain now exceeds legitimate chain!\n")
    attacker_chain.mine_pending_transactions(wallet_attacker.get_public_key_string())
    
    print(f"  Attacker chain: {len(attacker_chain.chain)} blocks")
    print(f"  Block hashes: {[b.hash[:8] + '...' for b in attacker_chain.chain]}\n")
    
    print("--- Phase 3: Attack analysis ---\n")
    
    print(f"Legitimate chain length:  {len(legitimate_chain.chain)}")
    print(f"Attacker chain length:    {len(attacker_chain.chain)}")
    
    longest_chain = attacker_chain if len(attacker_chain.chain) > len(legitimate_chain.chain) else legitimate_chain
    
    if len(attacker_chain.chain) > len(legitimate_chain.chain):
        print(f"\n ATTACK SUCCESSFUL: Attacker's chain is longer!")
        print(f"In a Proof-of-Work system, nodes follow the longest chain.")
        print(f"The network would accept the attacker's version as truth.\n")
        
        print("Consequences of this attack:")
        print("  1. Transaction 2 (Bob→Attacker: 80) is REVERSED")
        print("  2. Transaction 3 (Attacker→Attacker: 80) is REVERSED")
        print("  3. The attacker effectively stole coins and then undid it")
        print("  4. This is called 'double-spending'\n")
    else:
        print(f"\n Attack failed: Legitimate chain is longer")
        print(f"Network would reject the shorter chain.\n")
    
    print("--- Defenses against 51% attacks ---\n")
    print("1. Large network: Harder to control 51% with many miners")
    print("2. Increased difficulty: More computation needed for attacks")
    print("3. Longer finality: Transactions considered final after N blocks")
    print("4. Economic incentives: Mining is more profitable than attacking")
    print("5. Algorithm diversity: Different consensus mechanisms (PoS, etc.)")
    
    return legitimate_chain, attacker_chain


def demo_hash_distribution():
    """
    Demonstrate how different nonces produce different hashes,
    showing the work involved in Proof-of-Work.
    """
    print("\n\n" + "="*80)
    print("DEMONSTRATION 3: HASH DISTRIBUTION & PROOF-OF-WORK".center(80))
    print("="*80 + "\n")
    
    from block import Block
    
    print("Mining a block with difficulty 4 (4 leading zeros)...\n")
    
    # Create a block without mining
    test_block = Block(
        index=99,
        transactions=[{"sender": "Alice", "receiver": "Bob", "amount": 50}],
        previous_hash="aabbccdd"
    )
    
    print(f"Block before mining:")
    print(f"  Nonce: {test_block.nonce}")
    print(f"  Hash:  {test_block.hash}\n")
    
    # Store original info
    original_hash = test_block.hash
    original_nonce = test_block.nonce
    
    # Mine the block
    import time
    start_time = time.time()
    test_block.mine_block(difficulty=4)
    elapsed_time = time.time() - start_time
    
    print(f"\nBlock after mining:")
    print(f"  Nonce: {test_block.nonce} (tried {test_block.nonce} different values)")
    print(f"  Hash:  {test_block.hash}")
    print(f"  Time:  {elapsed_time:.2f} seconds\n")
    
    print("Key insights:")
    print(f"  1. Hash changed completely ({original_hash[:8]}... ==> {test_block.hash[:8]}...)")
    print(f"  2. Nonce had to be incremented {test_block.nonce} times")
    print(f"  3. Even tiny nonce changes create completely different hashes")
    print(f"  4. Finding the target hash required significant computation")
    print(f"  5. This makes blocks tamper-resistant and expensive to re-mine")


def run_all_demonstrations():
    """Run all security demonstrations."""
    print("\n\n")
    print("╔" + "═"*78 + "╗")
    print("║" + " "*78 + "║")
    print("║" + "BLOCKCHAIN SECURITY DEMONSTRATIONS".center(78) + "║")
    print("║" + " "*78 + "║")
    print("╚" + "═"*78 + "╝")
    
    # Demo 1: Manipulation resistance
    blockchain1 = demo_resistance_to_manipulation()
    
    # Demo 2: 51% attack
    legitimate_chain, attacker_chain = demo_51_percent_attack()
    
    # Demo 3: Hash distribution
    demo_hash_distribution()
    
    print("\n\n" + "═"*80)
    print("ALL DEMONSTRATIONS COMPLETED".center(80))
    print("═"*80)
    
    print("\nKey Takeaways:")
    print("  ✓ Changing any block breaks the entire chain (immutability)")
    print("  ✓ Re-mining all blocks is computationally expensive")
    print("  ✓ The longest chain is considered the truth (consensus)")
    print("  ✓ Controlling 51% allows creating an alternative history")
    print("  ✓ But double-spending is still risky and economically unfavorable")
    print("  ✓ Digital signatures ensure transaction authenticity")
    print("  ✓ Proof-of-Work makes the system secure through computation")


if __name__ == "__main__":
    run_all_demonstrations()
