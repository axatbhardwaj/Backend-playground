#!/usr/bin/env python3
"""
Script to count total service IDs from GetServiceIDsForAgent40 GraphQL query response
"""

import json
import sys


def count_service_ids(response_data):
    """
    Count the total number of service IDs from GraphQL response

    Args:
        response_data: Dictionary containing the GraphQL response

    Returns:
        int: Total count of service IDs
    """
    try:
        # Handle different possible response structures
        if isinstance(response_data, str):
            response_data = json.loads(response_data)

        # Extract multisigs from response
        if "data" in response_data:
            multisigs = response_data["data"].get("multisigs", [])
        elif "multisigs" in response_data:
            multisigs = response_data["multisigs"]
        else:
            print("Error: Could not find 'multisigs' in response data")
            return 0

        # Extract service IDs
        service_ids = []
        for multisig in multisigs:
            if "serviceId" in multisig:
                service_ids.append(multisig["serviceId"])

        # Count unique service IDs
        unique_service_ids = list(set(service_ids))
        unique_service_ids.sort()  # Sort for better readability

        total_count = len(service_ids)
        unique_count = len(unique_service_ids)

        # Print details
        print(f"Total service ID entries found: {total_count}")
        print(f"Unique service IDs found: {unique_count}")

        # Print all service IDs
        if total_count > 0:
            print(f"\nAll service IDs (in order of appearance):")
            for i, service_id in enumerate(service_ids, 1):
                print(f"{i}. {service_id}")

            print(f"\nUnique service IDs (sorted):")
            for i, service_id in enumerate(unique_service_ids, 1):
                print(f"{i}. {service_id}")

        return total_count, unique_count

    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        return 0, 0
    except Exception as e:
        print(f"Error processing data: {e}")
        return 0, 0


def main():
    """Main function to handle the service ID counting"""

    # Your actual response data
    actual_response = {
        "data": {
            "multisigs": [
                {"serviceId": 9},
                {"serviceId": 18},
                {"serviceId": 37},
                {"serviceId": 44},
                {"serviceId": 53},
                {"serviceId": 55},
                {"serviceId": 19},
                {"serviceId": 52},
                {"serviceId": 42},
                {"serviceId": 2},
                {"serviceId": 49},
                {"serviceId": 14},
                {"serviceId": 41},
                {"serviceId": 8},
                {"serviceId": 50},
                {"serviceId": 31},
                {"serviceId": 48},
                {"serviceId": 40},
                {"serviceId": 4},
                {"serviceId": 5},
                {"serviceId": 34},
                {"serviceId": 32},
                {"serviceId": 45},
                {"serviceId": 22},
                {"serviceId": 15},
                {"serviceId": 46},
                {"serviceId": 30},
                {"serviceId": 6},
                {"serviceId": 38},
                {"serviceId": 51},
                {"serviceId": 29},
                {"serviceId": 36},
                {"serviceId": 21},
                {"serviceId": 27},
                {"serviceId": 54},
                {"serviceId": 7},
                {"serviceId": 17},
                {"serviceId": 23},
                {"serviceId": 25},
                {"serviceId": 43},
                {"serviceId": 24},
                {"serviceId": 13},
                {"serviceId": 20},
                {"serviceId": 33},
                {"serviceId": 26},
                {"serviceId": 35},
                {"serviceId": 47},
                {"serviceId": 28},
            ]
        }
    }

    print("=== Service ID Counter ===\n")

    # Process the actual service ID data
    print("Processing actual service ID data:")
    count_service_ids(actual_response)


if __name__ == "__main__":
    main()
