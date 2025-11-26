const { ethers } = require('ethers');

async function fetchBlock(rpcUrl, blockNumber) {
  if (!rpcUrl) {
    throw new Error('RPC URL is required');
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);

  // Parse block number - convert to number if it's a numeric string
  let parsedBlockNumber = blockNumber;
  if (typeof blockNumber === 'string' && /^\d+$/.test(blockNumber)) {
    parsedBlockNumber = parseInt(blockNumber, 10);
  }

  const block = await provider.getBlock(parsedBlockNumber);
  
  if (!block) {
    throw new Error(`Block ${blockNumber} not found`);
  }

  return block;
}

function formatBlock(block) {
  return {
    number: block.number,
    hash: block.hash,
    timestamp: block.timestamp,
    transactions: block.transactions.length,
    gasUsed: block.gasUsed.toString(),
    gasLimit: block.gasLimit.toString(),
    baseFeePerGas: block.baseFeePerGas?.toString(),
  };
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node fetch-block.js <rpc-url> [block-number|latest]');
    process.exit(1);
  }

  const rpcUrl = args[0];
  const blockNumber = args[1] || 'latest';

  try {
    const block = await fetchBlock(rpcUrl, blockNumber);
    const formatted = formatBlock(block);
    
    console.log('Block fetched successfully:');
    console.log(JSON.stringify(formatted, null, 2));
  } catch (error) {
    console.error('Error fetching block:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fetchBlock, formatBlock };

