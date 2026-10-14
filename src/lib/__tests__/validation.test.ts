import { describe, it, expect } from "vitest";
import {
  propertySchema,
  roofSchema,
  waterDemandSchema,
  rainfallSchema,
  fullAssessmentFormSchema,
} from "@/lib/validation/assessment";

describe("AQUASIGHT AI - Assessment Validation Schemas", () => {
  describe("propertySchema", () => {
    it("validates valid property input", () => {
      const valid = {
        name: "Eco Villa",
        propertyType: "residential" as const,
        country: "India",
        state: "Karnataka",
        city: "Bengaluru",
        address: "123 Green Way",
        unitPreference: "metric" as const,
      };
      const result = propertySchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects property name with less than 2 characters", () => {
      const invalid = {
        name: "A",
        propertyType: "residential" as const,
        country: "India",
        state: "Karnataka",
        city: "Bengaluru",
      };
      const result = propertySchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 2 characters");
      }
    });

    it("rejects invalid property type", () => {
      const invalid = {
        name: "Valid Name",
        propertyType: "invalid_type",
        country: "India",
        state: "Karnataka",
        city: "Bengaluru",
      };
      const result = propertySchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("roofSchema", () => {
    it("validates valid roof characteristics", () => {
      const valid = {
        area: 250,
        areaUnit: "sqm" as const,
        material: "metal_sheet" as const,
        slopeCategory: "low_pitch" as const,
        sectionsCount: 2,
      };
      const result = roofSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects zero or negative roof area", () => {
      const invalidZero = {
        area: 0,
        areaUnit: "sqm" as const,
        material: "concrete_tile" as const,
        sectionsCount: 1,
      };
      const result = roofSchema.safeParse(invalidZero);
      expect(result.success).toBe(false);

      const invalidNegative = {
        area: -150,
        areaUnit: "sqm" as const,
        material: "concrete_tile" as const,
        sectionsCount: 1,
      };
      expect(roofSchema.safeParse(invalidNegative).success).toBe(false);
    });
  });

  describe("waterDemandSchema", () => {
    it("validates valid water demand inputs", () => {
      const valid = {
        intendedUses: ["toilet_flushing" as const, "landscape_irrigation" as const],
        occupants: 4,
        dailyDemand: 450,
        demandUnit: "liters_per_day" as const,
        existingStorageCapacity: 1000,
        storageUnit: "liters" as const,
      };
      const result = waterDemandSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects empty intended water uses array", () => {
      const invalid = {
        intendedUses: [],
        occupants: 4,
      };
      const result = waterDemandSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Select at least one");
      }
    });
  });

  describe("rainfallSchema", () => {
    it("validates valid rainfall inputs", () => {
      const valid = {
        sourceType: "manual_estimate" as const,
        annualRainfall: 950,
        rainfallUnit: "mm" as const,
        sourceReference: "Local meteorological service",
      };
      const result = rainfallSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects negative rainfall values", () => {
      const invalid = {
        sourceType: "manual_estimate" as const,
        annualRainfall: -100,
        rainfallUnit: "mm" as const,
      };
      const result = rainfallSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("fullAssessmentFormSchema", () => {
    it("validates a complete assessment payload", () => {
      const full = {
        property: {
          name: "Test Campus",
          propertyType: "educational" as const,
          country: "India",
          state: "Maharashtra",
          city: "Pune",
          unitPreference: "metric" as const,
        },
        roof: {
          area: 500,
          areaUnit: "sqm" as const,
          material: "concrete_tile" as const,
          slopeCategory: "flat" as const,
          sectionsCount: 2,
        },
        waterDemand: {
          intendedUses: ["toilet_flushing" as const],
          occupants: 50,
          dailyDemand: 1000,
          demandUnit: "liters_per_day" as const,
        },
        rainfallInput: {
          sourceType: "regional_average" as const,
          annualRainfall: 750,
          rainfallUnit: "mm" as const,
        },
        notes: "Test campus building assessment",
      };
      const result = fullAssessmentFormSchema.safeParse(full);
      expect(result.success).toBe(true);
    });
  });
});
