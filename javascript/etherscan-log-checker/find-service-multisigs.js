#!/usr/bin/env bun

const API_KEY = 'KWF34FE5A3HCXTE9B6R52F1B3N8XUGTIJ2';
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

async function findActiveServiceMultisigs() {
  console.log('🔍 Finding active service multisigs from recent delivery events...');

  // Get recent delivery events (last 100 blocks)
  const events = await fetchLogs({
    chainid: '100',
    module: 'logs',
    action: 'getLogs',
    fromBlock: '42788300',
    toBlock: 'latest',
    address: '0x735FAAb1c4Ec41128c367AFb5c3baC73509f70bB',
    topic0: TOPIC0_DELIVERY,
  });

  console.log(`Found ${events.length} recent delivery events`);

  const serviceMultisigs = new Set();

  for (const event of events) {
    if (event.topics.length >= 2) {
      // topic1 is likely the service multisig (deliveryMech)
      const serviceMultisig = '0x' + event.topics[1].slice(-40);
      serviceMultisigs.add(serviceMultisig);

      console.log(`📋 Delivery event:`);
      console.log(`   Service Multisig: ${serviceMultisig}`);
      console.log(`   Requester: 0x${event.topics[2]?.slice(-40) || 'N/A'}`);

      // Extract numDeliveries
      if (event.data && event.data.length >= 66) {
        const numDeliveriesHex = '0x' + event.data.slice(2, 66);
        const numDeliveries = BigInt(numDeliveriesHex);
        console.log(`   Num Deliveries: ${numDeliveries}`);
      }
      console.log('');
    }
  }

  console.log(`🎯 Found ${serviceMultisigs.size} unique service multisigs:`);
  Array.from(serviceMultisigs).forEach((multisig, index) => {
    console.log(`   ${index + 1}. ${multisig}`);
  });

  if (serviceMultisigs.size > 0) {
    console.log('\n💡 Try using one of these service multisig addresses in your delivery counter!');
  } else {
    console.log('\n❌ No delivery events found in recent blocks');
  }
}

findActiveServiceMultisigs().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
