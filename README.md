<<<<<<< HEAD
# AQUASIGHT AI — Rainwater Harvesting Assessment & Intelligence Platform

> **AI-powered rainwater harvesting assessment, optimization, and decision-support platform.**
> Built with physics-first hydrological engineering, daily continuous water balance simulation, and constrained storage optimization.

---

## 1. Product Overview

AQUASIGHT AI empowers property owners, civil engineers, consultants, and municipal teams to assess rooftop rainwater collection potential, simulate storage dynamics, estimate overflow and unmet demand, and generate explainable sizing recommendations.

The platform bridges:
1. **Deterministic Hydrological Calculations** ($V_{\text{gross}} = A \times P$, $V_{\text{runoff}} = A \times P \times C_r$, first-flush diversion, filtration losses).
2. **Continuous Daily Water Balance Simulation** across multi-year historical precipitation timeseries.
3. **Pareto Storage Optimization** balancing capital expense against volumetric supply reliability.
4. **Site & Safety Constraints** (setbacks, structural load limits, groundwater recharge screening).
5. **Life-Cycle Financial Analysis** (CapEx, OpEx, avoided water tariffs, NPV, payback).

---

## 2. Implementation Scope

### Phase 1: Repository Foundation + Product Shell
- **Application Shell & Design System:** Modern, high-precision technical UI inspired by AI compute and climate-tech platforms. Deep navy shell (`#0A1128`), off-white analytical canvases, teal/aqua water accents, and consistent 8px grid hierarchy.
- **Typed Domain Architecture:** Strictly typed models (`src/types/assessment.ts`) defining properties, locations, roof materials, downspouts, seasonal water demand, and rainfall profiles.
- **Zod Schema Validation:** Step-by-step and full-payload validation schemas (`src/lib/validation/assessment.ts`).
- **Multi-Step Assessment Creation Wizard:** 5-step wizard (`/assessment/new`) with form validation, step navigation, edit jumps, and submission.
- **Overview Dashboard:** Interactive dashboard (`/dashboard`) featuring metric summary cards, monthly precipitation vs. yield distribution (Recharts Bar Chart), yield vs. non-potable demand balance (Recharts Area Chart), recent assessments, and recommendation engine previews.
- **Assessments Library:** Searchable, filterable, and sortable assessment table/cards (`/assessments`) with empty states and actions.
- **Assessment Details View:** Comprehensive property and catchment inspector (`/assessments/[id]`) with deterministic theoretical math and Phase 2 engine integration.
- **Data Sources Registry:** Catalog (`/data-sources`) of planned climatological services (Open-Meteo ERA5, NASA POWER, CGWB/SoilGrids, Municipal Tariffs) with honest provenance indicators.
- **Settings & Demo Store:** Controls (`/settings`) for unit system preferences (Metric SI vs. Imperial), local demonstration storage management, and data governance notices.
- **Backend API Boundary Client:** Typed API boundary client (`src/lib/api/assessment-api.ts`) configured via `NEXT_PUBLIC_API_URL` with automated fallback to the isolated local demonstration storage (`src/lib/storage/assessment-storage.ts`).

### Phase 2: Hydrological Simulation Engine
- **Python Backend (FastAPI):** Authoritative physics-based hydrological computation engine with continuous daily water balance simulation.
- **Hydrological Modules:**
  - `runoff.py`: Deterministic runoff calculation ($V_{\text{runoff}} = A \times P \times C_r$)
  - `first_flush.py`: Dynamic first-flush diversion logic with dry-period reset
  - `tank_balance.py`: Continuous mass-balance simulation with overflow tracking
  - `metrics.py`: Comprehensive simulation metrics (coverage, efficiency, overflow ratio)
  - `units.py`: SI unit conversion utilities
- **Rainfall Service:** Integration with Open-Meteo ERA5 historical reanalysis API with caching and timeout handling.
- **Simulation API:** `/api/v1/simulations` endpoint accepting configuration parameters and returning detailed time-series results.
- **Frontend Simulation Panel:** Interactive UI component (`src/components/simulation/SimulationPanel.tsx`) integrated into assessment details page.
- **Simulation Features:**
  - Configurable tank capacity and initial storage
  - Configurable daily water demand
  - Rainfall source selection (Open-Meteo ERA5 or user-provided)
  - Date range selection for historical simulation
  - Real-time simulation results display with KPI cards
  - Storage over time chart (Recharts AreaChart)
  - Rainfall vs. inflow chart (Recharts BarChart)
  - Demand satisfaction chart (Recharts AreaChart)
  - Volume accounting summary
  - Rainfall data provenance display
  - Mass-balance audit validation
  - Engineering assumptions disclosure
