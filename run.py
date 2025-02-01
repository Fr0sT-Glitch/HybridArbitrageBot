# Main execution script for Hybrid Arbitrage Bot
import os
import time
from web3 import Web3
from dotenv import load_dotenv

load_dotenv()
INFURA_URL = os.getenv("INFURA_URL")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")

web3 = Web3(Web3.HTTPProvider(INFURA_URL))

def main():
    while True:
        print("Scanning for arbitrage opportunities...")
        time.sleep(60)

if __name__ == "__main__":
    main()