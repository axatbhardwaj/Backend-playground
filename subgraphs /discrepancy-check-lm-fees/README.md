# Subgraph Discrepancy Check Script

This script fetches data from a Graph Subgraph, verifies the cryptographic attestation provided by the Indexer, and logs which indexer served the response.

## Key Discovery: Attestation Verification Nuances

During development, we encountered several important nuances that are worth documenting:

### 1. The Graph Network Runs on Arbitrum One

The Graph Network has **migrated from Ethereum Mainnet to Arbitrum One**. This means the EIP-712 domain parameters must use:

| Parameter | Value |
|-----------|-------|
| `chainId` | `42161` (Arbitrum One) |
| `verifyingContract` | `0x0ab2b043138352413bb02e67e626a70320e3bd46` (DisputeManager on Arbitrum) |
| `version` | `"0"` |

**Common Mistake**: Using Mainnet parameters (`chainId: 1`, Mainnet DisputeManager) will recover incorrect addresses.

### 2. Recovered Address is an Allocation ID, NOT the Indexer

When you verify the attestation signature, the recovered address is the **Allocation ID**, not the Indexer's address directly.

```
Attestation Signature → Allocation ID → Indexer Address
```

To identify which indexer served your query, you must:
1. Recover the Allocation ID from the attestation
2. Look up that Allocation in the Graph Network subgraph
3. Get the Indexer address from the Allocation entity

### 3. Graph Network Subgraph for Lookups

The script uses the **Graph Network subgraph on Arbitrum** to dynamically look up allocation → indexer mappings:

- **Subgraph ID**: `DZz4kDTdmzWLWsV373w2bSmoar3umKKH9y82SUKr5qmp`

This is better than hardcoding allocation mappings since allocations can change over time.

## How It Works

### 1. Configuration
- Loads `GRAPH_GATEWAY_API_KEY` from `.env` (checks parent directory)
- Sets up the target subgraph and Graph Network subgraph URLs
- Defines EIP-712 domain for Arbitrum One

### 2. Data Fetching
- Queries the subgraph via the Graph Gateway
- Extracts the `graph-attestation` header from the HTTP response

### 3. Attestation Verification
1. Parse the attestation JSON from the header
2. Reconstruct the signed message (requestCID, responseCID, subgraphDeploymentID)
3. Use `ethers.verifyTypedData` to recover the **Allocation ID**
4. Query the Graph Network subgraph to look up the Indexer for that Allocation

### 4. Logging
Each entry in `response_log.json` (stored in script directory) contains:
- `timestamp`: When the check ran
- `allocationId`: The recovered allocation address
- `indexer`: The indexer's Ethereum address
- `indexerName`: Display name or URL of the indexer
- `data`: The GraphQL response data (fees, block info)

## Usage

1. Ensure `.env` file exists with `GRAPH_GATEWAY_API_KEY` (in project root or parent)

2. Run the data collection script:
   ```bash
   node check_subgraph.js
   ```

3. Analyze the collected data:
   ```bash
   node analyze_fees.js
   ```

4. Check `response_log.json` for raw output history

## Scripts

### `check_subgraph.js`
- Fetches subgraph data every 10 minutes
- Verifies attestations and identifies serving indexer
- Logs results to `response_log.json`

### `analyze_fees.js`
- Analyzes `response_log.json` for discrepancies
- Detects when fees decrease (⚠️) - indicates indexer data mismatch
- Detects indexer changes (🔄) - shows which indexer switched
- Outputs summary with total fee increases

**Note**: All logs are stored in the same directory as the scripts, regardless of where you run them from.

## EIP-712 Domain Reference

```javascript
const DOMAIN = {
  name: "Graph Protocol",
  version: "0",
  chainId: 42161, // Arbitrum One
  verifyingContract: "0x0ab2b043138352413bb02e67e626a70320e3bd46",
  salt: "0xa070ffb1cd7409649bf77822cce74495468e06dbfaef09556838bf188679b9c2"
};

const TYPES = {
  Receipt: [
    { name: "requestCID", type: "bytes32" },
    { name: "responseCID", type: "bytes32" },
    { name: "subgraphDeploymentID", type: "bytes32" }
  ]
};
```

## Subgraph Details

- **Name**: olas-legacy-mech-fees
- **Subgraph ID**: `JCYjvfTErSkkFYjGedMHPnTcySpeB1Z81FLYUuEjWXK3`
- **Deployment ID**: `QmWP5gEwn5c1utvKSLxiRQLNpXEN1u4W2Nj8LTvzZT8eKZ`
- **Network**: Gnosis

## Dependencies

```bash
npm install ethers graphql-request dotenv
```
