/**
 * AQUASIGHT AI - Optimization API Client
 * Interfaces with the FastAPI backend for storage capacity optimization.
 */

export interface FinancialParameters {
  installation_cost_per_liter: number;
  annual_maintenance_cost_percent: number;
  water_tariff_per_kL: number;
  discount_rate: number;
  evaluation_period_years: number;
}

export interface CandidateEvaluation {
  tank_capacity_liters: number;
  demand_coverage_pct: number;
  total_served_demand_liters: number;
  total_overflow_liters: number;
  total_unmet_demand_liters: number;
  collection_efficiency_pct: number;
  max_storage_liters: number;
  mean_storage_liters: number;
  installation_cost: number;
  annual_savings: number;
  annual_maintenance_cost: number;
  annual_net_cash_flow: number;
  npv: number;
  payback_period_years?: number;
  is_feasible: boolean;
  infeasibility_reason?: string;
}

export interface OptimizationResponse {
  objective: string;
  candidates: CandidateEvaluation[];
  feasible_candidates: CandidateEvaluation[];
  infeasible_candidates: CandidateEvaluation[];
  pareto_efficient_candidates: CandidateEvaluation[];
  lowest_cost_feasible?: CandidateEvaluation;
  highest_coverage_feasible?: CandidateEvaluation;
  recommended_candidate?: CandidateEvaluation;
  recommendation_rationale: string;
  financial_params: {
    installation_cost_per_liter: number;
    annual_maintenance_cost_percent: number;
    water_tariff_per_kL: number;
    discount_rate: number;
    evaluation_period_years: number;
  };
  budget_constraint?: number;
  min_coverage_constraint?: number;
  warnings: string[];
}

export interface RunOptimizationPayload {
  simulation_config: {
    assessment_id?: string;
    catchment_area_sqm: number;
    roof_material?: string;
    runoff_coefficient?: number;
    tank_capacity_liters: number;
    initial_storage_liters?: number;
    daily_demand_liters: number;
    first_flush_depth_mm?: number;
    dry_period_days?: number;
    conveyance_efficiency?: number;
    filtration_efficiency?: number;
    rainfall_source: "open_meteo" | "user_provided";
    latitude?: number;
    longitude?: number;
    start_date?: string;
    end_date?: string;
  };
  rainfall_config: {
    latitude: number;
    longitude: number;
    start_date: string;
    end_date: string;
  };
  financial_params: FinancialParameters;
  objective: "maximize_coverage" | "minimize_cost" | "pareto_exploration";
  budget_constraint?: number;
  min_coverage_constraint?: number;
  min_capacity_liters: number;
  max_capacity_liters: number;
  capacity_step_liters: number;
}

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export class OptimizationApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string = BACKEND_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  public async runOptimization(payload: RunOptimizationPayload): Promise<OptimizationResponse> {
    const url = `${this.baseUrl}/api/v1/optimization`;
    let response: Response;

    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new Error(
        `Unable to reach Python optimization backend at ${this.baseUrl}. Please verify the FastAPI service is running.`
      );
    }

    if (!response.ok) {
      let errorMsg = `Optimization request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMsg = errorData.message;
        } else if (errorData.detail) {
          errorMsg = JSON.stringify(errorData.detail);
        }
      } catch {
        // Fallback to status text
      }
      throw new Error(errorMsg);
    }

    return response.json();
  }
}

export const optimizationApi = new OptimizationApiClient();
