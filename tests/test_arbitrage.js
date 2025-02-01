const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HybridArbitrageBot - Arbitrage Execution", function () {
    let arbitrageBot, deployer, user;
    let USDC, USDT;

    before(async function () {
        [deployer, user] = await ethers.getSigners();
        const MockToken = await ethers.getContractFactory("MockToken");

        USDC = await MockToken.deploy("USD Coin", "USDC", 6);
        USDT = await MockToken.deploy("Tether", "USDT", 6);

        const HybridArbitrageBot = await ethers.getContractFactory("HybridArbitrageBot");
        arbitrageBot = await HybridArbitrageBot.deploy(USDC.address, deployer.address);
        await arbitrageBot.deployed();
    });

    it("Should prevent unprofitable trades", async function () {
        const tradeAmount = ethers.utils.parseUnits("1000", 6);
        const profitBeforeTrade = await arbitrageBot.getPotentialProfit(USDC.address, USDT.address, tradeAmount);
        expect(profitBeforeTrade).to.equal(0, "Trade should not be executed without profit");
    });

    it("Should execute profitable arbitrage trades", async function () {
        const tradeAmount = ethers.utils.parseUnits("1000", 6);

        // Simulate profitable arbitrage
        await arbitrageBot.mockProfit(USDC.address, USDT.address, tradeAmount, ethers.utils.parseUnits("50", 6));

        const profitBeforeTrade = await arbitrageBot.getPotentialProfit(USDC.address, USDT.address, tradeAmount);
        expect(profitBeforeTrade).to.be.gt(0, "Trade should be profitable");

        // Execute arbitrage
        await expect(arbitrageBot.executeArbitrage(USDC.address, USDT.address, tradeAmount))
            .to.emit(arbitrageBot, "ArbitrageExecuted")
            .withArgs(USDT.address, ethers.utils.parseUnits("50", 6));
    });
});
