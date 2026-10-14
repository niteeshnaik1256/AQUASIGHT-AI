"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Home,
  Droplets,
  CloudRain,
  MapPin,
  Calendar,
  AlertCircle,
  ArrowLeft,
  Trash2,
  BarChart2,
} from "lucide-react";
import { Assessment } from "@/types/assessment";
import { assessmentApi } from "@/lib/api/assessment-api";
import SimulationPanel from "@/components/simulation/SimulationPanel";

function AssessmentDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let ignore = false;
    assessmentApi.getAssessmentById(id).then(({ data }) => {
      if (!ignore) {
        setAssessment(data);
        setLoading(false);
      }
    });
    return () => {
      ignore = true;
    };
  }, [id]);

  const handleDelete = async () => {
    if (!assessment) return;
    if (confirm(`Delete assessment for ${assessment.property.name}?`)) {
      await assessmentApi.deleteAssessment(assessment.id);
      router.push("/assessments");
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-400">
        Loading assessment record #{id}...
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
        <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-900">Assessment Record Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          The requested assessment identifier <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">{id}</code> does not exist or has been removed from the local store.
        </p>
        <Link
          href="/assessments"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Return to Assessments Library</span>
        </Link>
      </div>
    );
  }

  // Deterministic theoretical calculations for preliminary estimation (honest SI math)
  const rainfallDepthMm = assessment.rainfallInput.annualRainfall || 0;
  const areaSqm = assessment.roof.areaUnit === "sqm" ? assessment.roof.area : assessment.roof.area * 0.092903;
  const theoreticalGrossLitres = areaSqm * rainfallDepthMm;
  const theoreticalGrossKL = Math.round((theoreticalGrossLitres / 1000) * 10) / 10;

  // Approximate material runoff coefficient
  const runoffCoeffs: Record<string, number> = {
    metal_sheet: 0.9,
    concrete_tile: 0.8,
    clay_tile: 0.85,
    asphalt_shingle: 0.75,
    green_roof: 0.5,
    other: 0.8,
  };
  const cr = runoffCoeffs[assessment.roof.material] || 0.8;
  const theoreticalRunoffKL = Math.round(((theoreticalGrossLitres * cr) / 1000) * 10) / 10;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/dashboard" className="hover:text-teal-600">
            Workspace
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/assessments" className="hover:text-teal-600">
            Assessments
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-slate-800 font-semibold truncate max-w-[200px]">
            {assessment.property.name}
          </span>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-medium"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete Record</span>
        </button>
      </div>

      {/* Property Title Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-bold">
                {assessment.property.propertyType}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-medium bg-amber-50 text-amber-700 border border-amber-200">
                {assessment.status.replace("_", " ")}
              </span>
              {assessment.isDemonstration && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  Phase 1 Demo Record
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {assessment.property.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {assessment.property.location.city}, {assessment.property.location.state},{" "}
                {assessment.property.location.country}
              </span>
              {assessment.property.location.address && (
                <span>• {assessment.property.location.address}</span>
              )}
              <span className="flex items-center gap-1 font-mono text-slate-400">
                <Calendar className="h-3.5 w-3.5" />
                Created {new Date(assessment.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              Record ID
            </div>
            <div className="font-mono text-xs font-semibold text-slate-700">{assessment.id}</div>
          </div>
        </div>
      </div>

      {/* Property Parameter Details (3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Roof Characteristics */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-3 pb-2 border-b border-slate-100">
            <Home className="h-4 w-4 text-teal-600" />
            <span>Roof & Catchment</span>
          </div>
          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">Surface Area:</span>
              <span className="font-mono font-semibold text-slate-900">
                {assessment.roof.area} {assessment.roof.areaUnit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Material:</span>
              <span className="capitalize font-medium text-slate-800">
                {assessment.roof.material.replace("_", " ")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Runoff Factor (Cr):</span>
              <span className="font-mono font-semibold text-teal-700">~{cr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Slope:</span>
              <span className="capitalize text-slate-800">
                {assessment.roof.slopeCategory?.replace("_", " ") || "Unspecified"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Downspouts:</span>
              <span className="font-mono text-slate-800">
                {assessment.roof.sectionsCount || 1}
              </span>
            </div>
          </div>
        </div>

        {/* Water Requirements */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-3 pb-2 border-b border-slate-100">
            <Droplets className="h-4 w-4 text-teal-600" />
            <span>Water Demand</span>
          </div>
          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">Daily Demand:</span>
              <span className="font-mono font-semibold text-slate-900">
                {assessment.waterDemand.dailyDemand
                  ? `${assessment.waterDemand.dailyDemand} L/day`
                  : "Unspecified"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Occupants:</span>
              <span className="font-mono text-slate-800">
                {assessment.waterDemand.occupants || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Existing Tank:</span>
              <span className="font-mono text-slate-800">
                {assessment.waterDemand.existingStorageCapacity || 0} L
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Intended Uses:</span>
              <div className="flex flex-wrap gap-1">
                {assessment.waterDemand.intendedUses.map((use) => (
                  <span
                    key={use}
                    className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium"
                  >
                    {use.replace("_", " ")}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Rainfall Parameters */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-3 pb-2 border-b border-slate-100">
            <CloudRain className="h-4 w-4 text-teal-600" />
            <span>Rainfall Information</span>
          </div>
          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">Annual Rainfall:</span>
              <span className="font-mono font-semibold text-slate-900">
                {assessment.rainfallInput.annualRainfall} {assessment.rainfallInput.rainfallUnit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Data Source:</span>
              <span className="capitalize text-slate-800">
                {assessment.rainfallInput.sourceType.replace("_", " ")}
              </span>
            </div>
            {assessment.rainfallInput.sourceReference && (
              <div>
                <span className="text-slate-400 block mb-0.5">Reference:</span>
                <span className="text-[11px] text-slate-700 italic">
                  {assessment.rainfallInput.sourceReference}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preliminary Analytical Estimates & Hydrological Engine Integration */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-teal-600" />
              <span>Theoretical Catchment Bounds (Physics-First Math)</span>
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              Deterministic Formulation
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Calculated directly using standard SI hydrological equations without approximations or simulation assumptions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-medium text-slate-500">Gross Rainfall Volume</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {theoreticalGrossKL} <span className="text-xs font-normal text-slate-500">kL / yr</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 font-mono">
              V_gross = Area ({Math.round(areaSqm)} m²) × Depth ({rainfallDepthMm} mm)
            </div>
          </div>

          <div className="p-4 rounded-lg bg-teal-50/60 border border-teal-200">
            <div className="text-[11px] font-medium text-teal-800">Estimated Runoff Volume (Pre-filtration)</div>
            <div className="text-2xl font-bold font-mono text-teal-900 mt-1">
              {theoreticalRunoffKL} <span className="text-xs font-normal text-teal-700">kL / yr</span>
            </div>
            <div className="text-[11px] text-teal-700 mt-2 font-mono">
              V_runoff = V_gross × Cr ({cr} for {assessment.roof.material})
            </div>
          </div>
        </div>

        {/* Phase 2 — Continuous Hydrological Simulation Engine */}
        <SimulationPanel assessment={assessment} />
      </div>
    </div>
  );
}

export default function AssessmentDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-400">
          Loading assessment details...
        </div>
      }
    >
      <AssessmentDetailsContent />
    </Suspense>
  );
}
