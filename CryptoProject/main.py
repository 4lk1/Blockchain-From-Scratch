"""
Main entry point for the blockchain demonstration.
Provides an interactive menu to explore blockchain features.
"""

from blockchain import Blockchain
from transaction import Wallet, Transaction
from security_demo import run_all_demonstrations
import time


def main_menu():
    """Display main menu and handle user choices."""
    
    print("\n╔" + "═"*78 + "╗")
    print("║" + " "*20 + "BLOCKCHAIN FROM SCRATCH DEMONSTRATION" + " "*21 + "║")
    print("║" + " "*78 + "║")
    print("║  Languages: Python | Cryptography | RSA, SHA-256 Hashing" + " "*23 + "║")
    print("╚" + "═"*78 + "╝\n")
    
    print("SELECT DEMONSTRATION:")
    print("  1. Create blockchain and perform transactions")
    print("  2. Security demonstrations (manipulation, 51% attack)")
    print("  3. Interactive blockchain explorer")
    print("  4. Run comprehensive test suite")
    print("  5. Exit")
    print()
    
    choice = input("Enter your choice (1-5): ").strip()
    
    if choice == "1":
        demo_basic_blockchain()
    elif choice == "2":
        run_all_demonstrations()
    elif choice == "3":
        interactive_explorer()
    elif choice == "4":
        run_test_suite()
    elif choice == "5":
        print("\nGoodbye!")
        return
    else:
        print("Invalid choice. Please try again.")
        return main_menu()
    
    input("\nPress Enter to return to menu...")
    main_menu()


def demo_basic_blockchain():
    """Basic blockchain creation and transaction demo."""
    
    print("\n" + "█"*80)
    print("█ BASIC BLOCKCHAIN DEMONSTRATION")
    print("█"*80 + "\n")
    
    # Create blockchain with difficulty 3
    difficulty = 3
    print(f"Creating blockchain with Proof-of-Work difficulty: {difficulty}\n")
    blockchain = Blockchain(difficulty=difficulty)
    
    # Create wallets
    print("Creating wallets...\n")
    wallet_alice = Wallet()
    wallet_bob = Wallet()
    wallet_charlie = Wallet()
    
    print(f"Alice's address:   {wallet_alice.get_public_key_string()}")
    print(f"Bob's address:     {wallet_bob.get_public_key_string()}")
    print(f"Charlie's address: {wallet_charlie.get_public_key_string()}\n")
    
    # Perform transactions
    print("─" * 80)
    print("ROUND 1: Alice sends 50 to Bob")
    print("─" * 80 + "\n")
    
    tx1 = wallet_alice.create_transaction(wallet_bob.get_public_key_string(), 50)
    print(f"✓ Transaction created and signed")
    print(f"  From:   {tx1.sender[:16]}...")
    print(f"  To:     {tx1.receiver[:16]}...")
    print(f"  Amount: {tx1.amount}")
    print(f"  Signed: {tx1.signature is not None}\n")
    
    blockchain.add_transaction(tx1)
    print("Mining block 1...\n")
    blockchain.mine_pending_transactions(wallet_alice.get_public_key_string())
    
    print("\n─" * 80)
    print("ROUND 2: Bob sends 30 to Charlie")
    print("─" * 80 + "\n")
    
    tx2 = wallet_bob.create_transaction(wallet_charlie.get_public_key_string(), 30)
    blockchain.add_transaction(tx2)
    print(f"✓ Transaction created and signed")
    print(f"  From:   {tx2.sender[:16]}...")
    print(f"  To:     {tx2.receiver[:16]}...")
    print(f"  Amount: {tx2.amount}\n")
    
    print("Mining block 2...\n")
    blockchain.mine_pending_transactions(wallet_bob.get_public_key_string())
    
    print("\n─" * 80)
    print("ROUND 3: Charlie sends 10 to Alice")
    print("─" * 80 + "\n")
    
    tx3 = wallet_charlie.create_transaction(wallet_alice.get_public_key_string(), 10)
    blockchain.add_transaction(tx3)
    print(f"✓ Transaction created and signed")
    print(f"  From:   {tx3.sender[:16]}...")
    print(f"  To:     {tx3.receiver[:16]}...")
    print(f"  Amount: {tx3.amount}\n")
    
    print("Mining block 3...\n")
    blockchain.mine_pending_transactions(wallet_charlie.get_public_key_string())
    
    # Display blockchain
    blockchain.print_chain()
    blockchain.print_stats()
    
    # Validate and show balances
    print("─" * 80)
    print("VALIDATION & BALANCES")
    print("─" * 80 + "\n")
    
    is_valid = blockchain.is_chain_valid()
    print()
    
    print("Account Balances:")
    print(f"  Alice:   {blockchain.get_balance(wallet_alice.get_public_key_string())} coins")
    print(f"  Bob:     {blockchain.get_balance(wallet_bob.get_public_key_string())} coins")
    print(f"  Charlie: {blockchain.get_balance(wallet_charlie.get_public_key_string())} coins")
    print(f"  (negative from mining rewards)")
    

