from fastapi import APIRouter
from app.models.optimization import OptimizationRequest, OptimizationResponse
from app.optimization import StorageOptimizer

router = APIRouter(prefix="/optimization", tags=["Optimization"])

optimizer = StorageOptimizer()


@router.post("", response_model=OptimizationResponse)
async def run_optimization(request: OptimizationRequest):
    """
    Runs storage capacity optimization over a range of tank capacities.
    Evaluates each candidate using the hydrological simulation engine and financial analysis.
    Returns Pareto-efficient candidates and recommendations.
    """
    result = await optimizer.optimize(
        base_request=request.simulation_config,
        rainfall_request=request.rainfall_config,
        financial_params_schema=request.financial_params,
        objective=request.objective,
        budget_constraint=request.budget_constraint,
        min_coverage_constraint=request.min_coverage_constraint,
        capacity_range_liters=(request.min_capacity_liters, request.max_capacity_liters),
        capacity_step_liters=request.capacity_step_liters,
    )

    # Convert domain objects to response schemas
    from app.optimization import CandidateEvaluation

    def candidate_to_schema(c: CandidateEvaluation):
        from app.models.optimization import CandidateEvaluationSchema
        return CandidateEvaluationSchema(
            tank_capacity_liters=c.tank_capacity_liters,
            demand_coverage_pct=c.demand_coverage_pct,
            total_served_demand_liters=c.total_served_demand_liters,
            total_overflow_liters=c.total_overflow_liters,
            total_unmet_demand_liters=c.total_unmet_demand_liters,
            collection_efficiency_pct=c.collection_efficiency_pct,
            max_storage_liters=c.max_storage_liters,
            mean_storage_liters=c.mean_storage_liters,
            installation_cost=c.installation_cost,
            annual_savings=c.annual_savings,
            annual_maintenance_cost=c.annual_maintenance_cost,
            annual_net_cash_flow=c.annual_net_cash_flow,
            npv=c.npv,
            payback_period_years=c.payback_period_years,
            is_feasible=c.is_feasible,
            infeasibility_reason=c.infeasibility_reason,
        )

    return OptimizationResponse(
        objective=result.objective.value,
        candidates=[candidate_to_schema(c) for c in result.candidates],
        feasible_candidates=[candidate_to_schema(c) for c in result.feasible_candidates],
        infeasible_candidates=[candidate_to_schema(c) for c in result.infeasible_candidates],
        pareto_efficient_candidates=[candidate_to_schema(c) for c in result.pareto_efficient_candidates],
        lowest_cost_feasible=candidate_to_schema(result.lowest_cost_feasible) if result.lowest_cost_feasible else None,
        highest_coverage_feasible=candidate_to_schema(result.highest_coverage_feasible) if result.highest_coverage_feasible else None,
        recommended_candidate=candidate_to_schema(result.recommended_candidate) if result.recommended_candidate else None,
        recommendation_rationale=result.recommendation_rationale,
        financial_params={
            "installation_cost_per_liter": result.financial_params.installation_cost_per_liter,
            "annual_maintenance_cost_percent": result.financial_params.annual_maintenance_cost_percent,
            "water_tariff_per_kL": result.financial_params.water_tariff_per_kL,
            "discount_rate": result.financial_params.discount_rate,
            "evaluation_period_years": result.financial_params.evaluation_period_years,
        },
        budget_constraint=result.budget_constraint,
        min_coverage_constraint=result.min_coverage_constraint,
        warnings=result.warnings,
    )
