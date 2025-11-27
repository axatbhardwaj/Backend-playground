# Indexer Discrepancy Investigation: olas-legacy-mech-fees

**Date**: November 27, 2025  
**Subgraph**: olas-legacy-mech-fees  
**Network**: Gnosis  
**Subgraph ID**: `JCYjvfTErSkkFYjGedMHPnTcySpeB1Z81FLYUuEjWXK3`  
**Deployment ID**: `QmWP5gEwn5c1utvKSLxiRQLNpXEN1u4W2Nj8LTvzZT8eKZ`

---

## Executive Summary

We discovered a **significant data discrepancy** between two indexers serving the same subgraph. The `upgradeindexer` consistently reports **~1,000 ETH less** in `totalFeesIn` compared to `wavefive.eth`.

## Indexers Under Investigation

| Indexer | Address | URL |
|---------|---------|-----|
| wavefive.eth | `0x7bb834017672b1135466661d8dd69c5dd0b3bf51` | https://graphprodl2.0xcryptovestor.com |
| upgradeindexer | `0xbdfb5ee5a2abf4fc7bb1bd1221067aef7f9de491` | https://indexer.upgrade.thegraph.com/ |

## Observed Discrepancy

### Data Comparison at Similar Timestamps

| Timestamp | Indexer | totalFeesIn | LegacyMech | MarketPlace |
|-----------|---------|-------------|------------|-------------|
| 2025-11-26T20:55:51 | wavefive.eth | 72,372 | 54,957 | 17,414 |
| 2025-11-26T21:05:51 | upgradeindexer | 71,385 | 54,547 | 16,837 |

**Difference**:
- `totalFeesIn`: ~987 ETH lower
- `totalFeesInLegacyMech`: ~410 ETH lower
- `totalFeesInLegacyMechMarketPlace`: ~577 ETH lower

### Pattern Observed

Every time the gateway routes a query to `upgradeindexer` instead of `wavefive.eth`, all three fee metrics show a **sudden decrease**:

```
2025-11-26T21:05:51  0xbdfb5ee5..  71385  54547  16837  🔄 0x7bb83401.. → 0xbdfb5ee5.. ⚠️ FEES↓ ⚠️ LEGACY↓ ⚠️ MARKET↓
2025-11-26T22:15:51  0xbdfb5ee5..  71389  54548  16840  🔄 0x7bb83401.. → 0xbdfb5ee5.. ⚠️ FEES↓ ⚠️ LEGACY↓ ⚠️ MARKET↓
2025-11-26T22:45:52  0xbdfb5ee5..  71391  54549  16842  🔄 0x7bb83401.. → 0xbdfb5ee5.. ⚠️ FEES↓ ⚠️ LEGACY↓ ⚠️ MARKET↓
```

When routing switches back to `wavefive.eth`, values return to the higher baseline.

## Statistics

- **Monitoring Period**: ~16 hours (2025-11-26 14:45 to 2025-11-27 06:35)
- **Total Indexer Changes**: 25
- **Discrepancy Consistent**: Yes, every switch to `upgradeindexer` showed lower values


## Technical Notes

### Attestation Verification

We verified the serving indexer using EIP-712 attestation signatures:
- Attestation recovers **Allocation ID**, not indexer address directly
- Allocation ID is looked up in Graph Network subgraph to get indexer

### EIP-712 Domain (Arbitrum One)

```javascript
{
  name: "Graph Protocol",
  version: "0",
  chainId: 42161,
  verifyingContract: "0x0ab2b043138352413bb02e67e626a70320e3bd46"
}
```

## Raw Data Sample

```
Timestamp               Indexer         totalFeesIn  LegacyMech  MarketPlace  Flags
2025-11-26T20:55:51     0x7bb83401..    72372        54957       17414
2025-11-26T21:05:51     0xbdfb5ee5..    71385        54547       16837        🔄 FEES↓ LEGACY↓ MARKET↓
2025-11-26T21:35:51     0x7bb83401..    72374        54958       17415        🔄 (back to normal)
```

## Interesting Observation: Sync Status vs Data

From the Graph Explorer (see `Screenshot_20251127_115422.png`):

| Indexer | Blocks Behind | Data Values |
|---------|---------------|-------------|
| upgradeindexer | **0 blocks** (100% synced) | Lower (~71,400 ETH) |
| wavefive.eth | **24 blocks behind** (99.9%) | Higher (~72,400 ETH) |
| ellipfra-indexer | 1,292,146 blocks behind (97%) | Not observed in queries |

**Key Finding**: The fully synced indexer (`upgradeindexer`) returns **lower** values than the indexer that is 24 blocks behind (`wavefive.eth`). This suggests the discrepancy is not due to sync status, but rather **missing historical data** in `upgradeindexer`.

## Scripts Used

| Script | Location | Purpose |
|--------|----------|---------|
| `check_subgraph.js` | `subgraphs /discrepancy-check-lm-fees/` | Fetches data every 10 min, verifies attestation, identifies serving indexer |
| `analyze_fees.js` | `subgraphs /discrepancy-check-lm-fees/` | Analyzes logs, detects fee decreases and indexer changes |

### Usage

```bash
# Start data collection (runs every 10 minutes)
node "subgraphs /discrepancy-check-lm-fees/check_subgraph.js"

# Analyze collected data
node "subgraphs /discrepancy-check-lm-fees/analyze_fees.js"
```

### Output Files

- `response_log.json` - Raw data with timestamps, indexer info, and fee values

## Conclusion

There is a **confirmed data discrepancy** between `wavefive.eth` and `upgradeindexer` for the `olas-legacy-mech-fees` subgraph. 

The `upgradeindexer` (fully synced, 0 blocks behind) is consistently reporting **~1,000 ETH less** in total fees compared to `wavefive.eth` (24 blocks behind). This paradox suggests `upgradeindexer` may have missed early historical events during initial indexing.

This needs to be investigated further and potentially reported as an indexing issue to The Graph team.

