import { Assessment } from "@/types/assessment";

const STORAGE_KEY = "aquasight_demo_assessments_v1";

export const INITIAL_DEMO_ASSESSMENTS: Assessment[] = [
  {
    id: "demo-assessment-001",
    isDemonstration: true,
    status: "pending_analysis",
    createdAt: "2026-10-10T10:30:00.000Z",
    updatedAt: "2026-10-10T10:30:00.000Z",
    property: {
      id: "prop-001",
      name: "Greenwood Eco-Residence",
      propertyType: "residential",
      location: {
        country: "India",
        state: "Karnataka",
        city: "Bengaluru",
        address: "142 Palm Meadows, Whitefield",
        latitude: 12.9698,
        longitude: 77.75,
      },
      createdAt: "2026-10-10T10:30:00.000Z",
      updatedAt: "2026-10-10T10:30:00.000Z",
    },
    roof: {
      area: 210,
      areaUnit: "sqm",
      material: "concrete_tile",
      slopeCategory: "low_pitch",
      sectionsCount: 2,
    },
    waterDemand: {
      occupants: 4,
      dailyDemand: 480,
      demandUnit: "liters_per_day",
      intendedUses: ["toilet_flushing", "landscape_irrigation", "general_cleaning"],
      existingStorageCapacity: 2000,
      storageUnit: "liters",
    },
    rainfallInput: {
      annualRainfall: 970,
      rainfallUnit: "mm",
      sourceType: "open_meteo_historical",
      sourceReference: "Bengaluru Airport ERA5 Reanalysis (10-yr normal)",
    },
    notes: "Demonstration record: Flat rooftop with parapet wall. Primary interest is toilet flushing and garden irrigation.",
  },
  {
    id: "demo-assessment-002",
    isDemonstration: true,
    status: "pending_analysis",
    createdAt: "2026-10-12T14:15:00.000Z",
    updatedAt: "2026-10-12T14:15:00.000Z",
    property: {
      id: "prop-002",
      name: "Riverbend Learning Academy",
      propertyType: "educational",
      location: {
        country: "India",
        state: "Maharashtra",
        city: "Pune",
        address: "Sector 8, Kothrud",
        latitude: 18.5074,
        longitude: 73.8077,
      },
      createdAt: "2026-10-12T14:15:00.000Z",
      updatedAt: "2026-10-12T14:15:00.000Z",
    },
    roof: {
      area: 650,
      areaUnit: "sqm",
      material: "metal_sheet",
      slopeCategory: "medium_pitch",
      sectionsCount: 3,
    },
    waterDemand: {
      occupants: 120,
      dailyDemand: 1800,
      demandUnit: "liters_per_day",
      intendedUses: ["toilet_flushing", "landscape_irrigation"],
      existingStorageCapacity: 5000,
      storageUnit: "liters",
    },
    rainfallInput: {
      annualRainfall: 720,
      rainfallUnit: "mm",
      sourceType: "manual_estimate",
      sourceReference: "User provided municipal reference estimate",
    },
    notes: "Demonstration record: Sloped corrugated metal catchment with high runoff coefficient (~0.90).",
  },
];

class AssessmentStorageService {
  private isBrowser(): boolean {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  }

  public getAll(): Assessment[] {
    if (!this.isBrowser()) {
      return INITIAL_DEMO_ASSESSMENTS;
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        this.saveAll(INITIAL_DEMO_ASSESSMENTS);
        return INITIAL_DEMO_ASSESSMENTS;
      }
      return JSON.parse(stored) as Assessment[];
    } catch {
      return INITIAL_DEMO_ASSESSMENTS;
    }
  }

  public getById(id: string): Assessment | null {
    const list = this.getAll();
    return list.find((item) => item.id === id) || null;
  }

  public save(item: Assessment): Assessment {
    const list = this.getAll();
    const existingIndex = list.findIndex((a) => a.id === item.id);
    let updatedList: Assessment[];

    if (existingIndex >= 0) {
      updatedList = [...list];
      updatedList[existingIndex] = { ...item, updatedAt: new Date().toISOString() };
    } else {
      updatedList = [item, ...list];
    }

    this.saveAll(updatedList);
    return item;
  }

  public delete(id: string): boolean {
    const list = this.getAll();
    const filtered = list.filter((a) => a.id !== id);
    if (filtered.length !== list.length) {
      this.saveAll(filtered);
      return true;
    }
    return false;
  }

  public resetToDefault(): void {
    if (this.isBrowser()) {
      window.localStorage.removeItem(STORAGE_KEY);
      this.saveAll(INITIAL_DEMO_ASSESSMENTS);
    }
  }

  private saveAll(items: Assessment[]): void {
    if (this.isBrowser()) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch {
        // Fallback or quota exceeded
      }
    }
  }
}

export const assessmentStorage = new AssessmentStorageService();
