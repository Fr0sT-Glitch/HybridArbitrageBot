import os
import sqlite3
from datetime import datetime

DB_FILE = "offchain/arbitrage_earnings.db"  # ✅ Ensures this is a file

def init_db():
    if not os.path.exists("offchain"):
        os.makedirs("offchain")  # ✅ Creates directory if missing
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS earnings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            profit REAL,
            token TEXT
        )
    """)
    conn.commit()
    conn.close()

def log_earning(profit, token):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    timestamp = datetime.utcnow().isoformat()
    cursor.execute("INSERT INTO earnings (timestamp, profit, token) VALUES (?, ?, ?)", (timestamp, profit, token))
    conn.commit()
    conn.close()
    print(f"✅ Logged {profit} {token} profit at {timestamp}")

if __name__ == "__main__":
    init_db()
    log_earning(25.5, "USDT")
