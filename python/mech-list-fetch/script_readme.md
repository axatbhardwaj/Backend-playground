# Mech Fetcher Script

A simple Python script to fetch and organize mech data from the mech-marketplace subgraph.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Update the subgraph endpoint in `mech_fetcher.py`:
```python
SUBGRAPH_ENDPOINT = "https://your-actual-subgraph-endpoint.com/graphql"
```

## Usage

Run the script:
```bash
python mech_fetcher.py
```

## What it does:

1. **Fetches all mechs** using the CreateMech entity
2. **Groups them by payment type** using factory addresses:
   - `0x8b299c20f87e3fcbff0e1b86dc0acc06ab6993ef` → Native Token Pricing (xDAI)
   - `0x31ffdc795fdf36696b8edf7583a3d115995a45fa` → OLAS Token Pricing
   - `0x65fd74c29463afe08c879a3020323dd7df02da57` → xDAI Subscription

3. **Groups by service ID** within each payment type
4. **Displays results** in a readable format

## Example Output:

```
🔍 Fetching mech data from subgraph...
✅ Found 25 mechs

=== Mech Data Grouped by Payment Type and Service ID ===

📂 Native Token Pricing (xDAI)
============================================================
  🔹 Service ID: 1
     📊 Total Mechs: 3
        1. Mech: 0x12345678...
           Block: 12345678
           Timestamp: 1698765432
        2. Mech: 0x87654321...
           Block: 12345679
           Timestamp: 1698765433
        3. Mech: 0xabcd1234...
           Block: 12345680
           Timestamp: 1698765434

📂 OLAS Token Pricing
============================================================
  🔹 Service ID: 2
     📊 Total Mechs: 1
        1. Mech: 0xef123456...
           Block: 12345681
           Timestamp: 1698765435
```

## Functions Available:

- `fetch_all_mechs()` - Get all mechs with service IDs and factory addresses
- `fetch_mechs_by_payment_type(factory_address)` - Get mechs for specific payment type
- `group_mechs_by_payment_type_and_service(mechs)` - Group mechs by payment type and service ID
- `display_grouped_mechs(grouped_mechs)` - Display results in readable format

## Customization:

You can modify the script to:
- Change the number of mechs fetched (`first: 100`)
- Add more fields to the GraphQL queries
- Implement pagination for large datasets
- Save results to JSON/CSV files
- Add error handling and retries

This script demonstrates the basic approach for fetching mech data as described in the documentation!
