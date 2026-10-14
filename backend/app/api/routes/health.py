from datetime import datetime, timezone
from fastapi import APIRouter

router = APIRouter()


@router.get("/health", tags=["System"])
def get_health():
    """
    Health check endpoint reporting backend service status and engine version.
    """
    return {
        "status": "healthy",
        "service": "aquasight-hydrology-engine",
        "version": "0.2.0-phase2",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "capabilities": [
            "deterministic_runoff",
            "event_first_flush",
            "daily_continuous_water_balance",
            "open_meteo_era5_ingestion",
        ],
    }
