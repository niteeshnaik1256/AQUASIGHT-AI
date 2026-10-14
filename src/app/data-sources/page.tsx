import React from "react";
import {
  ShieldCheck,
  Clock,
} from "lucide-react";
import { DataSourceRecord } from "@/types/assessment";

const DATA_SOURCES: DataSourceRecord[] = [
  {
    id: "ds-open-meteo",
    name: "Open-Meteo Historical Weather API (ERA5 Reanalysis)",
    category: "climate_reanalysis",
    provider: "European Centre for Medium-Range Weather Forecasts (ECMWF) / Open-Meteo",
    dataType: "Hourly and Daily Precipitation, Evapotranspiration, Temperature",
    geographicCoverage: "Global (0.25° grid, ~31km resolution)",
    timeRange: "1940 to present (Near real-time with 5-day lag)",
    status: "in_development",
    description: "High-resolution historical timeseries reanalysis for continuous daily water balance simulations.",
  },
  {
    id: "ds-nasa-power",
    name: "NASA POWER Agroclimatology & Solar Archive",
    category: "satellite_climatology",
    provider: "NASA Langley Research Center",
    dataType: "Precipitation, Solar Irradiance, Relative Humidity",
    geographicCoverage: "Global (0.5° × 0.5° grid)",
    timeRange: "1981 to present",
    status: "planned",
    description: "Cross-validation climatological baseline for long-term monthly precipitation normals and seasonal variability.",
  },
  {
    id: "ds-soil-groundwater",
    name: "Regional Hydrogeological & Soil Infiltration Grids",
    category: "groundwater_soils",
    provider: "Central Ground Water Board (CGWB) & SoilGrids (ISRIC)",
    dataType: "Hydraulic Conductivity, Infiltration Rates, Water Table Depth",
    geographicCoverage: "Regional (India / Global coverage)",
    timeRange: "Static geological & decadal monitoring",
    status: "planned",
    description: "Spatial screening context to prevent inappropriate groundwater recharge recommendations without geotechnical percolation tests.",
  },
  {
    id: "ds-municipal-tariffs",
    name: "Municipal Water Supply Tariffs & Escalation Index",
    category: "municipal_tariffs",
    provider: "AQUASIGHT Regional Benchmark Registry",
    dataType: "Tiered volumetric water tariffs ($ or ₹ per kL)",
    geographicCoverage: "Select urban metropolitan zones",
    timeRange: "2024 - 2026",
    status: "planned",
    description: "Economic lifecycle valuation to separate physical water yield from financially useful avoided water-purchase costs.",
  },
];

export default function DataSourcesPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          Data Sources & Provenance Registry
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Catalog of climatological, geospatial, and economic data services powering AQUASIGHT AI assessments.
        </p>
      </div>

      {/* Honest Provenance Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-900">
              Data Ingestion Roadmap & Scientific Transparency
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              In Phase 1, data sources are registered in architectural contract mode. No simulated or artificial weather data is presented as verified ground-truth. The Python backend ingestion pipeline (utilizing Open-Meteo ERA5 API) will be connected during Phase 2.
            </p>
          </div>
        </div>
      </div>

      {/* Data Sources Grid */}
      <div className="space-y-4">
        {DATA_SOURCES.map((source) => (
          <div
            key={source.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-bold">
                  {source.category.replace("_", " ")}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1.5">{source.name}</h3>
              </div>

              <div>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono font-semibold uppercase ${
                    source.status === "in_development"
                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  <Clock className="h-3 w-3" />
                  {source.status.replace("_", " ")}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4">{source.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Provider</span>
                <span className="font-medium text-slate-800">{source.provider}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Coverage</span>
                <span className="font-medium text-slate-800">{source.geographicCoverage}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Time Span</span>
                <span className="font-medium text-slate-800">{source.timeRange}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
