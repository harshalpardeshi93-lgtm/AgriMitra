import os
import time
import logging
import requests
from typing import List, Dict, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class ExternalMarketService:
    def __init__(self):
        # Allow disabling integration entirely
        self.api_key = os.getenv("DATA_GOV_IN_API_KEY")
        self.resource_id = os.getenv("DATA_GOV_IN_RESOURCE_ID", "9ef84268-d588-465a-a308-a864a43d0070")
        self.base_url = f"https://api.data.gov.in/resource/{self.resource_id}"
        # Cache mechanism: key -> (timestamp, data)
        self._cache: Dict[str, tuple] = {}
        self.cache_ttl = int(os.getenv("EXTERNAL_MARKET_CACHE_TTL_SEC", "3600"))

    def _get_cache_key(self, crop_name: str, state: Optional[str] = None, district: Optional[str] = None) -> str:
        parts = [crop_name.strip().lower()]
        if state:
            parts.append(state.strip().lower())
        if district:
            parts.append(district.strip().lower())
        return "_".join(parts)

    def fetch_live_prices(
        self, crop_name: str, state: Optional[str] = None, district: Optional[str] = None
    ) -> List[Dict]:
        if not self.api_key:
            logger.info("DATA_GOV_IN_API_KEY is not set. Skipping external fetch.")
            return []

        cache_key = self._get_cache_key(crop_name, state, district)
        cached = self._cache.get(cache_key)
        
        if cached and (time.time() - cached[0]) < self.cache_ttl:
            logger.debug(f"Cache hit for external market data: {cache_key}")
            return cached[1]

        params = {
            "api-key": self.api_key,
            "format": "json",
            "limit": "100", # Fetch up to 100 records for the combination
            "filters[commodity]": crop_name,
        }
        
        if state:
            params["filters[state]"] = state
        if district:
            params["filters[district]"] = district

        try:
            logger.info(f"Fetching external market data for {crop_name}, state={state}, district={district}")
            response = requests.get(self.base_url, params=params, timeout=30.0)
            response.raise_for_status()
            data = response.json()
            
            records = data.get("records", [])
            normalized_records = []
            current_time = datetime.utcnow().isoformat() + "Z"
            
            for r in records:
                try:
                    # Data.gov.in typically returns values as strings
                    min_p = float(r.get("min_price", 0))
                    max_p = float(r.get("max_price", 0))
                    modal_p = float(r.get("modal_price", 0))
                    # arrival_qty or arrival_qtl might be present depending on the dataset.
                    raw_arr = r.get("arrival_qty", r.get("arrival_qtl"))
                    arr_qty = float(raw_arr) if raw_arr is not None and str(raw_arr).strip() != "" else None
                    
                    normalized_records.append({
                        "market_name": str(r.get("market", "")).strip(),
                        "district": str(r.get("district", "")).strip(),
                        "state": str(r.get("state", "")).strip(),
                        "crop_name": str(r.get("commodity", crop_name)).strip(),
                        "date": str(r.get("arrival_date", "")).strip(),
                        "min_price": min_p,
                        "max_price": max_p,
                        "modal_price": modal_p,
                        "arrival_quantity": arr_qty,
                        "source_name": "data.gov.in (AGMARKNET)",
                        "fetched_at": current_time,
                        "data_timestamp": str(r.get("arrival_date", "")).strip(),
                        "freshness": "Live"
                    })
                except (ValueError, TypeError) as e:
                    logger.warning(f"Failed to parse external record: {r} Error: {e}")
                    continue
            
            # Cache the successfully parsed records, even if empty, to avoid spamming on misses
            self._cache[cache_key] = (time.time(), normalized_records)
            return normalized_records
            
        except requests.exceptions.Timeout:
            logger.error("Timeout fetching from external API")
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching from external API: {e}")
        except Exception as e:
            logger.error(f"Unexpected error in ExternalMarketService: {e}")

        return []

    def clear_cache(self):
        self._cache.clear()

external_market_service = ExternalMarketService()
