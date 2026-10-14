import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional, List
import httpx

from app.core.config import settings
from app.core.errors import ClimatologyError
from app.models.rainfall import (
    HistoricalRainfallRequest,
    HistoricalRainfallResponse,
    RainfallProvenance,
    DailyRainfallItem,
)
from app.repositories.rainfall_cache import rainfall_cache

logger = logging.getLogger(__name__)


class RainfallService:
    """
    Ingestion service for Open-Meteo Historical Weather (ERA5 Reanalysis).
    """

    def __init__(
        self,
        base_url: str = settings.OPEN_METEO_BASE_URL,
        timeout_seconds: float = settings.OPEN_METEO_TIMEOUT_SECONDS,
        max_retries: int = settings.OPEN_METEO_MAX_RETRIES,
        http_client: Optional[httpx.AsyncClient] = None,
    ):
        self.base_url = base_url
        self.timeout = timeout_seconds
        self.max_retries = max_retries
        self._external_client = http_client

    async def get_historical_rainfall(
        self,
        request: HistoricalRainfallRequest,
        bypass_cache: bool = False,
    ) -> HistoricalRainfallResponse:
        """
        Retrieves daily precipitation time series from cache or Open-Meteo.
        """
        # 1. Check cache
        if not bypass_cache:
            cached = rainfall_cache.get(
                lat=request.latitude,
                lon=request.longitude,
                start_date=request.start_date,
                end_date=request.end_date,
            )
            if cached:
                logger.info(f"Rainfall cache hit for {request.latitude}, {request.longitude}")
                return cached

        # 2. Query external Open-Meteo endpoint
        params = {
            "latitude": request.latitude,
            "longitude": request.longitude,
            "start_date": request.start_date,
            "end_date": request.end_date,
            "daily": "precipitation_sum",
            "timezone": "auto",
        }

        retrieval_time = datetime.now(timezone.utc).isoformat()
        last_error: Optional[Exception] = None

        for attempt in range(1, self.max_retries + 1):
            try:
                if self._external_client:
                    response = await self._external_client.get(
                        self.base_url,
                        params=params,
                        timeout=self.timeout,
                    )
                else:
                    async with httpx.AsyncClient(timeout=self.timeout) as client:
                        response = await client.get(self.base_url, params=params)

                if response.status_code == 429:
                    raise ClimatologyError(
                        "Open-Meteo API rate limit exceeded (HTTP 429). Please retry after a brief delay.",
                        status_code=429,
                    )
                if response.status_code >= 400:
                    raise ClimatologyError(
                        f"Open-Meteo returned HTTP error {response.status_code}: {response.text}",
                        status_code=502,
                    )

                payload = response.json()
                return self._parse_and_validate_response(request, payload, retrieval_time)

            except httpx.TimeoutException as exc:
                last_error = exc
                logger.warning(f"Open-Meteo timeout on attempt {attempt}/{self.max_retries}")
                if attempt < self.max_retries:
                    await asyncio.sleep(0.5 * attempt)
            except httpx.RequestError as exc:
                last_error = exc
                logger.warning(f"Open-Meteo network request error on attempt {attempt}: {exc}")
                if attempt < self.max_retries:
                    await asyncio.sleep(0.5 * attempt)
            except ClimatologyError:
                raise
            except Exception as exc:
                raise ClimatologyError(f"Unexpected error processing Open-Meteo response: {str(exc)}")

        raise ClimatologyError(
            f"Failed to retrieve rainfall series after {self.max_retries} attempts: {last_error}"
        )

    def _parse_and_validate_response(
        self,
        request: HistoricalRainfallRequest,
        payload: dict,
        retrieval_time: str,
    ) -> HistoricalRainfallResponse:
        """
        Parses Open-Meteo response, validates data integrity, and saves to cache.
        """
        if "daily" not in payload:
            raise ClimatologyError("Malformed Open-Meteo response: missing 'daily' section")

        daily_data = payload["daily"]
        times: List[str] = daily_data.get("time", [])
        precips: List[Optional[float]] = daily_data.get("precipitation_sum", [])

        if len(times) != len(precips):
            raise ClimatologyError(
                f"Mismatch in returned time ({len(times)}) and precipitation ({len(precips)}) array lengths"
            )

        if not times:
            raise ClimatologyError(
                f"No precipitation data returned by Open-Meteo for period {request.start_date} to {request.end_date}"
            )

        daily_records: List[DailyRainfallItem] = []
        missing_count = 0

        for d_str, p_val in zip(times, precips):
            if p_val is None:
                missing_count += 1
                # Mark as 0.0 only for record typing but flag completeness
                daily_records.append(DailyRainfallItem(date=d_str, precipitation_mm=0.0))
            elif p_val < 0:
                raise ClimatologyError(f"Negative precipitation depth ({p_val} mm) received for {d_str}")
            else:
                daily_records.append(DailyRainfallItem(date=d_str, precipitation_mm=float(p_val)))

        completeness_status = "complete"
        if missing_count == len(times):
            completeness_status = "unavailable"
        elif missing_count > 0:
            completeness_status = "partial"

        total_depth = round(sum(r.precipitation_mm for r in daily_records), 2)
        valid_days = len(daily_records) - missing_count

        provenance = RainfallProvenance(
            provider="Open-Meteo ERA5 Reanalysis",
            dataset="ECMWF ERA5 Atmospheric Reanalysis",
            requested_latitude=request.latitude,
            requested_longitude=request.longitude,
            resolved_latitude=payload.get("latitude"),
            resolved_longitude=payload.get("longitude"),
            variable="precipitation_sum",
            unit="mm",
            time_range=f"{request.start_date} to {request.end_date}",
            retrieval_timestamp=retrieval_time,
            is_cached=False,
            missing_count=missing_count,
            completeness_status=completeness_status,
        )

        response = HistoricalRainfallResponse(
            provenance=provenance,
            daily_records=daily_records,
            total_depth_mm=total_depth,
            valid_days_count=valid_days,
        )

        # Cache valid response
        rainfall_cache.set(
            lat=request.latitude,
            lon=request.longitude,
            start_date=request.start_date,
            end_date=request.end_date,
            response=response,
        )

        return response


rainfall_service = RainfallService()
