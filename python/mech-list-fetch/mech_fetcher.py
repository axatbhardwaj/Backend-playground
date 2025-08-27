#!/usr/bin/env python3
"""
Mech Marketplace Subgraph Data Fetcher

This script fetches mech data from the mech-marketplace subgraph
and groups it by payment type and service ID.
"""

import requests
import json
from typing import Dict, List, Any

# GraphQL endpoint - replace with your actual subgraph endpoint
SUBGRAPH_ENDPOINT = "https://subgraph.satsuma-prod.com/1e739c661bf8/axats-team--633952/mech-marketplace-xdai-fix/api"

# Payment type mapping based on factory addresses
PAYMENT_TYPE_MAPPING = {
    '0x8b299c20f87e3fcbf0e1b86dc0acc06ab6993ef': 'Native Token Pricing (xDAI)',
    '0x31ffdc795fdf36696b8edf7583a3d115995a45fa': 'OLAS Token Pricing',
    '0x65fd74c29463afe08c879a3020323dd7df02da57': 'xDAI Subscription'
}

def fetch_all_mechs() -> List[Dict[str, Any]]:
    """Fetch all mechs with their service IDs and factory addresses"""

    query = """
    query GetAllMechs {
      createMeches(
        first: 100
        orderBy: blockTimestamp
        orderDirection: desc
      ) {
        id
        mech
        serviceId
        mechFactory
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
    """

    response = requests.post(SUBGRAPH_ENDPOINT, json={'query': query})

    if response.status_code == 200:
        data = response.json()
        return data['data']['createMeches']
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return []

def fetch_mechs_by_payment_type(factory_address: str) -> List[Dict[str, Any]]:
    """Fetch mechs for a specific payment type"""

    query = f"""
    query GetMechsByFactory {{
      createMeches(
        where: {{ mechFactory: "{factory_address}" }}
        first: 50
        orderBy: blockTimestamp
        orderDirection: desc
      ) {{
        id
        mech
        serviceId
        mechFactory
        blockNumber
        blockTimestamp
      }}
    }}
    """

    response = requests.post(SUBGRAPH_ENDPOINT, json={'query': query})

    if response.status_code == 200:
        data = response.json()
        return data['data']['createMeches']
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return []

def group_mechs_by_payment_type_and_service(mechs: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Group mechs by payment type and service ID"""

    grouped = {}

    for mech in mechs:
        factory_address = mech['mechFactory'].lower()
        payment_type = PAYMENT_TYPE_MAPPING.get(factory_address, 'Unknown')
        service_id = mech['serviceId']

        if payment_type not in grouped:
            grouped[payment_type] = {}

        if service_id not in grouped[payment_type]:
            grouped[payment_type][service_id] = []

        grouped[payment_type][service_id].append(mech)

    return grouped

def display_grouped_mechs(grouped_mechs: Dict[str, Any]) -> None:
    """Display grouped mech data in a readable format"""

    print("\n=== Mech Data Grouped by Payment Type and Service ID ===\n")

    for payment_type, services in grouped_mechs.items():
        print(f"📂 {payment_type}")
        print("=" * 60)

        for service_id, mechs in services.items():
            print(f"  🔹 Service ID: {service_id}")
            print(f"     📊 Total Mechs: {len(mechs)}")

            for i, mech in enumerate(mechs[:3], 1):  # Show first 3 mechs
                print(f"        {i}. Mech: {mech['mech'][:10]}...")
                print(f"           Block: {mech['blockNumber']}")
                print(f"           Timestamp: {mech['blockTimestamp']}")

            if len(mechs) > 3:
                print(f"           ... and {len(mechs) - 3} more mechs")

            print()

        print()

def main():
    """Main function to fetch and display mech data"""

    print("🔍 Fetching mech data from subgraph...")

    # Fetch all mechs
    all_mechs = fetch_all_mechs()

    if not all_mechs:
        print("❌ No mech data found or error occurred")
        return

    print(f"✅ Found {len(all_mechs)} mechs")

    # Group mechs by payment type and service ID
    grouped_mechs = group_mechs_by_payment_type_and_service(all_mechs)

    # Display results
    display_grouped_mechs(grouped_mechs)

    # Example: Fetch mechs for specific payment type
    print("\n🔍 Example: Fetching Native Token mechs...")
    native_mechs = fetch_mechs_by_payment_type("0x8b299c20F87e3fcBfF0e1B86dC0acC06AB6993EF")
    print(f"✅ Found {len(native_mechs)} Native Token mechs")

if __name__ == "__main__":
    main()
