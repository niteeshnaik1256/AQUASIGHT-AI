import pytest
from app.hydrology.tank_balance import (
    TankWaterBalanceSimulator,
    DailyRainfallInput,
    MASS_BALANCE_TOLERANCE_LITERS,
)
from app.hydrology.metrics import compute_simulation_metrics


def test_empty_tank_no_rainfall():
    sim = TankWaterBalanceSimulator(
        tank_capacity_liters=5000.0,
        catchment_area_sqm=100.0,
        initial_storage_liters=0.0,
    )
    records = sim.simulate(
        rainfall_series=[DailyRainfallInput(date="2024-01-01", precipitation_mm=0.0)],
        daily_demand_liters=200.0,
    )
    r = records[0]
    assert r.opening_storage_liters == 0.0
    assert r.inflow_to_tank_liters == 0.0
    assert r.served_demand_liters == 0.0
    assert r.unmet_demand_liters == 200.0
    assert r.closing_storage_liters == 0.0
    assert r.overflow_liters == 0.0
    assert r.mass_balance_residual_liters <= MASS_BALANCE_TOLERANCE_LITERS


def test_full_tank_no_rainfall():
    sim = TankWaterBalanceSimulator(
        tank_capacity_liters=5000.0,
        catchment_area_sqm=100.0,
        initial_storage_liters=5000.0,
    )
    records = sim.simulate(
        rainfall_series=[DailyRainfallInput(date="2024-01-01", precipitation_mm=0.0)],
        daily_demand_liters=500.0,
    )
    r = records[0]
    assert r.opening_storage_liters == 5000.0
    assert r.served_demand_liters == 500.0
    assert r.unmet_demand_liters == 0.0
    assert r.closing_storage_liters == 4500.0
    assert r.overflow_liters == 0.0


def test_tank_overflow_when_inflow_exceeds_capacity():
    # 100 m², 50 mm rain => 5,000 L gross
    # Cr = 0.8 => 4,000 L runoff
    # First flush (1 mm) => 100 L diverted => 3,900 L
    # Conveyance (1.0) & Filter (1.0) for clear math => 3,900 L inflow
    sim = TankWaterBalanceSimulator(
        tank_capacity_liters=2000.0,
        catchment_area_sqm=100.0,
        initial_storage_liters=500.0,
        runoff_coefficient=0.8,
        conveyance_efficiency=1.0,
        filtration_efficiency=1.0,
    )
    # Demand = 400 L
    # Available = 500 + 3900 = 4400 L
    # After demand = 4400 - 400 = 4000 L
    # Capacity = 2000 L => Overflow = 2000 L, Closing = 2000 L
    records = sim.simulate(
        rainfall_series=[DailyRainfallInput(date="2024-01-01", precipitation_mm=50.0)],
        daily_demand_liters=400.0,
    )
    r = records[0]
    assert r.opening_storage_liters == 500.0
    assert r.inflow_to_tank_liters == 3900.0
    assert r.served_demand_liters == 400.0
    assert r.closing_storage_liters == 2000.0
    assert r.overflow_liters == 2000.0
    assert r.unmet_demand_liters == 0.0


def test_zero_demand_scenario():
    sim = TankWaterBalanceSimulator(
        tank_capacity_liters=3000.0,
        catchment_area_sqm=100.0,
        initial_storage_liters=1000.0,
    )
    records = sim.simulate(
        rainfall_series=[DailyRainfallInput(date="2024-01-01", precipitation_mm=5.0)],
        daily_demand_liters=0.0,
    )
    metrics = compute_simulation_metrics(records)
    assert metrics.total_requested_demand_liters == 0.0
    assert metrics.total_served_demand_liters == 0.0
    assert metrics.demand_coverage_pct == 100.0


def test_initial_storage_greater_than_capacity_rejected():
    with pytest.raises(ValueError, match="must be between 0 and tank capacity"):
        TankWaterBalanceSimulator(
            tank_capacity_liters=2000.0,
            catchment_area_sqm=100.0,
            initial_storage_liters=2500.0,
        )
