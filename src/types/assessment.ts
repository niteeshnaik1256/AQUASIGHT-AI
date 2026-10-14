/**
 * AQUASIGHT AI - Domain Types
 * Strictly typed entities for property, roof, water demand, rainfall, and assessments.
 * Designed to cleanly mirror future Python Pydantic schemas.
 */

export type PropertyType =
  | "residential"
  | "commercial"
  | "educational"
  | "apartment"
  | "other";

export type AreaUnit = "sqm" | "sqft";
export type DemandUnit = "liters_per_day" | "gallons_per_day";
export type RainfallUnit = "mm" | "inches";
export type StorageUnit = "liters" | "gallons";

export type RoofMaterial =
  | "metal_sheet"
  | "concrete_tile"
  | "clay_tile"
  | "asphalt_shingle"
  | "green_roof"
  | "other";

export type RoofSlopeCategory = "flat" | "low_pitch" | "medium_pitch" | "steep";

export type IntendedWaterUse =
  | "toilet_flushing"
  | "landscape_irrigation"
  | "laundry"
  | "car_washing"
  | "cooling"
  | "general_cleaning"
  | "other";

export type RainfallSourceType =
  | "manual_estimate"
  | "open_meteo_historical"
  | "regional_average"
  | "unknown";

export type AssessmentStatus =
  | "draft"
  | "pending_analysis"
  | "analyzed"
  | "archived";

export interface Location {
  country: string;
  state: string;
  city: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface Property {
  id: string;
  name: string;
  propertyType: PropertyType;
  location: Location;
  createdAt: string;
  updatedAt: string;
}

export interface Roof {
  area: number;
  areaUnit: AreaUnit;
  material: RoofMaterial;
  slopeCategory?: RoofSlopeCategory;
  sectionsCount?: number;
}

export interface WaterDemand {
  occupants?: number;
  dailyDemand?: number;
  demandUnit: DemandUnit;
  intendedUses: IntendedWaterUse[];
  existingStorageCapacity?: number;
  storageUnit?: StorageUnit;
}

export interface RainfallInput {
  annualRainfall?: number;
  rainfallUnit: RainfallUnit;
  sourceType: RainfallSourceType;
  sourceReference?: string;
}

export interface Assessment {
  id: string;
  property: Property;
  roof: Roof;
  waterDemand: WaterDemand;
  rainfallInput: RainfallInput;
  status: AssessmentStatus;
  isDemonstration: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataSourceRecord {
  id: string;
  name: string;
  category: "climate_reanalysis" | "satellite_climatology" | "groundwater_soils" | "municipal_tariffs";
  provider: string;
  dataType: string;
  geographicCoverage: string;
  timeRange: string;
  status: "connected" | "planned" | "in_development" | "maintenance";
  lastUpdated?: string;
  description: string;
}
