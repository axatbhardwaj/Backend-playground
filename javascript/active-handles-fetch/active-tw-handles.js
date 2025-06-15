// Required for making HTTP requests (install via 'npm install node-fetch')
import fetch from 'node-fetch';

// --- Hardcoded Configuration ---
const MIRRORDB_BASE_URL = 'https://afmdb.autonolas.tech'; // e.g., 'http://localhost:8000'
const HARDCODED_AGENT_TYPE_ID = 3; // Replace with your actual agent type ID
const HARDCODED_INTERACTIONS_ATTR_DEF_ID = 3; // Replace with interaction attr def ID
const HARDCODED_USERNAME_ATTR_DEF_ID = 2; // Replace with username attr def ID
const HARDCODED_OWN_TWITTER_USERNAME = 'test_twitter_user_123'; // Replace with your agent's username
const DEFAULT_DAYS_FILTER = 7; // Default number of days for recent activity

// --- MirrorDB API Endpoints (Assumed based on Python)---
const GET_INTERACTIONS_ENDPOINT = (agentTypeId, interactionsAttrDefId) =>
    `${MIRRORDB_BASE_URL}/api/agent-types/${agentTypeId}/attributes/${interactionsAttrDefId}/values`;

const GET_USERNAME_ATTRIBUTE_ENDPOINT = (agentId, usernameAttrDefId) =>
    `${MIRRORDB_BASE_URL}/api/agents/${agentId}/attributes/${usernameAttrDefId}/`;

// --- Helper Function to fetch data from MirrorDB ---
async function fetchMirrorDBData(url, params = {}) {
    const urlWithParams = new URL(url);
    Object.keys(params).forEach(key => urlWithParams.searchParams.append(key, params[key]));

    try {
        const response = await fetch(urlWithParams);

        if (!response.ok) {
            console.error(`HTTP error! Status: ${response.status} fetching ${url}`);
            // Attempt to read error body if available
            try {
                const errorBody = await response.text();
                console.error(`Response body: ${errorBody}`);
            } catch (e) {
                console.error("Could not read error response body.");
            }
            return null;
        }

        const data = await response.json();

        if (data && data.error) {
            console.error(`MirrorDB API Error: ${data.error}`);
            return null;
        }

        // Assuming the actual data is nested under a 'response' key like in Python
        // Adjust if your API returns the list/object directly
        return data.response !== undefined ? data.response : data;

    } catch (error) {
        console.error(`Error fetching data from ${url}:`, error);
        return null;
    }
}

// --- Configuration and Validation ---
function getValidatedConfig() {
    if (!MIRRORDB_BASE_URL || MIRRORDB_BASE_URL === 'YOUR_MIRRORDB_BASE_URL') {
        console.error("MIRRORDB_BASE_URL is not configured. Cannot fetch handles.");
        return null;
    }

    if (!HARDCODED_AGENT_TYPE_ID || !HARDCODED_INTERACTIONS_ATTR_DEF_ID || !HARDCODED_USERNAME_ATTR_DEF_ID || !HARDCODED_OWN_TWITTER_USERNAME) {
        console.error("One or more required hardcoded IDs or username are missing or invalid. Cannot fetch handles.");
        return null;
    }

    return {
        MIRRORDB_BASE_URL: MIRRORDB_BASE_URL,
        agentTypeId: HARDCODED_AGENT_TYPE_ID,
        interactionsAttrDefId: HARDCODED_INTERACTIONS_ATTR_DEF_ID,
        usernameAttrDefId: HARDCODED_USERNAME_ATTR_DEF_ID,
        ownUsername: HARDCODED_OWN_TWITTER_USERNAME
    };
}

// --- Fetch Interactions ---
async function fetchInteractions(config) {
    console.log(`Fetching all interaction attributes for agent type ${config.agentTypeId} and attribute ${config.interactionsAttrDefId}...`);
    const allInteractions = await fetchMirrorDBData(
        GET_INTERACTIONS_ENDPOINT(config.agentTypeId, config.interactionsAttrDefId),
        { limit: 10000 } // Assuming a large enough limit to get all relevant data
    );

    if (!allInteractions) {
        console.warn("Failed to fetch interaction attributes from MirrorDB. Cannot determine active handles.");
        return null;
    }

    if (!Array.isArray(allInteractions)) {
        console.error(`Expected interaction data to be an array, but got ${typeof allInteractions}.`);
        return null;
    }

    return allInteractions;
}

