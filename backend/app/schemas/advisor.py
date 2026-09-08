from typing import List, Optional
from pydantic import BaseModel

class MarketRankingItem(BaseModel):
    market_name: str
    district: str
    state: str
    latest_modal_price: float
    expected_5d_price: float
    expected_gain: float
    expected_gain_pct: float
    trend_direction: str
    price_change_pct: float
    arrival_quantity: Optional[float] = None
    composite_score: float
    freshness: str = "Fallback"
    source_name: str = "AgriMitra Database"

class AdvisorResponse(BaseModel):
    crop_id: int
    crop_name: str
    quantity_kg: float
    quality_grade: str
    recommended_market: str
    district: str
    state: str
    current_modal_price: Optional[float] = None
    expected_price: Optional[float] = None
    expected_gain: Optional[float] = None
    recommended_window: str  # Options: Sell now, Sell within 1–2 days, Consider waiting, Limited confidence
    confidence_level: str   # Options: Confidence estimate, Limited confidence
    confidence_score: Optional[float] = None
    mae_validation_score: Optional[float] = None
    observation_count: int
    key_reasons: List[str]
    market_rankings: List[MarketRankingItem]
    data_disclaimer: str = "Market insights are based on structured prototype data and are designed for integration with government/open-data sources."
    
    # New Phase 2 Risk-Aware fields
    decision: Optional[str] = None
    decision_label: Optional[str] = None
    decision_reason: Optional[str] = None
    price_volatility: Optional[float] = None
    volatility_level: Optional[str] = None
    downside_risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    arrival_data_available: bool = False
    arrival_signal: Optional[str] = None
    arrival_trend: Optional[str] = None
    supply_pressure: Optional[str] = None
    economic_uncertainty: bool = False
    upside_score: Optional[float] = None
    storage_score: Optional[float] = None
    transport_cost_status: Optional[str] = None
    storage_cost_status: Optional[str] = None
    storage_available: bool = False
    storage_cost: Optional[float] = None
    transport_cost: Optional[float] = None
    recommended_sell_quantity: Optional[float] = None
    recommended_hold_quantity: Optional[float] = None
    data_freshness: str = "Fallback"

    expected_upside_pct: Optional[float] = None
    downside_risk: Optional[str] = None
    volatility: Optional[str] = None
    supply_pressure_status: str = "UNAVAILABLE"
    arrival_quantity: Optional[float] = None
    storage_feasible: Optional[bool] = None
    decision_horizon: Optional[str] = None
    risk_flags: List[str] = []

    warnings: List[str] = []
    
    # Herd-behavior tracking fields
    market_behavior_signal: str = "UNAVAILABLE"
    market_systemic_risk: str = "UNAVAILABLE"
    wait_concentration: Optional[float] = None
    
    # Phase 4 Weather Risk fields
    weather_data_available: bool = False
    weather_risk_level: str = "UNAVAILABLE"
    weather_condition: Optional[str] = None
    weather_warning: Optional[str] = None
    weather_source: str = "IMD"
    weather_fetched_at: Optional[str] = None

