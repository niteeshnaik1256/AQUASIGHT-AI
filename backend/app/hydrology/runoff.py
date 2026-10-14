"""
Deterministic Rooftop Runoff and Loss Calculation Engine.

Calculates:
1. Gross precipitation volume: V_gross = P * A
2. Rooftop runoff: V_runoff = V_gross * Cr
3. Downstream conveyance and filtration loss accounting.
"""

from dataclasses import dataclass
from typing import Dict, Optional


# Documented engineering defaults for roof runoff coefficients (Cr)
# Based on Texas Manual on Rainwater Harvesting / Indian Standards IS:15797 / DIN 1989
DEFAULT_RUNOFF_COEFFICIENTS: Dict[str, float] = {
    "metal_sheet": 0.90,      # Corrugated galvanized iron, standing seam aluminum
    "concrete_tile": 0.80,    # Flat concrete slab, concrete tile
    "clay_tile": 0.85,        # Glazed or dense terracotta tile
    "asphalt_shingle": 0.75,  # Composite asphalt roof shingles
    "green_roof": 0.50,       # Extensive sedum / green roof system
    "other": 0.80,            # General default baseline
}


def get_default_runoff_coefficient(material: str) -> float:
    """
    Returns engineering default runoff coefficient for a given roof material.
    Note: These are baseline defaults; site-specific testing or manufacturer
    specifications take precedence when available.
    """
    clean_mat = material.lower().strip()
    return DEFAULT_RUNOFF_COEFFICIENTS.get(clean_mat, DEFAULT_RUNOFF_COEFFICIENTS["other"])


@dataclass(frozen=True)
class RunoffCalculationResult:
    gross_volume_liters: float
    runoff_volume_liters: float
    runoff_coefficient: float
    effective_area_sqm: float
    rainfall_depth_mm: float


def calculate_daily_runoff(
    rainfall_depth_mm: float,
    effective_area_sqm: float,
    runoff_coefficient: Optional[float] = None,
    roof_material: Optional[str] = None,
) -> RunoffCalculationResult:
    """
    Deterministic runoff calculation for a single daily time step.

    Parameters:
    - rainfall_depth_mm: Daily precipitation depth (mm >= 0).
    - effective_area_sqm: Contributing catchment area (m² > 0).
    - runoff_coefficient: Explicit user-specified coefficient (0.0 to 1.0).
    - roof_material: Fallback roof material identifier to look up default.

    Returns:
    - RunoffCalculationResult with gross and runoff volumes in Litres.
    """
    if rainfall_depth_mm < 0:
        raise ValueError(f"Rainfall depth must be non-negative: {rainfall_depth_mm} mm")
    if effective_area_sqm <= 0:
        raise ValueError(f"Effective roof area must be strictly positive: {effective_area_sqm} m²")

    # Determine runoff coefficient: explicit user value takes absolute precedence
    if runoff_coefficient is not None:
        cr = float(runoff_coefficient)
    elif roof_material is not None:
        cr = get_default_runoff_coefficient(roof_material)
    else:
        cr = DEFAULT_RUNOFF_COEFFICIENTS["other"]

    if not (0.0 <= cr <= 1.0):
        raise ValueError(f"Runoff coefficient must be between 0.0 and 1.0, got {cr}")

    # Physical identity: 1 mm over 1 m² = 1.0 Litre
    gross_volume = rainfall_depth_mm * effective_area_sqm
    runoff_volume = gross_volume * cr

    return RunoffCalculationResult(
        gross_volume_liters=gross_volume,
        runoff_volume_liters=runoff_volume,
        runoff_coefficient=cr,
        effective_area_sqm=effective_area_sqm,
        rainfall_depth_mm=rainfall_depth_mm,
    )


def apply_conveyance_and_filtration(
    volume_post_first_flush_liters: float,
    conveyance_efficiency: float = 0.95,
    filtration_efficiency: float = 0.90,
) -> tuple[float, float, float]:
    """
    Applies conveyance and filtration recovery efficiencies to water after first-flush diversion.

    Parameters:
    - volume_post_first_flush_liters: Volume remaining after first-flush (L >= 0).
    - conveyance_efficiency: Gutter and downspout conveyance recovery (0.0 to 1.0).
    - filtration_efficiency: Mechanical pre-filter recovery (0.0 to 1.0).

    Returns:
    - tuple: (net_inflow_to_tank_liters, conveyance_loss_liters, filtration_loss_liters)
    """
    if volume_post_first_flush_liters < 0:
        raise ValueError("Volume entering filtration cannot be negative")
    if not (0.0 <= conveyance_efficiency <= 1.0):
        raise ValueError(f"Conveyance efficiency must be in [0, 1], got {conveyance_efficiency}")
    if not (0.0 <= filtration_efficiency <= 1.0):
        raise ValueError(f"Filtration efficiency must be in [0, 1], got {filtration_efficiency}")

    conveyance_loss = volume_post_first_flush_liters * (1.0 - conveyance_efficiency)
    vol_conveyed = volume_post_first_flush_liters * conveyance_efficiency

    filtration_loss = vol_conveyed * (1.0 - filtration_efficiency)
    net_inflow = vol_conveyed * filtration_efficiency

    return net_inflow, conveyance_loss, filtration_loss