// --- Filter Agent IDs by Recent Activity ---
function getRecentAgentIds(allInteractions, days) {
    console.log(`Filtering agent IDs with interactions in the last ${days} days...`);
    const recentAgentIds = new Set();
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000); // Milliseconds since epoch

    for (const interaction of allInteractions) {
        try {
            const jsonValue = interaction.json_value;
            if (!jsonValue || typeof jsonValue !== 'object') {
                continue;
            }

            const timestampStr = jsonValue.timestamp;
            if (!timestampStr || typeof timestampStr !== 'string') {
                continue;
            }

            const interactionTime = new Date(timestampStr);
            if (isNaN(interactionTime.getTime())) {
                console.warn(`Could not parse timestamp string "${timestampStr}" for interaction ${interaction.attribute_id || 'N/A'}. Skipping.`);
                continue;
            }

            if (interactionTime.getTime() >= cutoffTime) {
                const agentId = interaction.agent_id;
                if (agentId !== undefined && agentId !== null) {
                    recentAgentIds.add(parseInt(agentId, 10));
                } else {
                    console.warn(`Interaction found with null/undefined agent_id: ${interaction.attribute_id || 'N/A'}. Skipping.`);
                }
            }
        } catch (e) {
            console.warn(`Error processing interaction record ${interaction.attribute_id || 'N/A'}: ${e}. Skipping.`);
            continue;
        }
    }

    if (recentAgentIds.size === 0) {
        console.log("No agents found with recent interactions.");
    }

    return recentAgentIds;
}

// --- Fetch Usernames for Agents ---
async function fetchAgentUsernames(agentIds, config) {
    console.log(`Fetching usernames for the ${agentIds.size} active agents...`);
    const agentUsernames = {};
    // Fetching usernames one by one - adjust if MirrorDB API supports batch lookup
    for (const agentId of agentIds) {
        const usernameAttribute = await fetchMirrorDBData(
            GET_USERNAME_ATTRIBUTE_ENDPOINT(agentId, config.usernameAttrDefId)
        );

        if (usernameAttribute && typeof usernameAttribute === 'object') {
            const username = usernameAttribute.string_value;
            if (username && typeof username === 'string') {
                agentUsernames[agentId] = username;
            } else {
                console.debug(`Username attribute for agent ${agentId} has missing or empty string_value.`);
            }
        } else {
            console.warn(`Could not retrieve valid username attribute for agent ${agentId}. Response: ${usernameAttribute}`);
        }
    }

    if (Object.keys(agentUsernames).length === 0) {
        console.warn("Found recent agents but failed to fetch any corresponding usernames.");
    }

    return agentUsernames;
}

// --- Main Function to Get Active Twitter Handles ---
async function getActiveTwitterHandles(days = DEFAULT_DAYS_FILTER) {
    console.log(`Fetching active Twitter handles (last ${days} days) from MirrorDB...`);

    const config = getValidatedConfig();
    if (!config) {
        return []; // Early exit
    }

    const allInteractions = await fetchInteractions(config);
    if (!allInteractions) {
        return []; // Early exit
    }

    const recentAgentIds = getRecentAgentIds(allInteractions, days);
    if (recentAgentIds.size === 0) {
        return []; // Early exit
    }

    const agentUsernames = await fetchAgentUsernames(recentAgentIds, config);
    if (Object.keys(agentUsernames).length === 0) {
        return []; // Early exit
    }

    // Step 6 & 7: Filter and Collect Handles (Exclude own username)
    const handles = [];
    for (const agentId in agentUsernames) {
        const username = agentUsernames[agentId];
        if (username !== config.ownUsername) {
            handles.push(username);
        } else {
            console.debug(`Excluding own username: ${username}`);
        }
    }

    console.log(`Found ${handles.length} active handles (excluding self if username known): ${handles}`);
    return handles;
}

// Example usage:
(async () => {
    const activeHandles = await getActiveTwitterHandles(7); // Get handles from last 14 days
    console.log("\nActive Handles:");
    console.log(activeHandles);
})();

// Export the function for use in other modules
export { getActiveTwitterHandles };