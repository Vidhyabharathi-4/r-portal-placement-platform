import sys
import os
import traceback
from fastapi import FastAPI

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

# Statically define app at the top level so Vercel's AST parser can find it
app = None
tb = None

try:
    from app.main import app as real_app
    app = real_app
except Exception as e:
    tb = traceback.format_exc()

# Fallback dummy app if initialization failed
if app is None:
    app = FastAPI()
    
    @app.get("/api/health")
    def health_fallback():
        return {"status": "error", "traceback": tb}
        
    @app.get("/{catchall:path}")
    def catch_all_fallback(catchall: str):
        return {"status": "error", "traceback": tb}
