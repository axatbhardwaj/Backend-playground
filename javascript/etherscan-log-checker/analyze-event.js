#!/usr/bin/env bun

const API_KEY = 'KWF34FE5A3HCXTE9B6R52F1B3N8XUGTIJ2';
const CHAIN_ID = 100;
const MARKETPLACE_ADDRESS = '0x735FAAb1c4Ec41128c367AFb5c3baC73509f70bB';

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

async function main() {
  console.log('🔍 Analyzing the mystery event structure...');

  const events = await fetchLogs({
    chainid: String(CHAIN_ID),
    module: 'logs',
    action: 'getLogs',
    fromBlock: '42788144',
    toBlock: 'latest',
    address: MARKETPLACE_ADDRESS,
  });

  console.log(`Found ${events.length} events`);

  // Analyze the first few events
  for (let i = 0; i < Math.min(3, events.length); i++) {
    const event = events[i];
    console.log(`\n📋 Event ${i + 1}:`);
    console.log(`   Topic0: ${event.topics[0]}`);
    console.log(`   Topic1: ${event.topics[1]} (address: 0x${event.topics[1].slice(-40)})`);
    console.log(`   Topic2: ${event.topics[2]} (address: 0x${event.topics[2].slice(-40)})`);
    console.log(`   Data length: ${event.data?.length || 0}`);

    if (event.data && event.data.length > 2) {
      // Parse the data - first 32 bytes (64 hex chars) after 0x
      const dataHex = event.data.slice(2);
      if (dataHex.length >= 64) {
        const firstWord = dataHex.slice(0, 64);
        const firstValue = BigInt('0x' + firstWord);
        console.log(`   First data word: ${firstValue} (0x${firstWord})`);

        // Try to interpret as different types
        if (firstValue <= 1000) {
          console.log(`   → Could be numDeliveries: ${firstValue}`);
        }
      }
    }
  }

  console.log('\n🤔 Based on the structure (3 topics, data), this could be:');
  console.log('1. MarketplaceDeliveryWithSignatures - but topic hash doesn\'t match');
  console.log('2. A different event with similar structure');
  console.log('3. An older version of the delivery event');
}

main().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
