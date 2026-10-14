"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Home,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Droplets,
  CloudRain,
  ArrowRight,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import {
  propertySchema,
  roofSchema,
  waterDemandSchema,
  rainfallSchema,
  fullAssessmentFormSchema,
  PropertyFormValues,
  RoofFormValues,
  WaterDemandFormValues,
  RainfallFormValues,
} from "@/lib/validation/assessment";
import { assessmentApi } from "@/lib/api/assessment-api";
import { IntendedWaterUse } from "@/types/assessment";

const STEPS = [
  { id: 1, name: "Property Info", icon: Building2 },
  { id: 2, name: "Roof Characteristics", icon: Home },
  { id: 3, name: "Water Demand", icon: Droplets },
  { id: 4, name: "Rainfall Input", icon: CloudRain },
  { id: 5, name: "Review & Submit", icon: CheckCircle2 },
];

export default function NewAssessmentPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [propertyData, setPropertyData] = useState<PropertyFormValues>({
    name: "",
    propertyType: "residential",
    country: "India",
    state: "",
    city: "",
    address: "",
    unitPreference: "metric",
  });

  const [roofData, setRoofData] = useState<RoofFormValues>({
    area: 150,
    areaUnit: "sqm",
    material: "concrete_tile",
    slopeCategory: "low_pitch",
    sectionsCount: 1,
  });

  const [waterData, setWaterData] = useState<WaterDemandFormValues>({
    intendedUses: ["toilet_flushing", "landscape_irrigation"],
    occupants: 4,
    dailyDemand: 400,
    demandUnit: "liters_per_day",
    existingStorageCapacity: 1000,
    storageUnit: "liters",
  });

  const [rainfallData, setRainfallData] = useState<RainfallFormValues>({
    sourceType: "manual_estimate",
    annualRainfall: 950,
    rainfallUnit: "mm",
    sourceReference: "Local meteorological estimate",
  });

  const [notes, setNotes] = useState("");

  // Validate step before advancing
  const validateStep = (step: number): boolean => {
    setErrors({});
    if (step === 1) {
      const res = propertySchema.safeParse(propertyData);
      if (!res.success) {
        const fieldErrors: Record<string, string> = {};
        res.error.issues.forEach((issue) => {
          if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
        });
        setErrors(fieldErrors);
        return false;
      }
    } else if (step === 2) {
      const res = roofSchema.safeParse(roofData);
      if (!res.success) {
        const fieldErrors: Record<string, string> = {};
        res.error.issues.forEach((issue) => {
          if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
        });
        setErrors(fieldErrors);
        return false;
      }
    } else if (step === 3) {
      const res = waterDemandSchema.safeParse(waterData);
      if (!res.success) {
        const fieldErrors: Record<string, string> = {};
        res.error.issues.forEach((issue) => {
          if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
        });
        setErrors(fieldErrors);
        return false;
      }
    } else if (step === 4) {
      const res = rainfallSchema.safeParse(rainfallData);
      if (!res.success) {
        const fieldErrors: Record<string, string> = {};
        res.error.issues.forEach((issue) => {
          if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
        });
        setErrors(fieldErrors);
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleToggleIntendedUse = (use: IntendedWaterUse) => {
    setWaterData((prev) => {
      const exists = prev.intendedUses.includes(use);
      const updated = exists
        ? prev.intendedUses.filter((u) => u !== use)
        : [...prev.intendedUses, use];
      return { ...prev, intendedUses: updated };
    });
  };

  const handleSubmit = async () => {
    const fullPayload = {
      property: propertyData,
      roof: roofData,
      waterDemand: waterData,
      rainfallInput: rainfallData,
      notes,
    };

    const res = fullAssessmentFormSchema.safeParse(fullPayload);
    if (!res.success) {
      alert("Please review the form. Some required values are invalid.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: created } = await assessmentApi.createAssessment({
        property: {
          name: propertyData.name,
          propertyType: propertyData.propertyType,
          location: {
            country: propertyData.country,
            state: propertyData.state,
            city: propertyData.city,
            address: propertyData.address,
          },
        },
        roof: {
          area: roofData.area,
          areaUnit: roofData.areaUnit,
          material: roofData.material,
          slopeCategory: roofData.slopeCategory,
          sectionsCount: roofData.sectionsCount,
        },
        waterDemand: {
          intendedUses: waterData.intendedUses,
          occupants: waterData.occupants,
          dailyDemand: waterData.dailyDemand,
          demandUnit: waterData.demandUnit,
          existingStorageCapacity: waterData.existingStorageCapacity,
          storageUnit: waterData.storageUnit,
        },
        rainfallInput: {
          annualRainfall: rainfallData.annualRainfall,
          rainfallUnit: rainfallData.rainfallUnit,
          sourceType: rainfallData.sourceType,
          sourceReference: rainfallData.sourceReference,
        },
        notes,
      });

      router.push(`/assessments/${created.id}`);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <Link href="/dashboard" className="hover:text-teal-600">
            Workspace
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/assessments" className="hover:text-teal-600">
            Assessments
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-slate-800 font-medium">New Assessment</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Property Assessment</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure property characteristics, catchment area, and demand parameters for rainwater assessment.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (step.id < currentStep) setCurrentStep(step.id);
                }}
                disabled={step.id > currentStep}
                className={`flex items-center gap-2.5 p-2 rounded-lg text-left transition-colors ${
                  isCurrent
                    ? "bg-teal-50 text-teal-800 border border-teal-200 font-semibold"
                    : isCompleted
                    ? "text-slate-700 hover:bg-slate-50 cursor-pointer"
                    : "text-slate-400 opacity-60 cursor-not-allowed"
                }`}
              >
                <div
                  className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 text-xs font-mono font-bold ${
                    isCurrent
                      ? "bg-teal-600 text-white"
                      : isCompleted
                      ? "bg-teal-100 text-teal-700"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Step {step.id}</div>
                  <div className="text-xs truncate font-medium flex items-center gap-1">
                    <Icon className="h-3 w-3 text-teal-600 shrink-0" />
                    <span className="truncate">{step.name}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Form Box */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        {/* STEP 1: Property Information */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900">Step 1: Property Information</h2>
              <p className="text-xs text-slate-500">Identify the physical site and regional jurisdiction.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Property Name *
                </label>
                <input
                  type="text"
                  value={propertyData.name}
                  onChange={(e) => setPropertyData({ ...propertyData, name: e.target.value })}
                  placeholder="e.g. Greenwood Eco-Villa or Horizon Tech Park"
                  className={`w-full text-xs p-2.5 rounded-lg border bg-slate-50 text-slate-900 focus:bg-white ${
                    errors.name ? "border-rose-400" : "border-slate-200"
                  }`}
                />
                {errors.name && <p className="text-[11px] text-rose-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Property Type *
                </label>
                <select
                  value={propertyData.propertyType}
                  onChange={(e) =>
                    setPropertyData({
                      ...propertyData,
                      propertyType: e.target.value as PropertyFormValues["propertyType"],
                    })
                  }
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900"
                >
                  <option value="residential">Residential Home / Villa</option>
                  <option value="apartment">Apartment Community</option>
                  <option value="educational">School / College Campus</option>
                  <option value="commercial">Commercial Building</option>
                  <option value="other">Other / Mixed-Use</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Units Preference
                </label>
                <select
                  value={propertyData.unitPreference}
                  onChange={(e) =>
                    setPropertyData({
                      ...propertyData,
                      unitPreference: e.target.value as "metric" | "imperial",
                    })
                  }
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900"
                >
                  <option value="metric">Metric (meters, mm, liters)</option>
                  <option value="imperial">Imperial (feet, inches, gallons)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Country *
                </label>
                <input
                  type="text"
                  value={propertyData.country}
                  onChange={(e) => setPropertyData({ ...propertyData, country: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900"
                />
                {errors.country && <p className="text-[11px] text-rose-600 mt-1">{errors.country}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State / Province / Region *
                </label>
                <input
                  type="text"
                  value={propertyData.state}
                  onChange={(e) => setPropertyData({ ...propertyData, state: e.target.value })}
                  placeholder="e.g. Karnataka or California"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900"
                />
                {errors.state && <p className="text-[11px] text-rose-600 mt-1">{errors.state}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={propertyData.city}
                  onChange={(e) => setPropertyData({ ...propertyData, city: e.target.value })}
                  placeholder="e.g. Bengaluru or Austin"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900"
                />
                {errors.city && <p className="text-[11px] text-rose-600 mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Street Address (Optional)
                </label>
                <input
                  type="text"
                  value={propertyData.address}
                  onChange={(e) => setPropertyData({ ...propertyData, address: e.target.value })}
                  placeholder="e.g. 142 Meadow Lane"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Roof Characteristics */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900">Step 2: Roof & Catchment Parameters</h2>
              <p className="text-xs text-slate-500">Surface area and materials dictate runoff efficiency and yield.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Roof Catchment Area *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={roofData.area || ""}
                    onChange={(e) => setRoofData({ ...roofData, area: parseFloat(e.target.value) || 0 })}
                    className="flex-1 text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-mono"
                  />
                  <select
                    value={roofData.areaUnit}
                    onChange={(e) => setRoofData({ ...roofData, areaUnit: e.target.value as "sqm" | "sqft" })}
                    className="text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800"
                  >
                    <option value="sqm">m² (sq meters)</option>
                    <option value="sqft">sq ft</option>
                  </select>
                </div>
                {errors.area && <p className="text-[11px] text-rose-600 mt-1">{errors.area}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Roof Surface Material *
                </label>
                <select
                  value={roofData.material}
                  onChange={(e) =>
                    setRoofData({
                      ...roofData,
                      material: e.target.value as RoofFormValues["material"],
                    })
                  }
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900"
                >
                  <option value="metal_sheet">Corrugated Metal / Galvanized Sheet (Cr ~0.90)</option>
                  <option value="concrete_tile">Concrete Slab / Flat Tile (Cr ~0.80)</option>
                  <option value="clay_tile">Terracotta / Glazed Clay Tile (Cr ~0.85)</option>
                  <option value="asphalt_shingle">Asphalt Shingle (Cr ~0.75)</option>
                  <option value="green_roof">Extensive Green Roof (Cr ~0.50)</option>
                  <option value="other">Other / Composite Surface</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Roof Slope Category
                </label>
                <select
                  value={roofData.slopeCategory || "low_pitch"}
                  onChange={(e) =>
                    setRoofData({
                      ...roofData,
                      slopeCategory: e.target.value as RoofFormValues["slopeCategory"],
                    })
                  }
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900"
                >
                  <option value="flat">Flat (&lt; 5°)</option>
                  <option value="low_pitch">Low Pitch (5° - 15°)</option>
                  <option value="medium_pitch">Medium Pitch (15° - 30°)</option>
                  <option value="steep">Steep (&gt; 30°)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Number of Roof Sections / Downspouts
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={roofData.sectionsCount || 1}
                  onChange={(e) => setRoofData({ ...roofData, sectionsCount: parseInt(e.target.value) || 1 })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Water Demand */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900">Step 3: Water Requirements & Usage</h2>
              <p className="text-xs text-slate-500">Define intended non-potable end uses and daily demand volume.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Intended Uses of Harvested Water * (Select all that apply)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: "toilet_flushing", label: "Toilet Flushing" },
                  { id: "landscape_irrigation", label: "Landscape / Garden" },
                  { id: "laundry", label: "Washing & Laundry" },
                  { id: "car_washing", label: "Vehicle Washing" },
                  { id: "cooling", label: "HVAC / Cooling Towers" },
                  { id: "general_cleaning", label: "General Cleaning" },
                ].map((item) => {
                  const isChecked = waterData.intendedUses.includes(item.id as IntendedWaterUse);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleToggleIntendedUse(item.id as IntendedWaterUse)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs transition-colors ${
                        isChecked
                          ? "bg-teal-50 border-teal-300 text-teal-900 font-semibold"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded border flex items-center justify-center text-[10px] ${
                          isChecked ? "bg-teal-600 border-teal-600 text-white" : "border-slate-300"
                        }`}
                      >
                        {isChecked && "✓"}
                      </div>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
              {errors.intendedUses && <p className="text-[11px] text-rose-600 mt-1">{errors.intendedUses}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Daily Demand (Litres / day)
                </label>
                <input
                  type="number"
                  min="0"
                  value={waterData.dailyDemand || ""}
                  onChange={(e) => setWaterData({ ...waterData, dailyDemand: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g. 450"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Number of Occupants (Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={waterData.occupants || ""}
                  onChange={(e) => setWaterData({ ...waterData, occupants: parseInt(e.target.value) || undefined })}
                  placeholder="e.g. 4"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Existing Storage Capacity (if any)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    value={waterData.existingStorageCapacity || ""}
                    onChange={(e) =>
                      setWaterData({ ...waterData, existingStorageCapacity: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="e.g. 1000"
                    className="flex-1 text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-mono"
                  />
                  <span className="text-xs p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 font-medium">
                    Litres
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Rainfall Information */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900">Step 4: Rainfall & Climatology Information</h2>
              <p className="text-xs text-slate-500">Provide historical local rainfall data or select external source.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Known Average Annual Rainfall (mm) *
                </label>
                <input
                  type="number"
                  min="10"
                  max="12000"
                  value={rainfallData.annualRainfall || ""}
                  onChange={(e) =>
                    setRainfallData({ ...rainfallData, annualRainfall: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="e.g. 950"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-mono"
                />
                {errors.annualRainfall && <p className="text-[11px] text-rose-600 mt-1">{errors.annualRainfall}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data Source Type
                </label>
                <select
                  value={rainfallData.sourceType}
                  onChange={(e) =>
                    setRainfallData({
                      ...rainfallData,
                      sourceType: e.target.value as RainfallFormValues["sourceType"],
                    })
                  }
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900"
                >
                  <option value="manual_estimate">Manual User Estimate</option>
                  <option value="regional_average">Regional Climatological Average</option>
                  <option value="open_meteo_historical">Open-Meteo ERA5 Reanalysis (Staged for Phase 2)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Source Reference / Station Notes (Optional)
                </label>
                <input
                  type="text"
                  value={rainfallData.sourceReference || ""}
                  onChange={(e) => setRainfallData({ ...rainfallData, sourceReference: e.target.value })}
                  placeholder="e.g. Local airport meteorological station average (2014-2024)"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-start gap-2 mt-2">
              <HelpCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                <strong>Data Provenance Integrity:</strong> Values entered here are categorized as user inputs. In Phase 2, AQUASIGHT AI will automatically query and verify satellite & weather reanalysis models (Open-Meteo / ERA5) for your coordinates.
              </span>
            </div>
          </div>
        )}

        {/* STEP 5: Review & Submit */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900">Step 5: Review Assessment Configuration</h2>
              <p className="text-xs text-slate-500">Verify inputs before creating the demonstration assessment record.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800">Property Details</span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-teal-600 hover:underline font-semibold"
                  >
                    Edit
                  </button>
                </div>
                <div className="space-y-1 text-slate-600">
                  <div>Name: <span className="font-semibold text-slate-900">{propertyData.name}</span></div>
                  <div>Type: <span className="capitalize">{propertyData.propertyType}</span></div>
                  <div>Location: {propertyData.city}, {propertyData.state}, {propertyData.country}</div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800">Catchment / Roof</span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-teal-600 hover:underline font-semibold"
                  >
                    Edit
                  </button>
                </div>
                <div className="space-y-1 text-slate-600">
                  <div>Area: <span className="font-semibold text-slate-900">{roofData.area} {roofData.areaUnit}</span></div>
                  <div>Material: <span className="capitalize">{roofData.material.replace("_", " ")}</span></div>
                  <div>Slope: <span className="capitalize">{roofData.slopeCategory?.replace("_", " ")}</span></div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800">Water Requirements</span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="text-teal-600 hover:underline font-semibold"
                  >
                    Edit
                  </button>
                </div>
                <div className="space-y-1 text-slate-600">
                  <div>Daily Demand: <span className="font-semibold text-slate-900">{waterData.dailyDemand || "Unspecified"} L/day</span></div>
                  <div>Uses: {waterData.intendedUses.map((u) => u.replace("_", " ")).join(", ")}</div>
                  <div>Existing Storage: {waterData.existingStorageCapacity || 0} L</div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800">Rainfall Input</span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="text-teal-600 hover:underline font-semibold"
                  >
                    Edit
                  </button>
                </div>
                <div className="space-y-1 text-slate-600">
                  <div>Annual Rainfall: <span className="font-semibold text-slate-900">{rainfallData.annualRainfall} mm</span></div>
                  <div>Source: <span className="capitalize">{rainfallData.sourceType.replace("_", " ")}</span></div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <label htmlFor="assessment-notes-input" className="block font-bold text-slate-800 mb-1">
                Assessment Notes &amp; Site Observations (Optional)
              </label>
              <textarea
                id="assessment-notes-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Existing gutters in good condition; planning surface tank on north-east corner..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Phase 1 Demonstration Record Notice:</strong> Submitting will create a persistent demonstration record in your local workspace. The record will be tagged as <em>pending_analysis</em> until the Phase 2 Python hydrological simulation engine executes full continuous mass-balance calculations.
              </div>
            </div>
          </div>
        )}

        {/* Step Navigation Actions */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
          ) : (
            <Link
              href="/dashboard"
              className="text-xs text-slate-500 hover:text-slate-800 font-medium"
            >
              Cancel
            </Link>
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <span>Continue</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition-colors disabled:opacity-50"
            >
              <span>{isSubmitting ? "Creating Assessment..." : "Create Assessment Record"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
