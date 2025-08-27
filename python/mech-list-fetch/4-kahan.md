# Mech Marketplace Subgraph Data Fetching Guide

## Overview

This guide explains how to fetch mech data from the mech-marketplace subgraph using GraphQL queries. We'll use the `CreateMech` entity to get complete mech information with service IDs and payment types.

## GraphQL Queries

### 1. Get All Mechs

```graphql
# Get all mechs with their service IDs and factory addresses
query GetAllMechs {
  createMeches(
    first: 100
    orderBy: blockTimestamp
    orderDirection: desc
  ) {
    id              # Mech address
    mech            # Mech address (same as id)
    serviceId       # Service ID
    mechFactory     # Factory address for payment type
    blockNumber
    blockTimestamp
    transactionHash
  }
}
```

### 2. Get Native Token Mechs

```graphql
# Get mechs with Native token pricing
query GetNativeMechs {
  createMeches(
    where: { mechFactory: "0x8b299c20F87e3fcBfF0e1B86dC0acC06AB6993EF" }
    first: 50
    orderBy: blockTimestamp
    orderDirection: desc
  ) {
    id
    mech
    serviceId
    mechFactory
    blockNumber
    blockTimestamp
  }
}
```

### 3. Get OLAS Token Mechs

```graphql
# Get mechs with OLAS token pricing
query GetOLASTokenMechs {
  createMeches(
    where: { mechFactory: "0x31ffDC795FDF36696B8eDF7583A3D115995a45FA" }
    first: 50
    orderBy: blockTimestamp
    orderDirection: desc
  ) {
    id
    mech
    serviceId
    mechFactory
    blockNumber
    blockTimestamp
  }
}
```

### 4. Get Subscription Mechs

```graphql
# Get mechs with xDAI subscription model
query GetSubscriptionMechs {
  createMeches(
    where: { mechFactory: "0x65fd74C29463afe08c879a3020323DD7DF02DA57" }
    first: 50
    orderBy: blockTimestamp
    orderDirection: desc
  ) {
    id
    mech
    serviceId
    mechFactory
    blockNumber
    blockTimestamp
  }
}
```

## Payment Type Mapping

Convert factory addresses to payment types:

### Gnosis Chain Factory Addresses:
- `0x8b299c20F87e3fcBfF0e1B86dC0acC06AB6993EF` → **Native Token Pricing (xDAI)**
- `0x31ffDC795FDF36696B8eDF7583A3D115995a45FA` → **OLAS Token Pricing**
- `0x65fd74C29463afe08c879a3020323DD7DF02DA57` → **xDAI Subscription**

### Base Chain Factory Addresses:
- `0x2E008211f34b25A7d7c102403c6C2C3B665a1abe` → **Native Token Pricing (ETH)**
- `0x97371B1C0cDA1D04dFc43DFb50a04645b7Bc9BEe` → **OLAS Token Pricing**
- `0x7beD01f8482fF686F025628e7780ca6C1f0559fc` → **USDC Subscription**

## Group Data by Payment Type and Service ID

Use this JavaScript code to group mechs:

```javascript
const PAYMENT_TYPE_MAPPING = {
  '0x8b299c20f87e3fcbf0e1b86dc0acc06ab6993ef': 'Native Token Pricing (xDAI)',
  '0x31ffdc795fdf36696b8edf7583a3d115995a45fa': 'OLAS Token Pricing',
  '0x65fd74c29463afe08c879a3020323dd7df02da57': 'xDAI Subscription'
};

function groupMechs(mechs) {
  const grouped = {};

  mechs.forEach(mech => {
    const paymentType = PAYMENT_TYPE_MAPPING[mech.mechFactory.toLowerCase()] || 'Unknown';
    const serviceId = mech.serviceId;

    if (!grouped[paymentType]) {
      grouped[paymentType] = {};
    }

    if (!grouped[paymentType][serviceId]) {
      grouped[paymentType][serviceId] = [];
    }

    grouped[paymentType][serviceId].push(mech);
  });

  return grouped;
}
```

## Usage Example

```javascript
// Fetch mechs from subgraph
const response = await fetch('YOUR_SUBGRAPH_ENDPOINT', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: GetAllMechs })
});

const data = await response.json();
const mechs = data.data.createMeches;

// Group by payment type and service ID
const groupedMechs = groupMechs(mechs);

console.log(groupedMechs);
```

## Important Notes

1. Use pagination for large datasets: `first: 100, skip: 0`
2. Order by timestamp: `orderBy: blockTimestamp, orderDirection: desc`

This is the complete guide to fetch mech data with service IDs and payment types! 🚀
