"""
Predictions API routes.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from ..database.supabase_client import db
from ..database.models import Prediccion, EstadoSorteo

router = APIRouter(prefix="/api/predictions", tags=["Predicciones Bloqueadas"])

@router.get("/active")
def get_active_locked_predictions(limit: int = Query(300, ge=1, le=1000)):
    """
    Returns active locked predictions for upcoming draws with full explainability.
    """
    preds = db.get_predictions(limit=limit)
    enriched = []
    
    for p in preds:
        draw = db.get_draw_by_id(p.sorteo_id)
        lot = db.get_lottery_by_id(draw.loteria_id) if draw else None
        
        # Find model info
        version = None
        for v in db.get_model_versions():
            if v.id == p.version_modelo_id:
                version = v
                break
        model = db.get_model_by_id(version.modelo_id) if version else None

        enriched.append({
            "prediccion": p,
            "sorteo": draw,
            "loteria": lot,
            "modelo": model,
            "version": version
        })
    return enriched

@router.get("/by-draw/{draw_id}")
def get_predictions_by_draw(draw_id: str):
    preds = db.get_predictions(draw_id=draw_id, limit=200)
    draw = db.get_draw_by_id(draw_id)
    lot = db.get_lottery_by_id(draw.loteria_id) if draw else None
    
    # Group by model
    grouped: Dict[str, Any] = {}
    for p in preds:
        v = next((ver for ver in db.get_model_versions() if ver.id == p.version_modelo_id), None)
        m = db.get_model_by_id(v.modelo_id) if v else None
        m_code = m.codigo if m else "UNKNOWN"
        
        if m_code not in grouped:
            grouped[m_code] = {
                "modelo": m,
                "version": v,
                "candidatos": []
            }
        grouped[m_code]["candidatos"].append(p)

    return {
        "sorteo": draw,
        "loteria": lot,
        "modelos_predicciones": grouped
    }
