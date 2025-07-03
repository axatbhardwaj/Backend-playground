import os
from web3 import Web3


class ContractFinder:
    """
    A class to find the creation block number of an Ethereum smart contract
    using a binary search algorithm.
    """

    def __init__(self, provider_url: str):
        """
        Initializes the ContractFinder with a connection to an Ethereum node.

        Args:
            provider_url (str): The HTTP or WebSocket provider URL for an Ethereum node.
        """
        self.w3 = Web3(Web3.HTTPProvider(provider_url))
        if not self.w3.is_connected():
            raise ConnectionError("Failed to connect to the Ethereum provider.")

        # Get the latest block number to set the upper bound for our search.
        self.latest_block = self.w3.eth.block_number
        print(f"Successfully connected. Latest block: {self.latest_block}")

    def _get_code_length(self, contract_address: str, block_number: int) -> int:
        """
        Helper function to get the length of a contract's bytecode at a specific block.

        Args:
            contract_address (str): The contract's address.
            block_number (int): The block number to check.

        Returns:
            int: The length of the bytecode. Returns 0 if no code exists.
        """
        # Ensure address is in checksum format
        checksum_address = Web3.to_checksum_address(contract_address)
        try:
            code = self.w3.eth.get_code(checksum_address, block_identifier=block_number)
            return len(code)
        except Exception as e:
            print(
                f"Error getting code for {contract_address} at block {block_number}: {e}"
            )
            return 0

    def find_creation_block(self, contract_address: str) -> int:
        """
        Performs a binary search to find the block number where the contract was created.

        Args:
            contract_address (str): The hexadecimal address of the smart contract.

        Returns:
            int: The block number of the contract's creation.
        """
        print(f"\nSearching for creation block of {contract_address}...")
        return self._binary_search(contract_address, 0, self.latest_block)

    def _binary_search(
        self, contract_address: str, start_block: int, end_block: int
    ) -> int:
        """
        The recursive binary search implementation.

        Args:
            contract_address (str): The contract's address.
            start_block (int): The starting block for the current search range.
            end_block (int): The ending block for the current search range.

        Returns:
            int: The creation block number.
        """
        # Base case: if the range has narrowed to a single block, we've found it.
        if start_block >= end_block:
            return end_block

        # Find the middle of the current search range
        mid_block = (start_block + end_block) // 2

        # Check if the contract has code at the midpoint.
        # The "> 2" check is a safe way to ensure it's not just an empty contract.
        if self._get_code_length(contract_address, mid_block) > 2:
            # If code exists, the creation block is in the lower half (or is the midpoint).
            # We search from the start to the midpoint.
            return self._binary_search(contract_address, start_block, mid_block)
        else:
            # If no code exists, the creation block must be in the upper half.
            # We search from the block *after* the midpoint to the end.
            return self._binary_search(contract_address, mid_block + 1, end_block)


def main():
    """
    Main function to run the contract finder.
    """
    # It's recommended to use an environment variable for your RPC URL.
    provider_url = os.environ.get("ETH_RPC_URL", "YOUR_RPC_URL")
    if provider_url == "YOUR_RPC_URL":
        print(
            "Warning: Using a placeholder RPC URL. Please set the ETH_RPC_URL environment variable."
        )

    try:
        finder = ContractFinder(provider_url)
    except ConnectionError as e:
        print(e)
        return

    # List of contracts to find the creation block for
    contracts_to_check = [
        "0x7E01A500805F8A52FAD229B3015AD130A332B7B3",
        "0x0001a500a6b18995b03f44bb040a5ffc28e45cb0",
    ]

    for contract in contracts_to_check:
        creation_block = finder.find_creation_block(contract)
        print(f"✅ Contract: {contract} | Creation Block: {creation_block}")


if __name__ == "__main__":
    main()
