#!/usr/bin/env bun

const API_KEY = 'KWF34FE5A3HCXTE9B6R52F1B3N8XUGTIJ2';
const CHAIN_ID = 100;
const SERVICE_MULTISIG = '0xbce2a5a3f60cf752e5b509dbad604a114c7e64a9';
const MECH_ADDRESS = '0x601024e27f1c67b28209e24272ced8a31fc8151f';
const MARKETPLACE_ADDRESS = '0x735FAAb1c4Ec41128c367AFb5c3baC73509f70bB';

const TOPIC0_REQUEST = '0x36dd74e91e7cc09291294fa24f2a7feb53900de7d97f93c06ff9476585b7781b';
const TOPIC0_MDW_SIGS = '0x619fc03b152f0495ae4d669627206fbf1b1b14f2bac9cb5443f69fd8214429cf';

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

async function debugQuery(description, params) {
  console.log(`\n🔍 ${description}`);
  console.log(`   Query: ${JSON.stringify(params, null, 2)}`);

  try {
    const results = await fetchLogs(params);
    console.log(`   ✅ Found ${results.length} events`);

    if (results.length > 0) {
      console.log(`   📋 First event sample:`);
      console.log(`      Address: ${results[0].address}`);
      console.log(`      Topics: ${JSON.stringify(results[0].topics)}`);
      console.log(`      Data length: ${results[0].data?.length || 0}`);
      if (results[0].data && results[0].data.length > 66) {
        const numDeliveriesHex = '0x' + results[0].data.slice(2, 66);
        console.log(`      numDeliveries (if applicable): ${BigInt(numDeliveriesHex)}`);
      }
    }

    return results;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return [];
  }
}

async function main() {
  console.log('🐛 Delivery Counter Debug Tool');
  console.log('==============================');
  console.log(`Service Multisig: ${SERVICE_MULTISIG}`);
  console.log(`Mech Address: ${MECH_ADDRESS}`);
  console.log(`Marketplace Address: ${MARKETPLACE_ADDRESS}`);

  // Test 1: Check if mech address has any events at all
  await debugQuery('Test 1: Any events from mech address (last 100 blocks)', {
    chainid: String(CHAIN_ID),
    module: 'logs',
    action: 'getLogs',
    fromBlock: '42788144',
    toBlock: 'latest',
    address: MECH_ADDRESS,
  });

  // Test 2: Check Request events specifically
  await debugQuery('Test 2: Request events from mech (last 100 blocks)', {
    chainid: String(CHAIN_ID),
    module: 'logs',
    action: 'getLogs',
    fromBlock: '42788144',
    toBlock: 'latest',
    address: MECH_ADDRESS,
    topic0: TOPIC0_REQUEST,
  });

  // Test 3: Check if marketplace has any events
  await debugQuery('Test 3: Any events from marketplace (last 100 blocks)', {
    chainid: String(CHAIN_ID),
    module: 'logs',
    action: 'getLogs',
    fromBlock: '42788144',
    toBlock: 'latest',
    address: MARKETPLACE_ADDRESS,
  });

  // Test 4: Check MarketplaceDeliveryWithSignatures events
  await debugQuery('Test 4: MarketplaceDeliveryWithSignatures events (last 100 blocks)', {
    chainid: String(CHAIN_ID),
    module: 'logs',
    action: 'getLogs',
    fromBlock: '42788144',
    toBlock: 'latest',
    address: MARKETPLACE_ADDRESS,
    topic0: TOPIC0_MDW_SIGS,
  });

  // Test 5: Check filtered by service multisig
  const topic1Filter = '0x' + SERVICE_MULTISIG.toLowerCase().replace(/^0x/,'').padStart(64,'0');
  await debugQuery('Test 5: Marketplace deliveries filtered by service multisig (last 100 blocks)', {
    chainid: String(CHAIN_ID),
    module: 'logs',
    action: 'getLogs',
    fromBlock: '42788144',
    toBlock: 'latest',
    address: MARKETPLACE_ADDRESS,
    topic0: TOPIC0_MDW_SIGS,
    topic0_1_opr: 'and',
    topic1: topic1Filter,
  });

  console.log('\n🎯 Debug complete!');
  console.log('If all tests show 0 events, check:');
  console.log('1. Service multisig address correctness');
  console.log('2. Mech address correctness');
  console.log('3. Event signature hashes');
  console.log('4. Block range (try different ranges)');
}

main().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
