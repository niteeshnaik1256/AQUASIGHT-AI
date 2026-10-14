"""
Unit tests for storage capacity optimization service.
"""

import pytest
from app.optimization import StorageOptimizer, OptimizationObjective, CandidateEvaluation
from app.models.simulation import SimulationRequest
from app.models.rainfall import HistoricalRainfallRequest
from app.models.optimization import FinancialParametersSchema
from app.hydrology.tank_balance import DailyRainfallInput
from app.finance import FinancialParameters
from app.hydrology.tank_balance import TankWaterBalanceSimulator
from app.hydrology.metrics import compute_simulation_metrics
from unittest.mock import AsyncMock, patch, MagicMock


@pytest.fixture
def synthetic_rainfall():
    """Synthetic rainfall data for unit tests (no HTTP requests)."""
    return [
        DailyRainfallInput(date="2024-01-01", precipitation_mm=10.0),
        DailyRainfallInput(date="2024-01-02", precipitation_mm=0.0),
        DailyRainfallInput(date="2024-01-03", precipitation_mm=25.0),
        DailyRainfallInput(date="2024-01-04", precipitation_mm=5.0),
        DailyRainfallInput(date="2024-01-05", precipitation_mm=0.0),
    ]


@pytest.fixture
def base_simulation_request():
    """Base simulation request for testing."""
    return SimulationRequest(
        assessment_id="test-001",
        catchment_area_sqm=100.0,
        roof_material="concrete_tile",
        runoff_coefficient=0.8,
        tank_capacity_liters=5000.0,  # Will be overridden per candidate
        initial_storage_liters=0.0,
        daily_demand_liters=200.0,
        first_flush_depth_mm=1.0,
        dry_period_days=3,
        conveyance_efficiency=0.95,
        filtration_efficiency=0.90,
        rainfall_source="user_provided",
        user_rainfall_series=[
            {"date": "2024-01-01", "precipitation_mm": 10.0},
            {"date": "2024-01-02", "precipitation_mm": 0.0},
            {"date": "2024-01-03", "precipitation_mm": 25.0},
            {"date": "2024-01-04", "precipitation_mm": 5.0},
            {"date": "2024-01-05", "precipitation_mm": 0.0},
        ],
    )


@pytest.fixture
def financial_params_schema():
    """Financial parameters for testing."""
    return FinancialParametersSchema(
        installation_cost_per_liter=0.02,
        annual_maintenance_cost_percent=0.03,
        water_tariff_per_kL=30.0,
        discount_rate=0.08,
        evaluation_period_years=10,
    )


