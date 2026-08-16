"""
Results and Official Draw Data API routes.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ..database.supabase_client import db
from ..database.models import Resultado

router = APIRouter(prefix="/api/results", tags=["Resultados Oficiales"])

@router.get("/recent")
def get_recent_results(limit: int = Query(50, ge=1, le=100)):
    results = db.get_results(limit=100)
    enriched = []
    for r in results:
        draw = db.get_draw_by_id(r.sorteo_id)
        lot = db.get_lottery_by_id(draw.loteria_id) if draw else None
        
        # Check evaluations for this result
        evals = [e for e in db.get_evaluations(limit=500) if e.resultado_id == r.id]
        exact_hits = sum(1 for e in evals if e.acierto_exacto)
        pos_hits_3 = sum(1 for e in evals if e.aciertos_3_cifras)
        
        enriched.append({
            "resultado": r,
            "sorteo": draw,
            "loteria": lot,
            "total_evaluaciones": len(evals),
            "aciertos_exactos_en_predicciones": exact_hits,
            "aciertos_3_cifras_en_predicciones": pos_hits_3
        })
    # Sort descending by draw date
    enriched.sort(key=lambda item: (item["sorteo"].fecha_programada if item["sorteo"] else "") or "", reverse=True)
    return enriched[:limit]

@router.get("/{result_id}")
def get_result_detail(result_id: str):
    for r in db.get_results(limit=500):
        if r.id == result_id or r.sorteo_id == result_id:
            draw = db.get_draw_by_id(r.sorteo_id)
            lot = db.get_lottery_by_id(draw.loteria_id) if draw else None
            evals = [e for e in db.get_evaluations(limit=500) if e.resultado_id == r.id]
            return {
                "resultado": r,
                "sorteo": draw,
                "loteria": lot,
                "evaluaciones": evals
            }
    raise HTTPException(status_code=404, detail="Resultado no encontrado")
