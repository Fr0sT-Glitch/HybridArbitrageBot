# Arbitrage Bot with AAVE Flash Loans

A sophisticated arbitrage bot that leverages AAVE v2 flash loans to execute profitable trades across multiple DEXes on Ethereum mainnet.

## Overview

This project implements an automated arbitrage system that exploits price differences between decentralized exchanges using flash loans. By borrowing large amounts of capital through AAVE v2 flash loans, the system can execute profitable trades without requiring upfront capital, as long as the loan is repaid within the same transaction.

The system:
- Uses AAVE v2 flash loans to execute trades with no upfront capital
- Monitors price differences across major DEXes (Uniswap V3, SushiSwap, etc.)
- Executes trades atomically within a single transaction
- Includes off-chain monitoring and profit calculation
- Supports multiple trading pairs and DEX combinations

## How It Works

### Flash Loan Mechanism
The arbitrage execution follows these steps:

1. The bot identifies a price discrepancy between two DEXes
2. It initiates a flash loan from AAVE v2
3. The AAVE protocol sends the borrowed tokens and calls our contract's `executeOperation`
4. Within `executeOperation`, the contract:
   - Executes the first swap on DEX A
   - Executes the second swap on DEX B
   - Repays the flash loan plus premium
   - Keeps the profit (if successful)
5. If any step fails, the entire transaction reverts

### Price Monitoring
The Python backend continuously:
1. Fetches real-time prices from DEX contracts
2. Calculates potential arbitrage opportunities considering:
   - Price differences
   - Trading fees
   - Gas costs
   - Flash loan premiums
3. Executes trades when profit exceeds minimum threshold

## Architecture

### Smart Contracts

The system consists of two main smart contracts:

1. `EthStream.sol`: Implements flash loan arbitrage between Uniswap V2 and SushiSwap
   - Handles AAVE v2 flash loan callbacks
   - Manages token approvals and swaps
   - Includes slippage protection
   - Uses Flashbots for MEV protection

2. `HybridArbitrageBot.sol`: Implements flash loan arbitrage across multiple DEXes
   - Supports all major DEX protocols
   - Uses Chainlink price feeds
   - Includes comprehensive token and DEX registry
   - Implements modular swap execution

### Off-chain Components

The Python backend (`run.py`) handles:
- Price monitoring across DEXes
- Profit calculation and gas optimization
- Transaction submission and monitoring
- Profit logging and analysis
- Email notifications for successful trades

## Prerequisites

- Node.js (v14 or higher)
- Python 3.8+
- Pipenv
- Ethereum wallet with mainnet ETH (for deployment and transaction fees)
- Infura API key or other Ethereum node provider

## Installation

1. Install JavaScript dependencies:
```bash
bun install
```

2. Install Python dependencies:
```bash
pipenv install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your:
- Ethereum private key
- Infura API key
- Email notification settings
- Other configuration parameters

## Configuration

### Smart Contract Settings

The contracts can be configured through:
- `config.json`: DEX addresses and trading pairs
- Constructor parameters for:
  - AAVE LendingPool address
  - Token addresses
  - Slippage tolerance
  - Flash loan parameters

### Python Settings

Configure monitoring parameters in `config/config.json`:
- Minimum profit threshold
- Gas price limits
- Trading pairs to monitor
- DEX priority order
- Notification settings

## Usage

1. Start the virtual environment:
```bash
pipenv shell
```

2. Deploy contracts:
```bash
npx hardhat run scripts/deploy.js --network mainnet
```

3. Run the arbitrage bot:
```bash
pipenv run python run.py
```

The bot will:
- Monitor prices across configured DEXes
- Calculate potential profits including gas costs
- Execute trades when profitable opportunities are found
- Log results and send notifications

## Development

### Testing

Run smart contract tests:
```bash
npx hardhat test
```

Tests cover:
- Flash loan execution
- Arbitrage calculations
- Error handling
- Gas optimization

### Scripts

- `deploy.js`: Contract deployment
- `execute_trade.js`: Manual trade execution
- `reinvest_profits.js`: Profit management
- `report_generator.js`: Performance analysis

## Security

The system includes several security measures:
- Slippage protection
- MEV protection via Flashbots
- Access control for critical functions
- Comprehensive input validation
- Reentrancy protection

## Monitoring

The system logs:
- Successful trades
- Profit/loss tracking
- Gas usage
- Error conditions

Logs are stored in `arbitrage_earnings.db` and can be analyzed using the reporting scripts.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- AAVE v2 Protocol
- Uniswap/SushiSwap Teams
- Flashbots
- OpenZeppelin Contracts