class TestCandidateEvaluation:
    """Tests for single candidate tank capacity evaluation."""

    def test_candidate_evaluation_uses_simulation_engine(self, base_simulation_request, synthetic_rainfall, financial_params_schema):
        """Verify that candidate evaluation uses the actual hydrological simulation engine."""
        optimizer = StorageOptimizer()
        
        financial_params = FinancialParameters(
            installation_cost_per_liter=financial_params_schema.installation_cost_per_liter,
            annual_maintenance_cost_percent=financial_params_schema.annual_maintenance_cost_percent,
            water_tariff_per_kL=financial_params_schema.water_tariff_per_kL,
            discount_rate=financial_params_schema.discount_rate,
            evaluation_period_years=financial_params_schema.evaluation_period_years,
        )
        
        # Mock rainfall service to return synthetic data
        with patch('app.optimization.rainfall_service.get_historical_rainfall') as mock_rainfall:
            mock_response = AsyncMock()
            mock_response.daily_records = [
                type('Item', (), {'date': r.date, 'precipitation_mm': r.precipitation_mm})()
                for r in synthetic_rainfall
            ]
            mock_response.provenance = type('Provenance', (), {
                'provider': 'test',
                'dataset': 'test',
                'requested_latitude': 0.0,
                'requested_longitude': 0.0,
                'variable': 'precipitation',
                'unit': 'mm',
                'time_range': 'test',
                'retrieval_timestamp': 'test',
                'is_cached': False,
                'missing_count': 0,
                'completeness_status': 'complete',
            })()
            mock_rainfall.get_historical_rainfall = AsyncMock(return_value=mock_response)
            
            import asyncio
            result = asyncio.run(optimizer._evaluate_candidate(
                capacity_liters=5000.0,
                base_request=base_simulation_request,
                rainfall_inputs=synthetic_rainfall,
                financial_params=financial_params,
                budget_constraint=None,
                min_coverage_constraint=None,
            ))
        
        # Verify hydrological metrics are present
        assert result.tank_capacity_liters == 5000.0
        assert result.demand_coverage_pct >= 0.0
        assert result.demand_coverage_pct <= 100.0
        assert result.total_served_demand_liters >= 0.0
        assert result.total_overflow_liters >= 0.0
        assert result.collection_efficiency_pct >= 0.0
        assert result.collection_efficiency_pct <= 100.0

    def test_candidate_evaluation_financial_metrics(self, base_simulation_request, synthetic_rainfall, financial_params_schema):
        """Verify that financial metrics are calculated correctly."""
        optimizer = StorageOptimizer()
        
        financial_params = FinancialParameters(
            installation_cost_per_liter=financial_params_schema.installation_cost_per_liter,
            annual_maintenance_cost_percent=financial_params_schema.annual_maintenance_cost_percent,
            water_tariff_per_kL=financial_params_schema.water_tariff_per_kL,
            discount_rate=financial_params_schema.discount_rate,
            evaluation_period_years=financial_params_schema.evaluation_period_years,
        )
        
        with patch('app.optimization.rainfall_service.get_historical_rainfall') as mock_rainfall:
            mock_response = AsyncMock()
            mock_response.daily_records = [
                type('Item', (), {'date': r.date, 'precipitation_mm': r.precipitation_mm})()
                for r in synthetic_rainfall
            ]
            mock_response.provenance = type('Provenance', (), {
                'provider': 'test',
                'dataset': 'test',
                'requested_latitude': 0.0,
                'requested_longitude': 0.0,
                'variable': 'precipitation',
                'unit': 'mm',
                'time_range': 'test',
                'retrieval_timestamp': 'test',
                'is_cached': False,
                'missing_count': 0,
                'completeness_status': 'complete',
            })()
            mock_rainfall.get_historical_rainfall = AsyncMock(return_value=mock_response)
            
            import asyncio
            result = asyncio.run(optimizer._evaluate_candidate(
                capacity_liters=10000.0,
                base_request=base_simulation_request,
                rainfall_inputs=synthetic_rainfall,
                financial_params=financial_params,
                budget_constraint=None,
                min_coverage_constraint=None,
            ))
        
        # Verify financial calculations
        assert result.installation_cost == 10000.0 * 0.02  # 200.0
        assert result.annual_maintenance_cost == 200.0 * 0.03  # 6.0
        assert result.npv is not None  # NPV should always be calculated

    def test_budget_constraint_violation(self, base_simulation_request, synthetic_rainfall, financial_params_schema):
        """Verify that candidates exceeding budget are marked infeasible."""
        optimizer = StorageOptimizer()
        
        financial_params = FinancialParameters(
            installation_cost_per_liter=financial_params_schema.installation_cost_per_liter,
            annual_maintenance_cost_percent=financial_params_schema.annual_maintenance_cost_percent,
            water_tariff_per_kL=financial_params_schema.water_tariff_per_kL,
            discount_rate=financial_params_schema.discount_rate,
            evaluation_period_years=financial_params_schema.evaluation_period_years,
        )
        
        with patch('app.optimization.rainfall_service.get_historical_rainfall') as mock_rainfall:
            mock_response = AsyncMock()
            mock_response.daily_records = [
                type('Item', (), {'date': r.date, 'precipitation_mm': r.precipitation_mm})()
                for r in synthetic_rainfall
            ]
            mock_response.provenance = type('Provenance', (), {
                'provider': 'test',
                'dataset': 'test',
                'requested_latitude': 0.0,
                'requested_longitude': 0.0,
                'variable': 'precipitation',
                'unit': 'mm',
                'time_range': 'test',
                'retrieval_timestamp': 'test',
                'is_cached': False,
                'missing_count': 0,
                'completeness_status': 'complete',
            })()
            mock_rainfall.get_historical_rainfall = AsyncMock(return_value=mock_response)
            
            import asyncio
            result = asyncio.run(optimizer._evaluate_candidate(
                capacity_liters=10000.0,
                base_request=base_simulation_request,
                rainfall_inputs=synthetic_rainfall,
                financial_params=financial_params,
                budget_constraint=100.0,  # Tank costs 200, budget is 100
                min_coverage_constraint=None,
            ))
        
        assert not result.is_feasible
        assert result.infeasibility_reason is not None
        assert "budget" in result.infeasibility_reason.lower()

    def test_coverage_constraint_violation(self, base_simulation_request, synthetic_rainfall, financial_params_schema):
        """Verify that candidates below minimum coverage are marked infeasible."""
        optimizer = StorageOptimizer()
        
        financial_params = FinancialParameters(
            installation_cost_per_liter=financial_params_schema.installation_cost_per_liter,
            annual_maintenance_cost_percent=financial_params_schema.annual_maintenance_cost_percent,
            water_tariff_per_kL=financial_params_schema.water_tariff_per_kL,
            discount_rate=financial_params_schema.discount_rate,
            evaluation_period_years=financial_params_schema.evaluation_period_years,
        )
        
        with patch('app.optimization.rainfall_service.get_historical_rainfall') as mock_rainfall:
            mock_response = AsyncMock()
            mock_response.daily_records = [
                type('Item', (), {'date': r.date, 'precipitation_mm': r.precipitation_mm})()
                for r in synthetic_rainfall
            ]
            mock_response.provenance = type('Provenance', (), {
                'provider': 'test',
                'dataset': 'test',
                'requested_latitude': 0.0,
                'requested_longitude': 0.0,
                'variable': 'precipitation',
                'unit': 'mm',
                'time_range': 'test',
                'retrieval_timestamp': 'test',
                'is_cached': False,
                'missing_count': 0,
                'completeness_status': 'complete',
            })()
            mock_rainfall.get_historical_rainfall = AsyncMock(return_value=mock_response)
            
            import asyncio
            result = asyncio.run(optimizer._evaluate_candidate(
                capacity_liters=1000.0,
                base_request=base_simulation_request,
                rainfall_inputs=synthetic_rainfall,
                financial_params=financial_params,
                budget_constraint=None,
                min_coverage_constraint=90.0,  # Very high coverage requirement
            ))
        
        # Small tank likely won't meet 90% coverage
        if result.demand_coverage_pct < 90.0:
            assert not result.is_feasible
            assert result.infeasibility_reason is not None
            assert "coverage" in result.infeasibility_reason.lower()

    def test_feasible_candidate_no_constraints(self, base_simulation_request, synthetic_rainfall, financial_params_schema):
        """Verify that candidates are feasible when no constraints are applied."""
        optimizer = StorageOptimizer()
        
        financial_params = FinancialParameters(
            installation_cost_per_liter=financial_params_schema.installation_cost_per_liter,
            annual_maintenance_cost_percent=financial_params_schema.annual_maintenance_cost_percent,
            water_tariff_per_kL=financial_params_schema.water_tariff_per_kL,
            discount_rate=financial_params_schema.discount_rate,
            evaluation_period_years=financial_params_schema.evaluation_period_years,
        )
        
        with patch('app.optimization.rainfall_service.get_historical_rainfall') as mock_rainfall:
            mock_response = AsyncMock()
            mock_response.daily_records = [
                type('Item', (), {'date': r.date, 'precipitation_mm': r.precipitation_mm})()
                for r in synthetic_rainfall
            ]
            mock_response.provenance = type('Provenance', (), {
                'provider': 'test',
                'dataset': 'test',
                'requested_latitude': 0.0,
                'requested_longitude': 0.0,
                'variable': 'precipitation',
                'unit': 'mm',
                'time_range': 'test',
                'retrieval_timestamp': 'test',
                'is_cached': False,
                'missing_count': 0,
                'completeness_status': 'complete',
            })()
            mock_rainfall.get_historical_rainfall = AsyncMock(return_value=mock_response)
            
            import asyncio
            result = asyncio.run(optimizer._evaluate_candidate(
                capacity_liters=5000.0,
                base_request=base_simulation_request,
                rainfall_inputs=synthetic_rainfall,
                financial_params=financial_params,
                budget_constraint=None,
                min_coverage_constraint=None,
            ))
        
        assert result.is_feasible
        assert result.infeasibility_reason is None


