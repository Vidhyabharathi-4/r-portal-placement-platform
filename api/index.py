import sys
import os
import traceback
from fastapi import FastAPI

try:
    # Add the backend directory to Python path
    sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))
    from app.main import app
except Exception as e:
    tb = traceback.format_exc()
    app = FastAPI()
    
    @app.get("/api/health")
    def health():
        return {"status": "error", "traceback": tb}
        
    @app.get("/{catchall:path}")
    def catch_all(catchall: str):
        return {"status": "error", "traceback": tb}
