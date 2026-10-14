import pytest
from app.hydrology.units import (
    sqft_to_sqm,
    sqm_to_sqft,
    inches_to_mm,
    mm_to_inches,
    gallons_to_liters,
    liters_to_gallons,
    liters_to_kl,
    kl_to_liters,
)


def test_area_conversions():
    # 1000 sq ft is ~92.903 sqm
    sqm = sqft_to_sqm(1000.0)
    assert abs(sqm - 92.90304) < 1e-4

    # Round trip
    assert abs(sqm_to_sqft(sqm) - 1000.0) < 1e-4

    with pytest.raises(ValueError, match="negative"):
        sqft_to_sqm(-10.0)


def test_rainfall_depth_conversions():
    # 1 inch = 25.4 mm
    mm = inches_to_mm(2.0)
    assert abs(mm - 50.8) < 1e-5

    # Round trip
    assert abs(mm_to_inches(50.8) - 2.0) < 1e-5

    with pytest.raises(ValueError, match="negative"):
        inches_to_mm(-1.0)


def test_volume_conversions():
    # 100 gallons US is ~378.541 Litres
    liters = gallons_to_liters(100.0)
    assert abs(liters - 378.5411784) < 1e-4

    # Round trip
    assert abs(liters_to_gallons(liters) - 100.0) < 1e-4

    # kL
    assert liters_to_kl(5000.0) == 5.0
    assert kl_to_liters(5.0) == 5000.0

    with pytest.raises(ValueError, match="negative"):
        gallons_to_liters(-5.0)
