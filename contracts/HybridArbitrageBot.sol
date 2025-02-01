
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract HybridArbitrageBot is Ownable {
    uint256 public constant MIN_PROFIT_THRESHOLD = 1 * 10**18; // $1 in Wei

    event ArbitrageExecuted(address indexed profitToken, uint256 profitAmount);
    event TradeSkipped(string reason);

    function executeArbitrage(string memory tokenA, string memory tokenB, uint256 amount) external onlyOwner {
        address bestDex;
        uint256 bestProfit;
        
        // Iterate over DEX aggregators
        for (uint i = 0; i < dexAggregators.length; i++) {
            address dexRouter = dexAggregators[i].router;
            uint256 profit = getPotentialProfit(tokenA, tokenB, amount, dexRouter);
            
            if (profit > bestProfit) {
                bestProfit = profit;
                bestDex = dexRouter;
            }
        }

        require(bestProfit >= MIN_PROFIT_THRESHOLD, "Trade rejected: Profit below $1 USD.");

        _executeTrade(tokenA, tokenB, amount, bestDex);
    }
}
