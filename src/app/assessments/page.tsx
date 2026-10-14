"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Search,
  Filter,
  PlusCircle,
  ArrowUpDown,
  MapPin,
  Calendar,
  ArrowRight,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Assessment } from "@/types/assessment";
import { assessmentApi } from "@/lib/api/assessment-api";
import { assessmentStorage } from "@/lib/storage/assessment-storage";

type SortOption = "newest" | "oldest" | "area_desc" | "area_asc";

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [loading, setLoading] = useState(true);

  const refreshAssessments = async () => {
    const { data } = await assessmentApi.getAssessments();
    setAssessments(data);
    setLoading(false);
  };

  useEffect(() => {
    let ignore = false;
    assessmentApi.getAssessments().then(({ data }) => {
      if (!ignore) {
        setAssessments(data);
        setLoading(false);
      }
    });
    return () => {
      ignore = true;
    };
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the assessment for "${name}"?`)) {
      await assessmentApi.deleteAssessment(id);
      refreshAssessments();
    }
  };

  const handleResetDemo = () => {
    assessmentStorage.resetToDefault();
    refreshAssessments();
  };

  const filteredAssessments = useMemo(() => {
    return assessments
      .filter((item) => {
        const matchesSearch =
          item.property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.property.location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.property.location.country.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "all" || item.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === "area_desc") {
          return b.roof.area - a.roof.area;
        }
        if (sortBy === "area_asc") {
          return a.roof.area - b.roof.area;
        }
        return 0;
      });
  }, [assessments, searchQuery, statusFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Assessments Library
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Browse, search, and manage property rainwater harvesting assessments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDemo}
            title="Reset to default demo records"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Reset Demo Data</span>
          </button>
          <Link
            href="/assessment/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Assessment</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by property name, city, or country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending_analysis">Pending Analysis</option>
              <option value="analyzed">Analyzed</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="area_desc">Roof Area (High to Low)</option>
              <option value="area_asc">Roof Area (Low to High)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assessments Grid / List */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-400">
          Loading assessments from local store...
        </div>
      ) : filteredAssessments.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FileSpreadsheet className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No assessments found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery || statusFilter !== "all"
              ? "No property records match your search or filter criteria."
              : "No property assessments have been registered yet."}
          </p>
          <div className="flex items-center justify-center gap-3">
            {(searchQuery || statusFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="text-xs text-teal-600 font-semibold hover:underline"
              >
                Clear Filters
              </button>
            )}
            <Link
              href="/assessment/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Create New Assessment</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssessments.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {item.property.propertyType}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1.5 truncate">
                      {item.property.name}
                    </h3>
                  </div>
                  <span className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    {item.status.replace("_", " ")}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {item.property.location.city}, {item.property.location.state}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 font-mono">
                  <div>
                    <div className="text-[10px] uppercase font-sans text-slate-400">Catchment Area</div>
                    <div className="font-semibold text-slate-800">
                      {item.roof.area} {item.roof.areaUnit}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-sans text-slate-400">Annual Rain</div>
                    <div className="font-semibold text-slate-800">
                      {item.rainfallInput.annualRainfall || "N/A"} mm
                    </div>
                  </div>
                </div>

                {item.notes && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 mb-4 italic">
                    &ldquo;{item.notes}&rdquo;
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                  <Calendar className="h-3 w-3" />
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id, item.property.name)}
                    aria-label={`Delete assessment for ${item.property.name}`}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <Link
                    href={`/assessments/${item.id}`}
                    className="inline-flex items-center gap-1 font-semibold text-teal-600 hover:text-teal-800"
                  >
                    <span>View Details</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
