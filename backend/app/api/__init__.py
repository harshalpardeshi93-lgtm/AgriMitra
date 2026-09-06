from fastapi import APIRouter
from app.api.health import router as health_router
from app.api.crops import router as crops_router
from app.api.markets import router as markets_router
from app.api.prices import router as prices_router
from app.api.trends import router as trends_router
from app.api.forecast import router as forecast_router
from app.api.advisor import router as advisor_router
from app.api.lots import router as lots_router
from app.api.offers import router as offers_router
from app.api.auth import router as auth_router
from app.api.transactions import router as transactions_router

api_router = APIRouter(prefix="/api")
api_router.include_router(health_router, tags=["Health"])
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(crops_router, tags=["Crops"])
api_router.include_router(markets_router, tags=["Markets"])
api_router.include_router(prices_router, tags=["Prices"])
api_router.include_router(trends_router, tags=["Trends"])
api_router.include_router(forecast_router, tags=["Forecast"])
api_router.include_router(advisor_router, tags=["Advisor"])
api_router.include_router(lots_router, prefix="/lots", tags=["Produce Lots"])
api_router.include_router(offers_router, prefix="/offers", tags=["Buyer Offers"])
api_router.include_router(transactions_router, prefix="/transactions", tags=["Transactions"])


