import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes_lotteries import router as lotteries_router
from .routes_predictions import router as predictions_router
from .routes_results import router as results_router
from .routes_models import router as models_router
from .routes_evaluations import router as evaluations_router
from .routes_system import router as system_router

app = FastAPI(
    title="LoterIA (ALPES) - Backend API",
    description="Sistema Autónomo de Análisis, Predicción y Evaluación de Loterías de Colombia con Base de Datos Supabase.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Sub-routers
app.include_router(lotteries_router)
app.include_router(predictions_router)
app.include_router(results_router)
app.include_router(models_router)
app.include_router(evaluations_router)
app.include_router(system_router)

@app.get("/")
def root():
    return {
        "system": "LoterIA (ALPES) - Autonomous Lottery Prediction & Evaluation System",
        "version": "1.0.0",
        "database": "Supabase (PostgreSQL)",
        "status": "OPERATIONAL",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.api.main:app", host="0.0.0.0", port=8000, reload=True)
