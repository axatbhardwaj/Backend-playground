#!/usr/bin/env bun

const API_KEY = 'KWF34FE5A3HCXTE9B6R52F1B3N8XUGTIJ2';
const CHAIN_ID = 100; // 100=Gnosis, 8453=Base
const FROM_BLOCK = 40630097;
const BLOCK_CHUNK_SIZE = 50000;

const MECH_ADDRESS = '0x601024e27f1c67b28209e24272ced8a31fc8151f';
const SERVICE_MULTISIG = '0xc05e7412439bd7e91730a6880e18d5d5873f632c'; // Active service multisig found from delivery events
// topic0 hashes (computed via keccak256)
const TOPIC0_REQUEST = '0x36dd74e91e7cc09291294fa24f2a7feb53900de7d97f93c06ff9476585b7781b'; // keccak("Request(address,bytes32,bytes)")
// Found actual topic hash from marketplace contract events
const TOPIC0_DELIVERY = '0xb1ea35a385d4517ac7b3fb0eac4f62db4f0c5b4cf8b7aef789bbd1db097edb25'; // Actual delivery event hash

async function fetchLogs(params) {
  const p = new URLSearchParams({ ...params, apikey: API_KEY });
  const url = `https://api.etherscan.io/v2/api?${p.toString()}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  if (j.status !== '1' && j.message !== 'No records found') {
    throw new Error(j.message || 'unknown error');
  }
  return j.result || [];
}

async function latestBlock() {
  const url = `https://api.etherscan.io/v2/api?chainid=${CHAIN_ID}&module=block&action=getblocknobytime&closest=before&timestamp=${Math.floor(Date.now()/1000)}&apikey=${API_KEY}`;
  const r = await fetch(url);
  const j = await r.json();
  return parseInt(j.result);
}

async function countPaged(params) {
  let total = 0, page = 1;
  for (;;) {
    const res = await fetchLogs({ ...params, page: String(page), offset: '1000' });
    total += res.length;
    if (res.length < 1000) return total;
    if (page % 2 === 0) await new Promise(r => setTimeout(r, 2000)); // More conservative rate limiting
    page++;
  }
}

async function sumNumDeliveries(params) {
  let sum = 0n, page = 1;
  for (;;) {
    const res = await fetchLogs({ ...params, page: String(page), offset: '1000' });
    for (const log of res) {
      // Extract numDeliveries from the first 32 bytes of data
      if (!log.data || log.data.length < 66) continue;
      const numDeliveriesHex = '0x' + log.data.slice(2, 66);
      const numDeliveries = BigInt(numDeliveriesHex);
      sum += numDeliveries;
    }
    if (res.length < 1000) return sum;
    if (page % 2 === 0) await new Promise(r => setTimeout(r, 2000)); // More conservative rate limiting
    page++;
  }
}

async function main() {
  // Validate configuration
  if (SERVICE_MULTISIG.includes('replace-with')) {
    console.error('❌ Error: Please replace <replace-with-service-latestMultisig> with the actual service multisig address');
    process.exit(1);
  }

  console.log('🔍 Starting delivery analysis...');
  console.log(`📊 Analyzing blocks from ${FROM_BLOCK} onwards in chunks of ${BLOCK_CHUNK_SIZE}`);
  console.log(`🔗 Mech Address: ${MECH_ADDRESS}`);
  console.log(`👥 Service Multisig: ${SERVICE_MULTISIG}`);

  const latest = await latestBlock();
  console.log(`📈 Latest block: ${latest}`);

  let from = FROM_BLOCK;
  let onChainCount = 0;
  let offChainSum = 0n;

  while (from <= latest) {
    const to = Math.min(from + BLOCK_CHUNK_SIZE - 1, latest);
    console.log(`\n📦 Processing block range: ${from} to ${to}`);

    // On-chain: Request events at mech address
    console.log(`  🔗 Counting on-chain Request events...`);
    const onChainInRange = await countPaged({
      chainid: String(CHAIN_ID),
      module: 'logs',
      action: 'getLogs',
      fromBlock: String(from),
      toBlock: String(to),
      address: MECH_ADDRESS,
      topic0: TOPIC0_REQUEST,
    });
    onChainCount += onChainInRange;
    console.log(`  ✅ On-chain events in range: ${onChainInRange} (total: ${onChainCount})`);

    // Off-chain: Delivery events filtered by service multisig (topic1 = deliveryMech based on analysis)
    console.log(`  📬 Summing off-chain delivery numbers...`);
    const offChainInRange = await sumNumDeliveries({
      chainid: String(CHAIN_ID),
      module: 'logs',
      action: 'getLogs',
      fromBlock: String(from),
      toBlock: String(to),
      address: '0x735FAAb1c4Ec41128c367AFb5c3baC73509f70bB', // MechMarketplace contract address
      topic0: TOPIC0_DELIVERY,
      topic0_1_opr: 'and',
      topic1: '0x' + SERVICE_MULTISIG.toLowerCase().replace(/^0x/,'').padStart(64,'0'),
    });
    offChainSum += offChainInRange;
    console.log(`  ✅ Off-chain deliveries in range: ${offChainInRange} (total: ${offChainSum})`);

    from = to + 1;
    await new Promise(r => setTimeout(r, 1000)); // Increased delay between block ranges
  }

  console.log('\n🎯 Final Results:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 On-chain Request events: ${onChainCount}`);
  console.log(`🚚 Off-chain numDeliveries sum: ${offChainSum.toString()}`);
  console.log(`💎 Total (expected totalRequestsReceived): ${(BigInt(onChainCount) + offChainSum).toString()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