class TestParetoDominance:
    """Tests for Pareto dominance analysis."""

    def test_dominated_candidate_removed(self):
        """A candidate dominated by another should be excluded from Pareto set."""
        optimizer = StorageOptimizer()
        
        # Candidate A: higher cost, lower coverage (dominated)
        dominated = CandidateEvaluation(
            tank_capacity_liters=10000.0,
            demand_coverage_pct=50.0,
            total_served_demand_liters=50000.0,
            total_overflow_liters=10000.0,
            total_unmet_demand_liters=50000.0,
            collection_efficiency_pct=60.0,
            max_storage_liters=10000.0,
            mean_storage_liters=5000.0,
            installation_cost=200.0,
            annual_savings=1500.0,
            annual_maintenance_cost=6.0,
            annual_net_cash_flow=1494.0,
            npv=10000.0,
            payback_period_years=0.13,
            is_feasible=True,
        )
        
        # Candidate B: lower cost, higher coverage (dominates A)
        dominant = CandidateEvaluation(
            tank_capacity_liters=5000.0,
            demand_coverage_pct=70.0,
            total_served_demand_liters=70000.0,
            total_overflow_liters=5000.0,
            total_unmet_demand_liters=30000.0,
            collection_efficiency_pct=65.0,
            max_storage_liters=5000.0,
            mean_storage_liters=2500.0,
            installation_cost=100.0,
            annual_savings=2100.0,
            annual_maintenance_cost=3.0,
            annual_net_cash_flow=2097.0,
            npv=15000.0,
            payback_period_years=0.05,
            is_feasible=True,
        )
        
        pareto_efficient = optimizer._find_pareto_efficient([dominated, dominant])
        
        assert dominant in pareto_efficient
        assert dominated not in pareto_efficient

    def test_non_dominated_candidate_retained(self):
        """A non-dominated candidate should be in the Pareto set."""
        optimizer = StorageOptimizer()
        
        candidate = CandidateEvaluation(
            tank_capacity_liters=5000.0,
            demand_coverage_pct=70.0,
            total_served_demand_liters=70000.0,
            total_overflow_liters=5000.0,
            total_unmet_demand_liters=30000.0,
            collection_efficiency_pct=65.0,
            max_storage_liters=5000.0,
            mean_storage_liters=2500.0,
            installation_cost=100.0,
            annual_savings=2100.0,
            annual_maintenance_cost=3.0,
            annual_net_cash_flow=2097.0,
            npv=15000.0,
            payback_period_years=0.05,
            is_feasible=True,
        )
        
        pareto_efficient = optimizer._find_pareto_efficient([candidate])
        
        assert len(pareto_efficient) == 1
        assert candidate in pareto_efficient

    def test_equal_cost_different_coverage(self):
        """When costs are equal, the higher coverage candidate should dominate."""
        optimizer = StorageOptimizer()
        
        candidate_low = CandidateEvaluation(
            tank_capacity_liters=5000.0,
            demand_coverage_pct=50.0,
            total_served_demand_liters=50000.0,
            total_overflow_liters=5000.0,
            total_unmet_demand_liters=50000.0,
            collection_efficiency_pct=60.0,
            max_storage_liters=5000.0,
            mean_storage_liters=2500.0,
            installation_cost=100.0,
            annual_savings=1500.0,
            annual_maintenance_cost=3.0,
            annual_net_cash_flow=1497.0,
            npv=10000.0,
            payback_period_years=0.07,
            is_feasible=True,
        )
        
        candidate_high = CandidateEvaluation(
            tank_capacity_liters=10000.0,
            demand_coverage_pct=80.0,
            total_served_demand_liters=80000.0,
            total_overflow_liters=10000.0,
            total_unmet_demand_liters=20000.0,
            collection_efficiency_pct=65.0,
            max_storage_liters=10000.0,
            mean_storage_liters=5000.0,
            installation_cost=100.0,  # Same cost
            annual_savings=2400.0,
            annual_maintenance_cost=3.0,
            annual_net_cash_flow=2397.0,
            npv=18000.0,
            payback_period_years=0.04,
            is_feasible=True,
        )
        
        pareto_efficient = optimizer._find_pareto_efficient([candidate_low, candidate_high])
        
        # Higher coverage should dominate at equal cost
        assert candidate_high in pareto_efficient
        assert candidate_low not in pareto_efficient

    def test_equal_coverage_different_cost(self):
        """When coverage is equal, the lower cost candidate should dominate."""
        optimizer = StorageOptimizer()
        
        candidate_high_cost = CandidateEvaluation(
            tank_capacity_liters=10000.0,
            demand_coverage_pct=70.0,
            total_served_demand_liters=70000.0,
            total_overflow_liters=10000.0,
            total_unmet_demand_liters=30000.0,
            collection_efficiency_pct=65.0,
            max_storage_liters=10000.0,
            mean_storage_liters=5000.0,
            installation_cost=200.0,
            annual_savings=2100.0,
            annual_maintenance_cost=6.0,
            annual_net_cash_flow=2094.0,
            npv=15000.0,
            payback_period_years=0.10,
            is_feasible=True,
        )
        
        candidate_low_cost = CandidateEvaluation(
            tank_capacity_liters=5000.0,
            demand_coverage_pct=70.0,
            total_served_demand_liters=70000.0,
            total_overflow_liters=5000.0,
            total_unmet_demand_liters=30000.0,
            collection_efficiency_pct=65.0,
            max_storage_liters=5000.0,
            mean_storage_liters=2500.0,
            installation_cost=100.0,  # Lower cost
            annual_savings=2100.0,
            annual_maintenance_cost=3.0,
            annual_net_cash_flow=2097.0,
            npv=18000.0,
            payback_period_years=0.05,
            is_feasible=True,
        )
        
        pareto_efficient = optimizer._find_pareto_efficient([candidate_high_cost, candidate_low_cost])
        
        # Lower cost should dominate at equal coverage
        assert candidate_low_cost in pareto_efficient
        assert candidate_high_cost not in pareto_efficient

    def test_empty_candidate_list(self):
        """Empty candidate list should return empty Pareto set."""
        optimizer = StorageOptimizer()
        pareto_efficient = optimizer._find_pareto_efficient([])
        assert pareto_efficient == []

    def test_single_candidate(self):
        """Single candidate should be Pareto-efficient."""
        optimizer = StorageOptimizer()
        
        candidate = CandidateEvaluation(
            tank_capacity_liters=5000.0,
            demand_coverage_pct=70.0,
            total_served_demand_liters=70000.0,
            total_overflow_liters=5000.0,
            total_unmet_demand_liters=30000.0,
            collection_efficiency_pct=65.0,
            max_storage_liters=5000.0,
            mean_storage_liters=2500.0,
            installation_cost=100.0,
            annual_savings=2100.0,
            annual_maintenance_cost=3.0,
            annual_net_cash_flow=2097.0,
            npv=15000.0,
            payback_period_years=0.05,
            is_feasible=True,
        )
        
        pareto_efficient = optimizer._find_pareto_efficient([candidate])
        assert len(pareto_efficient) == 1

    def test_multiple_pareto_efficient_candidates(self):
        """Multiple non-dominated candidates should all be retained."""
        optimizer = StorageOptimizer()
        
        # Trade-off 1: Low cost, low coverage
        candidate1 = CandidateEvaluation(
            tank_capacity_liters=2000.0,
            demand_coverage_pct=40.0,
            total_served_demand_liters=40000.0,
            total_overflow_liters=2000.0,
            total_unmet_demand_liters=60000.0,
            collection_efficiency_pct=60.0,
            max_storage_liters=2000.0,
            mean_storage_liters=1000.0,
            installation_cost=40.0,
            annual_savings=1200.0,
            annual_maintenance_cost=1.2,
            annual_net_cash_flow=1198.8,
            npv=8000.0,
            payback_period_years=0.03,
            is_feasible=True,
        )
        
        # Trade-off 2: High cost, high coverage
        candidate2 = CandidateEvaluation(
            tank_capacity_liters=10000.0,
            demand_coverage_pct=90.0,
            total_served_demand_liters=90000.0,
            total_overflow_liters=10000.0,
            total_unmet_demand_liters=10000.0,
            collection_efficiency_pct=65.0,
            max_storage_liters=10000.0,
            mean_storage_liters=5000.0,
            installation_cost=200.0,
            annual_savings=2700.0,
            annual_maintenance_cost=6.0,
            annual_net_cash_flow=2694.0,
            npv=20000.0,
            payback_period_years=0.07,
            is_feasible=True,
        )
        
        pareto_efficient = optimizer._find_pareto_efficient([candidate1, candidate2])
        
        # Both should be Pareto-efficient (neither dominates the other)
        assert len(pareto_efficient) == 2
        assert candidate1 in pareto_efficient
        assert candidate2 in pareto_efficient


