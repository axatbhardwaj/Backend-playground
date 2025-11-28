#!/usr/bin/env bun
/**
 * Standalone script to get Twitter handles for multisig addresses from Contribute DB.
 *
 * Usage:
 *   # With multisigs from command line:
 *   bun scripts/get_multisig_twitter_handles.js 0x123... 0x456...
 *
 *   # With multisigs from a file (one address per line):
 *   bun scripts/get_multisig_twitter_handles.js --file multisigs.txt
 *
 *   # Dump all multisig -> twitter_handle mappings:
 *   bun scripts/get_multisig_twitter_handles.js --all
 *
 *   # Save to JSON:
 *   bun scripts/get_multisig_twitter_handles.js --all --output results.json
 */

const BASE_URL = "https://afmdb.autonolas.tech";
const CONTRIBUTE_TYPE_ID = 14;

async function getAgentInstancesByType(typeId) {
    const url = `${BASE_URL}/api/agent-types/${typeId}/agents/?skip=0&limit=100`;
    const response = await fetch(url);
    if (!response.ok) {
        console.error(`Error fetching agents: ${response.status}`);
        return [];
    }
    return response.json();
}

async function getAgentAttributes(agentId) {
    const url = `${BASE_URL}/api/agents/${agentId}/attributes/`;
    const attributes = [];
    let skip = 0;

    while (true) {
        const response = await fetch(`${url}?skip=${skip}&limit=100`);
        if (!response.ok) {
            console.error(`Error fetching attributes (skip=${skip}): ${response.status}`);
            break;
        }

        const batch = await response.json();
        if (!batch || batch.length === 0) break;

        attributes.push(...batch);
        process.stdout.write(`  Fetched ${attributes.length} attributes...\r`);
        skip += batch.length;

        if (batch.length < 100) break;
    }

    console.log();
    return attributes;
}

async function loadUsersFromDb() {
    const agents = await getAgentInstancesByType(CONTRIBUTE_TYPE_ID);
    if (agents.length === 0) {
        console.error("Error: No agent instances found for contribute type");
        process.exit(1);
    }

    console.log(`Found ${agents.length} contribute agent(s)`);

    const users = {};
    for (const agent of agents) {
        const agentId = agent.agent_id;
        const agentName = agent.agent_name || "Unknown";
        console.log(`Fetching attributes from agent: ${agentName} (ID: ${agentId})`);

        const attributes = await getAgentAttributes(agentId);

        for (const attr of attributes) {
            const jsonValue = attr.json_value;
            if (!jsonValue || typeof jsonValue !== "object") continue;

            // Check if this is a user attribute
            if ("twitter_handle" in jsonValue || "service_multisig" in jsonValue) {
                const userId = jsonValue.id;
                if (userId != null) {
                    users[String(userId)] = jsonValue;
                }
            }
        }
    }

    console.log(`Loaded ${Object.keys(users).length} users from database`);
    return users;
}

function getMultisigTwitterMapping(users) {
    const mapping = {};
    for (const user of Object.values(users)) {
        const multisig = user.service_multisig;
        const handle = user.twitter_handle;
        if (multisig && handle) {
            mapping[multisig.toLowerCase()] = handle;
        }
    }
    return mapping;
}

function lookupMultisigs(mapping, multisigs) {
    const results = {};
    for (const multisig of multisigs) {
        results[multisig] = mapping[multisig.toLowerCase()] || null;
    }
    return results;
}

async function loadMultisigsFromFile(filepath) {
    const content = await Bun.file(filepath).text();
    return content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && line.startsWith("0x"));
}

function printHelp() {
    console.log(`
Usage: bun scripts/get_multisig_twitter_handles.js [OPTIONS] [MULTISIGS...]

Options:
  --all, -a         Dump all multisig -> twitter_handle mappings
  --file, -f FILE   Load multisig addresses from file (one per line)
  --output, -o FILE Save results to JSON file
  --help, -h        Show this help message
`);
}

async function main() {
    const args = process.argv.slice(2);

    let showAll = false;
    let inputFile = null;
    let outputFile = null;
    const multisigs = [];

    // Parse arguments
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "--all" || arg === "-a") {
            showAll = true;
        } else if (arg === "--file" || arg === "-f") {
            inputFile = args[++i];
        } else if (arg === "--output" || arg === "-o") {
            outputFile = args[++i];
        } else if (arg === "--help" || arg === "-h") {
            printHelp();
            process.exit(0);
        } else if (arg.startsWith("0x")) {
            multisigs.push(arg);
        }
    }

    // Load users from database
    const users = await loadUsersFromDb();
    const mapping = getMultisigTwitterMapping(users);

    let results;

    if (showAll) {
        results = { ...mapping };
    } else {
        if (inputFile) {
            const fileMultisigs = await loadMultisigsFromFile(inputFile);
            multisigs.push(...fileMultisigs);
        }

        if (multisigs.length === 0) {
            console.error("Error: Provide multisig addresses, use --file, or use --all");
            printHelp();
            process.exit(1);
        }

        results = lookupMultisigs(mapping, multisigs);
    }

    // Output results
    if (outputFile) {
        await Bun.write(outputFile, JSON.stringify(results, null, 2));
        console.log(`Results saved to ${outputFile}`);
    } else {
        console.log("\n" + "=".repeat(60));
        console.log("Multisig -> Twitter Handle Mapping");
        console.log("=".repeat(60));
        for (const [multisig, handle] of Object.entries(results)) {
            if (handle) {
                console.log(`${multisig} -> @${handle}`);
            } else {
                console.log(`${multisig} -> NOT FOUND`);
            }
        }
        console.log("=".repeat(60));
        const found = Object.values(results).filter(Boolean).length;
        console.log(`Total: ${Object.keys(results).length} addresses, ${found} found`);
    }
}

main().catch(console.error);

