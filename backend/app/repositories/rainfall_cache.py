import time
from typing import Dict, Optional, Tuple
from app.models.rainfall import HistoricalRainfallResponse


class RainfallCacheRepository:
    """
    In-memory cache for validated rainfall time series with TTL expiration.
    Keyed by normalized (lat, lon, start_date, end_date).
    """

    def __init__(self, default_ttl_seconds: int = 86400):
        self._cache: Dict[str, Tuple[float, HistoricalRainfallResponse]] = {}
        self._ttl = default_ttl_seconds

    def _generate_key(self, lat: float, lon: float, start_date: str, end_date: str) -> str:
        return f"{lat:.4f}:{lon:.4f}:{start_date}:{end_date}"

    def get(self, lat: float, lon: float, start_date: str, end_date: str) -> Optional[HistoricalRainfallResponse]:
        key = self._generate_key(lat, lon, start_date, end_date)
        if key not in self._cache:
            return None

        timestamp, item = self._cache[key]
        if time.time() - timestamp > self._ttl:
            del self._cache[key]
            return None

        # Return a copy marked as cached
        cached_item = item.model_copy(deep=True)
        cached_item.provenance.is_cached = True
        return cached_item

    def set(self, lat: float, lon: float, start_date: str, end_date: str, response: HistoricalRainfallResponse) -> None:
        key = self._generate_key(lat, lon, start_date, end_date)
        self._cache[key] = (time.time(), response)

    def clear(self) -> None:
        self._cache.clear()


rainfall_cache = RainfallCacheRepository()
