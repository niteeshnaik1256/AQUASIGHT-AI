"""
Repository layer for assessment and simulation persistence.
"""

from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session

from app.database.models import AssessmentModel, SimulationModel
from app.models.simulation import SimulationResponse, SimulationSummaryMetricsSchema, DailySimulationRecordSchema
from app.models.rainfall import RainfallProvenance


class AssessmentRepository:
    """Repository for assessment CRUD operations."""

    def __init__(self, db: Session):
        self.db = db

    def create_assessment(self, assessment_data: dict) -> AssessmentModel:
        """Create a new assessment record."""
        assessment = AssessmentModel(**assessment_data)
        self.db.add(assessment)
        self.db.commit()
        self.db.refresh(assessment)
        return assessment

    def get_assessment_by_id(self, assessment_id: str) -> Optional[AssessmentModel]:
        """Retrieve an assessment by ID."""
        return self.db.query(AssessmentModel).filter(AssessmentModel.id == assessment_id).first()

    def list_assessments(self, limit: int = 100, offset: int = 0) -> List[AssessmentModel]:
        """List all assessments with pagination."""
        return self.db.query(AssessmentModel).order_by(AssessmentModel.created_at.desc()).offset(offset).limit(limit).all()

    def update_assessment(self, assessment_id: str, update_data: dict) -> Optional[AssessmentModel]:
        """Update an existing assessment."""
        assessment = self.get_assessment_by_id(assessment_id)
        if not assessment:
            return None
        for key, value in update_data.items():
            setattr(assessment, key, value)
        self.db.commit()
        self.db.refresh(assessment)
        return assessment

    def delete_assessment(self, assessment_id: str) -> bool:
        """Delete an assessment by ID."""
        assessment = self.get_assessment_by_id(assessment_id)
        if not assessment:
            return False
        self.db.delete(assessment)
        self.db.commit()
        return True


