import json
import os
from web3 import Web3
from dotenv import load_dotenv
import time
import math
import sys
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from rich.console import Console
from rich.table import Table
from rich.align import Align

load_dotenv()
start_time = time.time()
# --- Configuration (replace with your actual values) ---
RPC_URLS = [
    url.strip() for url in os.getenv("RPC_URLS", os.getenv("RPC_URL")).split(",")
]
CONTRACT_ADDRESS = "0x82A9c823332518c32a0c0eDC050Ef00934Cf04D4"
# ADDRESS_TO_INVESTIGATE = "0x39FCE6a33596b7319d7941F3F90d256574bcc954"
DEFAULT_MAX_RETRIES = 3  # Max retries for fetching a single chunk

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
w3 = Web3(Web3.HTTPProvider(RPC_URLS[0]))


def check_rpc_urls(rpc_urls):
    healthy_rpcs = []
    with ThreadPoolExecutor(max_workers=len(rpc_urls)) as executor:
        future_to_url = {
            executor.submit(Web3(Web3.HTTPProvider(url)).eth.get_block_number): url
            for url in rpc_urls
        }
        for future in as_completed(future_to_url):
            url = future_to_url[future]
            try:
                future.result()
                healthy_rpcs.append(url)
                print(f"✅ RPC URL is healthy: {url}")
            except Exception as e:
                print(f"❌ RPC URL failed health check: {url} - Error: {e}")
    return healthy_rpcs


if not w3.is_connected():
    print("Failed to connect to Ethereum node. Please check your RPC_URL(s).")
    exit()

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


def fetch_single_chunk(
    rpc_url,
    contract_address,
    abi,
    event_name,
    from_block,
    to_block,
    max_retries=DEFAULT_MAX_RETRIES,
):
    retries = 0
    while retries <= max_retries:
        try:
            w3_instance = Web3(Web3.HTTPProvider(rpc_url))
            contract_instance = w3_instance.eth.contract(
                address=Web3.to_checksum_address(contract_address), abi=abi
            )
            event_contract = getattr(contract_instance.events, event_name)()

            # The get_logs call will make its own HTTP request. The explicit requests.get call was incorrect.
            logs_chunk = event_contract.get_logs(
                from_block=from_block, to_block=to_block
            )
            return logs_chunk
        except requests.exceptions.HTTPError as http_err:
            if http_err.response.status_code == 429:  # Too Many Requests
                retries += 1
                print(
                    f"⚠️ Rate Limit (429) for {event_name} from {rpc_url} (Blocks: {from_block}-{to_block}). Retrying in 10s (Attempt {retries}/{max_retries})."
                )
                time.sleep(10)  # Wait for 10 seconds before retrying
            else:
                print(
                    f"\n❌ HTTP error fetching {event_name} logs for range {from_block}-{to_block} from {rpc_url}: {http_err}"
                )
                return []
        except requests.exceptions.ConnectionError as conn_err:
            print(
                f"\n❌ Connection error fetching {event_name} logs for range {from_block}-{to_block} from {rpc_url}: {conn_err}"
            )
            return []
        except requests.exceptions.Timeout as timeout_err:
            print(
                f"\n❌ Timeout error fetching {event_name} logs for range {from_block}-{to_block} from {rpc_url}: {timeout_err}"
            )
            return []
        except Exception as e:
            print(
                f"\n❌ Unexpected error fetching {event_name} logs for range {from_block}-{to_block} from {rpc_url}: {e}"
            )
            return []
    print(
        f"\nAttempted to fetch chunk {from_block}-{to_block} {max_retries + 1} times and failed."
    )
    return []


