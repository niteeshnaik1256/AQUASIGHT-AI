"use client";

import React, { useState, useCallback } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Play,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Droplets,
  TrendingUp,
  CloudRain,
  Gauge,
  ShieldCheck,
  Info,
} from "lucide-react";
import {
  simulationApi,
  type SimulationResponse,
  type RunSimulationPayload,
} from "@/lib/api/simulation-api";
import type { Assessment } from "@/types/assessment";

/* ─── Helpers ─── */

/** Format litres to human-readable kL / L string */
function formatVolume(liters: number): string {
  if (liters >= 1000) return `${(liters / 1000).toFixed(1)} kL`;
  return `${Math.round(liters)} L`;
}

/** Derive daily demand from assessment or fallback */
function deriveDailyDemand(assessment: Assessment): number {
  if (assessment.waterDemand.dailyDemand && assessment.waterDemand.dailyDemand > 0) {
    return assessment.waterDemand.dailyDemand;
  }
  // Fallback: 135 L/person/day (IS 1172 non-potable estimate) or 200 L baseline
  const occupants = assessment.waterDemand.occupants || 4;
  return occupants * 50; // 50 L/person/day non-potable baseline
}

/** Derive catchment area in sqm */
function deriveAreaSqm(assessment: Assessment): number {
  return assessment.roof.areaUnit === "sqm"
    ? assessment.roof.area
    : assessment.roof.area * 0.092903;
}

/* ─── Subsample daily records for charting (avoid rendering 365+ bars) ─── */
function subsampleForChart(
  records: SimulationResponse["daily_records"],
  maxPoints: number = 90
) {
  if (records.length <= maxPoints) return records;
  const step = Math.ceil(records.length / maxPoints);
  return records.filter((_, i) => i % step === 0);
}

/* ─── Types ─── */

interface SimulationPanelProps {
  assessment: Assessment;
}

/* ─── Component ─── */

