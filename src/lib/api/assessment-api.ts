import { Assessment } from "@/types/assessment";
import { assessmentStorage } from "@/lib/storage/assessment-storage";

/**
 * Backend API Client Boundary
 *
 * Configurable via NEXT_PUBLIC_API_URL environment variable.
 * When NEXT_PUBLIC_API_URL is configured and reachable, this service will delegate
 * to the FastAPI Python backend. In Phase 1, it provides clean local storage
 * delegation with documented integration points for:
 * 1. POST /api/v1/assessments
 * 2. GET /api/v1/assessments
 * 3. GET /api/v1/assessments/{id}
 * 4. POST /api/v1/hydrology/simulate (Phase 2)
 * 5. POST /api/v1/recommendations/optimize (Phase 3)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface CreateAssessmentPayload {
  property: {
    name: string;
    propertyType: Assessment["property"]["propertyType"];
    location: Assessment["property"]["location"];
  };
  roof: Assessment["roof"];
  waterDemand: Assessment["waterDemand"];
  rainfallInput: Assessment["rainfallInput"];
  notes?: string;
}

export class AssessmentApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  public isLiveBackendConfigured(): boolean {
    return Boolean(this.baseUrl && this.baseUrl.startsWith("http"));
  }

  public async getAssessments(): Promise<{ data: Assessment[]; source: "api" | "local_store" }> {
    if (this.isLiveBackendConfigured()) {
      try {
        const res = await fetch(`${this.baseUrl}/api/v1/assessments`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          const json = await res.json();
          return { data: json, source: "api" };
        }
      } catch (err) {
        console.warn("Live API unavailable, falling back to local store", err);
      }
    }

    // Phase 1 local fallback
    return { data: assessmentStorage.getAll(), source: "local_store" };
  }

  public async getAssessmentById(id: string): Promise<{ data: Assessment | null; source: "api" | "local_store" }> {
    if (this.isLiveBackendConfigured()) {
      try {
        const res = await fetch(`${this.baseUrl}/api/v1/assessments/${id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          const json = await res.json();
          return { data: json, source: "api" };
        }
      } catch (err) {
        console.warn("Live API unavailable, falling back to local store", err);
      }
    }

    return { data: assessmentStorage.getById(id), source: "local_store" };
  }

  public async createAssessment(payload: CreateAssessmentPayload): Promise<{ data: Assessment; source: "api" | "local_store" }> {
    const timestamp = new Date().toISOString();
    const id = `asmt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const newAssessment: Assessment = {
      id,
      isDemonstration: true, // Marked as Phase 1 demonstration until processed by backend engine
      status: "pending_analysis",
      createdAt: timestamp,
      updatedAt: timestamp,
      property: {
        id: `prop-${Date.now().toString(36)}`,
        name: payload.property.name,
        propertyType: payload.property.propertyType,
        location: payload.property.location,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      roof: payload.roof,
      waterDemand: payload.waterDemand,
      rainfallInput: payload.rainfallInput,
      notes: payload.notes,
    };

    if (this.isLiveBackendConfigured()) {
      try {
        const res = await fetch(`${this.baseUrl}/api/v1/assessments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newAssessment),
        });
        if (res.ok) {
          const json = await res.json();
          return { data: json, source: "api" };
        }
      } catch (err) {
        console.warn("Live API unavailable, persisting to local store", err);
      }
    }

    const saved = assessmentStorage.save(newAssessment);
    return { data: saved, source: "local_store" };
  }

  public async deleteAssessment(id: string): Promise<boolean> {
    if (this.isLiveBackendConfigured()) {
      try {
        const res = await fetch(`${this.baseUrl}/api/v1/assessments/${id}`, {
          method: "DELETE",
        });
        if (res.ok) return true;
      } catch (err) {
        console.warn("Live API unavailable, deleting from local store", err);
      }
    }

    return assessmentStorage.delete(id);
  }
}

export const assessmentApi = new AssessmentApiClient();
