// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "./interfaces/IFlashLoanReceiver.sol";
import "./interfaces/ILendingPool.sol";
import "./interfaces/ILendingPoolAddressesProvider.sol";

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
    ILendingPoolAddressesProvider public immutable ADDRESSES_PROVIDER;
    ILendingPool public immutable LENDING_POOL;

    uint256 public slippageTolerance = 5; // 0.5% slippage tolerance

    constructor(
        address _uniswapRouter,
        address _sushiswapRouter,
        address _lendingPool,
        address _weth,
        address _flashbots,
        address _addressesProvider
    ) {
        owner = msg.sender;
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
        sushiswapRouter = IUniswapV2Router02(_sushiswapRouter);
        lendingPool = ILendingPool(_lendingPool);
        WETH = IERC20(_weth);
        flashbots = IFlashbots(_flashbots);
        ADDRESSES_PROVIDER = ILendingPoolAddressesProvider(_addressesProvider);
        LENDING_POOL = ILendingPool(_lendingPool);
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
        address[] memory assets = new address[](1);
        assets[0] = address(WETH);
        
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amountIn;
        
        uint256[] memory modes = new uint256[](1);
        modes[0] = 0; // no debt to be opened

        bytes memory params = abi.encode(token, buyOnUniswap);
        LENDING_POOL.flashLoan(
            address(this),
            assets,
            amounts,
            modes,
            address(this),
            params,
            0
        );
    }

    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address /* initiator */,
        bytes calldata params
    ) external override nonReentrant returns (bool) {
        require(msg.sender == address(LENDING_POOL), "Caller must be LendingPool");
        require(assets.length == 1 && amounts.length == 1 && premiums.length == 1, "Only single asset flash loans supported");
        
        // Extract parameters
        (address token, bool buyOnUniswap) = abi.decode(params, (address, bool));
        
        // Setup swap path
        address[] memory path = new address[](2);
        path[0] = address(WETH);
        path[1] = token;
        
        // Calculate minimum output amount
        uint256 amount = amounts[0];
        uint256 minAmountOut = (amount * (100 - slippageTolerance)) / 100;
        
        // First swap
        IUniswapV2Router02 firstRouter = buyOnUniswap ? uniswapRouter : sushiswapRouter;
        WETH.approve(address(firstRouter), amount);
        uint256[] memory swapAmounts = firstRouter.swapExactTokensForTokens(
            amount,
            minAmountOut,
            path,
            address(this),
            block.timestamp + 60
        );

        // Prepare reverse swap
        uint256 tokenReceived = swapAmounts[1];
        path[0] = token;
        path[1] = address(WETH);

        // Second swap
        IUniswapV2Router02 secondRouter = buyOnUniswap ? sushiswapRouter : uniswapRouter;
        IERC20(token).approve(address(secondRouter), tokenReceived);
        secondRouter.swapExactTokensForTokens(
            tokenReceived,
            minAmountOut,
            path,
            address(this),
            block.timestamp + 60
        );

        // Approve and repay the flash loan
        WETH.approve(address(LENDING_POOL), amounts[0] + premiums[0]);

        return true;
    }

    function withdraw(address token, uint amount) external onlyOwner {
        IERC20(token).transfer(owner, amount);
    }
}
