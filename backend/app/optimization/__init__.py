"""
Storage capacity optimization service for rainwater harvesting systems.

Evaluates candidate tank capacities using the existing hydrological simulation engine
and applies financial analysis to identify cost-effective configurations.
"""

from dataclasses import dataclass, field
from typing import List, Optional, Literal
from enum import Enum

from app.models.simulation import SimulationRequest
from app.models.rainfall import HistoricalRainfallRequest
from app.models.optimization import FinancialParametersSchema
from app.hydrology.metrics import SimulationSummaryMetrics
from app.finance import FinancialParameters, FinancialResults, calculate_financials
from app.services.rainfall_service import rainfall_service
from app.hydrology.tank_balance import TankWaterBalanceSimulator, DailyRainfallInput
from app.hydrology.metrics import compute_simulation_metrics


class OptimizationObjective(str, Enum):
    """Supported optimization objectives."""
    MAXIMIZE_COVERAGE = "maximize_coverage"  # Maximize demand coverage subject to budget
    MINIMIZE_COST = "minimize_cost"  # Minimize cost subject to minimum coverage
    PARETO_EXPLORATION = "pareto_exploration"  # Explore trade-off frontier


@dataclass(frozen=True)
class CandidateEvaluation:
    """Evaluation results for a single tank capacity candidate."""

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


@dataclass
class OptimizationResult:
    """Complete optimization analysis results."""

    objective: OptimizationObjective
    candidates: List[CandidateEvaluation]
    feasible_candidates: List[CandidateEvaluation]
    infeasible_candidates: List[CandidateEvaluation]

    # Pareto analysis
    pareto_efficient_candidates: List[CandidateEvaluation]
    lowest_cost_feasible: Optional[CandidateEvaluation]
    highest_coverage_feasible: Optional[CandidateEvaluation]

    # Recommendation
    recommended_candidate: Optional[CandidateEvaluation]
    recommendation_rationale: str

    # Assumptions
    financial_params: FinancialParameters
    budget_constraint: Optional[float]
    min_coverage_constraint: Optional[float]

    # Warnings
    warnings: List[str] = field(default_factory=list)


