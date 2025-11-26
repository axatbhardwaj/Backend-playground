import json
from eth_account import Account
from eth_account.messages import encode_typed_data
from eth_utils import to_bytes, to_hex, keccak  # Added keccak for hash computation

# POI JSON string
poi_json = '''{"requestCID":"0xabcef9ab9dae5d88dfeaa73fe88225c8f08366225158a0623cfdd3a17af38f01","responseCID":"0x08a1f52bfb6433bb4fa838074885066f8cdf02e1503b6ac71fdf3d39f3c412ff","subgraphDeploymentID":"0x5cf032d1f06809a5ac6d7fd2ceadbf57cff5995c6572ffc67b0048011aa387b0","r":"0x8bb422b6b4846ebaf0dc3806a4ca8b49a2d64db22ae09166ffd5fbcef431215a","s":"0x7a47738eccf3104d0bad43dc8dff9162a8e90ecd60cec7dc17f67cfbe014ef0d","v":0}'''

# Load the JSON
poi = json.loads(poi_json)

# Extract POI fields
request_cid = poi['requestCID']
response_cid = poi['responseCID']
subgraph_deployment_id = poi['subgraphDeploymentID']
r = poi['r']
s = poi['s']
v = poi['v']

# Validate inputs
if not all([request_cid.startswith('0x'), response_cid.startswith('0x'), subgraph_deployment_id.startswith('0x'), 
            r.startswith('0x'), s.startswith('0x'), len(r) == 66, len(s) == 66]):
    print("Error: Invalid input format. Ensure all hex strings are valid and 32 bytes long.")
    exit(1)

# EIP-712 parameters (adjust these based on your network)
chain_id = 1  # Mainnet; change to 4 for Rinkeby, etc.
dispute_manager_address = "0x97307b963662cCA2f7eD50e38dCC555dfFc4FB0b"  # DisputeManager address (Mainnet, verify)
version = "1"  # Protocol version (e.g., "1" or "2")
salt = "0xa070ffb1cd7409649bf77822cce74495468e06dbfaef09556838bf188679b9c2"

# EIP-712 typed data structure
typed_data = {
    "types": {
        "EIP712Domain": [
            {"name": "name", "type": "string"},
            {"name": "version", "type": "string"},
            {"name": "chainId", "type": "uint256"},
            {"name": "verifyingContract", "type": "address"},
            {"name": "salt", "type": "bytes32"},
        ],
        "Receipt": [
            {"name": "requestCID", "type": "bytes32"},
            {"name": "responseCID", "type": "bytes32"},
            {"name": "subgraphDeploymentID", "type": "bytes32"},
        ],
    },
    "primaryType": "Receipt",
    "domain": {
        "name": "Graph Protocol",
        "version": version,
        "chainId": chain_id,
        "verifyingContract": dispute_manager_address,
        "salt": to_bytes(hexstr=salt),
    },
    "message": {
        "requestCID": to_bytes(hexstr=request_cid),
        "responseCID": to_bytes(hexstr=response_cid),
        "subgraphDeploymentID": to_bytes(hexstr=subgraph_deployment_id),
    },
}

# Encode the message for signing
signable_message = encode_typed_data(full_message=typed_data)
print(signable_message)
# Compute message hash manually (no attribute exists; concatenate and keccak)
concatenated = b'\x19' + signable_message.version + signable_message.header + signable_message.body
message_hash = to_hex(keccak(concatenated))
print("Message hash:", message_hash)

# Recover address
try:
    # The signature from ethers.js uses a v that is a recovery ID (0 or 1).
    # We need to convert it to the format expected by recover_message (27 or 28).
    # Then we concatenate r, s, and v to form the full signature.
    signature = to_bytes(hexstr=r) + to_bytes(hexstr=s) + (v + 27).to_bytes(1, 'big')
    recovered = Account.recover_message(signable_message, signature=signature)
    print(f"Recovered indexer address: {recovered}")
    print(f"Subgraph Deployment ID: {subgraph_deployment_id}")
    print("To verify, check if this address is an indexer for the subgraph deployment ID on The Graph Explorer[](https://thegraph.com/explorer) or via the network subgraph.")
except Exception as e:
    print(f"Failed to recover address: {e}")

You can replace the poi_json in that script with the POI you get from the response and just run that script and it should output the recovered indexer's address.