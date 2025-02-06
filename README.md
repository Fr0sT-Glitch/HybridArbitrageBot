# Hybrid Arbitrage Bot

## Features
- Uses flash loans for arbitrage trading
- Prevents unprofitable trades
- Supports multiple DEX aggregators
- Optimizes gas fees

## Installation
```sh
bun install
pip install python-dotenv web3 requests
```

## Deployment
```sh
npx hardhat compile
npx hardhat run scripts/deploy.js --network mainnet
```

## Running the Bot
```sh
python run.py
```