export default function SimulationPanel({ assessment }: SimulationPanelProps) {
  // Derived defaults
  const areaSqm = deriveAreaSqm(assessment);
  const defaultDailyDemand = deriveDailyDemand(assessment);
  const defaultTankCapacity = assessment.waterDemand.existingStorageCapacity || 5000;

  // Form state
  const [tankCapacity, setTankCapacity] = useState(defaultTankCapacity);
  const [initialStorage, setInitialStorage] = useState(0);
  const [dailyDemand, setDailyDemand] = useState(defaultDailyDemand);
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2024-12-31");
  const [rainfallSource, setRainfallSource] = useState<"open_meteo" | "user_provided">("open_meteo");

  // Simulation state
  const [result, setResult] = useState<SimulationResponse | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunSimulation = useCallback(async () => {
    setIsSimulating(true);
    setError(null);
    setResult(null);

    try {
      const payload: RunSimulationPayload = {
        assessment_id: assessment.id,
        catchment_area_sqm: areaSqm,
        roof_material: assessment.roof.material,
        tank_capacity_liters: tankCapacity,
        initial_storage_liters: initialStorage,
        daily_demand_liters: dailyDemand,
        first_flush_depth_mm: 1.0,
        dry_period_days: 3,
        conveyance_efficiency: 0.95,
        filtration_efficiency: 0.90,
        rainfall_source: rainfallSource,
      };

      if (rainfallSource === "open_meteo") {
        payload.latitude = assessment.property.location.latitude || 12.97;
        payload.longitude = assessment.property.location.longitude || 77.59;
        payload.start_date = startDate;
        payload.end_date = endDate;
      }

      const simResult = await simulationApi.runSimulation(payload);
      setResult(simResult);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
    } finally {
      setIsSimulating(false);
    }
  }, [assessment, areaSqm, tankCapacity, initialStorage, dailyDemand, startDate, endDate, rainfallSource]);

  return (
    <div className="space-y-6">
      {/* ─── Simulation Configuration Form ─── */}
      <div className="p-5 rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50/50 to-white">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
            <Gauge className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-900">
              Daily Water Balance Simulation Engine
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Physics-first continuous simulation via Python FastAPI backend • Mass-balance conservation enforced
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Tank Capacity */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Tank Capacity (Litres)
            </label>
            <input
              type="number"
              min={100}
              step={100}
              value={tankCapacity}
              onChange={(e) => setTankCapacity(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Initial Storage */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Initial Storage (Litres)
            </label>
            <input
              type="number"
              min={0}
              max={tankCapacity}
              step={50}
              value={initialStorage}
              onChange={(e) => setInitialStorage(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Daily Demand */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Daily Demand (L/day)
            </label>
            <input
              type="number"
              min={0}
              step={10}
              value={dailyDemand}
              onChange={(e) => setDailyDemand(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Rainfall Source */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Rainfall Source
            </label>
            <select
              value={rainfallSource}
              onChange={(e) => setRainfallSource(e.target.value as "open_meteo" | "user_provided")}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="open_meteo">Open-Meteo ERA5 Reanalysis</option>
            </select>
          </div>

          {/* Start Date */}
          {rainfallSource === "open_meteo" && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          )}

          {/* End Date */}
          {rainfallSource === "open_meteo" && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          )}
        </div>

        {/* Engineering Assumptions Disclosure */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200 mb-4">
          <Info className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
          <p className="text-[10px] text-slate-500 leading-relaxed">
            <span className="font-semibold text-slate-600">Fixed assumptions:</span>{" "}
            Catchment area: {Math.round(areaSqm)} m² •
            Material: {assessment.roof.material.replace("_", " ")} •
            First-flush: 1.0 mm/event •
            Conveyance efficiency: 95% •
            Filtration efficiency: 90% •
            Dry-period reset: 3 days
          </p>
        </div>

        {/* Run Button */}
        <button
          type="button"
          onClick={handleRunSimulation}
          disabled={isSimulating || tankCapacity <= 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold shadow-sm transition-colors"
        >
          {isSimulating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Running Simulation...</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              <span>Run Water-Balance Simulation</span>
            </>
          )}
        </button>
      </div>

      {/* ─── Error State ─── */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-rose-800">Simulation Error</h4>
            <p className="text-xs text-rose-700 mt-1">{error}</p>
            <p className="text-[10px] text-rose-500 mt-2">
              Ensure the Python backend is running: <code className="font-mono bg-rose-100 px-1 rounded">python -m uvicorn app.main:app --reload --app-dir backend --port 8000</code>
            </p>
          </div>
        </div>
      )}

      {/* ─── Simulation Results ─── */}
      {result && (
        <div className="space-y-5">
          {/* Mass Balance Audit Badge */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span className="text-[11px] font-bold text-emerald-800">
                Mass Balance: {result.mass_balance_audit.status === "verified_conserved" ? "Verified Conserved" : result.mass_balance_audit.status}
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-600">
              Max residual: {result.mass_balance_audit.max_single_day_residual_liters.toExponential(2)} L •
              Tolerance: {result.mass_balance_audit.tolerance_liters} L
            </span>
          </div>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="space-y-2">
              {result.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800">{w}</p>
                </div>
              ))}
            </div>
          )}

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              icon={<Droplets className="h-4 w-4" />}
              label="Demand Coverage"
              value={`${result.summary.demand_coverage_pct}%`}
              sublabel={`${formatVolume(result.summary.total_served_demand_liters)} served of ${formatVolume(result.summary.total_requested_demand_liters)}`}
              colorClass={result.summary.demand_coverage_pct >= 70 ? "text-emerald-700 bg-emerald-50 border-emerald-200" : result.summary.demand_coverage_pct >= 40 ? "text-amber-700 bg-amber-50 border-amber-200" : "text-rose-700 bg-rose-50 border-rose-200"}
            />
            <KPICard
              icon={<CloudRain className="h-4 w-4" />}
              label="Collection Efficiency"
              value={`${result.summary.collection_efficiency_pct}%`}
              sublabel={`${formatVolume(result.summary.total_inflow_to_tank_liters)} net inflow`}
              colorClass="text-teal-700 bg-teal-50 border-teal-200"
            />
            <KPICard
              icon={<TrendingUp className="h-4 w-4" />}
              label="Overflow Ratio"
              value={`${result.summary.overflow_ratio_pct}%`}
              sublabel={`${formatVolume(result.summary.total_overflow_liters)} spilled`}
              colorClass={result.summary.overflow_ratio_pct <= 20 ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-amber-700 bg-amber-50 border-amber-200"}
            />
            <KPICard
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Simulation Period"
              value={`${result.summary.total_days} days`}
              sublabel={`${result.summary.rainfall_days_count} rain days, ${result.summary.rainfall_events_count} events`}
              colorClass="text-slate-700 bg-slate-50 border-slate-200"
            />
          </div>

          {/* Volume Summary Grid */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Droplets className="h-3.5 w-3.5 text-teal-600" />
              Volume Accounting Summary
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <VolumeItem label="Total Rainfall" value={`${result.summary.total_rainfall_depth_mm.toFixed(1)} mm`} />
              <VolumeItem label="Gross Volume" value={formatVolume(result.summary.total_gross_volume_liters)} />
              <VolumeItem label="Runoff Volume" value={formatVolume(result.summary.total_runoff_volume_liters)} />
              <VolumeItem label="First-Flush Diverted" value={formatVolume(result.summary.total_first_flush_diverted_liters)} />
              <VolumeItem label="Conveyance Losses" value={formatVolume(result.summary.total_conveyance_losses_liters)} />
              <VolumeItem label="Filtration Losses" value={formatVolume(result.summary.total_filtration_losses_liters)} />
              <VolumeItem label="Net Tank Inflow" value={formatVolume(result.summary.total_inflow_to_tank_liters)} highlight />
              <VolumeItem label="Total Overflow" value={formatVolume(result.summary.total_overflow_liters)} />
              <VolumeItem label="Total Served" value={formatVolume(result.summary.total_served_demand_liters)} highlight />
              <VolumeItem label="Total Unmet" value={formatVolume(result.summary.total_unmet_demand_liters)} />
              <VolumeItem label="Days w/ Unmet Demand" value={`${result.summary.days_with_unmet_demand}`} />
              <VolumeItem label="Days w/ Overflow" value={`${result.summary.days_with_overflow}`} />
            </div>
          </div>

          {/* Storage Time-Series Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h4 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-2">
              <Gauge className="h-3.5 w-3.5 text-teal-600" />
              Tank Storage Over Time
            </h4>
            <p className="text-[10px] text-slate-400 mb-4">
              Daily closing storage level (L) • Tank capacity: {formatVolume(tankCapacity)}
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={subsampleForChart(result.daily_records)} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="storageGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: "#94a3b8" }}
                  tickFormatter={(v: string) => v.slice(5)}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "#94a3b8" }}
                  tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
                  domain={[0, tankCapacity]}
                />
                <Tooltip
                  contentStyle={{ fontSize: 10, borderRadius: 8, border: "1px solid #e2e8f0" }}
                  formatter={(value: unknown) => {
                    const num = typeof value === 'number' ? value : typeof value === 'string' ? parseFloat(value) : 0;
                    return [`${isNaN(num) ? 0 : num.toFixed(0)} L`, "Storage"];
                  }}
                  labelFormatter={(label: React.ReactNode) => `Date: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="closing_storage_liters"
                  stroke="#0d9488"
                  strokeWidth={1.5}
                  fill="url(#storageGradient)"
                  name="Storage (L)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Rainfall vs Inflow Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h4 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-2">
              <CloudRain className="h-3.5 w-3.5 text-teal-600" />
              Rainfall Depth vs Tank Inflow
            </h4>
            <p className="text-[10px] text-slate-400 mb-4">
              Daily precipitation depth (mm) and net inflow to tank (L)
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={subsampleForChart(result.daily_records)} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: "#94a3b8" }}
                  tickFormatter={(v: string) => v.slice(5)}
                  interval="preserveStartEnd"
                />
                <YAxis
                  yAxisId="rain"
                  orientation="left"
                  tick={{ fontSize: 9, fill: "#94a3b8" }}
                  label={{ value: "mm", angle: -90, position: "insideLeft", fontSize: 9, fill: "#94a3b8" }}
                />
                <YAxis
                  yAxisId="inflow"
                  orientation="right"
                  tick={{ fontSize: 9, fill: "#94a3b8" }}
                  tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
                  label={{ value: "L", angle: 90, position: "insideRight", fontSize: 9, fill: "#94a3b8" }}
                />
                <Tooltip
                  contentStyle={{ fontSize: 10, borderRadius: 8, border: "1px solid #e2e8f0" }}
                  labelFormatter={(label: React.ReactNode) => `Date: ${label}`}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar yAxisId="rain" dataKey="rainfall_depth_mm" fill="#7dd3fc" name="Rainfall (mm)" radius={[2, 2, 0, 0]} />
                <Bar yAxisId="inflow" dataKey="inflow_to_tank_liters" fill="#0d9488" name="Inflow (L)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Demand vs Served Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h4 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-2">
              <Droplets className="h-3.5 w-3.5 text-teal-600" />
              Demand Satisfaction
            </h4>
            <p className="text-[10px] text-slate-400 mb-4">
              Daily requested demand vs served demand (L)
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={subsampleForChart(result.daily_records)} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="servedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: "#94a3b8" }}
                  tickFormatter={(v: string) => v.slice(5)}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{ fontSize: 10, borderRadius: 8, border: "1px solid #e2e8f0" }}
                  labelFormatter={(label: React.ReactNode) => `Date: ${label}`}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Area
                  type="stepAfter"
                  dataKey="requested_demand_liters"
                  stroke="#94a3b8"
                  strokeWidth={1}
                  fill="none"
                  strokeDasharray="4 2"
                  name="Demand (L)"
                />
                <Area
                  type="stepAfter"
                  dataKey="served_demand_liters"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  fill="url(#servedGradient)"
                  name="Served (L)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Rainfall Provenance & Storage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Provenance */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h4 className="text-xs font-bold text-slate-800 mb-3">Rainfall Data Provenance</h4>
              <div className="space-y-2 text-xs">
                <ProvenanceRow label="Provider" value={result.rainfall_provenance.provider} />
                <ProvenanceRow label="Dataset" value={result.rainfall_provenance.dataset} />
                <ProvenanceRow label="Coordinates" value={`${result.rainfall_provenance.requested_latitude}, ${result.rainfall_provenance.requested_longitude}`} />
                {result.rainfall_provenance.resolved_latitude && (
                  <ProvenanceRow label="Resolved Grid" value={`${result.rainfall_provenance.resolved_latitude}, ${result.rainfall_provenance.resolved_longitude}`} />
                )}
                <ProvenanceRow label="Period" value={result.rainfall_provenance.time_range} />
                <ProvenanceRow label="Completeness" value={result.rainfall_provenance.completeness_status} />
                <ProvenanceRow label="Missing Days" value={`${result.rainfall_provenance.missing_count}`} />
                <ProvenanceRow label="Cached" value={result.rainfall_provenance.is_cached ? "Yes" : "No"} />
              </div>
            </div>

            {/* Storage Stats */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h4 className="text-xs font-bold text-slate-800 mb-3">Storage Statistics</h4>
              <div className="space-y-2 text-xs">
                <ProvenanceRow label="Tank Capacity" value={formatVolume(tankCapacity)} />
                <ProvenanceRow label="Initial Storage" value={formatVolume(result.summary.initial_storage_liters)} />
                <ProvenanceRow label="Final Storage" value={formatVolume(result.summary.final_storage_liters)} />
                <ProvenanceRow label="Mean Daily Storage" value={formatVolume(result.summary.mean_daily_storage_liters)} />
                <ProvenanceRow label="Max Daily Storage" value={formatVolume(result.summary.max_daily_storage_liters)} />
                <ProvenanceRow label="Min Daily Storage" value={formatVolume(result.summary.min_daily_storage_liters)} />
              </div>
            </div>
          </div>

          {/* Simulation Metadata */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-400 font-mono flex flex-wrap gap-x-4 gap-y-1">
            <span>ID: {result.simulation_id}</span>
            <span>Executed: {new Date(result.created_at).toLocaleString()}</span>
            <span>Engine: AQUASIGHT Phase 2 Deterministic</span>
            <span>Provenance: [Historical Simulation]</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Sub-components ─── */

function KPICard({
  icon,
  label,
  value,
  sublabel,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel: string;
  colorClass: string;
}) {
  return (
    <div className={`p-4 rounded-xl border ${colorClass}`}>
      <div className="flex items-center gap-1.5 mb-2 opacity-70">{icon}<span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span></div>
      <div className="text-2xl font-bold font-mono">{value}</div>
      <div className="text-[10px] mt-1 opacity-60">{sublabel}</div>
    </div>
  );
}

function VolumeItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-2.5 rounded-lg ${highlight ? "bg-teal-50 border border-teal-200" : "bg-slate-50 border border-slate-100"}`}>
      <div className="text-[10px] text-slate-400 font-medium">{label}</div>
      <div className={`text-sm font-bold font-mono mt-0.5 ${highlight ? "text-teal-800" : "text-slate-800"}`}>{value}</div>
    </div>
  );
}

function ProvenanceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}:</span>
      <span className="font-mono font-medium text-slate-700 text-right">{value}</span>
    </div>
  );
}
