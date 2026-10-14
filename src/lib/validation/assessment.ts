import { z } from "zod";

export const propertySchema = z.object({
  name: z.string().min(2, "Property name must be at least 2 characters").max(100),
  propertyType: z.enum(["residential", "commercial", "educational", "apartment", "other"]),
  country: z.string().min(2, "Country is required"),
  state: z.string().min(2, "State or region is required"),
  city: z.string().min(2, "City is required"),
  address: z.string().optional(),
  unitPreference: z.enum(["metric", "imperial"]).default("metric"),
});

export const roofSchema = z.object({
  area: z
    .number({ message: "Roof area must be a number" })
    .positive("Roof area must be greater than zero")
    .max(500000, "Roof area exceeds maximum supported limit"),
  areaUnit: z.enum(["sqm", "sqft"]).default("sqm"),
  material: z.enum([
    "metal_sheet",
    "concrete_tile",
    "clay_tile",
    "asphalt_shingle",
    "green_roof",
    "other",
  ]),
  slopeCategory: z.enum(["flat", "low_pitch", "medium_pitch", "steep"]).optional(),
  sectionsCount: z.number().int().min(1).max(20).default(1),
});

export const waterDemandSchema = z.object({
  intendedUses: z
    .array(
      z.enum([
        "toilet_flushing",
        "landscape_irrigation",
        "laundry",
        "car_washing",
        "cooling",
        "general_cleaning",
        "other",
      ])
    )
    .min(1, "Select at least one intended water use"),
  occupants: z.number().int().positive().max(5000).optional(),
  dailyDemand: z.number().positive().max(1000000).optional(),
  demandUnit: z.enum(["liters_per_day", "gallons_per_day"]).default("liters_per_day"),
  existingStorageCapacity: z.number().nonnegative().max(10000000).optional(),
  storageUnit: z.enum(["liters", "gallons"]).default("liters"),
});

export const rainfallSchema = z.object({
  sourceType: z.enum([
    "manual_estimate",
    "open_meteo_historical",
    "regional_average",
    "unknown",
  ]),
  annualRainfall: z.number().positive().max(12000).optional(),
  rainfallUnit: z.enum(["mm", "inches"]).default("mm"),
  sourceReference: z.string().optional(),
});

export const fullAssessmentFormSchema = z.object({
  property: propertySchema,
  roof: roofSchema,
  waterDemand: waterDemandSchema,
  rainfallInput: rainfallSchema,
  notes: z.string().max(1000).optional(),
});

export type PropertyFormValues = z.infer<typeof propertySchema>;
export type RoofFormValues = z.infer<typeof roofSchema>;
export type WaterDemandFormValues = z.infer<typeof waterDemandSchema>;
export type RainfallFormValues = z.infer<typeof rainfallSchema>;
export type FullAssessmentFormValues = z.infer<typeof fullAssessmentFormSchema>;
