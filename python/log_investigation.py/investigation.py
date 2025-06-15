import json
import os
from web3 import Web3
from dotenv import load_dotenv
import time
import math
import sys
import requests

load_dotenv()

# --- Configuration (replace with your actual values) ---
RPC_URL = os.getenv("RPC_URL")
CONTRACT_ADDRESS = "0x82A9c823332518c32a0c0eDC050Ef00934Cf04D4"
# ADDRESS_TO_INVESTIGATE = "0x39FCE6a33596b7319d7941F3F90d256574bcc954"

# Map event names to their respective address and amount arguments in the ABI
EVENT_CONFIGS = {
    "1": {"name": "Hearted", "event_arg": "hearter", "amount_arg": "amount"},
    "2": {"name": "Collected", "event_arg": "hearter", "amount_arg": "allocation"},
    "3": {"name": "Summoned", "event_arg": "summoner", "amount_arg": "amount"},
    "4": {"name": "Unleashed", "event_arg": "unleasher", "amount_arg": "liquidity"},
    "5": {
        "name": "Purged",
        "event_arg": "memeToken",
        "amount_arg": "amount",
    },  # memeToken is the token address here
}

# --- Load ABI ---
from abi_memebase import memebase_abi

ABI = memebase_abi

# --- Connect to Ethereum Node ---
w3 = Web3(Web3.HTTPProvider(RPC_URL))

if not w3.is_connected():
    print("Failed to connect to Ethereum node. Please check your RPC_URL.")
    exit()

print(f"Successfully connected to Ethereum node: {w3.client_version}")
contract = w3.eth.contract(address=Web3.to_checksum_address(CONTRACT_ADDRESS), abi=ABI)


