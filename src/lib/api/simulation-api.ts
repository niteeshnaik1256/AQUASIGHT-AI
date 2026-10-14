/**
 * AQUASIGHT AI - Simulation API Client
 * Interfaces with the FastAPI backend for daily continuous hydrological simulations.
 */

export interface DailySimulationRecord {
  date: string;
  rainfall_depth_mm: number;
  gross_volume_liters: number;
  runoff_volume_liters: number;
  first_flush_diverted_liters: number;
  conveyance_loss_liters: number;
  filtration_loss_liters: number;
  inflow_to_tank_liters: number;
  opening_storage_liters: number;
  requested_demand_liters: number;
  served_demand_liters: number;
  unmet_demand_liters: number;
  closing_storage_liters: number;
  overflow_liters: number;
  mass_balance_residual_liters: number;
  is_new_rainfall_event: boolean;
}

export interface SimulationSummaryMetrics {
  total_days: number;
  rainfall_days_count: number;
  dry_days_count: number;
  rainfall_events_count: number;
  total_rainfall_depth_mm: number;
  total_gross_volume_liters: number;
  total_runoff_volume_liters: number;
  total_first_flush_diverted_liters: number;
  total_conveyance_losses_liters: number;
  total_filtration_losses_liters: number;
  total_inflow_to_tank_liters: number;
  total_requested_demand_liters: number;
  total_served_demand_liters: number;
  total_unmet_demand_liters: number;
  total_overflow_liters: number;
  demand_coverage_pct: number;
  overflow_ratio_pct: number;
  collection_efficiency_pct: number;
  initial_storage_liters: number;
  final_storage_liters: number;
  mean_daily_storage_liters: number;
  max_daily_storage_liters: number;
  min_daily_storage_liters: number;
  days_with_unmet_demand: number;
  days_with_overflow: number;
  cumulative_mass_balance_residual_liters: number;
}

export interface RainfallProvenance {
  provider: string;
  dataset: string;
  requested_latitude: number;
  requested_longitude: number;
  resolved_latitude?: number;
  resolved_longitude?: number;
  variable: string;
  unit: string;
  time_range: string;
  retrieval_timestamp: string;
  is_cached: boolean;
  missing_count: number;
  completeness_status: "complete" | "partial" | "unavailable";
}

export interface SimulationResponse {
  simulation_id: string;
  assessment_id?: string;
  created_at: string;
  assumptions: Record<string, unknown>;
  rainfall_provenance: RainfallProvenance;
  summary: SimulationSummaryMetrics;
  daily_records: DailySimulationRecord[];
  warnings: string[];
  mass_balance_audit: {
    status: string;
    max_single_day_residual_liters: number;
    cumulative_residual_liters: number;
    tolerance_liters: number;
  };
}

export interface RunSimulationPayload {
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
  user_rainfall_series?: Array<{ date: string; precipitation_mm: number }>;
}

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export class SimulationApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string = BACKEND_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  public async runSimulation(payload: RunSimulationPayload): Promise<SimulationResponse> {
    const url = `${this.baseUrl}/api/v1/simulations`;
    let response: Response;

    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new Error(
        `Unable to reach Python simulation backend at ${this.baseUrl}. Please verify the FastAPI service is running.`
      );
    }

    if (!response.ok) {
      let errorMsg = `Simulation request failed with status ${response.status}`;
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

  public async getSimulationById(id: string): Promise<SimulationResponse> {
    const url = `${this.baseUrl}/api/v1/simulations/${id}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Simulation ${id} not found.`);
    }
    return response.json();
  }
}

export const simulationApi = new SimulationApiClient();
