"""
Financial modeling module for rainwater harvesting systems.

Calculates:
- Net Present Value (NPV)
- Simple Payback Period
- Annual cash flows
- Life-cycle cost analysis

Cash Flow Convention:
- Initial investment (CapEx) is negative (outflow)
- Annual savings are positive (inflow)
- Annual maintenance costs are negative (outflow)
- NPV = Initial Investment + Σ(Annual Cash Flow / (1 + r)^t)
"""

from dataclasses import dataclass
from typing import Optional, List
from math import pow


@dataclass(frozen=True)
class FinancialParameters:
    """Configurable financial assumptions for cost-benefit analysis."""

    # Costs (in local currency, e.g., INR, USD)
    installation_cost_per_liter: float  # Cost per liter of tank capacity
    annual_maintenance_cost_percent: float  # Annual maintenance as % of installation cost

    # Revenue/Savings
    water_tariff_per_kL: float  # Municipal water tariff per kiloliter

    # Time value of money
    discount_rate: float  # Annual discount rate (e.g., 0.08 for 8%)
    evaluation_period_years: int  # Analysis horizon in years

    # Validation
    def __post_init__(self):
        if self.installation_cost_per_liter < 0:
            raise ValueError("Installation cost per liter cannot be negative")
        if not (0.0 <= self.annual_maintenance_cost_percent <= 1.0):
            raise ValueError("Annual maintenance cost percent must be in [0, 1]")
        if self.water_tariff_per_kL < 0:
            raise ValueError("Water tariff cannot be negative")
        if not (0.0 <= self.discount_rate <= 1.0):
            raise ValueError("Discount rate must be in [0, 1]")
        if self.evaluation_period_years < 1:
            raise ValueError("Evaluation period must be at least 1 year")


@dataclass(frozen=True)
class FinancialResults:
    """Computed financial metrics for a candidate configuration."""

    # Capital costs
    tank_capacity_liters: float
    installation_cost: float

    # Annual values
    annual_water_served_liters: float
    annual_water_savings: float
    annual_maintenance_cost: float
    annual_net_cash_flow: float

    # Aggregate metrics
    simple_payback_period_years: Optional[float]  # None if never recovers
    net_present_value: float
    total_savings_over_period: float
    total_maintenance_over_period: float

    # Status flags
    is_profitable: bool
    has_positive_payback: bool


def calculate_financials(
    tank_capacity_liters: float,
    annual_served_demand_liters: float,
    params: FinancialParameters,
) -> FinancialResults:
    """
    Calculate financial metrics for a rainwater harvesting system.

    Parameters:
    - tank_capacity_liters: Storage tank capacity in liters
    - annual_served_demand_liters: Annual water demand served by harvested water (L/year)
    - params: Financial assumptions

    Returns:
    - FinancialResults with all computed metrics
    """
    # 1. Calculate initial capital expenditure
    installation_cost = tank_capacity_liters * params.installation_cost_per_liter

    # 2. Calculate annual water savings
    # Convert liters to kiloliters for tariff calculation
    annual_water_served_kL = annual_served_demand_liters / 1000.0
    annual_water_savings = annual_water_served_kL * params.water_tariff_per_kL

    # 3. Calculate annual maintenance cost
    annual_maintenance_cost = installation_cost * params.annual_maintenance_cost_percent

    # 4. Calculate annual net cash flow
    # Positive = savings exceed maintenance, Negative = maintenance exceeds savings
    annual_net_cash_flow = annual_water_savings - annual_maintenance_cost

    # 5. Calculate simple payback period
    # Payback = Initial Cost / Annual Net Cash Flow (if positive)
    if annual_net_cash_flow > 0:
        simple_payback_period_years = installation_cost / annual_net_cash_flow
    else:
        simple_payback_period_years = None

    # 6. Calculate Net Present Value (NPV)
    # NPV = -Initial Investment + Σ(Annual Net Cash Flow / (1 + r)^t)
    npv = -installation_cost  # Initial outflow (negative)
    for year in range(1, params.evaluation_period_years + 1):
        discounted_cash_flow = annual_net_cash_flow / ((1 + params.discount_rate) ** year)
        npv += discounted_cash_flow

    # 7. Calculate aggregate metrics over evaluation period
    total_savings_over_period = annual_water_savings * params.evaluation_period_years
    total_maintenance_over_period = annual_maintenance_cost * params.evaluation_period_years

    # 8. Determine status flags
    is_profitable = npv > 0
    has_positive_payback = simple_payback_period_years is not None

    return FinancialResults(
        tank_capacity_liters=tank_capacity_liters,
        installation_cost=installation_cost,
        annual_water_served_liters=annual_served_demand_liters,
        annual_water_savings=annual_water_savings,
        annual_maintenance_cost=annual_maintenance_cost,
        annual_net_cash_flow=annual_net_cash_flow,
        simple_payback_period_years=simple_payback_period_years,
        net_present_value=npv,
        total_savings_over_period=total_savings_over_period,
        total_maintenance_over_period=total_maintenance_over_period,
        is_profitable=is_profitable,
        has_positive_payback=has_positive_payback,
    )


def get_default_financial_parameters() -> FinancialParameters:
    """
    Returns illustrative default financial parameters.
    NOTE: These are estimates that must be verified for the specific location and context.
    """
    return FinancialParameters(
        installation_cost_per_liter=0.015,  # ~15 INR per liter (illustrative)
        annual_maintenance_cost_percent=0.02,  # 2% of installation cost annually
        water_tariff_per_kL=25.0,  # ~25 INR per kL (illustrative)
        discount_rate=0.08,  # 8% discount rate
        evaluation_period_years=20,  # 20-year analysis horizon
    )
