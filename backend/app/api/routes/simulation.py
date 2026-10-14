from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.simulation import SimulationRequest, SimulationResponse
from app.services.simulation_service import SimulationService
from app.database import get_db

router = APIRouter(prefix="/simulations", tags=["Simulation"])


@router.post("", response_model=SimulationResponse)
async def create_simulation(request: SimulationRequest, db: Session = Depends(get_db)):
    """
    Executes a continuous daily water-balance simulation over the specified rainfall time series.
    Enforces conservation of mass on every simulated day.
    Results are persisted to the database.
    """
    service = SimulationService(db)
    return await service.run_simulation(request, db)


@router.get("/{simulation_id}", response_model=SimulationResponse)
def get_simulation(simulation_id: str, db: Session = Depends(get_db)):
    """
    Retrieves a previously run simulation result from the database.
    """
    service = SimulationService(db)
    return service.get_simulation_by_id(simulation_id, db)