# Helper function to fetch logs in chunks
def fetch_event_logs_in_chunks(
    contract, event_name, start_block, end_block, max_range_per_request, rpc_urls
):
    """
    Fetches logs for a specific event from a contract over a large block range
    by breaking it into smaller chunks and fetching them in parallel.
    """
    all_logs = []
    total_blocks = end_block - start_block + 1
    # total_chunks = math.ceil(total_blocks / max_range_per_request)
    start_overall_time = time.time()
    completed_chunks = 0

    num_rpcs = len(rpc_urls)
    blocks_per_rpc = math.ceil(total_blocks / num_rpcs)

    tasks = []
    for i in range(num_rpcs):
        rpc_start_block = start_block + i * blocks_per_rpc
        rpc_end_block = min(rpc_start_block + blocks_per_rpc - 1, end_block)

        if rpc_start_block > rpc_end_block:
            continue

        # Each RPC will handle its segment, but we still need to break it down by max_range_per_request
        for current_from_block in range(
            rpc_start_block, rpc_end_block + 1, max_range_per_request
        ):
            current_to_block = min(
                current_from_block + max_range_per_request - 1, rpc_end_block
            )
            tasks.append(
                (
                    rpc_urls[i],
                    contract.address,
                    ABI,
                    event_name,
                    current_from_block,
                    current_to_block,
                    DEFAULT_MAX_RETRIES,
                )
            )

    with ThreadPoolExecutor(max_workers=len(rpc_urls)) as executor:
        future_to_chunk = {
            executor.submit(fetch_single_chunk, *task): task for task in tasks
        }

        for future in as_completed(future_to_chunk):
            chunk_range_task = future_to_chunk[future]
            try:
                logs_chunk = future.result()
                all_logs.extend(logs_chunk)
            except Exception as exc:
                print(
                    f"Chunk {chunk_range_task[4]}-{chunk_range_task[5]} generated an exception: {exc}"
                )
            finally:
                completed_chunks += 1
                display_progress(
                    completed_chunks,
                    len(tasks),
                    start_overall_time,
                    event_name,
                    start_block,
                    end_block,
                )

    sys.stdout.write("\n")
    sys.stdout.flush()
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
        if getattr(log.args, event_arg) == checksum_address_to_find:
            count += 1
            total_amount += getattr(log.args, amount_arg)
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

# --- Health Check for RPCs ---
print("\n--- Checking RPC URL Health ---")
RPC_URLS = check_rpc_urls(RPC_URLS)
if not RPC_URLS:
    print("No healthy RPC URLs available. Exiting.")
    exit()

# --- Analysis ---
eth_to_usd_rate = fetch_eth_to_usd_rate()

all_analysis_results = {}

console = Console()

for event_key in selected_event_keys:
    if event_key in EVENT_CONFIGS:
        event_info = EVENT_CONFIGS[event_key]
        event_name = event_info["name"]
        event_arg = event_info["event_arg"]
        amount_arg = event_info["amount_arg"]

        print(f"\n--- Fetching {event_name} Logs ---")
        logs = fetch_event_logs_in_chunks(
            contract,
            event_name,
            start_block_overall,
            end_block_overall,
            MAX_BLOCK_RANGE_PER_REQUEST,
            RPC_URLS,
        )

        for address in ADDRESSES_TO_INVESTIGATE:
            if address not in all_analysis_results:
                all_analysis_results[address] = {}

            analysis_results = analyze_event_logs(logs, address, event_arg, amount_arg)

            eth_amount = analysis_results["total_amount"] / 10**18
            usd_value = None
            if eth_to_usd_rate is not None:
                usd_value = eth_amount * eth_to_usd_rate

            all_analysis_results[address][event_name] = {
                "count": analysis_results["count"],
                "total_amount_eth": eth_amount,
                "total_amount_usd": usd_value,
            }
    else:
        print(f"Warning: Invalid event selection: {event_key}. Skipping.")

end_time = time.time()
print(f"Time taken: {end_time - start_time:.2f} seconds")

console.print("\n--- Analysis Results ---")

for address, events_data in all_analysis_results.items():
    table = Table(
        title=f"Results for Address: {address}",
        show_lines=True,
        title_style="bold magenta",
    )

    table.add_column("Event Name", style="cyan", no_wrap=False)
    table.add_column("Count", style="magenta", justify="center")
    table.add_column("Total Amount ETH", style="green", justify="right")
    table.add_column("Total Amount USD", style="yellow", justify="right")

    for event_name, data in events_data.items():
        eth_str = f'{data["total_amount_eth"]:.6f}'
        usd_str = (
            f'{data["total_amount_usd"]:.2f}'
            if data["total_amount_usd"] is not None
            else "N/A"
        )
        table.add_row(event_name, str(data["count"]), eth_str, usd_str)
    console.print(Align.center(table))
