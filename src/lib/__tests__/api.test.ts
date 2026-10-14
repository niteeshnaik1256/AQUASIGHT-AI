import { describe, it, expect } from "vitest";
import { AssessmentApiClient } from "@/lib/api/assessment-api";

describe("AssessmentApiClient", () => {
  it("defaults to local storage when NEXT_PUBLIC_API_URL is unset", async () => {
    const client = new AssessmentApiClient("");
    expect(client.isLiveBackendConfigured()).toBe(false);

    const { data, source } = await client.getAssessments();
    expect(source).toBe("local_store");
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it("creates a demonstration assessment with appropriate defaults and status", async () => {
    const client = new AssessmentApiClient("");
    const { data, source } = await client.createAssessment({
      property: {
        name: "Test Solar Villa",
        propertyType: "residential",
        location: {
          country: "India",
          state: "Karnataka",
          city: "Mysuru",
        },
      },
      roof: {
        area: 180,
        areaUnit: "sqm",
        material: "concrete_tile",
      },
      waterDemand: {
        intendedUses: ["toilet_flushing"],
        demandUnit: "liters_per_day",
      },
      rainfallInput: {
        annualRainfall: 800,
        rainfallUnit: "mm",
        sourceType: "manual_estimate",
      },
    });

    expect(source).toBe("local_store");
    expect(data.id).toMatch(/^asmt-/);
    expect(data.status).toBe("pending_analysis");
    expect(data.isDemonstration).toBe(true);
    expect(data.property.name).toBe("Test Solar Villa");

    // Clean up created record
    await client.deleteAssessment(data.id);
  });
});
