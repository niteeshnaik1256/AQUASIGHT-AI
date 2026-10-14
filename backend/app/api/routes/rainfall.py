from fastapi import APIRouter
from app.models.rainfall import HistoricalRainfallRequest, HistoricalRainfallResponse
from app.services.rainfall_service import rainfall_service

router = APIRouter(prefix="/rainfall", tags=["Rainfall"])


@router.post("/historical", response_model=HistoricalRainfallResponse)
async def get_historical_rainfall(request: HistoricalRainfallRequest):
    """
    Retrieves and caches historical daily precipitation data for given coordinates
    and date range using the Open-Meteo ERA5 Reanalysis archive.
    """
    return await rainfall_service.get_historical_rainfall(request)
