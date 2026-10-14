"""
First-Flush Diversion Module for AQUASIGHT AI.

Implements event-based first-flush diversion:
- Event identification using configurable inter-event dry-period days.
- Target volume: V_target = d_ff * Area (in Litres).
- Actual diversion is strictly capped at available runoff volume.
- Supports multi-day events where the initial event volume is satisfied across consecutive rainy days.
"""

from dataclasses import dataclass
from typing import List, Optional


@dataclass
class FirstFlushStepResult:
    is_new_event: bool
    consecutive_dry_days_prior: int
    target_diversion_liters: float
    actual_diversion_liters: float
    volume_post_first_flush_liters: float


class FirstFlushTracker:
    """
    Stateful event tracker for sequential daily first-flush accounting.
    """

    def __init__(
        self,
        catchment_area_sqm: float,
        first_flush_depth_mm: float = 1.0,
        dry_period_days: int = 3,
        rain_threshold_mm: float = 0.1,
    ):
        if catchment_area_sqm <= 0:
            raise ValueError(f"Catchment area must be positive: {catchment_area_sqm} m²")
        if first_flush_depth_mm < 0:
            raise ValueError(f"First-flush depth must be non-negative: {first_flush_depth_mm} mm")
        if dry_period_days < 1:
            raise ValueError(f"Dry period days must be at least 1, got {dry_period_days}")
        if rain_threshold_mm < 0:
            raise ValueError(f"Rain threshold must be non-negative: {rain_threshold_mm} mm")

        self.area_sqm = catchment_area_sqm
        self.depth_mm = first_flush_depth_mm
        self.dry_period_days = dry_period_days
        self.rain_threshold = rain_threshold_mm

        # Target diversion for an event: 1 mm depth over 1 m² = 1.0 L
        self.target_event_volume_liters = self.depth_mm * self.area_sqm

        # Internal state tracking
        self.consecutive_dry_days: int = dry_period_days  # Initial assumption: system starts after dry period
        self.remaining_target_for_current_event: float = self.target_event_volume_liters
        self.is_in_active_event: bool = False

    def step(self, rainfall_depth_mm: Optional[float], available_runoff_liters: float) -> FirstFlushStepResult:
        """
        Processes a single day's rainfall and available runoff.

        Parameters:
        - rainfall_depth_mm: Measured or retrieved daily rainfall (mm).
        - available_runoff_liters: Runoff volume generated from the catchment (L).

        Returns:
        - FirstFlushStepResult detailing diversion and remaining volume.
        """
        if rainfall_depth_mm is None:
            raise ValueError("Rainfall depth cannot be None; missing data cannot be silently treated as dry.")
        if rainfall_depth_mm < 0:
            raise ValueError(f"Rainfall depth cannot be negative: {rainfall_depth_mm} mm")
        if available_runoff_liters < 0:
            raise ValueError(f"Available runoff cannot be negative: {available_runoff_liters} L")

        is_rain_day = rainfall_depth_mm >= self.rain_threshold
        is_new_event = False
        prior_dry_days = self.consecutive_dry_days

        if is_rain_day:
            if not self.is_in_active_event or self.consecutive_dry_days >= self.dry_period_days:
                # Triggering a new distinct rainfall event
                is_new_event = True
                self.is_in_active_event = True
                self.remaining_target_for_current_event = self.target_event_volume_liters

            # Calculate actual diversion: cannot exceed available runoff, cannot exceed remaining event target
            actual_diversion = min(available_runoff_liters, self.remaining_target_for_current_event)
            self.remaining_target_for_current_event -= actual_diversion

            # Reset dry day counter
            self.consecutive_dry_days = 0
            volume_post_ff = available_runoff_liters - actual_diversion

            return FirstFlushStepResult(
                is_new_event=is_new_event,
                consecutive_dry_days_prior=prior_dry_days,
                target_diversion_liters=self.target_event_volume_liters,
                actual_diversion_liters=actual_diversion,
                volume_post_first_flush_liters=volume_post_ff,
            )
        else:
            # Dry or sub-threshold day
            self.consecutive_dry_days += 1
            if self.consecutive_dry_days >= self.dry_period_days:
                self.is_in_active_event = False
                self.remaining_target_for_current_event = self.target_event_volume_liters

            return FirstFlushStepResult(
                is_new_event=False,
                consecutive_dry_days_prior=prior_dry_days,
                target_diversion_liters=0.0,
                actual_diversion_liters=0.0,
                volume_post_first_flush_liters=0.0,
            )
