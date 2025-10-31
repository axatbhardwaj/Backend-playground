#!/usr/bin/env bun

const API_KEY = 'KWF34FE5A3HCXTE9B6R52F1B3N8XUGTIJ2';
const SERVICE_MULTISIG = '0xbce2a5a3f60cf752e5b509dbad604a114c7e64a9';
const TOPIC0_DELIVERY = '0xb1ea35a385d4517ac7b3fb0eac4f62db4f0c5b4cf8b7aef789bbd1db097edb25';

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

async function testDeliveryCounting() {
  console.log('🧪 Testing delivery counting for service multisig...');

  // Test just the last 100 blocks to avoid rate limits
  const events = await fetchLogs({
    chainid: '100',
    module: 'logs',
    action: 'getLogs',
    fromBlock: '42788300', // Very recent blocks
    toBlock: 'latest',
    address: '0x735FAAb1c4Ec41128c367AFb5c3baC73509f70bB',
    topic0: TOPIC0_DELIVERY,
    topic0_1_opr: 'and',
    topic1: '0x' + SERVICE_MULTISIG.toLowerCase().replace(/^0x/,'').padStart(64,'0'),
  });

  console.log(`✅ Found ${events.length} delivery events for this service multisig`);

  let totalDeliveries = 0n;
  for (const event of events) {
    if (event.data && event.data.length >= 66) {
      const numDeliveriesHex = '0x' + event.data.slice(2, 66);
      const numDeliveries = BigInt(numDeliveriesHex);
      totalDeliveries += numDeliveries;
      console.log(`  📦 Event: ${numDeliveries} deliveries`);
    }
  }

  console.log(`\n🎯 Total deliveries found: ${totalDeliveries}`);

  if (events.length > 0) {
    console.log('✅ SUCCESS: Delivery counting is working!');
  } else {
    console.log('❌ No delivery events found for this service multisig');
    console.log('   This could mean:');
    console.log('   1. Service multisig has no deliveries');
    console.log('   2. Wrong multisig address');
    console.log('   3. Wrong topic filtering');
  }
}

testDeliveryCounting().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
