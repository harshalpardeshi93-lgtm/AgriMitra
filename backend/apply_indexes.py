import sqlite3
import os

DB_PATH = "data/agrimitra.db"

def add_indexes():
    if not os.path.exists(DB_PATH):
        print("Database not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    queries = [
        "CREATE INDEX IF NOT EXISTS ix_transactions_lot_id ON transactions (lot_id);",
        "CREATE INDEX IF NOT EXISTS ix_transactions_buyer_id ON transactions (buyer_id);",
        "CREATE INDEX IF NOT EXISTS ix_transactions_farmer_id ON transactions (farmer_id);",
        "CREATE INDEX IF NOT EXISTS ix_transactions_payment_status ON transactions (payment_status);",
        "CREATE INDEX IF NOT EXISTS ix_transactions_transaction_status ON transactions (transaction_status);",
        
        "CREATE INDEX IF NOT EXISTS ix_buyer_offers_lot_id ON buyer_offers (lot_id);",
        "CREATE INDEX IF NOT EXISTS ix_buyer_offers_buyer_id ON buyer_offers (buyer_id);",
        "CREATE INDEX IF NOT EXISTS ix_buyer_offers_status ON buyer_offers (status);",
        
        "CREATE INDEX IF NOT EXISTS ix_produce_lots_farmer_id ON produce_lots (farmer_id);",
        "CREATE INDEX IF NOT EXISTS ix_produce_lots_crop_id ON produce_lots (crop_id);",
        "CREATE INDEX IF NOT EXISTS ix_produce_lots_market_id ON produce_lots (market_id);",
        "CREATE INDEX IF NOT EXISTS ix_produce_lots_status ON produce_lots (status);"
    ]

    for q in queries:
        try:
            cursor.execute(q)
            print(f"Executed: {q}")
        except Exception as e:
            print(f"Error executing {q}: {e}")

    conn.commit()
    conn.close()
    print("Index update complete.")

if __name__ == "__main__":
    add_indexes()
