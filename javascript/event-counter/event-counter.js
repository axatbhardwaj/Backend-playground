import { ethers } from "ethers";

// --- 1. CONFIGURE YOUR DETAILS HERE ---

// Your connection to the blockchain (e.g., from Alchemy, Infura, or a local node)
// Supports multiple RPCs for parallel processing (distributes batches across RPCs)
const RPC_URLS = [
    "https://go.getblock.io/b82362231fd84410b9b4582121db0c54",
    "https://go.getblock.io/cc90d4ef5adf425dbfbdb24ed26e0cc4",
    "https://go.getblock.io/15ac025bb0ff404595fdc9cbd345a625",
    "https://go.getblock.io/e6a5a7a4b276406eb3810639ab5837bd",
    "https://go.getblock.io/8da80ffdb255406fa5daa99756ffaebe",

].filter(Boolean); // Remove any undefined values

// The address of the deployed AgentMech contract
const CONTRACT_ADDRESS = "0x77af31De935740567Cf4fF1986D04B2c964A786a";

// The block range you want to query
const START_BLOCK = 30663133;
const END_BLOCK = 34116661; // You can also use "latest"

// Batch size for querying (to avoid RPC limits)
const BATCH_SIZE = 10000;

// Delay between requests to avoid rate limiting (ms)
const REQUEST_DELAY = 100;

// --- END CONFIGURATION ---


// Minimal ABI from your AgentMech.json, only including the events we need
const abi = [
    "event Deliver(address indexed sender, uint256 requestId, bytes data)",
    "event Request(address indexed sender, uint256 requestId, bytes data)"
];

function createBatches(startBlock, endBlock, batchSize) {
    const batches = [];
    for (let i = startBlock; i <= endBlock; i += batchSize) {
        const batchEnd = Math.min(i + batchSize - 1, endBlock);
        batches.push({ start: i, end: batchEnd });
    }
    return batches;
}

async function createProviders(rpcUrls) {
    const providers = [];
    for (let i = 0; i < rpcUrls.length; i++) {
        try {
            const provider = new ethers.JsonRpcProvider(rpcUrls[i]);
            await provider.getBlockNumber(); // Test the connection
            providers.push(provider);
            console.log(`✅ Connected to RPC ${i + 1}`);
        } catch (error) {
            console.warn(`⚠️ RPC ${i + 1} failed: ${error.message}`);
        }
    }
    if (providers.length === 0) {
        throw new Error("No RPC URLs available");
    }
    return providers;
}

function distributeBatches(batches, providers) {
    const distribution = providers.map(() => []);
    batches.forEach((batch, index) => {
        const providerIndex = index % providers.length;
        distribution[providerIndex].push(batch);
    });
    return distribution;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function countEventsWithParallelRPCs(providers, contractAddress, abi, filter, batches) {
    const distribution = distributeBatches(batches, providers);
    const promises = [];

    for (let i = 0; i < providers.length; i++) {
        const provider = providers[i];
        const providerBatches = distribution[i];

        if (providerBatches.length > 0) {
            const contract = new ethers.Contract(contractAddress, abi, provider);
            const promise = countEventsInBatches(contract, filter, providerBatches, i + 1);
            promises.push(promise);
        }
    }

    const results = await Promise.all(promises);
    return results.reduce((sum, count) => sum + count, 0);
}

async function countEventsInBatches(contract, filter, batches, rpcNumber = null, maxRetries = 3) {
    let totalCount = 0;
    const rpcPrefix = rpcNumber ? `RPC${rpcNumber} ` : '';

    for (const batch of batches) {
        let success = false;
        let attempts = 0;

        while (!success && attempts < maxRetries) {
            try {
                const events = await contract.queryFilter(filter, batch.start, batch.end);
                totalCount += events.length;
                console.log(`  ${rpcPrefix}Batch ${batch.start}-${batch.end}: ${events.length} events`);
                success = true;
            } catch (error) {
                attempts++;
                if (attempts >= maxRetries) {
                    console.warn(`  ⚠️ ${rpcPrefix}Failed batch ${batch.start}-${batch.end} after ${attempts} attempts: ${error.message}`);
                } else {
                    console.warn(`  ⚠️ ${rpcPrefix}Retry ${attempts}/${maxRetries} for batch ${batch.start}-${batch.end}: ${error.message}`);
                    await delay(REQUEST_DELAY * attempts); // Exponential backoff
                }
            }
        }

        // Add delay between successful requests to avoid rate limiting
        if (success) {
            await delay(REQUEST_DELAY);
        }
    }

    return totalCount;
}

async function countEvents() {
    console.log(`Connecting to ${RPC_URLS.length} RPC nodes...`);
    const providers = await createProviders(RPC_URLS);

    console.log(`Querying events for ${CONTRACT_ADDRESS}`);
    console.log(`Block range: ${START_BLOCK} to ${END_BLOCK}`);
    console.log(`Using batches of ${BATCH_SIZE} blocks across ${providers.length} RPCs\n`);

    try {
        // --- 1. Create the event filters ---
        // const requestFilter = new ethers.Contract(CONTRACT_ADDRESS, abi, providers[0]).filters.Request();
        const deliverFilter = new ethers.Contract(CONTRACT_ADDRESS, abi, providers[0]).filters.Deliver();

        // --- 2. Create batches ---
        const batches = createBatches(START_BLOCK, END_BLOCK, BATCH_SIZE);
        console.log(`Created ${batches.length} batches to process in parallel`);

        // // --- 3. Count events with parallel RPCs ---
        // console.log("\nFetching 'Request' events...");
        // const requestCount = await countEventsWithParallelRPCs(providers, CONTRACT_ADDRESS, abi, requestFilter, batches);

        console.log("\nFetching 'Deliver' events...");
        const deliverCount = await countEventsWithParallelRPCs(providers, CONTRACT_ADDRESS, abi, deliverFilter, batches);

        // --- 4. Log the results ---
        console.log("\n--- ✅ Query Complete ---");
        // console.log(`'Request' events found: ${requestCount}`);
        console.log(`'Deliver' events found: ${deliverCount}`);
        console.log("------------------------\n");

    } catch (error) {
        console.error("Error fetching events:", error.message);
    }
}

countEvents();