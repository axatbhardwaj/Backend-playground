import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { Transfer } from "../generated/schema"
import { Transfer as TransferEvent } from "../generated/olas/olas"
import { handleTransfer } from "../src/olas"
import { createTransferEvent } from "./olas-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let from = Address.fromString("0x0000000000000000000000000000000000000001")
    let to = Address.fromString("0x0000000000000000000000000000000000000002")
    let value = BigInt.fromI32(1000)
    let transferEvent = createTransferEvent(from, to, value)
    handleTransfer(transferEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("Transfer created and stored", () => {
    assert.entityCount("Transfer", 1)

    // Recreate the event to access its properties (AssemblyScript doesn't support closures)
    let from = Address.fromString("0x0000000000000000000000000000000000000001")
    let to = Address.fromString("0x0000000000000000000000000000000000000002")
    let value = BigInt.fromI32(1000)
    let transferEvent = createTransferEvent(from, to, value)
    
    // Construct the entity ID the same way the handler does: transaction.hash.concatI32(logIndex.toI32())
    let txHash = transferEvent.transaction.hash
    let logIndex = transferEvent.logIndex
    let entityId = txHash.concatI32(logIndex.toI32())

    // Check that the Transfer entity has the correct field values
    assert.fieldEquals(
      "Transfer",
      entityId.toHexString(),
      "from",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "Transfer",
      entityId.toHexString(),
      "to",
      "0x0000000000000000000000000000000000000002"
    )
    assert.fieldEquals(
      "Transfer",
      entityId.toHexString(),
      "value",
      "1000"
    )

    // Also check that block data is present
    assert.fieldEquals(
      "Transfer",
      entityId.toHexString(),
      "blockNumber",
      transferEvent.block.number.toString()
    )
    assert.fieldEquals(
      "Transfer",
      entityId.toHexString(),
      "transactionHash",
      txHash.toHexString()
    )
  })
})
