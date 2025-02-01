const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HybridArbitrageBot - Flash Loan Execution", function () {
    let arbitrageBot, deployer, lender, user;
    let WETH, USDC;

    before(async function () {
        [deployer, lender, user] = await ethers.getSigners();

        // Deploy mock tokens
        const MockToken = await ethers.getContractFactory("MockToken");
        WETH = await MockToken.deploy("Wrapped Ethereum", "WETH", 18);
        USDC = await MockToken.deploy("USD Coin", "USDC", 6);

        // Deploy arbitrage bot
        const HybridArbitrageBot = await ethers.getContractFactory("HybridArbitrageBot");
        arbitrageBot = await HybridArbitrageBot.deploy(WETH.address, deployer.address);
        await arbitrageBot.deployed();

        // Provide liquidity to mock lending pool
        await USDC.mint(lender.address, ethers.utils.parseUnits("1000000", 6));
    });

    it("Should successfully borrow and repay flash loan", async function () {
        const loanAmount = ethers.utils.parseUnits("10000", 6);

        // Simulate flash loan
        await expect(arbitrageBot.flashLoan(USDC.address, loanAmount))
            .to.emit(arbitrageBot, "FlashLoanExecuted")
            .withArgs(USDC.address, loanAmount);

        const finalBalance = await USDC.balanceOf(arbitrageBot.address);
        expect(finalBalance).to.equal(0, "Flash loan should be repaid fully");
    });

    it("Should execute arbitrage after flash loan", async function () {
        const loanAmount = ethers.utils.parseUnits("10000", 6);

        // Simulate profitable arbitrage opportunity
        await arbitrageBot.mockProfit(USDC.address, WETH.address, loanAmount, ethers.utils.parseUnits("200", 6));

        // Execute flash loan + arbitrage
        await expect(arbitrageBot.flashLoan(USDC.address, loanAmount))
            .to.emit(arbitrageBot, "ArbitrageExecuted")
            .withArgs(WETH.address, ethers.utils.parseUnits("200", 6));
    });
});
