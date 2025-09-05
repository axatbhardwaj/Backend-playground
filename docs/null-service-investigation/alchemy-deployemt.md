# Alchemy Deployment Query and Response

## GraphQL Query

```graphql
query MechsOrderedByServiceDeliveriesWithHead {
  meches(orderBy: service__totalDeliveries, orderDirection: desc) {
    address
    mechFactory
    service {
      id
      totalDeliveries
    }
  }
  _meta {
    block { number hash }
    deployment
  }
}
```

## Response

```json
{
  "data": {
    "meches": [
      {
        "address": "0xc05e7412439bd7e91730a6880e18d5d5873f632c",
        "mechFactory": "0x8b299c20f87e3fcbff0e1b86dc0acc06ab6993ef",
        "service": {
          "id": "2182",
          "totalDeliveries": "49462"
        }
      },
      {
        "address": "0xb3c6319962484602b00d5587e965946890b82101",
        "mechFactory": "0x8b299c20f87e3fcbff0e1b86dc0acc06ab6993ef",
        "service": {
          "id": "2235",
          "totalDeliveries": "16336"
        }
      },
      {
        "address": "0x601024e27f1c67b28209e24272ced8a31fc8151f",
        "mechFactory": "0x8b299c20f87e3fcbff0e1b86dc0acc06ab6993ef",
        "service": {
          "id": "2198",
          "totalDeliveries": "6265"
        }
      },
      {
        "address": "0x13f36b1a516290b7563b1de574a02ebeb48926a1",
        "mechFactory": "0x31ffdc795fdf36696b8edf7583a3d115995a45fa",
        "service": {
          "id": "1722",
          "totalDeliveries": "400"
        }
      },
      {
        "address": "0xbead38e4c4777341bb3fd44e8cd4d1ba1a7ad9d7",
        "mechFactory": "0x8b299c20f87e3fcbff0e1b86dc0acc06ab6993ef",
        "service": {
          "id": "2135",
          "totalDeliveries": "387"
        }
      },
      {
        "address": "0x15719caecfafb1b1356255cb167cd2a73bd1555d",
        "mechFactory": "0x8b299c20f87e3fcbff0e1b86dc0acc06ab6993ef",
        "service": {
          "id": "1841",
          "totalDeliveries": "253"
        }
      },
      {
        "address": "0x61b962bf1cf91224b0967c7e726c8ce597569983",
        "mechFactory": "0x65fd74c29463afe08c879a3020323dd7df02da57",
        "service": {
          "id": "2010",
          "totalDeliveries": "232"
        }
      },
      {
        "address": "0xfacaa9dd513af6b5a79b73353daff041925d0101",
        "mechFactory": "0x8b299c20f87e3fcbff0e1b86dc0acc06ab6993ef",
        "service": {
          "id": "2150",
          "totalDeliveries": "165"
        }
      },
      {
        "address": "0x895c50590a516b451668a620a9ef9b8286b9e72d",
        "mechFactory": "0x8b299c20f87e3fcbff0e1b86dc0acc06ab6993ef",
        "service": {
          "id": "1966",
          "totalDeliveries": "93"
        }
      },
      {
        "address": "0xce90357349f87b72dbca6078a0ebf39fddd417fa",
        "mechFactory": "0x8b299c20f87e3fcbff0e1b86dc0acc06ab6993ef",
        "service": {
          "id": "1983",
          "totalDeliveries": "65"
        }
      },
      {
        "address": "0x7771674030b1fac454a292a3ecad0537c798769f",
        "mechFactory": "0x8b299c20f87e3fcbff0e1b86dc0acc06ab6993ef",
        "service": {
          "id": "2093",
          "totalDeliveries": "48"
        }
      },
      {
        "address": "0xe43a68c509886b6eb1147c7cfb20cacec1cea32b",
        "mechFactory": "0x8b299c20f87e3fcbff0e1b86dc0acc06ab6993ef",
        "service": {
          "id": "2267",
          "totalDeliveries": "27"
        }
      },
      {
        "address": "0xa61026515b701c9a123b0587fd601857f368127a",
        "mechFactory": "0x8b299c20f87e3fcbff0e1b86dc0acc06ab6993ef",
        "service": {
          "id": "1999",
          "totalDeliveries": "17"
        }
      },
      {
        "address": "0xd2949b547c4f226d2e9e6e2351a6dfd2e4c1dea0",
        "mechFactory": "0x8b299c20f87e3fcbff0e1b86dc0acc06ab6993ef",
        "service": {
          "id": "2266",
          "totalDeliveries": "14"
        }
      },
      {
        "address": "0x55426a0b38e05fd4ff82a92c276cdc4f0f58bc36",
        "mechFactory": "0x8b299c20f87e3fcbff0e1b86dc0acc06ab6993ef",
        "service": {
          "id": "2095",
          "totalDeliveries": "1"
        }
      },
      {
        "address": "0x561c27bf8f9683b6c40ab318f9e00aae50a58bf8",
        "mechFactory": "0x8b299c20f87e3fcbff0e1b86dc0acc06ab6993ef",
        "service": {
          "id": "2259",
          "totalDeliveries": "0"
        }
      },
      {
        "address": "0x5946682851bd17a4adbfbc1de81639d8c0d93cb5",
        "mechFactory": "0x8b299c20f87e3fcbff0e1b86dc0acc06ab6993ef",
        "service": {
          "id": "2246",
          "totalDeliveries": "0"
        }
      },
      {
        "address": "0x1b90270a0caeebe7eb49d0b16ed3f9879dcd6785",
        "mechFactory": "0x8b299c20f87e3fcbff0e1b86dc0acc06ab6993ef",
        "service": {
          "id": "2240",
          "totalDeliveries": "0"
        }
      },
      {
        "address": "0xe904fad5d67bf9bde6975b252f3d41a94a333575",
        "mechFactory": "0x8b299c20f87e3fcbff0e1b86dc0acc06ab6993ef",
        "service": {
          "id": "2162",
          "totalDeliveries": "0"
        }
      },
      {
        "address": "0x39d2ddcc6c1ec2c4c06190b280ce47b2db7bf75d",
        "mechFactory": "0x8b299c20f87e3fcbff0e1b86dc0acc06ab6993ef",
        "service": {
          "id": "2136",
          "totalDeliveries": "0"
        }
      },
      {
        "address": "0xeeb586cd073d0b88509390bc5778ffcdf29e1b56",
        "mechFactory": "0x8b299c20f87e3fcbff0e1b86dc0acc06ab6993ef",
        "service": {
          "id": "2132",
          "totalDeliveries": "0"
        }
      },
      {
        "address": "0xfc34d50d5eec711ecceb33e834c00c608abc2947",
        "mechFactory": "0x8b299c20f87e3fcbff0e1b86dc0acc06ab6993ef",
        "service": {
          "id": "2105",
          "totalDeliveries": "0"
        }
      },
      {
        "address": "0x45ed9cfcd00584cff17fc429adf917683025c030",
        "mechFactory": "0x8b299c20f87e3fcbff0e1b86dc0acc06ab6993ef",
        "service": {
          "id": "2099",
          "totalDeliveries": "0"
        }
      },
      {
        "address": "0x753a898c81136b845d514234dfb4a297326a1bcc",
        "mechFactory": "0x8b299c20f87e3fcbff0e1b86dc0acc06ab6993ef",
        "service": {
          "id": "2098",
          "totalDeliveries": "0"
        }
      },
      {
        "address": "0xb33a163dbef028185e58547a5cf3e87396b87e02",
        "mechFactory": "0x8b299c20f87e3fcbff0e1b86dc0acc06ab6993ef",
        "service": {
          "id": "2091",
          "totalDeliveries": "0"
        }
      },
      {
        "address": "0x85b5bbe00de0c14f7e2cb71b472469e45aa3433b",
        "mechFactory": "0x8b299c20f87e3fcbff0e1b86dc0acc06ab6993ef",
        "service": {
          "id": "1993",
          "totalDeliveries": "0"
        }
      },
      {
        "address": "0xf2574ffbadf37afc878616b8b2f77fa1d20bb4b4",
        "mechFactory": "0x8b299c20f87e3fcbff0e1b86dc0acc06ab6993ef",
        "service": {
          "id": "1961",
          "totalDeliveries": "0"
        }
      },
      {
        "address": "0x478ad20ed958dcc5ad4aba6f4e4cc51e07a840e4",
        "mechFactory": "0x8b299c20f87e3fcbff0e1b86dc0acc06ab6993ef",
        "service": {
          "id": "1815",
          "totalDeliveries": "0"
        }
      }
    ],
    "_meta": {
      "block": {
        "number": 41958089,
        "hash": "0x8e6cc367b6de2b18300a26f1f31d0d97d3f2fdad9814382277b682908e6c0a81"
      },
      "deployment": "QmXmYWjWh4ADpMh2ccZ779QD16MCNfgUMzR93Co7n4MbTY"
    }
  }
}
```