"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Droplets,
  PlusCircle,
  CloudRain,
  Database,
  ArrowUpRight,
  Info,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import { Assessment } from "@/types/assessment";
import { assessmentApi } from "@/lib/api/assessment-api";

// Illustrative monthly rainfall & harvestable potential distribution for demo visualization
const MONTHLY_ILLUSTRATIVE_DATA = [
  { month: "Jan", rainfall_mm: 5, harvestable_kl: 1.0, demand_kl: 14.4 },
  { month: "Feb", rainfall_mm: 8, harvestable_kl: 1.5, demand_kl: 13.5 },
  { month: "Mar", rainfall_mm: 18, harvestable_kl: 3.4, demand_kl: 14.4 },
  { month: "Apr", rainfall_mm: 42, harvestable_kl: 7.9, demand_kl: 14.0 },
  { month: "May", rainfall_mm: 110, harvestable_kl: 20.8, demand_kl: 14.4 },
  { month: "Jun", rainfall_mm: 85, harvestable_kl: 16.1, demand_kl: 14.0 },
  { month: "Jul", rainfall_mm: 120, harvestable_kl: 22.7, demand_kl: 14.4 },
  { month: "Aug", rainfall_mm: 145, harvestable_kl: 27.4, demand_kl: 14.4 },
  { month: "Sep", rainfall_mm: 195, harvestable_kl: 36.8, demand_kl: 14.0 },
  { month: "Oct", rainfall_mm: 165, harvestable_kl: 31.2, demand_kl: 14.4 },
  { month: "Nov", rainfall_mm: 60, harvestable_kl: 11.3, demand_kl: 14.0 },
  { month: "Dec", rainfall_mm: 17, harvestable_kl: 3.2, demand_kl: 14.4 },
];

