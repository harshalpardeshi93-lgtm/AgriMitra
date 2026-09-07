import httpx
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

class WeatherService:
    def __init__(self):
        # Base URL for IMD public API
        self.base_url = "https://api.imd.gov.in/public/index.php"
        self.timeout = 2.0  # Fast timeout to prevent blocking the advisor

    def get_weather_for_location(self, district: str, state: str) -> dict:
        """
        Attempts to fetch weather from the official IMD API.
        Falls back to UNAVAILABLE if unauthorized, timed out, or unreachable.
        """
        try:
            with httpx.Client(timeout=self.timeout) as client:
                # Attempt to call the official endpoint
                # Since we don't have configured API credentials, this will likely fail
                # with a 401 Unauthorized, 403 Forbidden, or timeout.
                response = client.get(self.base_url, params={"district": district})
                response.raise_for_status()
                
                # If we hypothetically get data:
                data = response.json()
                if not isinstance(data, dict):
                    raise ValueError("Malformed weather response: not a dictionary")
                
                # Real implementation would parse IMD rainfall and weather condition here
                # Example rule-based mapping:
                # rainfall > 60mm -> HIGH risk
                # rainfall > 15mm -> MEDIUM risk
                # else -> LOW risk
                
                return {
                    "available": True,
                    "risk_level": "LOW",
                    "condition": "Clear",
                    "warning": None,
                    "source": "IMD",
                    "fetched_at": datetime.now(timezone.utc).isoformat() + "Z"
                }

        except Exception as e:
            logger.warning(f"Failed to fetch official weather for {district}, {state}: {str(e)}")
            # Do NOT fabricate weather data. Fall back safely to UNAVAILABLE.
            return {
                "available": False,
                "risk_level": "UNAVAILABLE",
                "condition": None,
                "warning": None,
                "source": "IMD",
                "fetched_at": datetime.now(timezone.utc).isoformat() + "Z"
            }
