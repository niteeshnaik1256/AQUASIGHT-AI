import pytest
import httpx
from unittest.mock import AsyncMock

from app.models.rainfall import HistoricalRainfallRequest
from app.services.rainfall_service import RainfallService
from app.core.errors import ClimatologyError
from app.repositories.rainfall_cache import rainfall_cache


@pytest.fixture(autouse=True)
def clear_cache():
    rainfall_cache.clear()
    yield
    rainfall_cache.clear()


@pytest.mark.asyncio
async def test_successful_rainfall_ingestion():
    mock_payload = {
        "latitude": 12.97,
        "longitude": 77.59,
        "daily": {
            "time": ["2024-01-01", "2024-01-02", "2024-01-03"],
            "precipitation_sum": [0.0, 15.2, 8.4],
        },
    }

    mock_client = AsyncMock(spec=httpx.AsyncClient)
    mock_client.get.return_value = httpx.Response(
        status_code=200,
        json=mock_payload,
        request=httpx.Request("GET", "https://api.open-meteo.com"),
    )

    service = RainfallService(http_client=mock_client)
    req = HistoricalRainfallRequest(
        latitude=12.9716,
        longitude=77.5946,
        start_date="2024-01-01",
        end_date="2024-01-03",
    )

    res = await service.get_historical_rainfall(req)
    assert len(res.daily_records) == 3
    assert res.total_depth_mm == 23.6
    assert res.provenance.provider == "Open-Meteo ERA5 Reanalysis"
    assert res.provenance.completeness_status == "complete"
    assert res.provenance.missing_count == 0
    assert res.provenance.is_cached is False

    # Second call should hit cache without calling client again
    res_cached = await service.get_historical_rainfall(req)
    assert res_cached.provenance.is_cached is True
    assert mock_client.get.call_count == 1


@pytest.mark.asyncio
async def test_rate_limit_429_handling():
    mock_client = AsyncMock(spec=httpx.AsyncClient)
    mock_client.get.return_value = httpx.Response(
        status_code=429,
        text="Rate limit exceeded",
        request=httpx.Request("GET", "https://api.open-meteo.com"),
    )

    service = RainfallService(http_client=mock_client)
    req = HistoricalRainfallRequest(
        latitude=12.97,
        longitude=77.59,
        start_date="2024-01-01",
        end_date="2024-01-02",
    )

    with pytest.raises(ClimatologyError, match="rate limit"):
        await service.get_historical_rainfall(req)


@pytest.mark.asyncio
async def test_malformed_response_handling():
    mock_client = AsyncMock(spec=httpx.AsyncClient)
    # Missing daily section
    mock_client.get.return_value = httpx.Response(
        status_code=200,
        json={"error": True, "reason": "No data"},
        request=httpx.Request("GET", "https://api.open-meteo.com"),
    )

    service = RainfallService(http_client=mock_client)
    req = HistoricalRainfallRequest(
        latitude=12.97,
        longitude=77.59,
        start_date="2024-01-01",
        end_date="2024-01-02",
    )

    with pytest.raises(ClimatologyError, match="missing 'daily' section"):
        await service.get_historical_rainfall(req)


@pytest.mark.asyncio
async def test_timeout_and_retry_exhaustion():
    mock_client = AsyncMock(spec=httpx.AsyncClient)
    mock_client.get.side_effect = httpx.TimeoutException("Connection timed out")

    service = RainfallService(http_client=mock_client, max_retries=2)
    req = HistoricalRainfallRequest(
        latitude=12.97,
        longitude=77.59,
        start_date="2024-01-01",
        end_date="2024-01-02",
    )

    with pytest.raises(ClimatologyError, match="Failed to retrieve rainfall series"):
        await service.get_historical_rainfall(req)

    assert mock_client.get.call_count == 2
