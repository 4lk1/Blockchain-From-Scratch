"""
Miner Module
Provides mining functionality with detailed metrics and statistics.
"""

import time
from typing import Any, Optional


class Miner:
    """
    Represents a miner on the blockchain network.

    The miner is responsible for:
    1. Collecting pending transactions
    2. Mining blocks using Proof-of-Work
    3. Receiving mining rewards
    4. Maintaining statistics

    Attributes:
        address (str): The miner's wallet address
        blocks_mined (int): Total number of blocks mined
        total_rewards (float): Total amount of mining rewards received
        mining_times (list): List of mining times for each block
    """

    def __init__(self, address):
        """
        Initialize a new miner.

        Args:
            address (str): The miner's wallet address
        """
        self.address = address
        self.blocks_mined = 0
        self.total_rewards = 0
        self.mining_times = []

    def mine_block(self, blockchain) -> Optional[Any]:
        """
        Mine a block on the given blockchain.

        Reward-only blocks are allowed when the pending pool is empty.

        Args:
            blockchain: The blockchain to mine on

        Returns:
            The newly mined block, or None if mining failed
        """
        pending_count = len(blockchain.pending_transactions)

        print(f"\n{'=' * 60}")
        print(f"MINING BLOCK #{blockchain.get_chain_length()}".center(60))
        print(f"Miner: {self.address[:16]}...".center(60))
        print(f"Pending Transactions: {pending_count}".center(60))
        print(f"{'=' * 60}")

        start_time = time.time()
        block = blockchain.mine_pending_transactions(self.address)
        mining_time = time.time() - start_time

        if block is None:
            return None

        self.mining_times.append(mining_time)
        self.blocks_mined += 1
        self.total_rewards += blockchain.mining_reward

        print("\nMining Statistics:")
        print(f"   Total blocks mined: {self.blocks_mined}")
        print(f"   Total rewards: {self.total_rewards}")
        print(
            f"   Average mining time: "
            f"{sum(self.mining_times) / len(self.mining_times):.2f}s"
        )

        return block

    def get_average_mining_time(self):
        """
        Get the average mining time for this miner.

        Returns:
            float: Average mining time in seconds, or 0 if no blocks mined
        """
        if not self.mining_times:
            return 0
        return sum(self.mining_times) / len(self.mining_times)

    def get_statistics(self):
        """
        Get detailed statistics about the miner.

        Returns:
            dict: Dictionary containing mining statistics
        """
        return {
            "address": self.address,
            "blocks_mined": self.blocks_mined,
            "total_rewards": self.total_rewards,
            "average_mining_time": self.get_average_mining_time(),
            "mining_times": self.mining_times,
        }

    def print_statistics(self):
        """Print formatted mining statistics."""
        print(f"\n{'=' * 60}")
        print("MINER STATISTICS".center(60))
        print(f"{'=' * 60}")
        print(f"Address: {self.address[:16]}...")
        print(f"Blocks Mined: {self.blocks_mined}")
        print(f"Total Rewards: {self.total_rewards}")
        if self.mining_times:
            print(f"Average Mining Time: {self.get_average_mining_time():.2f} seconds")
            print(f"Fastest Mine: {min(self.mining_times):.2f} seconds")
            print(f"Slowest Mine: {max(self.mining_times):.2f} seconds")
        print(f"{'=' * 60}\n")

    def __repr__(self):
        """String representation of miner."""
        return f"Miner(address={self.address[:10]}..., blocks_mined={self.blocks_mined})"
