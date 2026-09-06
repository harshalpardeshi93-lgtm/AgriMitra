import os
import sys
import datetime

# Ensure backend root is on sys.path when running script directly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.session import SessionLocal, engine, Base
from app.models.crop import Crop
from app.models.market import Market
from app.models.price import MarketPrice
from app.models.user import User
from app.models.lot import ProduceLot
from app.models.offer import BuyerOffer

def seed_database(force_reseed=False):
    print("Ensuring database tables exist...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Check if already seeded
        if not force_reseed and db.query(MarketPrice).count() > 100:
            print("Database already contains multi-day historical seed data. Skipping seed step.")
            return

        # Clear existing entries if force_reseed
        if force_reseed:
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)


        if not db.query(Crop).first():
            print("Seeding crops...")
            crops_data = [
                {"id": 1, "name": "Tomato", "unit": "quintal"},
                {"id": 2, "name": "Onion", "unit": "quintal"},
                {"id": 3, "name": "Potato", "unit": "quintal"},
                {"id": 4, "name": "Wheat", "unit": "quintal"},
                {"id": 5, "name": "Rice", "unit": "quintal"},
                {"id": 6, "name": "Soybean", "unit": "quintal"},
                {"id": 7, "name": "Cotton", "unit": "quintal"},
                {"id": 8, "name": "Maize", "unit": "quintal"},
            ]
            crops = [Crop(**c) for c in crops_data]
            db.add_all(crops)
            db.commit()

        if not db.query(Market).first():
            print("Seeding markets...")
            markets_data = [
                {"id": 1, "name": "Mumbai APMC (Vashi)", "district": "Thane", "state": "Maharashtra", "latitude": 19.0760, "longitude": 72.8777},
                {"id": 2, "name": "Pune APMC (Gultekdi)", "district": "Pune", "state": "Maharashtra", "latitude": 18.5204, "longitude": 73.8567},
                {"id": 3, "name": "Nashik APMC Mandi", "district": "Nashik", "state": "Maharashtra", "latitude": 19.9975, "longitude": 73.7898},
                {"id": 4, "name": "Lasalgaon Mandi", "district": "Nashik", "state": "Maharashtra", "latitude": 20.1472, "longitude": 74.2306},
                {"id": 5, "name": "Ahmednagar Mandi", "district": "Ahmednagar", "state": "Maharashtra", "latitude": 19.0948, "longitude": 74.7480},
                {"id": 6, "name": "Nagpur APMC", "district": "Nagpur", "state": "Maharashtra", "latitude": 21.1458, "longitude": 79.0882},
                {"id": 7, "name": "Solapur APMC", "district": "Solapur", "state": "Maharashtra", "latitude": 17.6599, "longitude": 75.9064},
                {"id": 8, "name": "Indore Mandi", "district": "Indore", "state": "Madhya Pradesh", "latitude": 22.7196, "longitude": 75.8577},
            ]
            markets = [Market(**m) for m in markets_data]
            db.add_all(markets)
            db.commit()

        print("Seeding multi-week historical market prices...")
        
        # Base price templates per crop & market
        base_configs = [
            # Tomato (Crop 1)
            (1, 1, 2850, 1200, 15),   # Mumbai
            (1, 2, 2780, 950, 12),    # Pune
            (1, 3, 2720, 1350, 10),   # Nashik
            (1, 4, 2700, 1050, 8),    # Lasalgaon
            (1, 5, 2680, 800, 14),    # Ahmednagar
            (1, 6, 2740, 900, 9),     # Nagpur
            (1, 7, 2690, 750, 11),    # Solapur

            # Onion (Crop 2)
            (2, 4, 2600, 3300, 20),   # Lasalgaon
            (2, 3, 2520, 2800, 18),   # Nashik
            (2, 1, 2720, 2050, 22),   # Mumbai
            (2, 2, 2640, 1800, 16),   # Pune

            # Wheat (Crop 4)
            (4, 8, 2880, 4100, 10),   # Indore
            (4, 1, 3010, 2700, 12),   # Mumbai
            (4, 2, 2920, 2350, 9),    # Pune
            (4, 3, 2840, 1750, 8),    # Nashik

            # Soybean (Crop 6)
            (6, 8, 4600, 3700, 25),   # Indore
            (6, 6, 4520, 3100, 22),   # Nagpur
            (6, 5, 4440, 2050, 20),   # Ahmednagar
            (6, 3, 4400, 1850, 18),   # Nashik

            # Cotton (Crop 7) - Seeded with 25 days for completeness
            (7, 8, 7100, 500, 15),    # Indore
            (7, 6, 7050, 400, 12),    # Nagpur
            (7, 1, 7200, 300, 10),    # Mumbai

            # Potato (Crop 3)
            (3, 8, 1500, 600, 10),    # Indore
            (3, 1, 1600, 500, 12),    # Mumbai

            # Rice (Crop 5)
            (5, 8, 3200, 800, 20),    # Indore
            (5, 2, 3300, 750, 18),    # Pune

            # Maize (Crop 8)
            (8, 8, 2100, 400, 15),    # Indore
            (8, 3, 2150, 350, 12),    # Nashik
        ]

        # Generate 25 days of historical data up to 2026-09-05
        today = datetime.date(2026, 9, 5)
        prices_data = []

        for day_offset in range(24, -1, -1):
            curr_date = (today - datetime.timedelta(days=day_offset)).isoformat()
            
            for crop_id, market_id, start_modal, start_arr, trend_factor in base_configs:
                # Add deterministic smooth trend variation across days
                day_delta = (24 - day_offset)
                seasonal_wave = (day_delta * trend_factor * 0.8) + ((day_delta % 3) * 15) - ((day_delta % 5) * 10)
                
                modal = round(start_modal + seasonal_wave, 2)
                min_p = round(modal - 130 - ((day_delta % 4) * 10), 2)
                max_p = round(modal + 140 + ((day_delta % 3) * 12), 2)
                arrivals = round(start_arr + ((day_delta % 7) * 40) - ((day_delta % 4) * 25), 1)

                prices_data.append(MarketPrice(
                    market_id=market_id,
                    crop_id=crop_id,
                    date=curr_date,
                    min_price=min_p,
                    max_price=max_p,
                    modal_price=modal,
                    arrival_quantity=arrivals
                ))

        db.add_all(prices_data)
        db.commit()
        print(f"Successfully seeded {len(prices_data)} historical price records across 25 days!")

        from app.services.auth_service import hash_password

        demo_pass_hash = hash_password("demo123")

        if not db.query(User).first():
            print("Seeding Users, Produce Lots, and Offers...")
            users = [
                User(id=1, name="Ramesh Farmer", role="farmer", location="Nashik, Maharashtra", phone="9876543210", password_hash=demo_pass_hash),
                User(id=2, name="Suresh Buyer", role="buyer", location="Mumbai, Maharashtra", phone="9876543211", password_hash=demo_pass_hash),
                User(id=3, name="FPO Nashik", role="fpo", location="Nashik, Maharashtra", phone="9876543212", password_hash=demo_pass_hash)
            ]
            db.add_all(users)
            db.commit()

            lots = [
                ProduceLot(id=1, farmer_id=1, crop_id=1, market_id=3, quantity_quintals=50, quality_grade="Grade A", expected_price_per_quintal=2800, status="Available"),
                ProduceLot(id=2, farmer_id=3, crop_id=2, market_id=4, quantity_quintals=120, quality_grade="Grade B", expected_price_per_quintal=2500, status="Available"),
                ProduceLot(id=3, farmer_id=1, crop_id=4, market_id=3, quantity_quintals=80, quality_grade="Premium", expected_price_per_quintal=2900, status="Available"),
                ProduceLot(id=4, farmer_id=3, crop_id=6, market_id=3, quantity_quintals=200, quality_grade="Grade A", expected_price_per_quintal=4500, status="Available")
            ]
            db.add_all(lots)
            db.commit()

            offers = [
                BuyerOffer(id=1, lot_id=1, buyer_id=2, offered_price=2750, quantity=50, message="Ready to buy immediately.", status="Pending")
            ]
            db.add_all(offers)
            db.commit()
            print("Successfully seeded Buyer Dashboard prototype data!")
        else:
            # Ensure existing demo users have phone & password_hash populated
            u1 = db.query(User).filter(User.id == 1).first()
            if u1 and not u1.phone:
                u1.phone = "9876543210"
                u1.password_hash = demo_pass_hash
            u2 = db.query(User).filter(User.id == 2).first()
            if u2 and not u2.phone:
                u2.phone = "9876543211"
                u2.password_hash = demo_pass_hash
            u3 = db.query(User).filter(User.id == 3).first()
            if u3 and not u3.phone:
                u3.phone = "9876543212"
                u3.password_hash = demo_pass_hash
            db.commit()


    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database(force_reseed=True)
