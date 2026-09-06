import time
from sqlalchemy import event
from sqlalchemy.engine import Engine
from app.database.session import SessionLocal
from app.models.user import User
from app.api.transactions import get_farmer_transactions
from app.api.offers import get_seller_offers

query_count = 0

@event.listens_for(Engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    global query_count
    query_count += 1

def measure_farmer_transactions_optimized():
    global query_count
    db = SessionLocal()
    farmer = db.query(User).filter(User.role == "farmer").first()
    query_count = 0
    
    # We call the optimized endpoint directly.
    # It fetches all available transactions.
    txns = get_farmer_transactions(farmer_id=farmer.id, db=db, current_user=farmer)
    print(f"Transactions Optimized (Total={len(txns)}): {query_count} queries")
    db.close()

def measure_seller_offers_optimized():
    global query_count
    db = SessionLocal()
    farmer = db.query(User).filter(User.role == "farmer").first()
    query_count = 0
    
    # We call the optimized endpoint directly.
    # It fetches all available offers.
    offers = get_seller_offers(farmer_id=farmer.id, db=db, current_user=farmer)
    print(f"Offers Optimized (Total={len(offers)}): {query_count} queries")
    db.close()

if __name__ == "__main__":
    print("--- OPTIMIZED ENDPOINT TEST ---")
    measure_farmer_transactions_optimized()
    measure_seller_offers_optimized()
