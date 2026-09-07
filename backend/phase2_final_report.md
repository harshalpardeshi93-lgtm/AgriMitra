# Phase 2 — Risk-Aware AI Sell Advisor Final Report

## 1. Files Changed
- `backend/app/api/advisor.py`: Added `transport_cost` parameter to API endpoint.
- `backend/app/services/advisor_service.py`: Passed `transport_cost` down to the ML module.
- `backend/app/ml/market_advisor.py`: Overhauled the decision engine, incorporated storage/transport costs, and fixed arrival data penalization.
- `backend/test_advisor_decision.py`: Added tests for high-risk mentor scenarios and storage costs.
- `frontend/src/pages/FarmerDashboard.jsx`: Added UI elements to display backend warnings (e.g., missing arrival data).

## 2. Existing Advisor Logic Found
The existing logic already had implementations for calculating simple volatility (standard deviation of percentage price changes) and a downside risk score based on historical drawdowns and trend direction. The original decision logic was a rigid IF/ELSE structure that often fell back to `WAIT` if the expected gain was positive, or `LOW_CONFIDENCE` if data was slightly incomplete.

## 3. New Risk Factors
The upgrade introduces explicit consideration of:
- **Net Expected Gain:** Deducting `storage_cost` and `transport_cost` from the gross expected gain.
- **Storage Availability Constraint:** Forcing a sell action if no storage is available, rather than waiting.
- **High Downside Risk Override:** Preventing a blind `WAIT` recommendation if downside risk is classified as `HIGH`.
- **Systemic Risk:** Accounting for high market systemic risk to recommend partial selling.

## 4. Decision Algorithm
The decision engine calculates a `composite_score` and then evaluates multiple factors sequentially:
1. Validates minimum data requirements.
2. Checks confidence thresholds. If confidence is very low and risk is low/moderate, it falls back to `LOW_CONFIDENCE`. If risk is high, it prioritizes a safe sell action.
3. Evaluates Net Expected Gain vs Risk. High risk or high volatility triggers `PARTIAL_SELL` (if storage exists and there's upside) or `SELL_NOW`.
4. Without storage availability, it defaults to `SELL_NOW`.
5. Only if upside is meaningful, risk is acceptable, and storage exists does it recommend `WAIT`.

## 5. Volatility Method
Uses the existing function `calculate_volatility`: Calculates the percentage returns between consecutive days and computes the standard deviation. A deviation > 5.0% is flagged as `HIGH` volatility.

## 6. Downside-Risk Method
Uses the existing `calculate_downside_risk`: Computes potential drawdown from the current price to the historical minimum, adding penalty points for a downward trend and high volatility. A score > 60 is classified as `HIGH` downside risk.

## 7. Confidence Method
Uses the dynamic confidence calculator in `price_forecaster.py`. Confidence drops mathematically based on high Mean Absolute Percentage Error (MAPE) and low data points. The advisor logic further dynamically reduces confidence by 10 points if arrival data is missing, and by 5 points if storage is available but its cost is unknown.

## 8. Arrival-Data Handling
If arrival data is unavailable from the data source, the system no longer penalizes the market by setting the liquidity score to 0.0. Instead, it computes the composite score using price and momentum only, scales it appropriately, and issues a warning to the farmer while reducing recommendation confidence.

## 9. Partial-Sell Calculation
As exact farmer storage capacity is unknown via the current API, the system avoids generating unsafe exact sell quantities (e.g., "sell exactly 300kg"). Instead, `recommended_sell_quantity` remains `None`, and the qualitative `decision_reason` advises the farmer to "Sell a portion now and hold the remainder only if storage is available."

## 10. Example Mentor-Risk Scenario Result
A new test (`test_mentor_scenario_high_risk_missing_arrival`) was implemented where current price is 2400/qtl and forecast is higher, but volatility and downside risk are high, and arrival data is missing. The advisor successfully avoids recommending `WAIT` and correctly recommends `PARTIAL_SELL` or `SELL_NOW`.

## 11. Backend Tests
All tests pass successfully. Tests added cover the mentor scenario, ensuring negative expected net gain (due to storage costs) triggers a sell, and validating that missing arrival data returns the correct signal without crashing.

## 12. Frontend Build
The Vite React frontend successfully builds without errors. The Farmer Dashboard now seamlessly integrates and displays the dynamic backend warnings.

## 13. Limitations
- **Storage Capacity:** True quantitative partial-sell splits require knowing the farmer's maximum available storage capacity in Kg, which is not currently collected.
- **Future Predictions:** The algorithm relies on standard Ridge regression which assumes linear trends; sudden market shocks cannot be reliably predicted.
