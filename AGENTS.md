<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AQUASIGHT AI — Persistent Agent Rules & Engineering Constraints

## 1. Operating Identity
AQUASIGHT AI is an AI-powered rainwater harvesting assessment, optimization, and decision-support platform combining physics-based hydrological engineering, continuous water balance simulation, external climatological reanalysis, and constrained optimization.

## 2. Mandatory Engineering Principles
1. **Correctness before complexity:** Never replace deterministic physical mass-balance equations with black-box approximations.
2. **Explicit SI units:** Maintain strict SI units internally ($A$ in $\text{m}^2$, $P$ in $\text{mm}$, $V$ in litres/kL, time in days).
3. **Mass balance conservation:** In continuous tank simulation:
   $$\Delta S_t = S_{t-1} + Q_{\text{in}, t} - D_{\text{supplied}, t} - L_{\text{loss}, t}$$
   $$0 \le S_t \le S_{\text{capacity}}$$
   Storage must never exceed physical capacity and overflow must be accounted for explicitly.
4. **Data Provenance & Scientific Integrity:**
   - Clearly distinguish `[Measured]`, `[Historical Simulation]`, `[Forecast Baseline]`, `[Assumed Default]`, and `[User Input]`.
   - Never fabricate datasets, weather observations, or savings metrics.
   - External APIs (such as Open-Meteo ERA5) must include explicit timeouts, caching, and fail-safes.
   - Never claim professional engineering certification or guarantee financial payback without site-specific structural verification.
5. **Architectural Separation:**
   - The Python backend (FastAPI, NumPy, SciPy) is the authoritative computation engine.
   - Do NOT duplicate hydrological equations in frontend JavaScript.
   - The frontend consumes typed contracts via `src/lib/api/assessment-api.ts`.

## 3. Development Commands
- Run test suite: `npm test` (Vitest)
- Run linter: `npm run lint` (ESLint)
- Run production build: `npm run build` (Next.js Turbopack)
- Start development server: `npm run dev`
