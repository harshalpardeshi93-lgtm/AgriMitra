import pytest
import os
import time
from unittest.mock import patch, MagicMock
from app.services.external_market_service import ExternalMarketService, external_market_service
from app.schemas.price import MarketPriceResponse
from app.services.price_service import get_market_prices

@pytest.fixture
def test_db_session():
    # Mocking DB session for get_market_prices
    session = MagicMock()
    return session

def test_external_market_service_disabled():
    service = ExternalMarketService()
    service.api_key = None
    prices = service.fetch_live_prices("Wheat")
    assert prices == []

@patch("app.services.external_market_service.requests.get")
def test_external_market_service_success(mock_get):
    service = ExternalMarketService()
    service.api_key = "test_key"
    
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "records": [
            {
                "market": "Pune",
                "district": "Pune",
                "state": "Maharashtra",
                "commodity": "Wheat",
                "arrival_date": "2024-12-01",
                "min_price": "2000",
                "max_price": "2500",
                "modal_price": "2300",
                "arrival_qty": "100"
            }
        ]
    }
    mock_get.return_value = mock_response
    
    prices = service.fetch_live_prices("Wheat")
    assert len(prices) == 1
    p = prices[0]
    assert p["market_name"] == "Pune"
    assert p["state"] == "Maharashtra"
    assert p["modal_price"] == 2300.0
    assert p["arrival_quantity"] == 100.0
    assert p["freshness"] == "Live"

@patch("app.services.external_market_service.requests.get")
def test_external_market_service_caching(mock_get):
    service = ExternalMarketService()
    service.api_key = "test_key"
    service.clear_cache()
    
    mock_response = MagicMock()
    mock_response.json.return_value = {"records": []}
    mock_get.return_value = mock_response
    
    # First call
    service.fetch_live_prices("Rice")
    assert mock_get.call_count == 1
    
    # Second call should hit cache
    service.fetch_live_prices("Rice")
    assert mock_get.call_count == 1
    
    # Call with different params
    service.fetch_live_prices("Rice", state="Maharashtra")
    assert mock_get.call_count == 2

@patch("app.services.external_market_service.requests.get")
def test_external_market_service_timeout(mock_get):
    import requests
    service = ExternalMarketService()
    service.api_key = "test_key"
    
    mock_get.side_effect = requests.exceptions.Timeout("Timeout")
    prices = service.fetch_live_prices("Soyabean")
    assert prices == []

def test_price_service_merge(test_db_session):
    # Setup mock DB query result
    mock_row = MagicMock()
    mock_row.id = 1
    mock_row.market_id = 10
    mock_row.market_name = "Nashik"
    mock_row.district = "Nashik"
    mock_row.state = "Maharashtra"
    mock_row.crop_id = 5
    mock_row.crop_name = "Onion"
    mock_row.date = "2024-11-20"
    mock_row.min_price = 1000.0
    mock_row.max_price = 1500.0
    mock_row.modal_price = 1200.0
    mock_row.arrival_quantity = 50.0

    mock_query = MagicMock()
    mock_query.join.return_value = mock_query
    mock_query.filter.return_value = mock_query
    mock_query.order_by.return_value = mock_query
    mock_query.all.return_value = [mock_row]
    
    test_db_session.query.return_value = mock_query

    with patch("app.services.external_market_service.ExternalMarketService.fetch_live_prices") as mock_fetch:
        mock_fetch.return_value = [
            {
                "market_name": "Nashik",
                "district": "Nashik",
                "state": "Maharashtra",
                "crop_name": "Onion",
                "date": "2024-12-01",
                "min_price": 1200.0,
                "max_price": 1800.0,
                "modal_price": 1500.0,
                "arrival_quantity": 200.0,
                "source_name": "data.gov.in (AGMARKNET)",
                "fetched_at": "2024-12-01T10:00:00Z",
                "data_timestamp": "2024-12-01",
                "freshness": "Live"
            }
        ]

        responses = get_market_prices(test_db_session, crop_id=5)
        
        assert len(responses) == 1
        assert responses[0].market_name == "Nashik"
        assert responses[0].modal_price == 1500.0  # Overwritten by live data
        assert responses[0].arrival_quantity == 200.0
        assert responses[0].freshness == "Live"
        assert responses[0].source_name == "data.gov.in (AGMARKNET)"

