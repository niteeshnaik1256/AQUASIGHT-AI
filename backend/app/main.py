import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.core.errors import AQUASIGHTError
from app.api.routes import health, rainfall, simulation, optimization
from app.database import init_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aquasight-backend")

app = FastAPI(
    title="AQUASIGHT AI — Hydrological Engine API",
    description="Authoritative physical mass-balance engine and continuous daily water simulator.",
    version="0.3.0-phase3",
)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    init_db()
    logger.info("Database initialized successfully")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom domain exception handler
@app.exception_handler(AQUASIGHTError)
async def aquasight_error_handler(request: Request, exc: AQUASIGHTError):
    logger.warning(f"Domain error on {request.url.path}: {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "error_type": exc.__class__.__name__,
            "message": exc.message,
        },
    )

# Clean request validation error handler
@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        loc = " -> ".join(str(l) for l in err.get("loc", []))
        errors.append(f"{loc}: {err.get('msg')}")
    return JSONResponse(
        status_code=422,
        content={
            "error": True,
            "error_type": "ValidationError",
            "message": "Invalid request parameters provided.",
            "details": errors,
        },
    )

# Safe unhandled error handler (prevents tracebacks from leaking)
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled server error on {request.url.path}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": True,
            "error_type": "InternalServerError",
            "message": "An unexpected server error occurred while processing the simulation.",
        },
    )

# Mount API routers under /api/v1
app.include_router(health.router, prefix="/api/v1")
app.include_router(rainfall.router, prefix="/api/v1")
app.include_router(simulation.router, prefix="/api/v1")
app.include_router(optimization.router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
