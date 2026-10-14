"""
Summary and Performance Metrics for Hydrological Simulation.

Computes:
- Water demand coverage (%)
- Overflow ratio (%)
- Overall collection efficiency (%)
- Storage distribution and days with deficits / overflows
- Cumulative mass conservation audit
"""

from dataclasses import dataclass
from typing import List

from app.hydrology.tank_balance import DailySimulationRecord


@dataclass(frozen=True)
class SimulationSummaryMetrics:
    total_days: int
    rainfall_days_count: int
    dry_days_count: int
    rainfall_events_count: int

    total_rainfall_depth_mm: float
    total_gross_volume_liters: float
    total_runoff_volume_liters: float
    total_first_flush_diverted_liters: float
    total_conveyance_losses_liters: float
    total_filtration_losses_liters: float
    total_inflow_to_tank_liters: float

    total_requested_demand_liters: float
    total_served_demand_liters: float
    total_unmet_demand_liters: float
    total_overflow_liters: float

    demand_coverage_pct: float
    overflow_ratio_pct: float
    collection_efficiency_pct: float

    initial_storage_liters: float
    final_storage_liters: float
    mean_daily_storage_liters: float
    max_daily_storage_liters: float
    min_daily_storage_liters: float

    days_with_unmet_demand: int
    days_with_overflow: int
    cumulative_mass_balance_residual_liters: float


def compute_simulation_metrics(records: List[DailySimulationRecord]) -> SimulationSummaryMetrics:
    """
    Computes aggregated summary and performance metrics from daily simulation records.
    """
    if not records:
        raise ValueError("Cannot compute metrics from an empty record list")

    total_days = len(records)
    total_rainfall_depth_mm = sum(r.rainfall_depth_mm for r in records)
    rainfall_days_count = sum(1 for r in records if r.rainfall_depth_mm >= 0.1)
    dry_days_count = total_days - rainfall_days_count
    rainfall_events_count = sum(1 for r in records if r.is_new_rainfall_event)

    total_gross = sum(r.gross_volume_liters for r in records)
    total_runoff = sum(r.runoff_volume_liters for r in records)
    total_first_flush = sum(r.first_flush_diverted_liters for r in records)
    total_conveyance = sum(r.conveyance_loss_liters for r in records)
    total_filtration = sum(r.filtration_loss_liters for r in records)
    total_inflow = sum(r.inflow_to_tank_liters for r in records)

    total_requested = sum(r.requested_demand_liters for r in records)
    total_served = sum(r.served_demand_liters for r in records)
    total_unmet = sum(r.unmet_demand_liters for r in records)
    total_overflow = sum(r.overflow_liters for r in records)

    # Ratios (handling division by zero explicitly)
    demand_coverage_pct = (total_served / total_requested * 100.0) if total_requested > 0 else 100.0
    overflow_ratio_pct = (total_overflow / total_inflow * 100.0) if total_inflow > 0 else 0.0
    collection_efficiency_pct = (total_inflow / total_gross * 100.0) if total_gross > 0 else 0.0

    initial_storage = records[0].opening_storage_liters
    final_storage = records[-1].closing_storage_liters
    closing_storages = [r.closing_storage_liters for r in records]

    mean_storage = sum(closing_storages) / total_days
    max_storage = max(closing_storages)
    min_storage = min(closing_storages)

    days_unmet = sum(1 for r in records if r.unmet_demand_liters > 1e-4)
    days_overflow = sum(1 for r in records if r.overflow_liters > 1e-4)
    cumulative_residual = sum(r.mass_balance_residual_liters for r in records)

    return SimulationSummaryMetrics(
        total_days=total_days,
        rainfall_days_count=rainfall_days_count,
        dry_days_count=dry_days_count,
        rainfall_events_count=rainfall_events_count,
        total_rainfall_depth_mm=total_rainfall_depth_mm,
        total_gross_volume_liters=total_gross,
        total_runoff_volume_liters=total_runoff,
        total_first_flush_diverted_liters=total_first_flush,
        total_conveyance_losses_liters=total_conveyance,
        total_filtration_losses_liters=total_filtration,
        total_inflow_to_tank_liters=total_inflow,
        total_requested_demand_liters=total_requested,
        total_served_demand_liters=total_served,
        total_unmet_demand_liters=total_unmet,
        total_overflow_liters=total_overflow,
        demand_coverage_pct=round(demand_coverage_pct, 2),
        overflow_ratio_pct=round(overflow_ratio_pct, 2),
        collection_efficiency_pct=round(collection_efficiency_pct, 2),
        initial_storage_liters=initial_storage,
        final_storage_liters=final_storage,
        mean_daily_storage_liters=round(mean_storage, 2),
        max_daily_storage_liters=round(max_storage, 2),
        min_daily_storage_liters=round(min_storage, 2),
        days_with_unmet_demand=days_unmet,
        days_with_overflow=days_overflow,
        cumulative_mass_balance_residual_liters=cumulative_residual,
    )