export default function DashboardPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let ignore = false;
    assessmentApi.getAssessments().then(({ data }) => {
      if (!ignore) {
        setAssessments(data);
        if (data.length > 0) {
          setSelectedPropertyId(data[0].id);
        }
        setMounted(true);
      }
    });
    return () => {
      ignore = true;
    };
  }, []);

  const selectedAssessment = assessments.find((a) => a.id === selectedPropertyId) || assessments[0];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
                Phase 1 Product Shell
              </span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Updated Oct 2026
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Rainwater Harvesting Intelligence Overview
            </h1>
            <p className="mt-1 text-xs md:text-sm text-slate-500 max-w-3xl">
              Monitor property assessments, inspect theoretical catchment collection bounds, and review preliminary storage configurations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {assessments.length > 0 && (
              <div className="flex items-center gap-2">
                <label htmlFor="property-selector" className="text-xs font-medium text-slate-600">
                  Property:
                </label>
                <select
                  id="property-selector"
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-slate-50 text-slate-800 font-medium focus:ring-1 focus:ring-teal-500 focus:outline-none"
                >
                  {assessments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.property.name} ({a.property.location.city})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Link
              href="/assessment/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Assess New Property</span>
            </Link>
          </div>
        </div>

        {/* Phase 1 Provenance Note */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-500">
          <Info className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
          <span>
            <strong>Data Provenance Notice:</strong> Calculations and graphs shown below are based on illustrative sample distributions for the selected property to demonstrate analytical visualization. The authoritative continuous daily simulation engine will be wired in Phase 2.
          </span>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>Theoretical Gross Yield</span>
            <CloudRain className="h-4 w-4 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {selectedAssessment
                ? `${Math.round(
                    ((selectedAssessment.roof.area * (selectedAssessment.rainfallInput.annualRainfall || 900)) /
                      1000) *
                      10
                  ) / 10}`
                : "203.7"}
            </span>
            <span className="text-xs font-medium text-slate-500">kL / year</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Formula: A × P</span>
            <span className="font-mono text-amber-600 font-semibold">[Demo Bound]</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>Est. Net Harvestable</span>
            <Droplets className="h-4 w-4 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-teal-700">
              {selectedAssessment
                ? `${Math.round(
                    ((selectedAssessment.roof.area *
                      (selectedAssessment.rainfallInput.annualRainfall || 900) *
                      0.85) /
                      1000) *
                      10
                  ) / 10}`
                : "173.1"}
            </span>
            <span className="text-xs font-medium text-slate-500">kL / year</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Runoff Coeff: ~0.85</span>
            <span className="font-mono text-teal-600 font-semibold">[Prelim Est]</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>Recommended Tank</span>
            <Layers className="h-4 w-4 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">10,000</span>
            <span className="text-xs font-medium text-slate-500">Litres</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Phase 2 Pareto Search</span>
            <span className="font-mono text-purple-600 font-semibold">[Simulated Target]</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>Assessed Properties</span>
            <Database className="h-4 w-4 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{assessments.length}</span>
            <span className="text-xs font-medium text-slate-500">Records</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Local Demonstration Store</span>
            <span className="font-mono text-slate-500 font-semibold">Active</span>
          </div>
        </div>
      </div>

      {/* Analytical Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Monthly Rainfall vs Harvestable Yield */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Monthly Precipitation & Yield Distribution</h2>
              <p className="text-xs text-slate-500">Illustrative climatological normal for property catchment</p>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              Demo Curve
            </span>
          </div>

          <div className="h-64 w-full flex-1">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MONTHLY_ILLUSTRATIVE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#1e293b",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                      color: "#fff",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Bar dataKey="rainfall_mm" name="Rainfall (mm)" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="harvestable_kl" name="Harvestable (kL)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Loading chart...</div>
            )}
          </div>
        </div>

        {/* Chart 2: Cumulative Yield vs Demand Balance */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Yield vs. Non-Potable Water Demand Balance</h2>
              <p className="text-xs text-slate-500">Monthly water availability against estimated property usage</p>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              Demo Balance
            </span>
          </div>

          <div className="h-64 w-full flex-1">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MONTHLY_ILLUSTRATIVE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#1e293b",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                      color: "#fff",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Area
                    type="monotone"
                    dataKey="harvestable_kl"
                    name="Harvestable Yield (kL)"
                    stroke="#0d9488"
                    fill="#ccfbf1"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="demand_kl"
                    name="Property Demand (kL)"
                    stroke="#e11d48"
                    fill="#ffe4e6"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Loading chart...</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Assessments & Decision Engine Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Assessments List (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Assessments</h2>
              <p className="text-xs text-slate-500">Properties configured in the workspace</p>
            </div>
            <Link
              href="/assessments"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="pb-2.5">Property</th>
                  <th className="pb-2.5">Type</th>
                  <th className="pb-2.5">Roof Area</th>
                  <th className="pb-2.5">Daily Demand</th>
                  <th className="pb-2.5">Status</th>
                  <th className="pb-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assessments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-medium text-slate-900">
                      <div>{a.property.name}</div>
                      <div className="text-[11px] text-slate-400">{a.property.location.city}, {a.property.location.state}</div>
                    </td>
                    <td className="py-3 text-slate-600 capitalize">{a.property.propertyType}</td>
                    <td className="py-3 font-mono text-slate-700">{a.roof.area} {a.roof.areaUnit}</td>
                    <td className="py-3 font-mono text-slate-700">
                      {a.waterDemand.dailyDemand ? `${a.waterDemand.dailyDemand} L/day` : "Unspecified"}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        {a.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/assessments/${a.id}`}
                        className="text-teal-600 hover:text-teal-800 font-semibold text-xs inline-flex items-center gap-0.5"
                      >
                        Inspect
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommendation Engine Preview (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-teal-600" />
                <h2 className="text-sm font-bold text-slate-900">Recommendation Engine</h2>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                Phase 3 Planned
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              When connected to the Phase 2 & 3 computational engine, AQUASIGHT AI generates multi-criteria decision recommendations based on physical constraints and cost tradeoffs.
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-semibold text-slate-800 mb-1">Target Storage Configuration</div>
                <div className="text-slate-500">10,000L polyethylene cylindrical surface tank with 1.0mm first-flush diversion kit.</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-semibold text-slate-800 mb-1">Reliability Index</div>
                <div className="text-slate-500">Covers ~72% of annual non-potable demand (toilets & irrigation).</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-semibold text-slate-800 mb-1">Required Site Validation</div>
                <div className="text-slate-500">Structural verification for surface placement; overflow routing to municipal storm drain.</div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Engineering Rule Engine</span>
            <span>Deterministic Model</span>
          </div>
        </div>
      </div>
    </div>
  );
}