class TestOptimizationObjectives:
    """Tests for optimization objective selection."""

    def test_maximize_coverage_selects_highest_coverage(self):
        """Maximize coverage objective should select highest coverage feasible candidate."""
        optimizer = StorageOptimizer()
        
        candidates = [
            CandidateEvaluation(
                tank_capacity_liters=2000.0,
                demand_coverage_pct=40.0,
                total_served_demand_liters=40000.0,
                total_overflow_liters=2000.0,
                total_unmet_demand_liters=60000.0,
                collection_efficiency_pct=60.0,
                max_storage_liters=2000.0,
                mean_storage_liters=1000.0,
                installation_cost=40.0,
                annual_savings=1200.0,
                annual_maintenance_cost=1.2,
                annual_net_cash_flow=1198.8,
                npv=8000.0,
                payback_period_years=0.03,
                is_feasible=True,
            ),
            CandidateEvaluation(
                tank_capacity_liters=5000.0,
                demand_coverage_pct=70.0,
                total_served_demand_liters=70000.0,
                total_overflow_liters=5000.0,
                total_unmet_demand_liters=30000.0,
                collection_efficiency_pct=65.0,
                max_storage_liters=5000.0,
                mean_storage_liters=2500.0,
                installation_cost=100.0,
                annual_savings=2100.0,
                annual_maintenance_cost=3.0,
                annual_net_cash_flow=2097.0,
                npv=15000.0,
                payback_period_years=0.05,
                is_feasible=True,
            ),
            CandidateEvaluation(
                tank_capacity_liters=10000.0,
                demand_coverage_pct=85.0,
                total_served_demand_liters=85000.0,
                total_overflow_liters=10000.0,
                total_unmet_demand_liters=15000.0,
                collection_efficiency_pct=65.0,
                max_storage_liters=10000.0,
                mean_storage_liters=5000.0,
                installation_cost=200.0,
                annual_savings=2550.0,
                annual_maintenance_cost=6.0,
                annual_net_cash_flow=2544.0,
                npv=18000.0,
                payback_period_years=0.08,
                is_feasible=True,
            ),
        ]
        
        recommended, rationale = optimizer._generate_recommendation(
            objective=OptimizationObjective.MAXIMIZE_COVERAGE,
            feasible=candidates,
            pareto_efficient=candidates,
            lowest_cost=candidates[0],
            highest_coverage=candidates[2],
            budget_constraint=None,
            min_coverage_constraint=None,
        )
        
        assert recommended is not None
        assert recommended.demand_coverage_pct == 85.0  # Highest coverage
        assert "maximizes demand coverage" in rationale.lower()

    def test_minimize_cost_selects_lowest_cost(self):
        """Minimize cost objective should select lowest cost feasible candidate meeting coverage."""
        optimizer = StorageOptimizer()
        
        candidates = [
            CandidateEvaluation(
                tank_capacity_liters=2000.0,
                demand_coverage_pct=40.0,
                total_served_demand_liters=40000.0,
                total_overflow_liters=2000.0,
                total_unmet_demand_liters=60000.0,
                collection_efficiency_pct=60.0,
                max_storage_liters=2000.0,
                mean_storage_liters=1000.0,
                installation_cost=40.0,
                annual_savings=1200.0,
                annual_maintenance_cost=1.2,
                annual_net_cash_flow=1198.8,
                npv=8000.0,
                payback_period_years=0.03,
                is_feasible=True,
            ),
            CandidateEvaluation(
                tank_capacity_liters=5000.0,
                demand_coverage_pct=70.0,
                total_served_demand_liters=70000.0,
                total_overflow_liters=5000.0,
                total_unmet_demand_liters=30000.0,
                collection_efficiency_pct=65.0,
                max_storage_liters=5000.0,
                mean_storage_liters=2500.0,
                installation_cost=100.0,
                annual_savings=2100.0,
                annual_maintenance_cost=3.0,
                annual_net_cash_flow=2097.0,
                npv=15000.0,
                payback_period_years=0.05,
                is_feasible=True,
            ),
        ]
        
        recommended, rationale = optimizer._generate_recommendation(
            objective=OptimizationObjective.MINIMIZE_COST,
            feasible=candidates,
            pareto_efficient=candidates,
            lowest_cost=candidates[0],
            highest_coverage=candidates[1],
            budget_constraint=None,
            min_coverage_constraint=None,
        )
        
        assert recommended is not None
        assert recommended.installation_cost == 40.0  # Lowest cost
        assert "minimizes cost" in rationale.lower()

    def test_no_feasible_candidates_returns_none(self):
        """When no candidates are feasible, recommendation should be None."""
        optimizer = StorageOptimizer()
        
        recommended, rationale = optimizer._generate_recommendation(
            objective=OptimizationObjective.MAXIMIZE_COVERAGE,
            feasible=[],
            pareto_efficient=[],
            lowest_cost=None,
            highest_coverage=None,
            budget_constraint=100.0,
            min_coverage_constraint=90.0,
        )
        
        assert recommended is None
        assert "no feasible" in rationale.lower()

    def test_pareto_exploration_selects_best_npv(self):
        """Pareto exploration should select candidate with highest NPV among Pareto-efficient."""
        optimizer = StorageOptimizer()
        
        candidates = [
            CandidateEvaluation(
                tank_capacity_liters=2000.0,
                demand_coverage_pct=40.0,
                total_served_demand_liters=40000.0,
                total_overflow_liters=2000.0,
                total_unmet_demand_liters=60000.0,
                collection_efficiency_pct=60.0,
                max_storage_liters=2000.0,
                mean_storage_liters=1000.0,
                installation_cost=40.0,
                annual_savings=1200.0,
                annual_maintenance_cost=1.2,
                annual_net_cash_flow=1198.8,
                npv=8000.0,
                payback_period_years=0.03,
                is_feasible=True,
            ),
            CandidateEvaluation(
                tank_capacity_liters=5000.0,
                demand_coverage_pct=70.0,
                total_served_demand_liters=70000.0,
                total_overflow_liters=5000.0,
                total_unmet_demand_liters=30000.0,
                collection_efficiency_pct=65.0,
                max_storage_liters=5000.0,
                mean_storage_liters=2500.0,
                installation_cost=100.0,
                annual_savings=2100.0,
                annual_maintenance_cost=3.0,
                annual_net_cash_flow=2097.0,
                npv=15000.0,
                payback_period_years=0.05,
                is_feasible=True,
            ),
        ]
        
        recommended, rationale = optimizer._generate_recommendation(
            objective=OptimizationObjective.PARETO_EXPLORATION,
            feasible=candidates,
            pareto_efficient=candidates,
            lowest_cost=candidates[0],
            highest_coverage=candidates[1],
            budget_constraint=None,
            min_coverage_constraint=None,
        )
        
        assert recommended is not None
        assert recommended.npv == 15000.0  # Higher NPV
        assert "npv" in rationale.lower()


