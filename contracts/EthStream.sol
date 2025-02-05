// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@aave/protocol-v2/contracts/interfaces/IFlashLoanReceiver.sol";
import "@aave/protocol-v2/contracts/interfaces/ILendingPool.sol";

interface IFlashbots {
    function sendPrivateTransaction(bytes calldata txData) external;
}

contract DexArbitrage is IFlashLoanReceiver, ReentrancyGuard {
    address public owner;
    IUniswapV2Router02 public uniswapRouter;
    IUniswapV2Router02 public sushiswapRouter;
    ILendingPool public lendingPool;
    IERC20 public WETH;
    IFlashbots public flashbots;

    uint256 public slippageTolerance = 5; // 0.5% slippage tolerance

    constructor(address _uniswapRouter, address _sushiswapRouter, address _lendingPool, address _weth, address _flashbots) {
        owner = msg.sender;
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
        sushiswapRouter = IUniswapV2Router02(_sushiswapRouter);
        lendingPool = ILendingPool(_lendingPool);
        WETH = IERC20(_weth);
        flashbots = IFlashbots(_flashbots);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    function updateSlippageTolerance(uint256 newTolerance) external onlyOwner {
        require(newTolerance <= 100, "Invalid slippage tolerance");
        slippageTolerance = newTolerance;
    }

    function executeArbitrage(address token, uint amountIn, bool buyOnUniswap) external onlyOwner {
        bytes memory params = abi.encode(token, amountIn, buyOnUniswap);
        lendingPool.flashLoan(address(this), address(WETH), amountIn, params);
    }

    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override nonReentrant returns (bool) {
        require(msg.sender == address(lendingPool), "Caller must be LendingPool");
        (address token, uint amountIn, bool buyOnUniswap) = abi.decode(params, (address, uint, bool));
        
        address[] memory path = new address[](2);
        path[0] = address(WETH);
        path[1] = token;
        
        uint[] memory amounts;
        uint minAmountOut = (amountIn * (100 - slippageTolerance)) / 100;
        if (buyOnUniswap) {
            WETH.approve(address(uniswapRouter), amountIn);
            amounts = uniswapRouter.swapExactTokensForTokens(
                amountIn,
                minAmountOut,
                path,
                address(this),
                block.timestamp + 60
            );
        } else {
            WETH.approve(address(sushiswapRouter), amountIn);
            amounts = sushiswapRouter.swapExactTokensForTokens(
                amountIn,
                minAmountOut,
                path,
                address(this),
                block.timestamp + 60
            );
        }

        uint tokenReceived = amounts[1];
        path[0] = token;
        path[1] = address(WETH);

        if (buyOnUniswap) {
            IERC20(token).approve(address(sushiswapRouter), tokenReceived);
            sushiswapRouter.swapExactTokensForTokens(
                tokenReceived,
                minAmountOut,
                path,
                address(this),
                block.timestamp + 60
            );
        } else {
            IERC20(token).approve(address(uniswapRouter), tokenReceived);
            uniswapRouter.swapExactTokensForTokens(
                tokenReceived,
                minAmountOut,
                path,
                address(this),
                block.timestamp + 60
            );
        }

        uint256 totalDebt = amount + premium;
        WETH.approve(address(lendingPool), totalDebt);

        // Send the transaction privately via Flashbots to avoid frontrunning
        bytes memory txData = abi.encodeWithSignature(
            "executeOperation(address,uint256,uint256,address,bytes)",
            asset,
            amount,
            premium,
            initiator,
            params
        );
        flashbots.sendPrivateTransaction(txData);

        return true;
    }

    function withdraw(address token, uint amount) external onlyOwner {
        IERC20(token).transfer(owner, amount);
    }
}
