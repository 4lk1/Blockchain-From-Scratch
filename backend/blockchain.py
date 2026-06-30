"""
Blockchain Module
Manages the blockchain, including chain validation, transaction management, and mining rewards.
"""

from .block import Block
from .transaction import Transaction


class Blockchain:
    """
    Represents the entire blockchain.

    The blockchain is a chain of blocks, each containing transactions.
    It enforces cryptographic validation to ensure integrity and prevent tampering.

    Attributes:
        chain (list): List of Block objects forming the blockchain
        pending_transactions (list): Transactions waiting to be mined
        difficulty (int): Number of leading zeros required for valid Proof-of-Work
        mining_reward (float): Amount awarded to miners for successfully mining a block
    """

    def __init__(self, difficulty=4, mining_reward=10):
        """
        Initialize a new blockchain.

        Args:
            difficulty (int): Number of leading zeros for Proof-of-Work (default: 4)
            mining_reward (float): Reward for mining a block (default: 10)
        """
        self.chain = []
        self.pending_transactions = []
        self.difficulty = difficulty
        self.mining_reward = mining_reward

        # Create the genesis block (first block)
        self.create_genesis_block()

    def create_genesis_block(self):
        """
        Create and add the genesis block (the first block in the chain).

        The genesis block has no previous hash and is manually created.
        """
        genesis_block = Block(0, [], "0")
        genesis_block.mine_block(self.difficulty)
        self.chain.append(genesis_block)

    def get_latest_block(self):
        """
        Get the most recent block in the chain.

        Returns:
            Block: The last block in the chain
        """
        return self.chain[-1]

    def add_transaction(self, transaction):
        """
        Add a transaction to the pending transactions pool.

        The transaction must be properly signed (except for SYSTEM transactions).
        Unsigned or invalid transactions are rejected.

        Args:
            transaction (Transaction): Transaction to add

        Returns:
            bool: True if transaction was added, False otherwise
        """
        # Validate the transaction
        if not transaction.is_valid():
            print("Transaction rejected: Invalid signature or unsigned")
            return False

        self.pending_transactions.append(transaction)
        print(
            f"✓ Transaction added: {transaction.sender[:10]}..."
            f"→{transaction.receiver[:10]}... ({transaction.amount})"
        )
        return True

    def mine_pending_transactions(self, miner_address):
        """
        Mine all pending transactions into a new block.

        This creates a new block containing all pending transactions,
        mines it with Proof-of-Work, and adds a mining reward transaction.

        Args:
            miner_address (str): Address of the miner to receive the reward
        """
        # Create mining reward transaction
        reward_transaction = Transaction("SYSTEM", miner_address, self.mining_reward)
        self.pending_transactions.append(reward_transaction)

        # Create new block with pending transactions
        new_block = Block(
            len(self.chain),
            self.pending_transactions,
            self.get_latest_block().hash,
        )

        # Mine the block
        new_block.mine_block(self.difficulty)

        # Attach difficulty to block for external consumers
        setattr(new_block, "difficulty", self.difficulty)

        # Add block to chain
        self.chain.append(new_block)

        # Clear pending transactions
        self.pending_transactions = []

        # Return the newly mined block for callers that expect it
        return new_block

    def get_balance(self, address):
        """
        Calculate the balance of an address.

        Scans the entire blockchain and sums up all transactions.
        Incoming transactions add to balance, outgoing transactions subtract.

        Args:
            address (str): Wallet address to check balance for

        Returns:
            float: The balance of the address
        """
        balance = 0

        # Scan all blocks in the chain
        for block in self.chain:
            # Scan all transactions in the block
            for transaction in block.transactions:
                # Add incoming transactions
                if transaction.receiver == address:
                    balance += transaction.amount

                # Subtract outgoing transactions
                if transaction.sender == address:
                    balance -= transaction.amount

        return balance

    def is_chain_valid(self):
        """
        Validate the entire blockchain for integrity.

        Checks:
        1. Each block's calculated hash matches stored hash
        2. Previous hash links are correct
        3. Each block's Proof-of-Work is valid (hash has correct leading zeros)
        4. All transaction signatures are valid

        Returns:
            tuple: (is_valid, error_message) - True and empty string if valid
        """
        print("\nValidating blockchain...\n")

        # Check each block in the chain
        for i in range(len(self.chain)):
            current_block = self.chain[i]

            # Recalculate the block's hash
            stored_hash = current_block.hash
            recalculated_hash = current_block.calculate_hash()

            if stored_hash != recalculated_hash:
                error_msg = (
                    f"Block #{i}: Hash mismatch\n"
                    f"   Stored: {stored_hash}\n"
                    f"   Calculated: {recalculated_hash}"
                )
                print(error_msg)
                return False, error_msg

            # Check previous hash link
            if i > 0:
                if current_block.previous_hash != self.chain[i - 1].hash:
                    error_msg = (
                        f"Block #{i}: Previous hash mismatch\n"
                        f"   Expected: {self.chain[i - 1].hash}\n"
                        f"   Got: {current_block.previous_hash}"
                    )
                    print(error_msg)
                    return False, error_msg

            # Check Proof-of-Work against the difficulty used for this block.
            block_difficulty = getattr(current_block, "difficulty", self.difficulty)
            if not current_block.hash.startswith("0" * block_difficulty):
                error_msg = (
                    f"Block #{i}: Invalid Proof-of-Work "
                    f"(insufficient leading zeros)"
                )
                print(error_msg)
                return False, error_msg

            # Validate all transaction signatures
            for j, transaction in enumerate(current_block.transactions):
                if not transaction.is_valid():
                    error_msg = f"Block #{i}, Transaction #{j}: Invalid signature"
                    print(error_msg)
                    return False, error_msg

            print(f"✓ Block #{i}: Valid (hash={current_block.hash[:16]}...)")

        print(f"\n✓ Blockchain is valid! All {len(self.chain)} blocks verified.\n")
        return True, ""

    def get_chain_length(self):
        """
        Get the number of blocks in the chain.

        Returns:
            int: Number of blocks
        """
        return len(self.chain)

    def get_pending_transaction_count(self):
        """
        Get the number of pending transactions.

        Returns:
            int: Number of pending transactions
        """
        return len(self.pending_transactions)

    def get_total_transaction_count(self):
        """
        Get the total number of transactions in the entire chain.

        Returns:
            int: Total transaction count
        """
        count = 0
        for block in self.chain:
            count += len(block.transactions)
        return count

    def print_chain(self):
        """Print a formatted representation of the entire blockchain."""
        print("\n" + "="*80)
        print("BLOCKCHAIN".center(80))
        print("="*80 + "\n")

        for block in self.chain:
            print(f"Block #{block.index}")
            print(f"  Hash: {block.hash}")
            print(f"  Previous Hash: {block.previous_hash}")
            print(f"  Nonce: {block.nonce}")
            print(f"  Timestamp: {block.timestamp}")
            print(f"  Transactions: {len(block.transactions)}")

            for i, tx in enumerate(block.transactions):
                print(
                    f"    [{i}] {tx.sender[:10]}... → "
                    f"{tx.receiver[:10]}... : {tx.amount}"
                )

            print()

    def __repr__(self):
        """String representation of blockchain."""
        return (
            f"Blockchain(blocks={len(self.chain)}, "
            f"pending_txs={len(self.pending_transactions)}, "
            f"difficulty={self.difficulty})"
        )
