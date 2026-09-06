import pandas as pd
import numpy as np
from typing import Dict, Any

def analyze_price_trend(prices: list) -> Dict[str, Any]:
    """
    Analyze historical price trends for a crop in a given market using Pandas.
    """
    if not prices:
        return {
            "trend_direction": "Stable",
            "price_change_pct": None,
            "price_velocity_per_day": None,
            "sma_3": None,
            "sma_7": None,
            "volatility": None,
            "latest_price": None,
            "start_price": None,
            "data_points_count": 0
        }

    df = pd.DataFrame(prices)
    if "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"])
        df = df.sort_values("date").reset_index(drop=True)

    modal_prices = df["modal_price"].astype(float)
    count = len(modal_prices)

    if count < 2:
        val = float(modal_prices.iloc[0]) if count == 1 else 0.0
        return {
            "trend_direction": "Stable",
            "price_change_pct": 0.0,
            "price_velocity_per_day": 0.0,
            "sma_3": val,
            "sma_7": val,
            "volatility": 0.0,
            "latest_price": val,
            "start_price": val,
            "data_points_count": count
        }

    start_price = float(modal_prices.iloc[0])
    latest_price = float(modal_prices.iloc[-1])
    
    price_change = latest_price - start_price
    price_change_pct = round((price_change / start_price) * 100, 2) if start_price > 0 else 0.0
    velocity = round(price_change / count, 2)

    sma_3 = round(float(modal_prices.tail(3).mean()), 2)
    sma_7 = round(float(modal_prices.tail(7).mean()), 2)
    volatility = round(float(modal_prices.std()), 2) if count > 1 else 0.0

    if price_change_pct > 1.5:
        direction = "Uptrend"
    elif price_change_pct < -1.5:
        direction = "Downtrend"
    else:
        direction = "Stable"

    return {
        "trend_direction": direction,
        "price_change_pct": price_change_pct,
        "price_velocity_per_day": velocity,
        "sma_3": sma_3,
        "sma_7": sma_7,
        "volatility": volatility,
        "latest_price": latest_price,
        "start_price": start_price,
        "data_points_count": count
    }
