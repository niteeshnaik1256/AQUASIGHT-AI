"""
Pytest configuration for AQUASIGHT AI Backend.
"""
import sys
from pathlib import Path

# Ensure backend root is on Python path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Initialize database for tests
from app.database import init_db
init_db()
