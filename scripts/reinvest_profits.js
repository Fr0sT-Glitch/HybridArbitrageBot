require("dotenv").config();
const { ethers } = require("hardhat");
const readline = require("readline");

const CONTRACT_ADDRESS = require("../config/deployed_contract.json").deployed_address;

async function main() {
    const [signer] = await ethers.getSigners();
    const arbitrageBot = await ethers.getContractAt("HybridArbitrageBot", CONTRACT_ADDRESS, signer);

    console.log("🔄 Hybrid Arbitrage Bot - Reinvest Profits");
    console.log("==========================================");

    // User input for profit token
    const profitToken = await askQuestion("Enter the profit token symbol (e.g., USDT): ");
    const reinvestToken = await askQuestion("Enter the token to reinvest into (e.g., USDC): ");
    const reinvestThresholdInput = await askQuestion("Enter minimum profit to reinvest (e.g., 500): ");
    const reinvestThreshold = ethers.utils.parseUnits(reinvestThresholdInput, 6);

    console.log(`🔍 Checking ${profitToken} balance for reinvestment...`);

    // Fetch profit balance from contract
    const balance = await arbitrageBot.getProfitBalance(profitToken);
    console.log(`💰 Current Profit Balance: ${ethers.utils.formatUnits(balance, 6)} ${profitToken}`);

    if (balance.gte(reinvestThreshold)) {
        console.log("✅ Reinvestment threshold met. Executing reinvestment...");

        // Execute arbitrage trade for reinvestment
        const tx = await arbitrageBot.executeArbitrage(profitToken, reinvestToken, balance);
        await tx.wait();

        console.log(`🚀 Successfully reinvested ${ethers.utils.formatUnits(balance, 6)} ${profitToken} into ${reinvestToken}`);
    } else {
        console.log("⚠️ Not enough profits to reinvest yet.");
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
        console.error("❌ Error reinvesting profits:", error);
        process.exit(1);
    });
