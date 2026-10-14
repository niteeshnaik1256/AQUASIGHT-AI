"""
Pydantic models for optimization API requests and responses.
"""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field, model_validator

from app.models.simulation import SimulationRequest
from app.models.rainfall import HistoricalRainfallRequest


class FinancialParametersSchema(BaseModel):
    """Pydantic schema for financial parameters (API layer)."""

    installation_cost_per_liter: float = Field(..., gt=0.0, description="Cost per liter of tank capacity")
    annual_maintenance_cost_percent: float = Field(..., ge=0.0, le=1.0, description="Annual maintenance as % of installation cost")
    water_tariff_per_kL: float = Field(..., ge=0.0, description="Municipal water tariff per kiloliter")
    discount_rate: float = Field(..., ge=0.0, le=1.0, description="Annual discount rate")
    evaluation_period_years: int = Field(..., ge=1, description="Analysis horizon in years")


class OptimizationRequest(BaseModel):
    """Request for storage capacity optimization."""

    # Base simulation configuration
    simulation_config: SimulationRequest = Field(..., description="Base simulation parameters")

    # Rainfall data specification
    rainfall_config: HistoricalRainfallRequest = Field(..., description="Rainfall data source")

    # Financial parameters
    financial_params: FinancialParametersSchema = Field(..., description="Financial assumptions")

    # Optimization settings
    objective: Literal["maximize_coverage", "minimize_cost", "pareto_exploration"] = Field(
        "pareto_exploration", description="Optimization objective"
    )

    # Constraints
    budget_constraint: Optional[float] = Field(None, ge=0.0, description="Maximum installation cost budget")
    min_coverage_constraint: Optional[float] = Field(None, ge=0.0, le=100.0, description="Minimum demand coverage % required")

    # Capacity search space
    min_capacity_liters: int = Field(1000, ge=100, description="Minimum tank capacity to evaluate (liters)")
    max_capacity_liters: int = Field(50000, ge=100, description="Maximum tank capacity to evaluate (liters)")
    capacity_step_liters: int = Field(1000, ge=100, description="Step size for capacity grid search (liters)")

    @model_validator(mode="after")
    def validate_capacity_range(self):
        if self.max_capacity_liters < self.min_capacity_liters:
            raise ValueError("max_capacity_liters must be >= min_capacity_liters")
        return self


class CandidateEvaluationSchema(BaseModel):
    """Evaluation results for a single candidate."""

    tank_capacity_liters: float
    demand_coverage_pct: float
    total_served_demand_liters: float
    total_overflow_liters: float
    total_unmet_demand_liters: float
    collection_efficiency_pct: float
    max_storage_liters: float
    mean_storage_liters: float

    # Financial metrics
    installation_cost: float
    annual_savings: float
    annual_maintenance_cost: float
    annual_net_cash_flow: float
    npv: float
    payback_period_years: Optional[float]

    # Feasibility
    is_feasible: bool
    infeasibility_reason: Optional[str] = None


class OptimizationResponse(BaseModel):
    """Complete optimization analysis results."""

    objective: str
    candidates: List[CandidateEvaluationSchema]
    feasible_candidates: List[CandidateEvaluationSchema]
    infeasible_candidates: List[CandidateEvaluationSchema]

    # Pareto analysis
    pareto_efficient_candidates: List[CandidateEvaluationSchema]
    lowest_cost_feasible: Optional[CandidateEvaluationSchema]
    highest_coverage_feasible: Optional[CandidateEvaluationSchema]

    # Recommendation
    recommended_candidate: Optional[CandidateEvaluationSchema]
    recommendation_rationale: str

    # Financial parameters used
    financial_params: dict

    # Constraints applied
    budget_constraint: Optional[float]
    min_coverage_constraint: Optional[float]

    # Warnings
    warnings: List[str]
