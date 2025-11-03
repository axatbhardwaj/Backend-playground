import { Transfer as TransferEvent } from "../generated/olas/olas"
import { Transfer, TransferTimeseries } from "../generated/schema"
import { Int8 } from "@graphprotocol/graph-ts"

export function handleTransfer(event: TransferEvent): void {
  // Create regular Transfer entity
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.from = event.params.from
  entity.to = event.params.to
  entity.value = event.params.value
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.save()

  // Create TransferTimeseries entity for aggregation
  // Int8 in The Graph is i64, so we have plenty of space
  // Use block number * large multiplier + logIndex for unique IDs
  let blockNumI64 = event.block.number.toI64()
  let logIdxI64 = event.logIndex.toI64()
  // Use 1M multiplier to ensure uniqueness across blocks
  let timeseriesId = (blockNumI64 * 1000000 + logIdxI64) as Int8
  
  let timeseriesEntity = new TransferTimeseries(timeseriesId)
  timeseriesEntity.timestamp = event.block.timestamp.toI32()
  timeseriesEntity.from = event.params.from
  timeseriesEntity.to = event.params.to
  timeseriesEntity.value = event.params.value
  timeseriesEntity.blockNumber = event.block.number
  timeseriesEntity.transactionHash = event.transaction.hash
  timeseriesEntity.save()
}
