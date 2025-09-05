### Mech Marketplace subgraph discrepancy between indexers

#### Summary
- Same code and manifest deployed on two indexers produce different results for `Mech.service`.
- Alchemy shows populated `service` objects; The Graph shows `service: null` for some mechs at the same block height.

#### Evidence (abridged)
- Query used:
```graphql
query MechsOrderedByServiceDeliveriesWithHead {
  meches(orderBy: service__totalDeliveries, orderDirection: desc) {
    address
    mechFactory
    service { id totalDeliveries }
  }
  _meta { block { number hash } deployment }
}
```
- Alchemy response sample: `service: { id: "2182", totalDeliveries: "49462" }`
- The Graph response sample: `service: null`
- Deployments at time of capture:
  - Alchemy `_meta.deployment`: `QmXmYWjWh4ADpMh2ccZ779QD16MCNfgUMzR93Co7n4MbTY`
  - The Graph `_meta.deployment`: `QmT7o3e6tLbRspM643WdQaRTEriA2EEVrY6BdqkCDNtZQg`

Additional direct checks on The Graph:
```graphql
{ service(id: "2267") { id } }
{ createServices(where: { serviceId: "2267" }) { id serviceId } }
```
Both returned null/empty → missing `Service` rows for those IDs.

#### Likely cause
- The Graph deployment missed some `ServiceRegistryL2.CreateService` events during historical indexing (RPC gap or transient indexing error). Without those events, `Service` entities are never created, so the relation `Mech.service` resolves to null at query time.

Notes from mappings/schema:
- `Mech.service` is set to the `serviceId` string on mech creation.
- `Service` is only created in handler `handleCreateService` for `ServiceRegistryL2.CreateService`.
- If that handler never runs for a given `serviceId`, the relation resolves to null even though `Mech.service` contains the id string.

#### Manifest (relevant excerpt)
```yaml
# subgraphs/mech-marketplace/subgraph.gnosis.yaml
- name: ServiceRegistryL2
  # Network alias in deployments: Alchemy used 'xdai', The Graph used 'gnosis'
  network: xdai
  source:
    address: "0x9338b5153AE39BB89f50468E608eD9d764B755fD"
    abi: ServiceRegistryL2
    startBlock: 27871084
```

#### Remediation
- Trigger a full reindex on The Graph (deploy a new version/label) using a reliable archive RPC for Gnosis/xDai.
- If the gap persists, lower `ServiceRegistryL2.startBlock` slightly (below 27,871,084) to ensure all historical `CreateService` logs are replayed, then redeploy and reindex.


#### Validation steps
After reindexing, run:
```graphql
{ service(id: "2267") { id } }
{ createServices(where: { serviceId: "2267" }) { id serviceId } }
```
Expect both to return data and downstream `meches { service { id totalDeliveries } }` to be non-null for those mechs.

#### Impact
- Affected queries: any resolving `Mech.service`, `Service.requests/deliveries`, or aggregations depending on missing `Service` entities.
- Root data and handlers are correct; issue isolated to missed historical event ingestion on The Graph.