def test_price_service_fallback(test_db_session):
    # Setup mock DB query result
    mock_row = MagicMock()
    mock_row.id = 1
    mock_row.market_id = 10
    mock_row.market_name = "Nashik"
    mock_row.district = "Nashik"
    mock_row.state = "Maharashtra"
    mock_row.crop_id = 5
    mock_row.crop_name = "Onion"
    mock_row.date = "2024-11-20"
    mock_row.min_price = 1000.0
    mock_row.max_price = 1500.0
    mock_row.modal_price = 1200.0
    mock_row.arrival_quantity = 50.0

    mock_query = MagicMock()
    mock_query.join.return_value = mock_query
    mock_query.filter.return_value = mock_query
    mock_query.order_by.return_value = mock_query
    mock_query.all.return_value = [mock_row]
    
    test_db_session.query.return_value = mock_query

    with patch("app.services.external_market_service.ExternalMarketService.fetch_live_prices") as mock_fetch:
        mock_fetch.return_value = []

        responses = get_market_prices(test_db_session, crop_id=5)
        
        assert len(responses) == 1
        assert responses[0].market_name == "Nashik"
        assert responses[0].modal_price == 1200.0  # Kept fallback data
        assert responses[0].freshness == "Fallback"
        assert responses[0].source_name == "AgriMitra Database"

def test_advisor_with_live_data(test_db_session):
    from app.services.advisor_service import get_ai_advisor_recommendation
    from app.models.crop import Crop
    from app.models.market import Market
    from app.models.price import MarketPrice

    # Mock Crop and Market
    mock_crop = MagicMock()
    mock_crop.id = 5
    mock_crop.name = "Onion"

    mock_market = MagicMock()
    mock_market.id = 10
    mock_market.name = "Nashik"
    mock_market.district = "Nashik"
    mock_market.state = "Maharashtra"

    # Mock DB queries
    def mock_query_side_effect(*args, **kwargs):
        q = MagicMock()
        if args[0] is Crop:
            q.filter.return_value.first.return_value = mock_crop
        elif args[0] is Market:
            q.all.return_value = [mock_market]
        else:
            # historical prices or price_service query
            mock_row = MagicMock()
            mock_row.date = "2024-11-20"
            mock_row.modal_price = 1200.0
            mock_row.arrival_quantity = 50.0
            q.filter.return_value.order_by.return_value.all.return_value = [mock_row]
            q.join.return_value = q
        return q

    test_db_session.query.side_effect = mock_query_side_effect

    with patch("app.services.advisor_service.get_market_prices") as mock_get_prices:
        # Mock the live response merging
        mock_live_response = MagicMock()
        mock_live_response.market_name = "Nashik"
        mock_live_response.district = "Nashik"
        mock_live_response.state = "Maharashtra"
        mock_live_response.date = "2024-12-01"
        mock_live_response.modal_price = 1500.0
        mock_live_response.arrival_quantity = None
        mock_live_response.freshness = "Live"
        mock_live_response.source_name = "data.gov.in"
        
        mock_get_prices.return_value = [mock_live_response]

        res = get_ai_advisor_recommendation(test_db_session, crop_id=5)
        
        assert res is not None
        assert len(res.market_rankings) == 1
        ranking = res.market_rankings[0]
        assert ranking.market_name == "Nashik"
        assert ranking.latest_modal_price == 1500.0 # Live price
        assert ranking.arrival_quantity is None # Safely handled missing arrival
        assert ranking.freshness == "Live"
        assert ranking.source_name == "data.gov.in"
        
        # Check reasons for missing arrival warning
        has_warning = any("Arrival quantity (supply volume) is currently unavailable" in r for r in res.key_reasons)
        assert has_warning, "Expected missing arrival warning in key reasons"
