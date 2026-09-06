import sys
import os
import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.session import SessionLocal
from app.models.price import MarketPrice
from app.models.crop import Crop
from app.models.market import Market

def patch_db():
    db = SessionLocal()
    
    # Check if we already seeded them
    cotton = db.query(Crop).filter(Crop.id == 7).first()
    if not cotton:
        print("Cotton not found!")
        return

    cotton_prices = db.query(MarketPrice).filter(MarketPrice.crop_id == 7).count()
    if cotton_prices > 0:
        print("Cotton already seeded!")
        return

    configs = [
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

    today = datetime.date(2026, 9, 5)
    prices_data = []

    for day_offset in range(24, -1, -1):
        curr_date = (today - datetime.timedelta(days=day_offset)).isoformat()
        
        for crop_id, market_id, start_modal, start_arr, trend_factor in configs:
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
    db.close()
    print(f"Successfully inserted {len(prices_data)} missing price records!")

if __name__ == '__main__':
    patch_db()
