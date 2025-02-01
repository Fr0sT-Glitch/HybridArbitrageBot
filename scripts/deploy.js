require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying HybridArbitrageBot...");

    const [deployer] = await ethers.getSigners();
    console.log("📢 Deploying from address:", deployer.address);

    // Constants
    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2"; // Ethereum WETH
    const QUANTUM_RESISTANT_WALLET = process.env.QUANTUM_WALLET || deployer.address; // Secure wallet

    // Deploy the contract
    const ArbitrageBot = await ethers.getContractFactory("HybridArbitrageBot");
    const arbitrageBot = await ArbitrageBot.deploy(WETH_ADDRESS, QUANTUM_RESISTANT_WALLET);

    await arbitrageBot.deployed();
    console.log("✅ HybridArbitrageBot deployed to:", arbitrageBot.address);

    // Initialize supported tokens
    const tokens = {
        "DAI": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        "USDC": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606e48",
        "USDT": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        "WBTC": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        "WETH": "0xC02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2",
        "AAVE": "0x7Fc66500c84A76Ad7e9c93437bfc5Ac33E2DdAE9",
        "COMP": "0xc00e94Cb662C3520282E6f5717214004A7f26888",
        "LINK": "0x514910771AF9Ca656af840dff83E8264EcF986CA",
        "MKR": "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2",
        "SNX": "0xC011A72400E58ecD99Ee497CF89E3775d4bd732F",
        "UNI": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
        "BAT": "0x0D8775F648430679A709E98d2b0Cb6250d2887EF",
        "SUSHI": "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2",
        "YFI": "0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e",
        "BAL": "0xba100000625a3754423978a60c9317c58a424e3D",
        "CRV": "0xD533a949740bb3306d119CC777fa900bA034cd52",
        "REN": "0x408e41876cCCDC0F92210600ef50372656052a38",
        "KNC": "0xdd974d5c2e2928dea5f71b9825b8b646686bd200",
        "FRAX": "0x853d955aCEf822Db058eb8505911ED77F175b99e",
        "LUSD": "0x5f98805A4E8be255a32880FDeC7F6728C6568Ba0",
        "GUSD": "0x056Fd409e1d7A124BD7017459Dfea2F387B6d5Cd",
        "TUSD": "0x0000000000085d4780B73119b644AE5ecd22b376",
        "FEI": "0x956F47F50A910163D8BF957Cf5846D573E7f87CA"
    };

    for (const [symbol, address] of Object.entries(tokens)) {
        console.log(`🔹 Adding support for ${symbol} (${address})`);
        await arbitrageBot.addSupportedToken(symbol, address);
    }

    // Save contract address for later use
    console.log("⚡ Saving contract address...");
    saveContractAddress(arbitrageBot.address);
}

// Helper function to save deployed contract address
function saveContractAddress(address) {
    const fs = require("fs");
    const path = "./config/deployed_contract.json";
    
    const data = JSON.stringify({ deployed_address: address }, null, 2);
    fs.writeFileSync(path, data, { flag: "w" });

    console.log("✅ Contract address saved to:", path);
}

// Run the deployment
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
