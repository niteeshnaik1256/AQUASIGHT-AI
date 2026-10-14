from typing import List, Optional, Literal
from pydantic import BaseModel, Field, model_validator
from datetime import datetime


class HistoricalRainfallRequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees (-90 to 90)")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees (-180 to 180)")
    start_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="Start date in YYYY-MM-DD format")
    end_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="End date in YYYY-MM-DD format")

    @model_validator(mode="after")
    def validate_date_ordering(self):
        try:
            d_start = datetime.strptime(self.start_date, "%Y-%m-%d").date()
            d_end = datetime.strptime(self.end_date, "%Y-%m-%d").date()
        except ValueError as e:
            raise ValueError(f"Invalid date format: {e}")

        if d_start > d_end:
            raise ValueError(f"start_date ({self.start_date}) must be on or before end_date ({self.end_date})")
        return self


class DailyRainfallItem(BaseModel):
    date: str
    precipitation_mm: float = Field(..., ge=0.0)


class RainfallProvenance(BaseModel):
    provider: str = "Open-Meteo ERA5 Reanalysis"
    dataset: str = "ECMWF ERA5 Atmospheric Reanalysis"
    requested_latitude: float
    requested_longitude: float
    resolved_latitude: Optional[float] = None
    resolved_longitude: Optional[float] = None
    variable: str = "precipitation_sum"
    unit: str = "mm"
    time_range: str
    retrieval_timestamp: str
    is_cached: bool = False
    missing_count: int = 0
    completeness_status: Literal["complete", "partial", "unavailable"] = "complete"


class HistoricalRainfallResponse(BaseModel):
    provenance: RainfallProvenance
    daily_records: List[DailyRainfallItem]
    total_depth_mm: float
    valid_days_count: int
