"""
Explicit SI unit conversion utilities for AQUASIGHT AI.
Ensures calculations internally strictly operate in:
- Catchment Area: square metres (m²)
- Rainfall Depth: millimetres (mm)
- Volume: Litres (L)
"""

SQFT_PER_SQM = 10.76391041671
SQM_PER_SQFT = 0.09290304

MM_PER_INCH = 25.4
INCHES_PER_MM = 1.0 / 25.4

LITERS_PER_GALLON_US = 3.785411784
GALLONS_PER_LITER_US = 1.0 / 3.785411784


def sqft_to_sqm(sqft: float) -> float:
    if sqft < 0:
        raise ValueError(f"Area cannot be negative: {sqft} sqft")
    return sqft * SQM_PER_SQFT


def sqm_to_sqft(sqm: float) -> float:
    if sqm < 0:
        raise ValueError(f"Area cannot be negative: {sqm} m²")
    return sqm * SQFT_PER_SQM


def inches_to_mm(inches: float) -> float:
    if inches < 0:
        raise ValueError(f"Rainfall depth cannot be negative: {inches} inches")
    return inches * MM_PER_INCH


def mm_to_inches(mm: float) -> float:
    if mm < 0:
        raise ValueError(f"Rainfall depth cannot be negative: {mm} mm")
    return mm * INCHES_PER_MM


def gallons_to_liters(gallons: float) -> float:
    if gallons < 0:
        raise ValueError(f"Volume cannot be negative: {gallons} gallons")
    return gallons * LITERS_PER_GALLON_US


def liters_to_gallons(liters: float) -> float:
    if liters < 0:
        raise ValueError(f"Volume cannot be negative: {liters} liters")
    return liters * GALLONS_PER_LITER_US


def liters_to_kl(liters: float) -> float:
    if liters < 0:
        raise ValueError(f"Volume cannot be negative: {liters} liters")
    return liters / 1000.0


def kl_to_liters(kl: float) -> float:
    if kl < 0:
        raise ValueError(f"Volume cannot be negative: {kl} kL")
    return kl * 1000.0