def interactive_explorer():
    """Interactive blockchain explorer."""
    
    print("\n" + "█"*80)
    print("█ INTERACTIVE BLOCKCHAIN EXPLORER")
    print("█"*80 + "\n")
    
    # Create a blockchain with some transactions
    blockchain = Blockchain(difficulty=2)
    
    wallet1 = Wallet()
    wallet2 = Wallet()
    wallet3 = Wallet()
    
    # Add some transactions
    for i in range(3):
        tx = wallet1.create_transaction(wallet2.get_public_key_string(), 10 + i*5)
        blockchain.add_transaction(tx)
        blockchain.mine_pending_transactions(wallet1.get_public_key_string())
    
    while True:
        print("\nEXPLORER MENU:")
        print("  1. View full blockchain")
        print("  2. Check balance of an address")
        print("  3. View transaction history")
        print("  4. Validate blockchain")
        print("  5. Get blockchain statistics")
        print("  6. Add new transaction")
        print("  7. Return to main menu")
        
        choice = input("\nEnter choice (1-7): ").strip()
        
        if choice == "1":
            blockchain.print_chain()
        
        elif choice == "2":
            address = input("Enter address (or press Enter for wallet1): ").strip()
            if not address:
                address = wallet1.get_public_key_string()
            balance = blockchain.get_balance(address)
            print(f"\nBalance for {address[:16]}...: {balance} coins")
        
        elif choice == "3":
            address = input("Enter address (or press Enter for wallet1): ").strip()
            if not address:
                address = wallet1.get_public_key_string()
            history = blockchain.get_transaction_history(address)
            print(f"\nTransaction history for {address[:16]}...:")
            for tx in history:
                print(f"  {tx['sender'][:8]}... → {tx['receiver'][:8]}...: {tx['amount']}")
        
        elif choice == "4":
            print("\nValidating blockchain...")
            blockchain.is_chain_valid()
        
        elif choice == "5":
            blockchain.print_stats()
        
        elif choice == "6":
            amount = float(input("Enter amount to send: "))
            tx = wallet1.create_transaction(wallet2.get_public_key_string(), amount)
            blockchain.add_transaction(tx)
            print("Mining new block...")
            blockchain.mine_pending_transactions(wallet1.get_public_key_string())
        
        elif choice == "7":
            break
        
        else:
            print("Invalid choice.")


def run_test_suite():
    """Run comprehensive tests."""
    
    print("\n" + "█"*80)
    print("█ COMPREHENSIVE TEST SUITE")
    print("█"*80 + "\n")
    
    print("Test 1: Genesis block creation")
    print("─" * 40)
    blockchain = Blockchain(difficulty=2)
    assert len(blockchain.chain) == 1
    assert blockchain.chain[0].index == 0
    assert blockchain.is_chain_valid()
    print("✓ PASSED: Genesis block created correctly\n")
    
    print("Test 2: Transaction validation")
    print("─" * 40)
    wallet = Wallet()
    tx = wallet.create_transaction("receiver_address", 50)
    assert tx.signature is not None
    assert tx.verify_signature(wallet.public_key)
    print("✓ PASSED: Transaction signature validation works\n")
    
    print("Test 3: Proof-of-Work validation")
    print("─" * 40)
    for block in blockchain.chain:
        assert block.hash[:blockchain.difficulty] == '0' * blockchain.difficulty
    print(f"✓ PASSED: All blocks have required Proof-of-Work\n")
    
    print("Test 4: Chain integrity")
    print("─" * 40)
    wallet1 = Wallet()
    wallet2 = Wallet()
    
    tx1 = wallet1.create_transaction(wallet2.get_public_key_string(), 100)
    blockchain.add_transaction(tx1)
    blockchain.mine_pending_transactions(wallet1.get_public_key_string())
    
    assert len(blockchain.chain) == 2
    assert blockchain.is_chain_valid()
    print("✓ PASSED: Chain integrity maintained\n")
    
    print("Test 5: Manipulation detection")
    print("─" * 40)
    # Try to modify a transaction
    blockchain.chain[1].transactions[0]['amount'] = 999
    is_valid = blockchain.is_chain_valid()
    assert not is_valid
    print("✓ PASSED: Manipulation detected correctly\n")
    
    print("\n" + "="*80)
    print("ALL TESTS PASSED SUCCESSFULLY!")
    print("="*80)


if __name__ == "__main__":
    try:
        main_menu()
    except KeyboardInterrupt:
        print("\n\nProgram interrupted. Goodbye!")
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
