from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field, model_validator
from app.models.rainfall import RainfallProvenance, DailyRainfallItem


class SimulationRequest(BaseModel):
    assessment_id: Optional[str] = Field(None, description="Optional associated assessment record identifier")
    catchment_area_sqm: float = Field(..., gt=0.0, description="Effective roof catchment area (m²)")
    roof_material: Optional[str] = Field(None, description="Roof surface material identifier")
    runoff_coefficient: Optional[float] = Field(None, ge=0.0, le=1.0, description="User-specified runoff coefficient (0 to 1)")
    tank_capacity_liters: float = Field(..., gt=0.0, description="Total storage tank capacity (Litres)")
    initial_storage_liters: float = Field(0.0, ge=0.0, description="Opening storage volume at start of simulation (Litres)")
    daily_demand_liters: float = Field(..., ge=0.0, description="Daily non-potable water demand (Litres/day)")
    first_flush_depth_mm: float = Field(1.0, ge=0.0, description="Configured first-flush diversion depth (mm)")
    dry_period_days: int = Field(3, ge=1, description="Consecutive dry days required to reset first-flush event")
    conveyance_efficiency: float = Field(0.95, ge=0.0, le=1.0, description="Conveyance efficiency fraction (0 to 1)")
    filtration_efficiency: float = Field(0.90, ge=0.0, le=1.0, description="Pre-filtration recovery efficiency (0 to 1)")

    rainfall_source: Literal["open_meteo", "user_provided"] = Field(
        "open_meteo", description="Rainfall time-series source"
    )

    # For open_meteo
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    start_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    end_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")

    # For user_provided
    user_rainfall_series: Optional[List[DailyRainfallItem]] = None

    @model_validator(mode="after")
    def validate_simulation_inputs(self):
        if self.initial_storage_liters > self.tank_capacity_liters:
            raise ValueError(
                f"initial_storage_liters ({self.initial_storage_liters}) cannot exceed tank_capacity_liters ({self.tank_capacity_liters})"
            )

        if self.rainfall_source == "open_meteo":
            if self.latitude is None or self.longitude is None:
                raise ValueError("latitude and longitude are required when rainfall_source is 'open_meteo'")
            if not self.start_date or not self.end_date:
                raise ValueError("start_date and end_date are required when rainfall_source is 'open_meteo'")
        elif self.rainfall_source == "user_provided":
            if not self.user_rainfall_series or len(self.user_rainfall_series) == 0:
                raise ValueError("user_rainfall_series must be provided when rainfall_source is 'user_provided'")
        return self


class DailySimulationRecordSchema(BaseModel):
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


class SimulationSummaryMetricsSchema(BaseModel):
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


class SimulationResponse(BaseModel):
    simulation_id: str
    assessment_id: Optional[str] = None
    created_at: str
    assumptions: Dict[str, Any]
    rainfall_provenance: RainfallProvenance
    summary: SimulationSummaryMetricsSchema
    daily_records: List[DailySimulationRecordSchema]
    warnings: List[str]
    mass_balance_audit: Dict[str, Any]