- **Mass Balance Conservation:** Every simulation day enforces $\Delta S_t = S_{t-1} + Q_{\text{in}, t} - D_{\text{supplied}, t} - L_{\text{loss}, t}$ with explicit overflow accounting.

---

## 3. Technology Stack

* **Frontend:** Next.js 16 (App Router), React 19, TypeScript (strict mode)
* **Styling:** Tailwind CSS v4, custom brand tokens, WCAG AA accessible focus rings, reduced-motion support
* **Icons:** Lucide React
* **Analytical Charts:** Recharts
* **Validation:** Zod
* **Testing:** Vitest
* **Backend:** Python 3.11+, FastAPI, Pydantic, NumPy, pandas, httpx
* **Backend Testing:** pytest, pytest-asyncio

---

## 4. Repository Structure

```text
rain-water-harvester/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with Suspense boundary & fonts
│   │   ├── page.tsx                # Public technical landing page
│   │   ├── globals.css             # Tailwind 4 theme tokens & accessibility styles
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Analytical overview dashboard
│   │   ├── assessment/
│   │   │   └── new/
│   │   │       └── page.tsx        # 5-step property assessment creation wizard
│   │   ├── assessments/
│   │   │   ├── page.tsx            # Assessments library (search, filter, sort)
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Assessment details & simulation panel
│   │   ├── data-sources/
│   │   │   └── page.tsx            # Climatology & external data registry
│   │   └── settings/
│   │       └── page.tsx            # Units & local demo store management
│   ├── components/
│   │   ├── layout/
│   │   │   └── AppShell.tsx        # Persistent sidebar & mobile drawer shell
│   │   └── simulation/
│   │       └── SimulationPanel.tsx # Water-balance simulation UI component
│   ├── lib/
│   │   ├── api/
│   │   │   ├── assessment-api.ts   # Assessment API client boundary
│   │   │   └── simulation-api.ts   # Simulation API client boundary
│   │   ├── storage/
│   │   │   └── assessment-storage.ts # Local demonstration persistence
│   │   ├── validation/
│   │   │   └── assessment.ts       # Zod validation schemas
│   │   ├── __tests__/
│   │   │   ├── api.test.ts         # API boundary & storage tests
│   │   │   └── validation.test.ts  # Zod schema unit tests
│   │   └── utils.ts                # Tailwind class merge utility (cn)
│   └── types/
│       └── assessment.ts           # Core domain entity types
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI application entry point
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── health.py       # Health check endpoint
│   │   │       ├── rainfall.py     # Rainfall data endpoints
│   │   │       └── simulation.py   # Simulation endpoints
│   │   ├── core/
│   │   │   ├── config.py           # Application configuration
│   │   │   └── errors.py           # Domain error definitions
│   │   ├── hydrology/
│   │   │   ├── runoff.py           # Runoff calculation logic
│   │   │   ├── first_flush.py      # First-flush diversion logic
│   │   │   ├── tank_balance.py     # Continuous mass-balance simulation
│   │   │   ├── metrics.py          # Simulation metrics calculation
│   │   │   └── units.py            # SI unit conversion utilities
│   │   ├── models/
│   │   │   ├── rainfall.py         # Rainfall data models
│   │   │   └── simulation.py       # Simulation request/response models
│   │   ├── repositories/
│   │   │   └── rainfall_cache.py   # Rainfall data caching
│   │   └── services/
│   │       ├── rainfall_service.py # Rainfall data service
│   │       └── simulation_service.py # Simulation orchestration
│   ├── tests/
│   │   ├── conftest.py             # Pytest configuration
│   │   ├── test_api_simulation.py  # Simulation API tests
│   │   ├── test_first_flush.py     # First-flush logic tests
│   │   ├── test_health.py          # Health endpoint tests
│   │   ├── test_mass_balance_invariants.py # Mass-balance validation tests
│   │   ├── test_rainfall_service.py # Rainfall service tests
│   │   ├── test_runoff.py          # Runoff calculation tests
│   │   ├── test_tank_balance.py    # Tank balance simulation tests
│   │   └── test_units.py           # Unit conversion tests
│   └── pyproject.toml              # Python project configuration
├── docs/                           # Architectural blueprints & specifications
├── AGENTS.md                       # Persistent agent rules & Next.js instructions
├── .env.example                    # Frontend environment variables template
├── next.config.ts                  # Next.js Turbopack configuration
├── tsconfig.json                   # Strict TypeScript compiler options
├── vitest.config.mts               # Unit testing configuration
└── package.json
```

---

## 5. Getting Started

### Prerequisites
- **Frontend:**
  - Node.js: `v20+` or `v22+` (Tested on `v22.20.0`)
  - npm: `v10+` or `v11+`
- **Backend:**
  - Python: `3.11+`
  - pip (Python package manager)

