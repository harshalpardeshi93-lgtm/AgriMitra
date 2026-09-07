import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error

def forecast_prices(prices: list, horizon_days: int = 7) -> Dict[str, Any]:
    """
    Chronological time-aware evaluation and Ridge Regression forecasting.
    Confidence score is dynamically calculated (NOT hardcoded).
    """
    count = len(prices) if prices else 0
    if not prices or count < 3:
        return {
            "forecast_points": [],
            "mae_score": 0.0,
            "observation_count": count,
            "confidence_score": 45.0,
            "confidence_label": "Limited confidence",
            "horizon_days": horizon_days
        }

    df = pd.DataFrame(prices)
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)

    # Feature Engineering
    df["day_idx"] = np.arange(len(df))
    df["sma_3"] = df["modal_price"].rolling(window=3, min_periods=1).mean()
    df["arrival_qty"] = df["arrival_quantity"].astype(float)

    # Use arrival_qty only if it doesn't contain NaNs
    if df["arrival_qty"].isna().any():
        features = ["day_idx", "sma_3"]
    else:
        features = ["day_idx", "sma_3", "arrival_qty"]

    X = df[features].values
    y = df["modal_price"].values

    # CHRONOLOGICAL TRAIN / TEST SPLIT (NO RANDOM SHUFFLE)
    if count >= 7:
        split_idx = max(2, int(count * 0.8))
        X_train, X_val = X[:split_idx], X[split_idx:]
        y_train, y_val = y[:split_idx], y[split_idx:]

        val_model = Ridge(alpha=1.0)
        val_model.fit(X_train, y_train)
        y_val_pred = val_model.predict(X_val)
        mae = round(float(mean_absolute_error(y_val, y_val_pred)), 2)
    else:
        # For small historical samples, compute in-sample MAE
        val_model = Ridge(alpha=1.0)
        val_model.fit(X, y)
        y_pred = val_model.predict(X)
        mae = round(float(mean_absolute_error(y, y_pred)), 2)

    # DYNAMIC CONFIDENCE CALCULATION BASED ON MEASURABLE FACTORS
    mean_price = float(np.mean(y))
    std_price = float(np.std(y))
    mape = (mae / mean_price * 100.0) if mean_price > 0 else 0.0
    volatility_ratio = (std_price / mean_price * 100.0) if mean_price > 0 else 0.0

    if count < 7:
        confidence_label = "Limited confidence"
        confidence_score = round(max(40.0, 60.0 - mape * 2.0), 1)
    else:
        confidence_label = "Confidence estimate"
        raw_score = 90.0 - (mape * 3.0) - (volatility_ratio * 1.5) + min(10.0, count * 0.4)
        confidence_score = round(max(40.0, min(86.0, raw_score)), 1)

    # Final Fit on complete dataset for horizon forecast
    full_model = Ridge(alpha=1.0)
    full_model.fit(X, y)

    last_date = df["date"].iloc[-1]
    last_day_idx = df["day_idx"].iloc[-1]
    last_sma3 = df["sma_3"].iloc[-1]
    last_arrival = df["arrival_qty"].iloc[-1]

    forecast_points = []
    current_sma3 = last_sma3

    for i in range(1, horizon_days + 1):
        future_date = (last_date + timedelta(days=i)).strftime("%Y-%m-%d")
        future_idx = last_day_idx + i
        
        if "arrival_qty" in features:
            pred_val = full_model.predict([[future_idx, current_sma3, last_arrival]])[0]
        else:
            pred_val = full_model.predict([[future_idx, current_sma3]])[0]
        pred_price = round(float(pred_val), 2)
        
        # Update rolling SMA buffer for multi-step recursive forecasting
        current_sma3 = round((current_sma3 * 2 + pred_price) / 3, 2)

        forecast_points.append({
            "date": future_date,
            "predicted_modal_price": pred_price,
            "min_expected": round(pred_price * 0.95, 2),
            "max_expected": round(pred_price * 1.05, 2),
            "is_forecast": True
        })

    return {
        "forecast_points": forecast_points,
        "mae_score": mae,
        "observation_count": count,
        "confidence_score": confidence_score,
        "confidence_label": confidence_label,
        "horizon_days": horizon_days
    }
