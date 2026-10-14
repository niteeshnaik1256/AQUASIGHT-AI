import random
import pytest
from app.hydrology.tank_balance import (
    TankWaterBalanceSimulator,
    DailyRainfallInput,
    MASS_BALANCE_TOLERANCE_LITERS,
)
from app.hydrology.metrics import compute_simulation_metrics


def test_mass_balance_invariants_long_series():
    # 365-day randomized synthetic series
    random.seed(42)
    rainfall_series = []
    for day_idx in range(1, 366):
        # 30% chance of rain, up to 60 mm
        p = round(random.uniform(0.5, 60.0), 2) if random.random() < 0.30 else 0.0
        rainfall_series.append(DailyRainfallInput(date=f"2024-{day_idx:03d}", precipitation_mm=p))

    capacity = 10000.0
    initial_storage = 1500.0
    daily_demand = 450.0

    sim = TankWaterBalanceSimulator(
        tank_capacity_liters=capacity,
        catchment_area_sqm=180.0,
        initial_storage_liters=initial_storage,
        runoff_coefficient=0.85,
        first_flush_depth_mm=1.0,
        conveyance_efficiency=0.95,
        filtration_efficiency=0.90,
    )

    records = sim.simulate(rainfall_series, daily_demand_liters=daily_demand)
    metrics = compute_simulation_metrics(records)

    # 1. Day-by-day invariant checks
    for r in records:
        mass_in = r.opening_storage_liters + r.inflow_to_tank_liters
        mass_out = r.served_demand_liters + r.overflow_liters + r.closing_storage_liters
        assert abs(mass_in - mass_out) <= MASS_BALANCE_TOLERANCE_LITERS
        assert 0.0 <= r.closing_storage_liters <= capacity + 1e-9
        assert 0.0 <= r.served_demand_liters <= daily_demand + 1e-9
        assert r.unmet_demand_liters >= -1e-9
        assert r.overflow_liters >= -1e-9

    # 2. Cumulative Conservation of Mass Check
    # Total Inflow + Initial Storage == Total Served Demand + Total Overflow + Final Storage
    cumulative_in = metrics.total_inflow_to_tank_liters + metrics.initial_storage_liters
    cumulative_out = (
        metrics.total_served_demand_liters
        + metrics.total_overflow_liters
        + metrics.final_storage_liters
    )
    assert abs(cumulative_in - cumulative_out) < 1e-3, (
        f"Cumulative conservation violated: {cumulative_in:.4f} != {cumulative_out:.4f}"
    )

    # 3. Maximum storage never exceeds capacity
    assert metrics.max_daily_storage_liters <= capacity
    # 4. Coverage between 0 and 100
    assert 0.0 <= metrics.demand_coverage_pct <= 100.0
