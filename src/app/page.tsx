import Link from "next/link";
import {
  Droplets,
  ArrowRight,
  ShieldAlert,
  BarChart3,
  Layers,
  Sparkles,
  CheckCircle2,
  Cpu,
  Compass,
  FileText,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070d1e] text-slate-100 flex flex-col selection:bg-teal-500 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-[#070d1e]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <Droplets className="h-5 w-5" />
            </div>
            <span className="font-bold tracking-tight text-lg text-white">
              AQUASIGHT <span className="text-teal-400">AI</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
            <a href="#capabilities" className="hover:text-teal-400 transition-colors">
              Capabilities
            </a>
            <a href="#workflow" className="hover:text-teal-400 transition-colors">
              Engineering Workflow
            </a>
            <a href="#architecture" className="hover:text-teal-400 transition-colors">
              Architecture
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-semibold transition-colors shadow-sm"
            >
              <span>Open Platform</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-500/30 text-teal-400 text-xs font-mono uppercase tracking-widest mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          Hydrological Modeling & Storage Optimization
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          AI-Powered Rainwater Harvesting <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-teal-400 via-cyan-300 to-sky-400 bg-clip-text text-transparent">
            Assessment & Decision Support
          </span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Evaluate catchment yields, model continuous daily water balances, quantify first-flush losses, and discover Pareto-optimal storage sizing with physics-first hydrological engineering.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/assessment/new"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-teal-500/20"
          >
            <span>Start Property Assessment</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition-all"
          >
            <span>Explore Demo Workspace</span>
          </Link>
        </div>

        {/* Phase 1 Scope & Provenance Disclaimer */}
        <div className="mt-12 max-w-2xl mx-auto p-4 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-start gap-3 text-left">
          <ShieldAlert className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-200 font-semibold">Phase 1 Foundation Release:</strong>
            {" "}The active build provides the product shell, typed data model, multi-step assessment workflow, and local persistence. Full Python-based daily water balance simulation and ML rainfall forecasting arrive in Phase 2.
          </div>
        </div>
      </section>

      {/* Engineering Pillars */}
      <section id="capabilities" className="py-16 px-6 bg-[#0a1128] border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Rigorous Engineering Over Hype
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Physics-based mass balances combined with constrained optimization to yield explainable, actionable recommendations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20 mb-4">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Continuous Daily Water Balance</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Deterministic daily simulations accounting for inflow ($V = A \times P \times C_r$), first-flush diversion, filtration efficiency, tank overflow, and daily demand deficits.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20 mb-4">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Pareto Storage Optimization</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Discrete simulation across candidate tank sizes to evaluate reliability percentage against capital expense, identifying the point of diminishing hydrological returns.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20 mb-4">
                <Compass className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Site & Safety Screening</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Multi-criteria evaluation incorporating roof material coefficients, setback rules, structural load considerations, and percolation requirements before recharge recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Engineering Workflow */}
      <section id="workflow" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            The Assessment Pipeline
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            From rooftop parameters to transparent, verifiable water savings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: "01",
              title: "Catchment Profiling",
              desc: "Capture rooftop area, pitch, surface materials, and daily non-potable water demand profiles.",
            },
            {
              step: "02",
              title: "Climatology Ingestion",
              desc: "Retrieve verified historical precipitation time-series and local rainfall distributions.",
            },
            {
              step: "03",
              title: "Hydrological Simulation",
              desc: "Simulate daily inflows, first-flush diversions, tank fill dynamics, and overflow volumes.",
            },
            {
              step: "04",
              title: "Decision Support",
              desc: "Compare candidate tank capacities, lifecycle costs, payback timelines, and actionable site checks.",
            },
          ].map((item) => (
            <div key={item.step} className="p-5 rounded-lg bg-slate-900/50 border border-slate-800 relative">
              <div className="font-mono text-xs font-bold text-teal-400 mb-2">{item.step}</div>
              <h4 className="text-base font-semibold text-white mb-2">{item.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Architecture & Roadmap */}
      <section id="architecture" className="py-16 px-6 bg-[#0a1128] border-t border-slate-800/80">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-white tracking-tight mb-8 text-center">
            Implementation Roadmap
          </h2>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-teal-950/40 border border-teal-500/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-teal-400 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-white">Phase 1: Foundation & Product Shell</div>
                  <div className="text-xs text-slate-400">Next.js App Router, typed domain schemas, multi-step wizard, local persistence boundary.</div>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-teal-500/20 text-teal-300 font-semibold uppercase">
                Active Release
              </span>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-slate-500 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-slate-300">Phase 2: Hydrological Engine & Daily Simulation</div>
                  <div className="text-xs text-slate-500">FastAPI backend, NumPy water balance, Open-Meteo ERA5 ingestion, loss accounting.</div>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-400 uppercase">
                Scheduled Next
              </span>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-slate-500 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-slate-300">Phase 3: Storage Optimizer & Financial Feasibility</div>
                  <div className="text-xs text-slate-500">Pareto capacity frontier, NPV/LCC models, regional water tariffs, explainable recommendations.</div>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-400 uppercase">
                Planned
              </span>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-sm transition-colors"
            >
              <span>Enter Workspace Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-800/80 bg-[#070d1e] text-center text-xs text-slate-500">
        <p>AQUASIGHT AI — Professional Environmental Decision Support. Strictly grounded in physical mass balance principles.</p>
      </footer>
    </div>
  );
}
