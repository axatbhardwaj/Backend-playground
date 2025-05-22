const { ethers } = require('ethers');

// Generic ERC20 ABI for balanceOf
const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
];

// Configure provider - using Infura as example
// const provider = new ethers.providers.JsonRpcProvider("https://virtual.base.rpc.tenderly.co/a5b05f31-33b4-4b9e-8b3e-59e665021b79");
let provider = new ethers.JsonRpcProvider("https://virtual.base.rpc.tenderly.co/a5b05f31-33b4-4b9e-8b3e-59e665021b79");
// Token contract address 
const TOKEN_ADDRESS = "0x54330d28ca3357F294334BDC454a032e7f353416";

async function getNativeBalance(address) {
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
}

async function getTokenBalance(address) {
    const contract = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, provider);
    const [balance, decimals, symbol] = await Promise.all([
        contract.balanceOf(address),
        contract.decimals(),
        contract.symbol()
    ]);
    return {
        balance: ethers.formatUnits(balance, decimals),
        symbol
    };
}

async function main() {
    // 0x1b8f8EDd72E2bA094E24D8d2DF52Dd72325c8bB4
    const walletAddress = "0x1b8f8EDd72E2bA094E24D8d2DF52Dd72325c8bB4";

    try {
        console.log(`Checking balances for address: ${walletAddress}`);

        const ethBalance = await getNativeBalance(walletAddress);
        console.log(`Native ETH Balance: ${ethBalance} ETH`);

        const tokenInfo = await getTokenBalance(walletAddress);
        console.log(`Token Balance: ${tokenInfo.balance} ${tokenInfo.symbol}`);
    } catch (error) {
        console.error("Error:", error);
    }
}

main();