class TestExtremalCandidates:
    """Tests for finding extremal candidates."""

    def test_find_lowest_cost(self):
        """Verify lowest cost candidate is correctly identified."""
        optimizer = StorageOptimizer()
        
        candidates = [
            CandidateEvaluation(
                tank_capacity_liters=2000.0,
                demand_coverage_pct=40.0,
                total_served_demand_liters=40000.0,
                total_overflow_liters=2000.0,
                total_unmet_demand_liters=60000.0,
                collection_efficiency_pct=60.0,
                max_storage_liters=2000.0,
                mean_storage_liters=1000.0,
                installation_cost=40.0,
                annual_savings=1200.0,
                annual_maintenance_cost=1.2,
                annual_net_cash_flow=1198.8,
                npv=8000.0,
                payback_period_years=0.03,
                is_feasible=True,
            ),
            CandidateEvaluation(
                tank_capacity_liters=5000.0,
                demand_coverage_pct=70.0,
                total_served_demand_liters=70000.0,
                total_overflow_liters=5000.0,
                total_unmet_demand_liters=30000.0,
                collection_efficiency_pct=65.0,
                max_storage_liters=5000.0,
                mean_storage_liters=2500.0,
                installation_cost=100.0,
                annual_savings=2100.0,
                annual_maintenance_cost=3.0,
                annual_net_cash_flow=2097.0,
                npv=15000.0,
                payback_period_years=0.05,
                is_feasible=True,
            ),
        ]
        
        lowest = optimizer._find_lowest_cost(candidates)
        assert lowest is not None
        assert lowest.installation_cost == 40.0

    def test_find_highest_coverage(self):
        """Verify highest coverage candidate is correctly identified."""
        optimizer = StorageOptimizer()
        
        candidates = [
            CandidateEvaluation(
                tank_capacity_liters=2000.0,
                demand_coverage_pct=40.0,
                total_served_demand_liters=40000.0,
                total_overflow_liters=2000.0,
                total_unmet_demand_liters=60000.0,
                collection_efficiency_pct=60.0,
                max_storage_liters=2000.0,
                mean_storage_liters=1000.0,
                installation_cost=40.0,
                annual_savings=1200.0,
                annual_maintenance_cost=1.2,
                annual_net_cash_flow=1198.8,
                npv=8000.0,
                payback_period_years=0.03,
                is_feasible=True,
            ),
            CandidateEvaluation(
                tank_capacity_liters=5000.0,
                demand_coverage_pct=70.0,
                total_served_demand_liters=70000.0,
                total_overflow_liters=5000.0,
                total_unmet_demand_liters=30000.0,
                collection_efficiency_pct=65.0,
                max_storage_liters=5000.0,
                mean_storage_liters=2500.0,
                installation_cost=100.0,
                annual_savings=2100.0,
                annual_maintenance_cost=3.0,
                annual_net_cash_flow=2097.0,
                npv=15000.0,
                payback_period_years=0.05,
                is_feasible=True,
            ),
        ]
        
        highest = optimizer._find_highest_coverage(candidates)
        assert highest is not None
        assert highest.demand_coverage_pct == 70.0

    def test_empty_list_returns_none(self):
        """Empty candidate list should return None for extremal candidates."""
        optimizer = StorageOptimizer()
        
        assert optimizer._find_lowest_cost([]) is None
        assert optimizer._find_highest_coverage([]) is None
