import sys
import os

# Add the backend directory to Python path so Vercel can find the app module
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

# Expose the FastAPI app instance for Vercel
from app.main import app
