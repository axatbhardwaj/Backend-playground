#!/usr/bin/env bun

// Configuration
const FROM_BLOCK = 40630097;
const BLOCK_CHUNK_SIZE = 50000; // Process blocks in smaller chunks to avoid API limits
const BASE_PARAMS = {
  chainid: 100,
  module: 'logs',
  action: 'getLogs',
  address: '0x601024e27f1c67b28209e24272ced8a31fc8151f',
  topic0: '0xb0d013658abb05dd269ff3ab257175d5ae3fa4107d4e142abd96e947cd5cb06f',
  offset: 1000,
  apikey: 'KWF34FE5A3HCXTE9B6R52F1B3N8XUGTIJ2'
};

async function fetchLogsForBlockRange(fromBlock, toBlock, page = 1) {
  const params = new URLSearchParams({
    ...BASE_PARAMS,
    fromBlock: fromBlock.toString(),
    toBlock: toBlock.toString(),
    page: page.toString()
  });

  const url = `https://api.etherscan.io/v2/api?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== "1") {
    // Handle "No records found" gracefully - just return empty array
    if (data.message === "No records found") {
      return [];
    }
    throw new Error(`API error: ${data.message}`);
  }

  return data.result;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function countEventsInBlockRange(fromBlock, toBlock) {
  let totalEvents = 0;
  let page = 1;

  while (true) {
    console.log(`  Fetching page ${page} for blocks ${fromBlock}-${toBlock}...`);
    const events = await fetchLogsForBlockRange(fromBlock, toBlock, page);

    totalEvents += events.length;
    console.log(`  Page ${page}: ${events.length} events (total for this range: ${totalEvents})`);

    // If we got less than 1000 events, we've reached the last page for this block range
    if (events.length < 1000) {
      break;
    }

      // Add delay to avoid rate limiting
      if (page % 3 === 0) {
        console.log("  Pausing for 2 seconds to avoid rate limiting...");
        await sleep(2000);
      }

    page++;
  }

  return totalEvents;
}

async function countEvents() {
  let totalEvents = 0;

  try {
    console.log("Fetching event logs from Etherscan API...");
    console.log(`Processing events in block chunks of ${BLOCK_CHUNK_SIZE} to avoid API limits`);
    console.log(`Starting from block ${FROM_BLOCK}`);

    // First, let's get the latest block to determine our range
    const latestBlockResponse = await fetch(`https://api.etherscan.io/v2/api?chainid=100&module=block&action=getblocknobytime&closest=before&timestamp=${Math.floor(Date.now() / 1000)}&apikey=${BASE_PARAMS.apikey}`);
    const latestBlockData = await latestBlockResponse.json();
    const latestBlock = parseInt(latestBlockData.result);

    console.log(`Latest block: ${latestBlock}`);

    let currentBlock = FROM_BLOCK;

    while (currentBlock <= latestBlock) {
      const toBlock = Math.min(currentBlock + BLOCK_CHUNK_SIZE - 1, latestBlock);

      console.log(`\n📊 Processing block range: ${currentBlock} to ${toBlock}`);
      const eventsInRange = await countEventsInBlockRange(currentBlock, toBlock);
      totalEvents += eventsInRange;

      console.log(`✅ Range ${currentBlock}-${toBlock}: ${eventsInRange} events (grand total: ${totalEvents})`);

      currentBlock = toBlock + 1;

      // Small delay between block ranges
      await sleep(1000);
    }

    console.log(`\n🎉 Total number of events across all blocks: ${totalEvents}`);
    return totalEvents;
  } catch (error) {
    console.error("Error fetching events:", error.message);

    // If we hit rate limiting or API limits, show what we got so far
    if (error.message.includes("403") || error.message.includes("too large")) {
      console.log(`\n⚠️  Hit API limit. Total events fetched so far: ${totalEvents}`);
      return totalEvents;
    }

    throw error;
  }
}

// Run the script
countEvents().catch(console.error);
