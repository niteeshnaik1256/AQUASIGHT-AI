"""
Daily Continuous Tank Water-Balance Simulator for AQUASIGHT AI.

Implements the authoritative deterministic mass-balance equations:
OpeningStorage_t + Inflow_t = ServedDemand_t + Overflow_t + ClosingStorage_t

Enforces:
- Demand served prior to overflow spillage.
- Storage strictly bounded: 0 <= ClosingStorage <= TankCapacity.
- Served demand <= Requested demand.
- Daily conservation-of-mass tolerance <= 1e-5 Litres.
"""

from dataclasses import dataclass
from typing import List, Optional

from app.hydrology.first_flush import FirstFlushTracker
from app.hydrology.runoff import calculate_daily_runoff, apply_conveyance_and_filtration


MASS_BALANCE_TOLERANCE_LITERS = 1e-5


@dataclass(frozen=True)
class DailySimulationRecord:
    date: str
    rainfall_depth_mm: float
    gross_volume_liters: float
    runoff_volume_liters: float
    first_flush_diverted_liters: float
    conveyance_loss_liters: float
    filtration_loss_liters: float
    inflow_to_tank_liters: float
    opening_storage_liters: float
    requested_demand_liters: float
    served_demand_liters: float
    unmet_demand_liters: float
    closing_storage_liters: float
    overflow_liters: float
    mass_balance_residual_liters: float
    is_new_rainfall_event: bool


@dataclass(frozen=True)
class DailyRainfallInput:
    date: str
    precipitation_mm: float


class TankWaterBalanceSimulator:
    """
    Executes daily continuous water balance simulation over a precipitation series.
    """

    def __init__(
        self,
        tank_capacity_liters: float,
        catchment_area_sqm: float,
        initial_storage_liters: float = 0.0,
        runoff_coefficient: Optional[float] = None,
        roof_material: Optional[str] = None,
        first_flush_depth_mm: float = 1.0,
        dry_period_days: int = 3,
        conveyance_efficiency: float = 0.95,
        filtration_efficiency: float = 0.90,
    ):
        if tank_capacity_liters <= 0:
            raise ValueError(f"Tank capacity must be strictly positive: {tank_capacity_liters} L")
        if catchment_area_sqm <= 0:
            raise ValueError(f"Catchment area must be strictly positive: {catchment_area_sqm} m²")
        if not (0.0 <= initial_storage_liters <= tank_capacity_liters):
            raise ValueError(
                f"Initial storage ({initial_storage_liters} L) must be between 0 and tank capacity ({tank_capacity_liters} L)"
            )
        if first_flush_depth_mm < 0:
            raise ValueError(f"First-flush depth cannot be negative: {first_flush_depth_mm} mm")
        if not (0.0 <= conveyance_efficiency <= 1.0):
            raise ValueError(f"Conveyance efficiency must be in [0, 1], got {conveyance_efficiency}")
        if not (0.0 <= filtration_efficiency <= 1.0):
            raise ValueError(f"Filtration efficiency must be in [0, 1], got {filtration_efficiency}")

        self.tank_capacity = float(tank_capacity_liters)
        self.catchment_area = float(catchment_area_sqm)
        self.initial_storage = float(initial_storage_liters)
        self.runoff_coefficient = runoff_coefficient
        self.roof_material = roof_material
        self.conveyance_eff = float(conveyance_efficiency)
        self.filtration_eff = float(filtration_efficiency)

        self.first_flush_tracker = FirstFlushTracker(
            catchment_area_sqm=self.catchment_area,
            first_flush_depth_mm=first_flush_depth_mm,
            dry_period_days=dry_period_days,
        )

    def simulate(
        self,
        rainfall_series: List[DailyRainfallInput],
        daily_demand_liters: float,
    ) -> List[DailySimulationRecord]:
        """
        Runs the continuous simulation day-by-day.

        Parameters:
        - rainfall_series: Chronologically ordered daily rainfall inputs.
        - daily_demand_liters: Non-negative daily non-potable water demand (L/day).

        Returns:
        - List of DailySimulationRecord for each date.
        """
        if daily_demand_liters < 0:
            raise ValueError(f"Daily water demand must be non-negative: {daily_demand_liters} L/day")
        if not rainfall_series:
            raise ValueError("Rainfall series cannot be empty")

        records: List[DailySimulationRecord] = []
        current_storage = self.initial_storage

        for day in rainfall_series:
            p_t = day.precipitation_mm
            if p_t < 0:
                raise ValueError(f"Invalid negative rainfall depth on {day.date}: {p_t} mm")

            # 1. Rooftop runoff
            runoff_res = calculate_daily_runoff(
                rainfall_depth_mm=p_t,
                effective_area_sqm=self.catchment_area,
                runoff_coefficient=self.runoff_coefficient,
                roof_material=self.roof_material,
            )

            # 2. First-flush diversion
            ff_res = self.first_flush_tracker.step(
                rainfall_depth_mm=p_t,
                available_runoff_liters=runoff_res.runoff_volume_liters,
            )

            # 3. Conveyance and Filtration losses
            q_in, l_convey, l_filter = apply_conveyance_and_filtration(
                volume_post_first_flush_liters=ff_res.volume_post_first_flush_liters,
                conveyance_efficiency=self.conveyance_eff,
                filtration_efficiency=self.filtration_eff,
            )

            # 4. Tank mass balance step
            opening_storage = current_storage
            available_water = opening_storage + q_in

            # Serve demand first
            served_demand = min(available_water, daily_demand_liters)
            unmet_demand = daily_demand_liters - served_demand
            water_after_demand = available_water - served_demand

            # Spillage overflow if storage exceeds capacity
            overflow = max(0.0, water_after_demand - self.tank_capacity)
            closing_storage = min(self.tank_capacity, water_after_demand)

            # Conservation of mass verification:
            # Inflow + Opening = Outflow (ServedDemand + Overflow) + Closing
            mass_in = opening_storage + q_in
            mass_out = served_demand + overflow + closing_storage
            residual = abs(mass_in - mass_out)

            if residual > MASS_BALANCE_TOLERANCE_LITERS:
                raise RuntimeError(
                    f"Conservation of mass violation on {day.date}: "
                    f"Mass In ({mass_in:.6f}L) != Mass Out ({mass_out:.6f}L), residual = {residual:.6e}L"
                )

            # Physical boundary assertions
            assert 0.0 <= closing_storage <= self.tank_capacity + 1e-9
            assert 0.0 <= served_demand <= daily_demand_liters + 1e-9
            assert unmet_demand >= -1e-9
            assert overflow >= -1e-9

            records.append(
                DailySimulationRecord(
                    date=day.date,
                    rainfall_depth_mm=p_t,
                    gross_volume_liters=runoff_res.gross_volume_liters,
                    runoff_volume_liters=runoff_res.runoff_volume_liters,
                    first_flush_diverted_liters=ff_res.actual_diversion_liters,
                    conveyance_loss_liters=l_convey,
                    filtration_loss_liters=l_filter,
                    inflow_to_tank_liters=q_in,
                    opening_storage_liters=opening_storage,
                    requested_demand_liters=daily_demand_liters,
                    served_demand_liters=served_demand,
                    unmet_demand_liters=unmet_demand,
                    closing_storage_liters=closing_storage,
                    overflow_liters=overflow,
                    mass_balance_residual_liters=residual,
                    is_new_rainfall_event=ff_res.is_new_event,
                )
            )

            # Next step opening storage
            current_storage = closing_storage

        return records