class StorageOptimizer:
    """
    Evaluates tank capacity candidates using deterministic simulation and financial analysis.
    """

    def __init__(self):
        pass

    async def optimize(
        self,
        base_request: SimulationRequest,
        rainfall_request: HistoricalRainfallRequest,
        financial_params_schema: FinancialParametersSchema,
        objective: OptimizationObjective,
        budget_constraint: Optional[float] = None,
        min_coverage_constraint: Optional[float] = None,
        capacity_range_liters: tuple = (1000, 50000),
        capacity_step_liters: int = 1000,
    ) -> OptimizationResult:
        """
        Run optimization over a range of tank capacities.

        Parameters:
        - base_request: Base simulation request (will be modified for each candidate)
        - rainfall_request: Rainfall data request
        - financial_params: Financial assumptions
        - objective: Optimization objective
        - budget_constraint: Maximum allowable installation cost (optional)
        - min_coverage_constraint: Minimum required demand coverage % (optional)
        - capacity_range_liters: (min_capacity, max_capacity) in liters
        - capacity_step_liters: Step size for capacity grid search

        Returns:
        - OptimizationResult with all candidates and recommendations
        """
        # 1. Convert financial params schema to domain object
        financial_params = FinancialParameters(
            installation_cost_per_liter=financial_params_schema.installation_cost_per_liter,
            annual_maintenance_cost_percent=financial_params_schema.annual_maintenance_cost_percent,
            water_tariff_per_kL=financial_params_schema.water_tariff_per_kL,
            discount_rate=financial_params_schema.discount_rate,
            evaluation_period_years=financial_params_schema.evaluation_period_years,
        )

        # 2. Obtain rainfall data once (shared across all candidates)
        rainfall_resp = await rainfall_service.get_historical_rainfall(rainfall_request)
        rainfall_inputs = [
            DailyRainfallInput(date=item.date, precipitation_mm=item.precipitation_mm)
            for item in rainfall_resp.daily_records
        ]

        if not rainfall_inputs:
            raise ValueError("No valid rainfall data available for optimization")

        # 2. Generate candidate capacities
        min_cap, max_cap = capacity_range_liters
        candidate_capacities = list(range(min_cap, max_cap + 1, capacity_step_liters))

        # 3. Evaluate each candidate
        all_candidates: List[CandidateEvaluation] = []
        warnings: List[str] = []

        for capacity in candidate_capacities:
            try:
                candidate = await self._evaluate_candidate(
                    capacity_liters=capacity,
                    base_request=base_request,
                    rainfall_inputs=rainfall_inputs,
                    financial_params=financial_params,
                    budget_constraint=budget_constraint,
                    min_coverage_constraint=min_coverage_constraint,
                )
                all_candidates.append(candidate)
            except Exception as e:
                warnings.append(f"Failed to evaluate capacity {capacity}L: {str(e)}")

        # 4. Separate feasible and infeasible
        feasible = [c for c in all_candidates if c.is_feasible]
        infeasible = [c for c in all_candidates if not c.is_feasible]

        # 5. Pareto analysis
        pareto_efficient = self._find_pareto_efficient(feasible)

        # 6. Identify extremal candidates
        lowest_cost = self._find_lowest_cost(feasible)
        highest_coverage = self._find_highest_coverage(feasible)

        # 7. Generate recommendation based on objective
        recommended, rationale = self._generate_recommendation(
            objective=objective,
            feasible=feasible,
            pareto_efficient=pareto_efficient,
            lowest_cost=lowest_cost,
            highest_coverage=highest_coverage,
            budget_constraint=budget_constraint,
            min_coverage_constraint=min_coverage_constraint,
        )

        return OptimizationResult(
            objective=objective,
            candidates=all_candidates,
            feasible_candidates=feasible,
            infeasible_candidates=infeasible,
            pareto_efficient_candidates=pareto_efficient,
            lowest_cost_feasible=lowest_cost,
            highest_coverage_feasible=highest_coverage,
            recommended_candidate=recommended,
            recommendation_rationale=rationale,
            financial_params=financial_params,
            budget_constraint=budget_constraint,
            min_coverage_constraint=min_coverage_constraint,
            warnings=warnings,
        )

    async def _evaluate_candidate(
        self,
        capacity_liters: float,
        base_request: SimulationRequest,
        rainfall_inputs: List,
        financial_params: FinancialParameters,
        budget_constraint: Optional[float],
        min_coverage_constraint: Optional[float],
    ) -> CandidateEvaluation:
        """Evaluate a single tank capacity candidate."""

        # 1. Run simulation with this capacity
        simulator = TankWaterBalanceSimulator(
            tank_capacity_liters=capacity_liters,
            catchment_area_sqm=base_request.catchment_area_sqm,
            initial_storage_liters=base_request.initial_storage_liters,
            runoff_coefficient=base_request.runoff_coefficient,
            roof_material=base_request.roof_material,
            first_flush_depth_mm=base_request.first_flush_depth_mm,
            dry_period_days=base_request.dry_period_days,
            conveyance_efficiency=base_request.conveyance_efficiency,
            filtration_efficiency=base_request.filtration_efficiency,
        )

        daily_records = simulator.simulate(
            rainfall_series=rainfall_inputs,
            daily_demand_liters=base_request.daily_demand_liters,
        )

        metrics = compute_simulation_metrics(daily_records)

        # 2. Calculate financial metrics
        financial_results = calculate_financials(
            tank_capacity_liters=capacity_liters,
            annual_served_demand_liters=metrics.total_served_demand_liters,
            params=financial_params,
        )

        # 3. Check constraints
        is_feasible = True
        infeasibility_reason = None

        if budget_constraint is not None and financial_results.installation_cost > budget_constraint:
            is_feasible = False
            infeasibility_reason = f"Exceeds budget of {budget_constraint}"

        if min_coverage_constraint is not None and metrics.demand_coverage_pct < min_coverage_constraint:
            is_feasible = False
            infeasibility_reason = f"Below minimum coverage of {min_coverage_constraint}%"

        return CandidateEvaluation(
            tank_capacity_liters=capacity_liters,
            demand_coverage_pct=metrics.demand_coverage_pct,
            total_served_demand_liters=metrics.total_served_demand_liters,
            total_overflow_liters=metrics.total_overflow_liters,
            total_unmet_demand_liters=metrics.total_unmet_demand_liters,
            collection_efficiency_pct=metrics.collection_efficiency_pct,
            max_storage_liters=metrics.max_daily_storage_liters,
            mean_storage_liters=metrics.mean_daily_storage_liters,
            installation_cost=financial_results.installation_cost,
            annual_savings=financial_results.annual_water_savings,
            annual_maintenance_cost=financial_results.annual_maintenance_cost,
            annual_net_cash_flow=financial_results.annual_net_cash_flow,
            npv=financial_results.net_present_value,
            payback_period_years=financial_results.simple_payback_period_years,
            is_feasible=is_feasible,
            infeasibility_reason=infeasibility_reason,
        )

    def _find_pareto_efficient(self, candidates: List[CandidateEvaluation]) -> List[CandidateEvaluation]:
        """
        Identify Pareto-efficient candidates.
        A candidate is dominated if another has:
        - Equal or lower cost AND equal or higher coverage (with at least one strict improvement).
        """
        if not candidates:
            return []

        pareto_efficient: List[CandidateEvaluation] = []

        for candidate in candidates:
            is_dominated = False
            for other in candidates:
                if other == candidate:
                    continue
                # Check if other dominates candidate
                cost_lower_or_equal = other.installation_cost <= candidate.installation_cost
                coverage_higher_or_equal = other.demand_coverage_pct >= candidate.demand_coverage_pct
                at_least_one_strict = (
                    other.installation_cost < candidate.installation_cost
                    or other.demand_coverage_pct > candidate.demand_coverage_pct
                )

                if cost_lower_or_equal and coverage_higher_or_equal and at_least_one_strict:
                    is_dominated = True
                    break

            if not is_dominated:
                pareto_efficient.append(candidate)

        return pareto_efficient

    def _find_lowest_cost(self, candidates: List[CandidateEvaluation]) -> Optional[CandidateEvaluation]:
        """Find the feasible candidate with lowest installation cost."""
        if not candidates:
            return None
        return min(candidates, key=lambda c: c.installation_cost)

    def _find_highest_coverage(self, candidates: List[CandidateEvaluation]) -> Optional[CandidateEvaluation]:
        """Find the feasible candidate with highest demand coverage."""
        if not candidates:
            return None
        return max(candidates, key=lambda c: c.demand_coverage_pct)

    def _generate_recommendation(
        self,
        objective: OptimizationObjective,
        feasible: List[CandidateEvaluation],
        pareto_efficient: List[CandidateEvaluation],
        lowest_cost: Optional[CandidateEvaluation],
        highest_coverage: Optional[CandidateEvaluation],
        budget_constraint: Optional[float],
        min_coverage_constraint: Optional[float],
    ) -> tuple[Optional[CandidateEvaluation], str]:
        """Generate recommendation based on objective and constraints."""

        if not feasible:
            if budget_constraint and min_coverage_constraint:
                return None, "No feasible candidate meets both budget and coverage constraints"
            elif budget_constraint:
                return None, f"No feasible candidate within budget of {budget_constraint}"
            elif min_coverage_constraint:
                return None, f"No feasible candidate meets minimum coverage of {min_coverage_constraint}%"
            else:
                return None, "No feasible candidates found"

        if objective == OptimizationObjective.MAXIMIZE_COVERAGE:
            # Recommend highest coverage within budget
            if highest_coverage:
                return highest_coverage, f"Recommended: {highest_coverage.tank_capacity_liters}L tank maximizes demand coverage at {highest_coverage.demand_coverage_pct}%"
            return feasible[0], "Recommended: First feasible candidate"

        elif objective == OptimizationObjective.MINIMIZE_COST:
            # Recommend lowest cost meeting coverage constraint
            if lowest_cost:
                return lowest_cost, f"Recommended: {lowest_cost.tank_capacity_liters}L tank minimizes cost at {lowest_cost.installation_cost} while meeting coverage requirement"
            return feasible[0], "Recommended: First feasible candidate"

        elif objective == OptimizationObjective.PARETO_EXPLORATION:
            # Recommend a balanced Pareto-efficient candidate
            if pareto_efficient:
                # Select the one with best NPV among Pareto-efficient
                best_npv = max(pareto_efficient, key=lambda c: c.npv)
                return best_npv, f"Recommended: {best_npv.tank_capacity_liters}L tank is Pareto-efficient with highest NPV ({best_npv.npv:.2f})"
            return feasible[0], "Recommended: First feasible candidate"

        return feasible[0], "Recommended: Default selection"
