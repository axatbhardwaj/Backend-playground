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
  console.log('🔍 Checking actual marketplace events...');

  const events = await fetchLogs({
    chainid: String(CHAIN_ID),
    module: 'logs',
    action: 'getLogs',
    fromBlock: '42788144',
    toBlock: 'latest',
    address: MARKETPLACE_ADDRESS,
  });

  console.log(`Found ${events.length} events. Analyzing event signatures...`);

  const signatures = new Map();

  for (const event of events.slice(0, 10)) { // Check first 10 events
    const topic0 = event.topics[0];
    const count = signatures.get(topic0) || 0;
    signatures.set(topic0, count + 1);

    console.log(`\nEvent ${signatures.get(topic0)} with topic0: ${topic0}`);
    console.log(`Topics count: ${event.topics.length}`);
    if (event.topics.length >= 2) {
      console.log(`Topic1: ${event.topics[1]}`);
    }
    console.log(`Data length: ${event.data?.length || 0}`);
  }

  console.log('\n📊 Event signature summary:');
  for (const [sig, count] of signatures) {
    console.log(`${sig}: ${count} events`);
  }
}

main().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