# Helper function to display progress
def display_progress(
    current_chunk_idx,
    total_chunks,
    start_time,
    event_name,
    current_from_block,
    current_to_block,
):
    elapsed_time = time.time() - start_time
    progress_percent = (current_chunk_idx / total_chunks) * 100

    if current_chunk_idx > 0:
        avg_time_per_chunk = elapsed_time / current_chunk_idx
        remaining_chunks = total_chunks - current_chunk_idx
        eta_seconds = remaining_chunks * avg_time_per_chunk

        # Format ETA nicely (e.g., minutes and seconds)
        eta_minutes = int(eta_seconds // 60)
        eta_seconds_rem = int(eta_seconds % 60)
        eta_str = f"{eta_minutes}m {eta_seconds_rem}s"
    else:
        eta_str = "N/A"

    # Use \r to return the cursor to the beginning of the line
    sys.stdout.write(
        f"\r  Fetching {event_name} logs for blocks {current_from_block} to {current_to_block}... "
        f"[{progress_percent:.2f}% Done, ETA: {eta_str}]"
    )
    sys.stdout.flush()


# Helper function to fetch logs in chunks
def fetch_event_logs_in_chunks(
    contract, event_name, start_block, end_block, max_range_per_request
):
    """
    Fetches logs for a specific event from a contract over a large block range
    by breaking it into smaller chunks.
    """
    all_logs = []
    event_contract = getattr(contract.events, event_name)()

    total_blocks = end_block - start_block + 1
    total_chunks = math.ceil(total_blocks / max_range_per_request)
    start_overall_time = time.time()
    chunk_idx = 0

    # Iterate through blocks in chunks
    for current_from_block in range(start_block, end_block + 1, max_range_per_request):
        current_to_block = min(
            current_from_block + max_range_per_request - 1, end_block
        )

        # Exit early if the current_from_block has surpassed the current_to_block
        # This can happen if the last chunk is smaller than max_range_per_request
        # and current_from_block is already beyond end_block.
        if current_from_block > current_to_block:
            break

        chunk_idx += 1  # Increment before display for 1-based indexing in display

        # Display progress
        display_progress(
            chunk_idx,
            total_chunks,
            start_overall_time,
            event_name,
            current_from_block,
            current_to_block,
        )

        try:
            logs_chunk = event_contract.get_logs(
                from_block=current_from_block, to_block=current_to_block
            )
            all_logs.extend(logs_chunk)
        except Exception as e:
            print(
                f"Error fetching {event_name} logs for range {current_from_block}-{current_to_block}: {e}"
            )
            # Depending on requirements, you might want to implement retry logic or
            # raise the exception to stop execution. For now, it prints and continues.
    return all_logs


def analyze_event_logs(logs, address_to_find, event_arg, amount_arg):
    """
    Counts how many times a specific address has 'hearted' and the total amount.
    """
    count = 0
    total_amount = 0
    # Ensure the address to find is checksummed for accurate comparison
    checksum_address_to_find = Web3.to_checksum_address(address_to_find)
    for log in logs:
        if log.args[event_arg] == checksum_address_to_find:
            count += 1
            total_amount += log.args[amount_arg]
    return {"count": count, "total_amount": total_amount}


def fetch_eth_to_usd_rate():
    primary_url = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eth.json"
    fallback_url = "https://latest.currency-api.pages.dev/v1/currencies/eth.json"

    try:
        response = requests.get(primary_url)
        response.raise_for_status()  # Raise an exception for HTTP errors
        data = response.json()
        return data["eth"]["usd"]
    except requests.exceptions.RequestException as e:
        print(f"Primary API failed: {e}. Trying fallback URL...")
        try:
            response = requests.get(fallback_url)
            response.raise_for_status()  # Raise an exception for HTTP errors
            data = response.json()
            return data["eth"]["usd"]
        except requests.exceptions.RequestException as e:
            print(f"Fallback API also failed: {e}. Cannot fetch ETH to USD rate.")
            return None


def print_event_analysis(
    event_name, analysis_results, address_to_investigate, eth_to_usd_rate
):
    eth_amount = analysis_results["total_amount"] / 10**18  # Convert to ETH
    if eth_to_usd_rate is not None:
        usd_value = eth_amount * eth_to_usd_rate
        print(
            f"Address {address_to_investigate} has {event_name.lower()} {analysis_results['count']} times with a total amount of {eth_amount:.4f} ETH (${usd_value:.2f})."
        )
    else:
        print(
            f"Address {address_to_investigate} has {event_name.lower()} {analysis_results['count']} times with a total amount of {eth_amount:.4f} ETH (USD value not available)."
        )


# Define the total range and chunk size based on the problem statement
TOTAL_BLOCKS_TO_FETCH = 432000  # on base blockchain 1 day = 432000 blocks
MAX_BLOCK_RANGE_PER_REQUEST = 500  # Alchemy's 500 block limit

# Determine the overall block range for investigation
current_block_number = w3.eth.block_number
# end_block_overall = current_block_number
end_block_overall = 31589310
start_block_overall = max(
    0, end_block_overall - TOTAL_BLOCKS_TO_FETCH
)  # Ensure block number doesn't go below 0

print(
    f"Starting log investigation from block {start_block_overall} to {end_block_overall} (total {end_block_overall - start_block_overall + 1} blocks)"
)

# Get user input for events to analyze
print(
    "\nSelect events to analyze (comma-separated numbers, or type '*' for all events):"
)
for key, config in EVENT_CONFIGS.items():
    print(f"{key}. {config['name']}")

event_choices_input = input("Enter your choices: ")

if event_choices_input.lower() == "*":
    selected_event_keys = list(EVENT_CONFIGS.keys())
else:
    selected_event_keys = [key.strip() for key in event_choices_input.split(",")]

# Get user input for addresses to investigate
addresses_input = input("\nEnter addresses to investigate (comma-separated): ")
ADDRESSES_TO_INVESTIGATE = [addr.strip() for addr in addresses_input.split(",")]

# --- Analysis ---
eth_to_usd_rate = fetch_eth_to_usd_rate()

for event_key in selected_event_keys:
    if event_key in EVENT_CONFIGS:
        event_info = EVENT_CONFIGS[event_key]
        event_name = event_info["name"]
        event_arg = event_info["event_arg"]
        amount_arg = event_info["amount_arg"]

        print(f"\n--- Analyzing {event_name} Events ---")

        # Fetch logs for the selected event type
        current_event_logs = fetch_event_logs_in_chunks(
            contract,
            event_name,
            start_block_overall,
            end_block_overall,
            MAX_BLOCK_RANGE_PER_REQUEST,
        )

        for address in ADDRESSES_TO_INVESTIGATE:
            analysis_results = analyze_event_logs(
                current_event_logs, address, event_arg, amount_arg
            )
            # Special handling for Purged event address display
            display_event_name = event_name
            if event_name == "Purged":
                display_event_name = "Purged (as memeToken)"
            print_event_analysis(
                display_event_name, analysis_results, address, eth_to_usd_rate
            )
    else:
        print(f"Warning: Invalid event selection: {event_key}. Skipping.")
