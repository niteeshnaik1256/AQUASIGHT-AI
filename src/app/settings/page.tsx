"use client";

import React, { useState } from "react";
import {
  Scale,
  Database,
  Shield,
  Info,
  RefreshCw,
  Trash2,
  Check,
} from "lucide-react";
import { assessmentStorage } from "@/lib/storage/assessment-storage";

export default function SettingsPage() {
  const [unitSystem, setUnitSystem] = useState<"metric" | "imperial">("metric");
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleResetData = () => {
    assessmentStorage.resetToDefault();
    setResetMessage("Demonstration records successfully reset to default seed.");
    setTimeout(() => setResetMessage(null), 3000);
  };

  const handleClearData = () => {
    if (confirm("Are you sure you want to clear all stored demonstration assessments?")) {
      if (typeof window !== "undefined") {
        window.localStorage.clear();
      }
      setResetMessage("Local demonstration storage cleared.");
      setTimeout(() => setResetMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          System Preferences & Configuration
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Manage workspace unit systems, demonstration storage state, and system metadata.
        </p>
      </div>

      {resetMessage && (
        <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-800 flex items-center gap-2">
          <Check className="h-4 w-4 text-teal-600" />
          <span>{resetMessage}</span>
        </div>
      )}

      {/* Units Configuration */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Scale className="h-4 w-4 text-teal-600" />
          <h2 className="text-sm font-bold text-slate-900">Unit Systems & Measurements</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setUnitSystem("metric")}
            className={`p-4 rounded-lg border text-left transition-colors ${
              unitSystem === "metric"
                ? "bg-teal-50 border-teal-300 text-teal-900 font-semibold"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <div className="text-xs font-bold mb-1">Metric (SI Standard)</div>
            <div className="text-[11px] text-slate-500 font-mono">
              Catchment: m² • Rainfall: mm • Storage: Litres / kL
            </div>
          </button>

          <button
            type="button"
            onClick={() => setUnitSystem("imperial")}
            className={`p-4 rounded-lg border text-left transition-colors ${
              unitSystem === "imperial"
                ? "bg-teal-50 border-teal-300 text-teal-900 font-semibold"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <div className="text-xs font-bold mb-1">Imperial Units</div>
            <div className="text-[11px] text-slate-500 font-mono">
              Catchment: sq ft • Rainfall: inches • Storage: Gallons
            </div>
          </button>
        </div>
      </div>

      {/* Demonstration Data Management */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Database className="h-4 w-4 text-teal-600" />
          <h2 className="text-sm font-bold text-slate-900">Demonstration Store Controls</h2>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          In Phase 1, assessments are persisted locally in your browser to demonstrate interactive workflow capabilities. You can reset to the initial demonstration seed or purge all local records.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={handleResetData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            <span>Reset to Default Demo Seed</span>
          </button>

          <button
            type="button"
            onClick={handleClearData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-600" />
            <span>Purge Local Storage</span>
          </button>
        </div>
      </div>

      {/* Application & Environment Metadata */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Info className="h-4 w-4 text-teal-600" />
          <h2 className="text-sm font-bold text-slate-900">Application Architecture Metadata</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono">
          <div>
            <span className="text-[10px] uppercase font-sans text-slate-400 block">Version</span>
            <span className="font-semibold text-slate-800">0.1.0-alpha</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-sans text-slate-400 block">Phase</span>
            <span className="font-semibold text-teal-700">Phase 1 Foundation</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-sans text-slate-400 block">Framework</span>
            <span className="font-semibold text-slate-800">Next.js 16 (Turbopack)</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-sans text-slate-400 block">Backend Status</span>
            <span className="font-semibold text-slate-600">Local Store Boundary</span>
          </div>
        </div>
      </div>

      {/* Data Governance & Disclaimers */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Shield className="h-4 w-4 text-teal-600" />
          <h2 className="text-sm font-bold text-slate-900">Engineering Disclaimers & Ethics</h2>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          AQUASIGHT AI is an engineering decision-support tool. Rainwater collection calculations are theoretical mass-balance estimates based on provided catchment areas and precipitation records. Always confirm structural load capacities, local stormwater regulations, and water potability treatment standards with licensed civil and environmental engineers before physical installation.
        </p>
      </div>
    </div>
  );
}
