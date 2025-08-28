# Alchemy vs Graph Protocol Data Consistency Issue

## Issue Overview

**Date:** December 2024
**Status:** Critical - Active Investigation
**Impact:** High - Production data consistency

### Summary
Significant data discrepancy discovered between Alchemy and Graph Protocol subgraph deployments of the same codebase. Graph Protocol subgraph encounters missing mech/service relationships that Alchemy deployment does not experience.

## Technical Details

### Deployment Comparison

| Provider | Block Height | Status | Error Conditions |
|----------|--------------|--------|------------------|
| **Alchemy** | 41,378,232 | ✅ No errors | Never triggers `serviceId === null` or `mech == null` |
| **Graph Protocol** | 39,854,557 | ❌ Errors present | Triggers null checks indicating missing data |

### Code Context
The issue manifests in the `getMech()` function in `utils.ts`:

```typescript
export function getMech(
  mechAddress: Bytes,
  transactionHash: Bytes,
  functionName: string
): Mech | null {
  const serviceId = getServiceIdFromMech(mechAddress);
  if (serviceId === null) {
    log.error('Mech not found - could not find serviceId for mech {} in transaction {} in function {}', [
      mechAddress.toHexString(),
      transactionHash.toHexString(),
      functionName,
    ]);
    return null;
  }

  let mech = Mech.load(serviceId);
  if (mech == null) {
    log.error('Mech not found - attempted to access mech {} (serviceId {}) in transaction {} in function {} which was not created yet', [
      mechAddress.toHexString(),
      serviceId,
      transactionHash.toHexString(),
      functionName,
    ]);
  }
  return mech;
}
```

## Evidence and Observations

### Data Gap Analysis
- **Block Difference:** ~2.3 million blocks (41M - 39M)
- **Missing Events:** `CreateMech` and/or `CreateService` events
- **Data Integrity:** Dune query comparisons show 99% accuracy with Alchemy data

### Error Pattern
Graph Protocol encounters conditions that Alchemy never triggers:
- `if (serviceId == null)` - Mech address not found in CreateMech entities
- `if (mech == null)` - Service entity doesn't exist for valid serviceId

### Validation Results
- **Alchemy:** 100% of tested mechs have valid service relationships
- **Graph Protocol:** Significant percentage of mechs have `service: null`
- **Dune Comparison:** Confirms Alchemy data accuracy

## Potential Root Causes

### 1. RPC Endpoint Differences
- Different blockchain data providers
- Potential for stale or missing blocks on Graph Protocol endpoint
- Network latency affecting real-time data availability

### 2. Indexing Strategy Differences
- Graph Protocol may have different event filtering/caching
- Potential race conditions in event processing order
- Missing historical events during indexing

### 3. Infrastructure Issues
- Graph Protocol node synchronization problems
- Network partitioning affecting data consistency
- Provider-specific block finality handling

### 4. Code Execution Context
- Different execution environments
- Memory/state management differences
- Timing-sensitive operations

## Impact Assessment

### Data Integrity
- Inconsistent mech/service relationship data
- Potential loss of historical transaction context
- Unreliable subgraph for production applications

### Business Impact
- Unpredictable data availability
- Potential downstream application failures
- Loss of trust in subgraph reliability

### Development Impact
- Difficult to debug environment-specific issues
- Testing complexity increased
- Deployment strategy complications

## Investigation Timeline

| Date | Event | Details |
|------|-------|---------|
| Dec 2024 | Initial Discovery | Graph Protocol errors vs Alchemy clean run |
| Dec 2024 | Code Analysis | Identified logging argument mismatch (fixed) |
| Dec 2024 | Data Analysis | Confirmed 99% accuracy with Dune comparisons |
| Dec 2024 | Root Cause Analysis | Identified provider data consistency issue |

## Next Steps

### Immediate Actions
1. **RPC Endpoint Audit**
   - Compare endpoints used by both providers
   - Validate block availability and consistency
   - Test with multiple RPC providers

2. **Data Recovery**
   - Implement fallback mechanisms for missing relationships
   - Add data validation and repair logic
   - Consider historical data re-indexing

### Medium-term Solutions
1. **Provider Redundancy**
   - Implement multi-provider failover strategy
   - Add data consistency checks
   - Monitor provider performance metrics

2. **Code Resilience**
   - Add comprehensive error handling
   - Implement data validation at multiple layers
   - Create recovery mechanisms for missing data

### Long-term Monitoring
1. **Automated Validation**
   - Regular data consistency checks
   - Alert system for provider discrepancies
   - Performance monitoring across providers

## Related Issues

### Code Fixes Applied
- **Logging Fix:** Removed mismatched placeholders in error messages (Dec 2024)
- **File:** `subgraphs/mech-marketplace/src/utils.ts`

### Known Data Issues
- **Null Service Relationships:** Historical mechs with missing service connections
- **Missing Events:** Potential gaps in CreateMech/CreateService event indexing

## Recommendations

### For Development Team
1. **Standardize RPC Providers:** Use consistent, high-reliability endpoints
2. **Implement Monitoring:** Real-time data consistency validation
3. **Add Resilience:** Graceful handling of missing data scenarios

### For Production Deployment
1. **Provider Failover:** Multi-provider redundancy strategy
2. **Data Validation:** Automated checks and repair mechanisms
3. **Alert System:** Immediate notification of data discrepancies

## Contact Information

**Issue Owner:** [Team Member Name]
**Priority:** Critical
**SLA:** 24-48 hours investigation completion

---

*This document serves as a reference for the Alchemy vs Graph Protocol data consistency investigation. Update as new findings emerge.*