### Frontend Installation
```bash
# Install frontend dependencies
npm install

# Configure environment (optional - defaults to http://127.0.0.1:8000)
cp .env.example .env.local
# Edit .env.local to set NEXT_PUBLIC_API_URL if needed
```

### Backend Installation
```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -e .

# Configure environment (optional - defaults are provided)
cp .env.example .env
# Edit .env to customize ports, CORS origins, or API settings
```

### Development Servers

**Start the Backend (Required for Simulation):**
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
The backend will be available at [http://127.0.0.1:8000](http://127.0.0.1:8000)
API documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

**Start the Frontend:**
```bash
# From the repository root
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### Verification & Testing

**Frontend:**
```bash
# Run unit test suite
npm test

# Run ESLint validation
npm run lint

# Run optimized production build
npm run build
```

**Backend:**
```bash
cd backend

# Run pytest test suite
pytest

# Run with verbose output
pytest -v
```

---

## 6. Environment Variables

### Frontend (.env.local)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Base URL for the FastAPI Python backend | `http://127.0.0.1:8000` |

### Backend (backend/.env)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Backend server port | `8000` |
| `HOST` | Backend server host | `0.0.0.0` |
| `ENVIRONMENT` | Environment mode | `development` |
| `CORS_ORIGINS` | Allowed CORS origins (JSON array) | `["http://localhost:3000","http://127.0.0.1:3000"]` |
| `OPEN_METEO_BASE_URL` | Open-Meteo ERA5 API endpoint | `https://archive-api.open-meteo.com/v1/archive` |
| `OPEN_METEO_TIMEOUT_SECONDS` | API request timeout | `15.0` |
| `OPEN_METEO_MAX_RETRIES` | API request retry attempts | `3` |
| `OPEN_METEO_CACHE_TTL_SECONDS` | Rainfall data cache duration | `86400` (24 hours) |

---

## 7. Usage Guide

### Creating an Assessment
1. Navigate to **Assessments** → **New Assessment**
2. Complete the 5-step wizard:
   - Property details (name, type, location)
   - Roof characteristics (area, material, slope)
   - Water demand (occupants, daily demand, intended uses)
   - Rainfall information (annual rainfall, data source)
   - Review and submit
3. The assessment is saved to local storage and appears in the assessments library

### Running a Water-Balance Simulation
1. Open an existing assessment from the assessments library
2. Scroll to the **Daily Water Balance Simulation Engine** section
3. Configure simulation parameters:
   - Tank capacity (litres)
   - Initial storage (litres)
   - Daily demand (L/day)
   - Rainfall source (Open-Meteo ERA5)
   - Start and end dates for historical simulation
4. Click **Run Water-Balance Simulation**
5. View results:
   - KPI cards (demand coverage, collection efficiency, overflow ratio)
   - Volume accounting summary
   - Storage over time chart
   - Rainfall vs. inflow chart
   - Demand satisfaction chart
   - Rainfall data provenance
   - Mass-balance audit status

### Understanding Simulation Metrics
- **Demand Coverage (%):** Percentage of total demand served by harvested water
- **Collection Efficiency (%):** Ratio of net tank inflow to gross rainfall volume
- **Overflow Ratio (%):** Percentage of total rainfall lost to overflow
- **Mass Balance Audit:** Validates conservation of mass on every simulated day
- **Rainfall Provenance:** Shows data source, coordinates, time range, and completeness status

### Engineering Assumptions
The simulation uses fixed assumptions that are disclosed in the UI:
- Catchment area: Derived from assessment roof area
- Runoff coefficient: Based on roof material (e.g., 0.9 for metal sheet)
- First-flush diversion: 1.0 mm per rainfall event
- Conveyance efficiency: 95%
- Filtration efficiency: 90%
- Dry-period reset: 3 consecutive dry days

---

## 8. Current Limitations & Deferred Features

* **Storage Optimization & Financial Modeling (Phase 3):** Pareto tank capacity trade-off curves, Life-Cycle Costing (LCC), and Net Present Value (NPV) models are scheduled for Phase 3.
* **Geospatial Terrain & Satellite Masking (Phase 4):** Automated rooftop polygon extraction and GIS slope/soil hazard screening are planned for Phase 4.
* **User-Provided Rainfall Series:** The UI currently only supports Open-Meteo ERA5; the backend accepts user-provided rainfall series but the frontend input is not yet implemented.
* **Persistent Simulation Storage:** Simulation results are stored in-memory in the backend; database persistence is not yet implemented.
* **Multi-Year Simulations:** The Open-Meteo API is configured for single-year periods; multi-year simulations require additional API configuration.
=======
# AQUASIGHT-AI
>>>>>>> 6baaaa4461d22f33cfe38da71dd95909462765e7
