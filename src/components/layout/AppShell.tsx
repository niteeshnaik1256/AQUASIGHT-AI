"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Droplets,
  LayoutDashboard,
  FileSpreadsheet,
  PlusCircle,
  Database,
  Settings,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/assessments", label: "Assessments", icon: FileSpreadsheet },
  { href: "/assessment/new", label: "New Assessment", icon: PlusCircle },
  { href: "/data-sources", label: "Data Sources", icon: Database },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If we are on the public landing page (/), do not wrap in the SaaS workspace shell
  if (pathname === "/") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0a1128] text-slate-200 border-r border-slate-800 shrink-0">
        <div className="p-5 flex items-center justify-between border-b border-slate-800/80">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-bold tracking-tight text-white hover:opacity-90">
            <div className="h-8 w-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <Droplets className="h-5 w-5" />
            </div>
            <div>
              <div className="leading-tight text-sm">AQUASIGHT <span className="text-teal-400">AI</span></div>
              <div className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Hydrology OS</div>
            </div>
          </Link>
        </div>

        {/* Phase 1 Status Banner */}
        <div className="px-4 py-3 mx-3 my-3 bg-slate-900/80 rounded-md border border-slate-800 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 font-medium text-teal-400 mb-0.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Phase 1 Foundation
          </div>
          <div>Product Shell & Data Boundary</div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 space-y-1 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-teal-500/15 text-teal-300 font-semibold border border-teal-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-teal-400" : "text-slate-500"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          <Link
            href="/"
            className="flex items-center justify-between text-xs text-slate-400 hover:text-teal-300 transition-colors py-1 px-2 rounded hover:bg-slate-900"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="h-3.5 w-3.5" />
              Public Overview
            </span>
          </Link>
          <div className="text-[10px] text-slate-500 px-2 flex items-center justify-between">
            <span>v0.1.0-alpha</span>
            <span className="inline-flex items-center gap-1 text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400"></span>
              UI Ready
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden bg-[#0a1128] text-white p-4 flex items-center justify-between border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-sm tracking-tight">
          <div className="h-7 w-7 rounded bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <Droplets className="h-4 w-4" />
          </div>
          <span>AQUASIGHT <span className="text-teal-400">AI</span></span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
          className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0a1128] border-b border-slate-800 px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium ${
                  isActive ? "bg-teal-500/20 text-teal-300 font-semibold" : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Icon className="h-4 w-4 text-teal-400" />
                {item.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-800">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Public Overview Page
            </Link>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-slate-800 capitalize">
              {pathname === "/dashboard"
                ? "Hydrological Assessment Workspace"
                : pathname.replace("/", "").replace(/-/g, " ")}
            </h1>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
              Demo Environment
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/assessment/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium shadow-sm transition-colors"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>New Assessment</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">{children}</main>

        {/* Global Footer */}
        <footer className="py-4 px-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>AQUASIGHT AI — Sustainable Water Intelligence</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-400">Phase 1: Foundation & Product Shell</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            <span className="flex items-center gap-1">
              <HelpCircle className="h-3.5 w-3.5" />
              Hydrological calculations scheduled for Phase 2
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