class SimulationRepository:
    """Repository for simulation CRUD operations."""

    def __init__(self, db: Session):
        self.db = db

    def create_simulation(self, response: SimulationResponse) -> SimulationModel:
        """Create a new simulation record from SimulationResponse."""
        # Convert daily records schema to dict
        daily_records_dict = [r.model_dump() for r in response.daily_records]

        # Parse created_at if it's a string
        created_at_dt = datetime.fromisoformat(response.created_at) if isinstance(response.created_at, str) else response.created_at

        simulation = SimulationModel(
            id=response.simulation_id,
            assessment_id=response.assessment_id,
            created_at=created_at_dt,
            input_config=response.assumptions,
            rainfall_provider=response.rainfall_provenance.provider,
            rainfall_dataset=response.rainfall_provenance.dataset,
            requested_latitude=response.rainfall_provenance.requested_latitude,
            requested_longitude=response.rainfall_provenance.requested_longitude,
            resolved_latitude=response.rainfall_provenance.resolved_latitude,
            resolved_longitude=response.rainfall_provenance.resolved_longitude,
            rainfall_variable=response.rainfall_provenance.variable,
            rainfall_unit=response.rainfall_provenance.unit,
            time_range=response.rainfall_provenance.time_range,
            retrieval_timestamp=response.rainfall_provenance.retrieval_timestamp,
            is_cached=response.rainfall_provenance.is_cached,
            missing_count=response.rainfall_provenance.missing_count,
            completeness_status=response.rainfall_provenance.completeness_status,
            total_days=response.summary.total_days,
            rainfall_days_count=response.summary.rainfall_days_count,
            dry_days_count=response.summary.dry_days_count,
            rainfall_events_count=response.summary.rainfall_events_count,
            total_rainfall_depth_mm=response.summary.total_rainfall_depth_mm,
            total_gross_volume_liters=response.summary.total_gross_volume_liters,
            total_runoff_volume_liters=response.summary.total_runoff_volume_liters,
            total_first_flush_diverted_liters=response.summary.total_first_flush_diverted_liters,
            total_conveyance_losses_liters=response.summary.total_conveyance_losses_liters,
            total_filtration_losses_liters=response.summary.total_filtration_losses_liters,
            total_inflow_to_tank_liters=response.summary.total_inflow_to_tank_liters,
            total_requested_demand_liters=response.summary.total_requested_demand_liters,
            total_served_demand_liters=response.summary.total_served_demand_liters,
            total_unmet_demand_liters=response.summary.total_unmet_demand_liters,
            total_overflow_liters=response.summary.total_overflow_liters,
            demand_coverage_pct=response.summary.demand_coverage_pct,
            overflow_ratio_pct=response.summary.overflow_ratio_pct,
            collection_efficiency_pct=response.summary.collection_efficiency_pct,
            initial_storage_liters=response.summary.initial_storage_liters,
            final_storage_liters=response.summary.final_storage_liters,
            mean_daily_storage_liters=response.summary.mean_daily_storage_liters,
            max_daily_storage_liters=response.summary.max_daily_storage_liters,
            min_daily_storage_liters=response.summary.min_daily_storage_liters,
            days_with_unmet_demand=response.summary.days_with_unmet_demand,
            days_with_overflow=response.summary.days_with_overflow,
            cumulative_mass_balance_residual_liters=response.summary.cumulative_mass_balance_residual_liters,
            daily_records=daily_records_dict,
            warnings=response.warnings,
            mass_balance_status=response.mass_balance_audit.get("status", "unknown"),
            max_single_day_residual_liters=response.mass_balance_audit.get("max_single_day_residual_liters", 0.0),
            cumulative_residual_liters=response.mass_balance_audit.get("cumulative_residual_liters", 0.0),
            tolerance_liters=response.mass_balance_audit.get("tolerance_liters", 1e-5),
        )
        self.db.add(simulation)
        self.db.commit()
        self.db.refresh(simulation)
        return simulation

    def get_simulation_by_id(self, simulation_id: str) -> Optional[SimulationModel]:
        """Retrieve a simulation by ID."""
        return self.db.query(SimulationModel).filter(SimulationModel.id == simulation_id).first()

    def list_simulations_for_assessment(self, assessment_id: str, limit: int = 50) -> List[SimulationModel]:
        """List all simulations for a given assessment."""
        return (
            self.db.query(SimulationModel)
            .filter(SimulationModel.assessment_id == assessment_id)
            .order_by(SimulationModel.created_at.desc())
            .limit(limit)
            .all()
        )

    def to_response(self, model: SimulationModel) -> SimulationResponse:
        """Convert SimulationModel to SimulationResponse."""
        # Reconstruct daily records
        daily_records = [DailySimulationRecordSchema(**r) for r in model.daily_records]

        # Reconstruct summary
        summary = SimulationSummaryMetricsSchema(
            total_days=model.total_days,
            rainfall_days_count=model.rainfall_days_count,
            dry_days_count=model.dry_days_count,
            rainfall_events_count=model.rainfall_events_count,
            total_rainfall_depth_mm=model.total_rainfall_depth_mm,
            total_gross_volume_liters=model.total_gross_volume_liters,
            total_runoff_volume_liters=model.total_runoff_volume_liters,
            total_first_flush_diverted_liters=model.total_first_flush_diverted_liters,
            total_conveyance_losses_liters=model.total_conveyance_losses_liters,
            total_filtration_losses_liters=model.total_filtration_losses_liters,
            total_inflow_to_tank_liters=model.total_inflow_to_tank_liters,
            total_requested_demand_liters=model.total_requested_demand_liters,
            total_served_demand_liters=model.total_served_demand_liters,
            total_unmet_demand_liters=model.total_unmet_demand_liters,
            total_overflow_liters=model.total_overflow_liters,
            demand_coverage_pct=model.demand_coverage_pct,
            overflow_ratio_pct=model.overflow_ratio_pct,
            collection_efficiency_pct=model.collection_efficiency_pct,
            initial_storage_liters=model.initial_storage_liters,
            final_storage_liters=model.final_storage_liters,
            mean_daily_storage_liters=model.mean_daily_storage_liters,
            max_daily_storage_liters=model.max_daily_storage_liters,
            min_daily_storage_liters=model.min_daily_storage_liters,
            days_with_unmet_demand=model.days_with_unmet_demand,
            days_with_overflow=model.days_with_overflow,
            cumulative_mass_balance_residual_liters=model.cumulative_mass_balance_residual_liters,
        )

        # Reconstruct provenance
        provenance = RainfallProvenance(
            provider=model.rainfall_provider,
            dataset=model.rainfall_dataset,
            requested_latitude=model.requested_latitude,
            requested_longitude=model.requested_longitude,
            resolved_latitude=model.resolved_latitude,
            resolved_longitude=model.resolved_longitude,
            variable=model.rainfall_variable,
            unit=model.rainfall_unit,
            time_range=model.time_range,
            retrieval_timestamp=model.retrieval_timestamp,
            is_cached=model.is_cached,
            missing_count=model.missing_count,
            completeness_status=model.completeness_status,
        )

        return SimulationResponse(
            simulation_id=model.id,
            assessment_id=model.assessment_id,
            created_at=model.created_at.isoformat(),
            assumptions=model.input_config,
            rainfall_provenance=provenance,
            summary=summary,
            daily_records=daily_records,
            warnings=model.warnings,
            mass_balance_audit={
                "status": model.mass_balance_status,
                "max_single_day_residual_liters": model.max_single_day_residual_liters,
                "cumulative_residual_liters": model.cumulative_residual_liters,
                "tolerance_liters": model.tolerance_liters,
            },
        )
