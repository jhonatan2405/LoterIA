"""
Evaluations API routes.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List
from ..database.supabase_client import db
from ..database.models import Evaluacion

router = APIRouter(prefix="/api/evaluations", tags=["Evaluaciones Automáticas"])

@router.get("/recent")
def get_recent_evaluations(limit: int = Query(50, ge=1, le=200)):
    evals = db.get_evaluations(limit=limit)
    enriched = []
    
    for e in evals:
        # Get prediction and draw
        pred = next((p for p in db.get_predictions(limit=500) if p.id == e.prediccion_id), None)
        draw = db.get_draw_by_id(pred.sorteo_id) if pred else None
        lot = db.get_lottery_by_id(draw.loteria_id) if draw else None

        enriched.append({
            "evaluacion": e,
            "prediccion": pred,
            "sorteo": draw,
            "loteria": lot
        })

    return enriched
