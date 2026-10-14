import pytest
from app.hydrology.runoff import (
    calculate_daily_runoff,
    apply_conveyance_and_filtration,
    DEFAULT_RUNOFF_COEFFICIENTS,
)


def test_zero_rainfall():
    res = calculate_daily_runoff(
        rainfall_depth_mm=0.0,
        effective_area_sqm=150.0,
        runoff_coefficient=0.85,
    )
    assert res.gross_volume_liters == 0.0
    assert res.runoff_volume_liters == 0.0


def test_positive_rainfall_and_material_defaults():
    # 25 mm on 200 m² = 5,000 Litres gross
    res_metal = calculate_daily_runoff(
        rainfall_depth_mm=25.0,
        effective_area_sqm=200.0,
        roof_material="metal_sheet",
    )
    assert res_metal.gross_volume_liters == 5000.0
    assert res_metal.runoff_coefficient == 0.90
    assert res_metal.runoff_volume_liters == 4500.0

    res_green = calculate_daily_runoff(
        rainfall_depth_mm=25.0,
        effective_area_sqm=200.0,
        roof_material="green_roof",
    )
    assert res_green.gross_volume_liters == 5000.0
    assert res_green.runoff_coefficient == 0.50
    assert res_green.runoff_volume_liters == 2500.0


def test_user_coefficient_overrides_material():
    res = calculate_daily_runoff(
        rainfall_depth_mm=10.0,
        effective_area_sqm=100.0,
        runoff_coefficient=0.72,
        roof_material="metal_sheet",  # should be overridden by 0.72
    )
    assert res.runoff_coefficient == 0.72
    assert res.runoff_volume_liters == 720.0


def test_conveyance_and_filtration_conservation():
    vol_in = 1000.0
    q_in, l_convey, l_filter = apply_conveyance_and_filtration(
        volume_post_first_flush_liters=vol_in,
        conveyance_efficiency=0.95,
        filtration_efficiency=0.90,
    )

    # 1000 * 0.05 = 50.0 L conveyance loss
    assert abs(l_convey - 50.0) < 1e-6
    # 950 * 0.10 = 95.0 L filtration loss
    assert abs(l_filter - 95.0) < 1e-6
    # 950 * 0.90 = 855.0 L net inflow
    assert abs(q_in - 855.0) < 1e-6

    # Inflow + Losses == Input Volume
    assert abs((q_in + l_convey + l_filter) - vol_in) < 1e-6


def test_invalid_runoff_parameters():
    with pytest.raises(ValueError, match="non-negative"):
        calculate_daily_runoff(rainfall_depth_mm=-5.0, effective_area_sqm=100.0)

    with pytest.raises(ValueError, match="strictly positive"):
        calculate_daily_runoff(rainfall_depth_mm=10.0, effective_area_sqm=0.0)

    with pytest.raises(ValueError, match="between 0.0 and 1.0"):
        calculate_daily_runoff(rainfall_depth_mm=10.0, effective_area_sqm=100.0, runoff_coefficient=1.25)
