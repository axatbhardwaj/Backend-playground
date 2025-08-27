#!/usr/bin/env python3
"""
Script to count total IDs from GetMultisigsForAgent40 GraphQL query response
"""

import json
import sys


def count_multisig_ids(response_data):
    """
    Count the total number of multisig IDs from GraphQL response

    Args:
        response_data: Dictionary containing the GraphQL response

    Returns:
        int: Total count of multisig IDs
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

        # Count IDs
        id_count = len(multisigs)

        # Print details
        print(f"Total multisig IDs found: {id_count}")

        # Optionally print all IDs
        if id_count > 0:
            print("\nFound IDs:")
            for i, multisig in enumerate(multisigs, 1):
                if "id" in multisig:
                    print(f"{i}. {multisig['id']}")

        return id_count

    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        return 0
    except Exception as e:
        print(f"Error processing data: {e}")
        return 0


def main():
    """Main function to handle different input methods"""

    # Your actual response data
    actual_response = {
        "data": {
            "multisigs": [
                {"id": "0x00a622b7588bef0b07b48e7c10f2acb0ef6e272d"},
                {"id": "0x06d1f8cdb1f126f541e3dc28e7db200b5ebe00eb"},
                {"id": "0x072e95ade0157317b647ceaae3029e4089064ea9"},
                {"id": "0x07aa2653a1119c7b4e328be1102e6c3dd0bb0c81"},
                {"id": "0x0cf0fc61e6ddb6f4b4f142051483821b67cf5caf"},
                {"id": "0x249403d66eec02a1f792d111ed429c8ddcb7a6e2"},
                {"id": "0x25f2dc3834d6355911c13eceb74a5fad8181a0a8"},
                {"id": "0x29e02ba1fdd53325f7ab36ea040c8c01bc5c9b9b"},
                {"id": "0x36bbd5a49ce07a54a646bb2225ab1866068d6e44"},
                {"id": "0x37036d9a0e4ade3898336a42cc31c71387d48b78"},
                {"id": "0x3d6f6870aa8d3a0757dfe3ff222f202a09688099"},
                {"id": "0x41d24de403217ed25f3ed637c5f628a23e2c4156"},
                {"id": "0x426117ee442328f6cf12e8805037ba14bb1f80cf"},
                {"id": "0x450f658e6d30e2b15fd32ee94b5e62805243a279"},
                {"id": "0x4702ca2d1c8e8a0fe8c7e1ee8538604925c3c9d2"},
                {"id": "0x4b00f1a232c28254223c8c177e997ab298e1e40a"},
                {"id": "0x54cf8772cf67f37190eadf300d57adb1ace125d3"},
                {"id": "0x5a4b31942d37d564e5cef4c82340e43fe66686b2"},
                {"id": "0x5efc7b394a916ac8090a7d6221f798abfb9f5510"},
                {"id": "0x5f0c4273ff97ae91fc8d2fc8621b5e37a741d1b1"},
                {"id": "0x604eab0f83daa031beaf652a3d69a2bf6adafca3"},
                {"id": "0x6efb6ca62bc244eb69c91c6fd1b9051dc96489d0"},
                {"id": "0x703a3510e62827d11d8085f9c179bd441f6a8201"},
                {"id": "0x70fae90eb66b779fc368350a051d83dc6c7ff068"},
                {"id": "0x8096f1021fe844ae45562eb961f6e1097f19edb1"},
                {"id": "0x8ed448a0a400647f395b65c93fa6b35ad7514d4a"},
                {"id": "0x8ed5ae443fbb1a36e364ac154887f3150669702a"},
                {"id": "0x98ebe72580a3518f1b4a79e84e5c30d89bda821b"},
                {"id": "0x9aa02a0ef14557d90338dc9e22d9aa4a4fc17d10"},
                {"id": "0x9e29a5601e56b90079e2bcc029a26fb3fce60db9"},
                {"id": "0x9f3abfc3301093f39c2a137f87c525b4a0832ba9"},
                {"id": "0x9fd33068b81c8719a1b2972277a0cc98956b9247"},
                {"id": "0xa11417aebf3932ee895008ede8ea95616f488bcf"},
                {"id": "0xb0df5a11c1186201a588353f322128cb1fc1c6c7"},
                {"id": "0xb58b61ed035e3b9f3fba99261734ad2ec114b6dc"},
                {"id": "0xba01a2b6f4d8d5f5313b3d7283f0db3a01850bbb"},
                {"id": "0xc449f6b1c380eee6dec31f79ace512ec3931bea2"},
                {"id": "0xc7d89ed318cac02cf9719c50157541df2504ea3a"},
                {"id": "0xc8e264f402ae94f69bdef8b1f035f7200cd2b0c7"},
                {"id": "0xca82d0c809ea1de7e911d1c99a55f054d96dfda4"},
                {"id": "0xd32613ed605be41d9c7fbc85f2ccb4fba59778ac"},
                {"id": "0xd46d318de29671ee2e071cb4ce0aa660fbbbb0ec"},
                {"id": "0xe4eaf37b1726634935f679a8f3e00ec2e4e650a0"},
                {"id": "0xe8c7bbf632bff7239e53dab45086ac14d6974bac"},
                {"id": "0xeb4b51e304a2bbfdb0f3003fd2ac6375518f7a32"},
                {"id": "0xf0495218037002b0419ecedc3c6c40fd1d470c78"},
                {"id": "0xf17be80d0525a748b4c15a02c86ea765e8dc88f8"},
                {"id": "0xf38820f03313535a4024dccbe2689aa7cc158f5c"},
            ]
        }
    }

    print("=== Multisig ID Counter ===\n")

    # Using your actual GraphQL response data
    print("Processing actual multisig data:")
    count_multisig_ids(actual_response)


if __name__ == "__main__":
    main()
