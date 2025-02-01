require("dotenv").config();
const nodemailer = require("nodemailer");
const { ethers } = require("hardhat");
const CONTRACT_ADDRESS = require("../config/deployed_contract.json").deployed_address;

// List of supported tokens for reporting
const SUPPORTED_TOKENS = [
    "DAI", "USDC", "USDT", "WBTC", "WETH", "AAVE", "COMP", "LINK",
    "MKR", "SNX", "UNI", "BAT", "SUSHI", "YFI", "BAL", "CRV",
    "REN", "KNC", "FRAX", "LUSD", "GUSD", "TUSD", "FEI"
];

// Email Configuration (Uses environment variables)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function generateReport() {
    const [signer] = await ethers.getSigners();
    const arbitrageBot = await ethers.getContractAt("HybridArbitrageBot", CONTRACT_ADDRESS, signer);

    console.log("🔍 Fetching arbitrage profit report...");

    let totalProfit = 0;
    let reportDetails = "🚀 **Hybrid Arbitrage Bot Performance Report** 🚀\n";
    reportDetails += "---------------------------------------------\n";

    // Fetch profit balance for each supported token
    for (const token of SUPPORTED_TOKENS) {
        try {
            const balance = await arbitrageBot.getProfitBalance(token);
            const profit = ethers.utils.formatUnits(balance, 6);
            if (balance.gt(0)) {
                reportDetails += `🔹 **${token} Profit:** ${profit} ${token}\n`;
                totalProfit += parseFloat(profit);
            }
        } catch (error) {
            console.warn(`⚠️ Error fetching balance for ${token}:`, error.message);
        }
    }

    reportDetails += `\n💰 **Total Profit Earned:** ${totalProfit.toFixed(2)} USD\n`;
    reportDetails += `📅 **Date:** ${new Date().toLocaleString()}\n`;

    console.log(reportDetails);

    // Send report via email
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_RECEIVER,
        subject: "🚀 Arbitrage Bot Profit Report",
        text: reportDetails,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("❌ Error sending email:", error);
        } else {
            console.log("✅ Report sent:", info.response);
        }
    });
}

// Run the report generator
generateReport()
    .then(() => process.exit(0))
    .catch(error => {
        console.error("❌ Error generating report:", error);
        process.exit(1);
    });
