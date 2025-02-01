require("dotenv").config();
const { ethers } = require("hardhat");
const readline = require("readline");

const CONTRACT_ADDRESS = require("../config/deployed_contract.json").deployed_address;

async function main() {
    const [signer] = await ethers.getSigners();
    const arbitrageBot = await ethers.getContractAt("HybridArbitrageBot", CONTRACT_ADDRESS, signer);

    console.log("🚀 Hybrid Arbitrage Trade Execution");
    console.log("===================================");

    // User input for tokens
    const tokenA = await askQuestion("Enter the first token symbol (e.g., USDC): ");
    const tokenB = await askQuestion("Enter the second token symbol (e.g., USDT): ");
    const tradeAmountInput = await askQuestion("Enter the trade amount: ");
    const tradeAmount = ethers.utils.parseUnits(tradeAmountInput, 6);

    console.log(`🔍 Checking arbitrage opportunity between ${tokenA} and ${tokenB}...`);

    // Check potential profit
    const profitBeforeTrade = await arbitrageBot.getPotentialProfit(tokenA, tokenB, tradeAmount);
    console.log(`💰 Potential Profit: ${ethers.utils.formatUnits(profitBeforeTrade, 6)} ${tokenB}`);

    if (profitBeforeTrade.gt(0)) {
        console.log("✅ Profitable trade found! Executing now...");
        const tx = await arbitrageBot.executeArbitrage(tokenA, tokenB, tradeAmount);
        await tx.wait();
        console.log("🚀 Trade executed successfully!");
    } else {
        console.log("⚠️ No profitable arbitrage opportunity found.");
    }

    process.exit(0);
}

// Function to get user input
function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error("❌ Error executing trade:", error);
        process.exit(1);
    });


main().catch((error) => {
    console.error(error);
    process.exit(1);
});
