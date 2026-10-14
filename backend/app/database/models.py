"""
SQLAlchemy ORM models for persistent storage.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import String, Float, Integer, JSON, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AssessmentModel(Base):
    """Persistent storage for property assessments."""

    __tablename__ = "assessments"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    property_name: Mapped[str] = mapped_column(String, nullable=False)
    property_type: Mapped[str] = mapped_column(String, nullable=False)
    country: Mapped[str] = mapped_column(String, nullable=False)
    state: Mapped[str] = mapped_column(String, nullable=False)
    city: Mapped[str] = mapped_column(String, nullable=False)
    address: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Roof characteristics
    roof_area: Mapped[float] = mapped_column(Float, nullable=False)
    roof_area_unit: Mapped[str] = mapped_column(String, nullable=False)
    roof_material: Mapped[str] = mapped_column(String, nullable=False)
    roof_slope_category: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    roof_sections_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Water demand
    occupants: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    daily_demand: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    demand_unit: Mapped[str] = mapped_column(String, nullable=False)
    intended_uses: Mapped[list] = mapped_column(JSON, nullable=False)
    existing_storage_capacity: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    storage_unit: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Rainfall input
    annual_rainfall: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    rainfall_unit: Mapped[str] = mapped_column(String, nullable=False)
    source_type: Mapped[str] = mapped_column(String, nullable=False)
    source_reference: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Metadata
    status: Mapped[str] = mapped_column(String, nullable=False, default="draft")
    is_demonstration: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default="CURRENT_TIMESTAMP")
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default="CURRENT_TIMESTAMP", onupdate="CURRENT_TIMESTAMP")

    # Relationships
    simulations: Mapped[list["SimulationModel"]] = relationship(
        "SimulationModel", back_populates="assessment", cascade="all, delete-orphan"
    )


class SimulationModel(Base):
    """Persistent storage for simulation results."""

    __tablename__ = "simulations"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    assessment_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("assessments.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default="CURRENT_TIMESTAMP")

    # Input configuration (stored as JSON for flexibility)
    input_config: Mapped[dict] = mapped_column(JSON, nullable=False)

    # Rainfall provenance
    rainfall_provider: Mapped[str] = mapped_column(String, nullable=False)
    rainfall_dataset: Mapped[str] = mapped_column(String, nullable=False)
    requested_latitude: Mapped[float] = mapped_column(Float, nullable=False)
    requested_longitude: Mapped[float] = mapped_column(Float, nullable=False)
    resolved_latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    resolved_longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    rainfall_variable: Mapped[str] = mapped_column(String, nullable=False)
    rainfall_unit: Mapped[str] = mapped_column(String, nullable=False)
    time_range: Mapped[str] = mapped_column(String, nullable=False)
    retrieval_timestamp: Mapped[str] = mapped_column(String, nullable=False)
    is_cached: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    missing_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    completeness_status: Mapped[str] = mapped_column(String, nullable=False)

    # Summary metrics
    total_days: Mapped[int] = mapped_column(Integer, nullable=False)
    rainfall_days_count: Mapped[int] = mapped_column(Integer, nullable=False)
    dry_days_count: Mapped[int] = mapped_column(Integer, nullable=False)
    rainfall_events_count: Mapped[int] = mapped_column(Integer, nullable=False)
    total_rainfall_depth_mm: Mapped[float] = mapped_column(Float, nullable=False)
    total_gross_volume_liters: Mapped[float] = mapped_column(Float, nullable=False)
    total_runoff_volume_liters: Mapped[float] = mapped_column(Float, nullable=False)
    total_first_flush_diverted_liters: Mapped[float] = mapped_column(Float, nullable=False)
    total_conveyance_losses_liters: Mapped[float] = mapped_column(Float, nullable=False)
    total_filtration_losses_liters: Mapped[float] = mapped_column(Float, nullable=False)
    total_inflow_to_tank_liters: Mapped[float] = mapped_column(Float, nullable=False)
    total_requested_demand_liters: Mapped[float] = mapped_column(Float, nullable=False)
    total_served_demand_liters: Mapped[float] = mapped_column(Float, nullable=False)
    total_unmet_demand_liters: Mapped[float] = mapped_column(Float, nullable=False)
    total_overflow_liters: Mapped[float] = mapped_column(Float, nullable=False)
    demand_coverage_pct: Mapped[float] = mapped_column(Float, nullable=False)
    overflow_ratio_pct: Mapped[float] = mapped_column(Float, nullable=False)
    collection_efficiency_pct: Mapped[float] = mapped_column(Float, nullable=False)
    initial_storage_liters: Mapped[float] = mapped_column(Float, nullable=False)
    final_storage_liters: Mapped[float] = mapped_column(Float, nullable=False)
    mean_daily_storage_liters: Mapped[float] = mapped_column(Float, nullable=False)
    max_daily_storage_liters: Mapped[float] = mapped_column(Float, nullable=False)
    min_daily_storage_liters: Mapped[float] = mapped_column(Float, nullable=False)
    days_with_unmet_demand: Mapped[int] = mapped_column(Integer, nullable=False)
    days_with_overflow: Mapped[int] = mapped_column(Integer, nullable=False)
    cumulative_mass_balance_residual_liters: Mapped[float] = mapped_column(Float, nullable=False)

    # Daily records (stored as JSON array)
    daily_records: Mapped[list] = mapped_column(JSON, nullable=False)

    # Warnings and audit
    warnings: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    mass_balance_status: Mapped[str] = mapped_column(String, nullable=False)
    max_single_day_residual_liters: Mapped[float] = mapped_column(Float, nullable=False)
    cumulative_residual_liters: Mapped[float] = mapped_column(Float, nullable=False)
    tolerance_liters: Mapped[float] = mapped_column(Float, nullable=False)

    # Relationships
    assessment: Mapped["AssessmentModel"] = relationship("AssessmentModel", back_populates="simulations")
