"""
Attack Module
Simulates a 51% attack on the blockchain.

This file provides a reproducible, educational simulation of a 51% attack
and returns structured results suitable for the API and frontend.
"""

from .blockchain import Blockchain
from .transaction import Transaction
from .wallet import Wallet


class Attack51Percent:
    """Simulates a 51% attack scenario and returns a result summary."""

    def __init__(self, difficulty: int = 3):
        self.difficulty = difficulty
        # Public and private chains used in the simulation
        self.public_chain = Blockchain(difficulty=difficulty, mining_reward=10)
        self.attacker_chain = Blockchain(difficulty=difficulty, mining_reward=10)
        # Wallet placeholders
        self.attacker_wallet = Wallet()
        self.victim_wallet = Wallet()

    def execute_attack(self) -> dict:
        """
        Execute the attack scenario and return a structured dictionary
        describing the outcome.
        """
        # Reset chains and wallets to a clean state for each run
        self.public_chain = Blockchain(difficulty=self.difficulty, mining_reward=10)
        self.attacker_chain = Blockchain(difficulty=self.difficulty, mining_reward=10)
        self.attacker_wallet = Wallet()
        self.victim_wallet = Wallet()

        # Seed initial funds to both attacker and victim
        initial_tx1 = Transaction("SYSTEM", self.attacker_wallet.get_address(), 100)
        initial_tx2 = Transaction("SYSTEM", self.victim_wallet.get_address(), 100)
        self.public_chain.add_transaction(initial_tx1)
        self.public_chain.add_transaction(initial_tx2)
        # Mine to assign balances
        system_miner = Wallet()
        self.public_chain.mine_pending_transactions(system_miner.get_address())

        initial_attacker_balance = self.public_chain.get_balance(self.attacker_wallet.get_address())
        initial_victim_balance = self.public_chain.get_balance(self.victim_wallet.get_address())

        # Victim makes a purchase sending coins to attacker on the public chain
        purchase_amount = 50
        purchase_tx = Transaction(
            self.victim_wallet.get_address(),
            self.attacker_wallet.get_address(),
            purchase_amount,
        )
        purchase_tx.sign_transaction(self.victim_wallet)
        self.public_chain.add_transaction(purchase_tx)
        miner1 = Wallet()
        self.public_chain.mine_pending_transactions(miner1.get_address())

        # Attacker builds a private chain starting from the same initial state
        sync_tx1 = Transaction("SYSTEM", self.attacker_wallet.get_address(), 100)
        sync_tx2 = Transaction("SYSTEM", self.victim_wallet.get_address(), 100)
        self.attacker_chain.add_transaction(sync_tx1)
        self.attacker_chain.add_transaction(sync_tx2)
        attacker_miner1 = Wallet()
        self.attacker_chain.mine_pending_transactions(attacker_miner1.get_address())

        # Attacker mines additional private blocks to overtake the public chain
        for _ in range(3):
            dummy_tx = Transaction("SYSTEM", self.attacker_wallet.get_address(), 0)
            self.attacker_chain.add_transaction(dummy_tx)
            attacker_miner = Wallet()
            self.attacker_chain.mine_pending_transactions(attacker_miner.get_address())

        # On private chain, attacker adds a reverse transaction to undo the public purchase
        reverse_tx = Transaction(
            self.attacker_wallet.get_address(),
            self.victim_wallet.get_address(),
            purchase_amount,
        )
        reverse_tx.sign_transaction(self.attacker_wallet)
        self.attacker_chain.add_transaction(reverse_tx)
        miner_reverse = Wallet()
        self.attacker_chain.mine_pending_transactions(miner_reverse.get_address())

        public_len = self.public_chain.get_chain_length()
        attacker_len = self.attacker_chain.get_chain_length()

        success = False
        if attacker_len > public_len:
            # Attacker's private chain replaces public chain
            self.public_chain = self.attacker_chain
            success = True

        final_attacker_balance = self.public_chain.get_balance(self.attacker_wallet.get_address())
        final_victim_balance = self.public_chain.get_balance(self.victim_wallet.get_address())

        return {
            "attacker_address": self.attacker_wallet.get_address(),
            "victim_address": self.victim_wallet.get_address(),
            "public_chain_length": public_len,
            "attacker_chain_length": attacker_len,
            "initial_victim_balance": initial_victim_balance,
            "final_victim_balance": final_victim_balance,
            "initial_attacker_balance": initial_attacker_balance,
            "final_attacker_balance": final_attacker_balance,
            "double_spend_amount": purchase_amount,
            "success": success,
        }

    def run_attack(self):
        """Run the attack with console output (mostly for debugging/demo)."""
        result = self.execute_attack()
        print("\n51% Attack Simulation Result:")
        for k, v in result.items():
            print(f"  {k}: {v}")
        return result

    def analyze_attack(self):
        """Print an analysis explaining why the attack works."""
        print("\n" + "=" * 80)
        print("51% ATTACK ANALYSIS".center(80))
        print("=" * 80)
        print(
            "\nThis simulation demonstrates how an attacker with majority hash "
            "power can build a longer chain and replace the public chain, "
            "enabling a double-spend."
        )

    def print_chain_comparison(self):
        """Print comparison of public and attacker chains."""
        print("\n" + "=" * 80)
        print("CHAIN COMPARISON".center(80))
        print("=" * 80)
        print("\nPUBLIC CHAIN:")
        print(f"Length: {self.public_chain.get_chain_length()}")
        print(f"Total Transactions: {self.public_chain.get_total_transaction_count()}")
        print(
            "Attacker Balance: "
            f"{self.public_chain.get_balance(self.attacker_wallet.get_address())}"
        )
        print(
            "Victim Balance: "
            f"{self.public_chain.get_balance(self.victim_wallet.get_address())}"
        )
        print("\nATTACKER PRIVATE CHAIN:")
        print(f"Length: {self.attacker_chain.get_chain_length()}")
        print(f"Total Transactions: {self.attacker_chain.get_total_transaction_count()}")
        print(
            "Attacker Balance: "
            f"{self.attacker_chain.get_balance(self.attacker_wallet.get_address())}"
        )
        print(
            "Victim Balance: "
            f"{self.attacker_chain.get_balance(self.victim_wallet.get_address())}"
        )
