"""
Unit tests for financial modeling module.
"""

import pytest
from app.finance import FinancialParameters, FinancialResults, calculate_financials, get_default_financial_parameters


def test_financial_parameters_validation():
    """Test that invalid financial parameters are rejected."""
    with pytest.raises(ValueError):
        FinancialParameters(
            installation_cost_per_liter=-1.0,
            annual_maintenance_cost_percent=0.02,
            water_tariff_per_kL=25.0,
            discount_rate=0.08,
            evaluation_period_years=20,
        )

    with pytest.raises(ValueError):
        FinancialParameters(
            installation_cost_per_liter=0.015,
            annual_maintenance_cost_percent=1.5,  # > 100%
            water_tariff_per_kL=25.0,
            discount_rate=0.08,
            evaluation_period_years=20,
        )

    with pytest.raises(ValueError):
        FinancialParameters(
            installation_cost_per_liter=0.015,
            annual_maintenance_cost_percent=0.02,
            water_tariff_per_kL=-10.0,
            discount_rate=0.08,
            evaluation_period_years=20,
        )

    with pytest.raises(ValueError):
        FinancialParameters(
            installation_cost_per_liter=0.015,
            annual_maintenance_cost_percent=0.02,
            water_tariff_per_kL=25.0,
            discount_rate=1.5,  # > 100%
            evaluation_period_years=20,
        )

    with pytest.raises(ValueError):
        FinancialParameters(
            installation_cost_per_liter=0.015,
            annual_maintenance_cost_percent=0.02,
            water_tariff_per_kL=25.0,
            discount_rate=0.08,
            evaluation_period_years=0,  # Must be >= 1
        )


def test_basic_financial_calculation():
    """Test basic financial calculation with positive cash flow."""
    params = FinancialParameters(
        installation_cost_per_liter=0.02,  # 20 currency units per liter
        annual_maintenance_cost_percent=0.03,  # 3% annually
        water_tariff_per_kL=30.0,  # 30 per kL
        discount_rate=0.08,
        evaluation_period_years=10,
    )

    tank_capacity = 10000  # 10 kL tank
    annual_served = 50000  # 50 kL served annually

    results = calculate_financials(tank_capacity, annual_served, params)

    # Installation cost
    assert results.installation_cost == 200.0  # 10000 * 0.02

    # Annual savings
    assert results.annual_water_savings == 1500.0  # 50 kL * 30

    # Annual maintenance
    assert results.annual_maintenance_cost == 6.0  # 200 * 0.03

    # Annual net cash flow
    assert results.annual_net_cash_flow == 1494.0  # 1500 - 6

    # Payback period
    assert results.simple_payback_period_years is not None
    assert abs(results.simple_payback_period_years - (200.0 / 1494.0)) < 0.01

    # NPV should be positive
    assert results.net_present_value > 0
    assert results.is_profitable
    assert results.has_positive_payback


def test_zero_tariff():
    """Test financial calculation with zero water tariff."""
    params = FinancialParameters(
        installation_cost_per_liter=0.02,
        annual_maintenance_cost_percent=0.03,
        water_tariff_per_kL=0.0,  # Free water
        discount_rate=0.08,
        evaluation_period_years=10,
    )

    tank_capacity = 10000
    annual_served = 50000

    results = calculate_financials(tank_capacity, annual_served, params)

    # No savings from water
    assert results.annual_water_savings == 0.0

    # Only maintenance costs (negative cash flow)
    assert results.annual_net_cash_flow == -6.0

    # No payback possible
    assert results.simple_payback_period_years is None
    assert not results.has_positive_payback

    # NPV should be negative (costs only)
    assert results.net_present_value < 0
    assert not results.is_profitable


def test_negative_net_savings():
    """Test when maintenance costs exceed water savings."""
    params = FinancialParameters(
        installation_cost_per_liter=0.02,
        annual_maintenance_cost_percent=0.50,  # 50% maintenance (very high)
        water_tariff_per_kL=5.0,  # Very cheap water
        discount_rate=0.08,
        evaluation_period_years=10,
    )

    tank_capacity = 10000
    annual_served = 10000  # Only 10 kL served

    results = calculate_financials(tank_capacity, annual_served, params)

    # Maintenance cost: 200 * 0.50 = 100
    # Water savings: 10 kL * 5 = 50
    # Net cash flow: 50 - 100 = -50
    assert results.annual_net_cash_flow < 0

    # No payback
    assert results.simple_payback_period_years is None

    # Not profitable
    assert results.net_present_value < 0
    assert not results.is_profitable


def test_npv_calculation():
    """Test NPV calculation against manual computation."""
    params = FinancialParameters(
        installation_cost_per_liter=0.01,
        annual_maintenance_cost_percent=0.0,  # No maintenance for simpler calculation
        water_tariff_per_kL=10.0,
        discount_rate=0.10,  # 10%
        evaluation_period_years=3,
    )

    tank_capacity = 1000  # 1000 L
    annual_served = 10000  # 10 kL annually

    results = calculate_financials(tank_capacity, annual_served, params)

    # Installation: 1000 * 0.01 = 10
    # Annual savings: 10 kL * 10 = 100
    # No maintenance
    # Annual cash flow: 100

    # Manual NPV: -10 + 100/1.1 + 100/1.1^2 + 100/1.1^3
    # = -10 + 90.91 + 82.64 + 75.13 = 238.68
    expected_npv = -10 + 100 / 1.1 + 100 / (1.1 ** 2) + 100 / (1.1 ** 3)

    assert abs(results.net_present_value - expected_npv) < 0.01


def test_default_parameters():
    """Test that default parameters are valid."""
    params = get_default_financial_parameters()
    assert params.installation_cost_per_liter > 0
    assert 0 <= params.annual_maintenance_cost_percent <= 1
    assert params.water_tariff_per_kL >= 0
    assert 0 <= params.discount_rate <= 1
    assert params.evaluation_period_years >= 1


def test_aggregate_metrics():
    """Test aggregate metrics over evaluation period."""
    params = FinancialParameters(
        installation_cost_per_liter=0.02,
        annual_maintenance_cost_percent=0.03,
        water_tariff_per_kL=30.0,
        discount_rate=0.08,
        evaluation_period_years=5,
    )

    tank_capacity = 10000
    annual_served = 50000

    results = calculate_financials(tank_capacity, annual_served, params)

    # Total savings over 5 years
    assert results.total_savings_over_period == 1500.0 * 5

    # Total maintenance over 5 years
    assert results.total_maintenance_over_period == 6.0 * 5
