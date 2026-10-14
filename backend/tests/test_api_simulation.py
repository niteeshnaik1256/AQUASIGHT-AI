from starlette.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_api_create_simulation_with_user_series():
    payload = {
        "assessment_id": "test-asmt-101",
        "catchment_area_sqm": 150.0,
        "roof_material": "concrete_tile",
        "runoff_coefficient": 0.8,
        "tank_capacity_liters": 5000.0,
        "initial_storage_liters": 0.0,
        "daily_demand_liters": 300.0,
        "first_flush_depth_mm": 1.0,
        "dry_period_days": 3,
        "conveyance_efficiency": 0.95,
        "filtration_efficiency": 0.90,
        "rainfall_source": "user_provided",
        "user_rainfall_series": [
            {"date": "2024-06-01", "precipitation_mm": 25.0},
            {"date": "2024-06-02", "precipitation_mm": 40.0},
            {"date": "2024-06-03", "precipitation_mm": 0.0},
            {"date": "2024-06-04", "precipitation_mm": 12.0},
        ],
    }

    res = client.post("/api/v1/simulations", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["simulation_id"].startswith("sim-")
    assert data["assessment_id"] == "test-asmt-101"
    assert "summary" in data
    assert len(data["daily_records"]) == 4
    assert data["mass_balance_audit"]["status"] == "verified_conserved"
    assert data["summary"]["total_requested_demand_liters"] == 1200.0

    # Retrieve by ID
    sim_id = data["simulation_id"]
    get_res = client.get(f"/api/v1/simulations/{sim_id}")
    assert get_res.status_code == 200
    assert get_res.json()["simulation_id"] == sim_id


def test_api_simulation_invalid_initial_storage():
    payload = {
        "catchment_area_sqm": 150.0,
        "tank_capacity_liters": 2000.0,
        "initial_storage_liters": 3000.0,  # Invalid: > capacity
        "daily_demand_liters": 300.0,
        "rainfall_source": "user_provided",
        "user_rainfall_series": [{"date": "2024-06-01", "precipitation_mm": 10.0}],
    }

    res = client.post("/api/v1/simulations", json=payload)
    assert res.status_code == 422
    data = res.json()
    assert data["error"] is True


def test_api_simulation_not_found():
    res = client.get("/api/v1/simulations/sim-nonexistent-id")
    assert res.status_code == 404
    data = res.json()
    assert data["error"] is True
    assert "not found" in data["message"].lower()
