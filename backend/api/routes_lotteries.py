"""
Lottery and Draw API routes.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ..database.supabase_client import db
from ..database.models import Loteria, Sorteo, EstadoSorteo

router = APIRouter(prefix="/api", tags=["Loterías y Sorteos"])

@router.get("/lotteries", response_model=List[Loteria])
def get_all_lotteries():
    return db.get_lotteries()

@router.get("/lotteries/{lottery_id}", response_model=Loteria)
def get_lottery(lottery_id: str):
    lot = db.get_lottery_by_id(lottery_id)
    if not lot:
        raise HTTPException(status_code=404, detail="Lotería no encontrada")
    return lot

@router.get("/lotteries/{lottery_id}/history")
def get_lottery_history(lottery_id: str, limit: int = Query(30, ge=1, le=200)):
    lot = db.get_lottery_by_id(lottery_id)
    if not lot:
        raise HTTPException(status_code=404, detail="Lotería no encontrada")
    
    draws = db.get_draws(lottery_id=lot.id, limit=limit)
    enriched = []
    for d in draws:
        res = db.get_result_by_draw_id(d.id)
        enriched.append({
            "sorteo": d,
            "resultado": res
        })
    return enriched

@router.get("/draws/upcoming")
def get_upcoming_draws(limit: int = Query(10, ge=1, le=50)):
    draws = [d for d in db.get_draws(limit=50) if d.estado in (EstadoSorteo.PROGRAMADO.value, EstadoSorteo.PREDICCION_GENERADA.value)]
    results = []
    for d in draws[:limit]:
        lot = db.get_lottery_by_id(d.loteria_id)
        preds = db.get_predictions(draw_id=d.id, limit=100)
        results.append({
            "sorteo": d,
            "loteria": lot,
            "total_predicciones": len(preds),
            "estado_bloqueo": len(preds) > 0
        })
    return results

@router.get("/schedules")
def get_all_schedules():
    from ..database.schedule_helper import get_next_draw_info
    lotteries = db.get_lotteries()
    schedules = {}
    for lot in lotteries:
        schedules[lot.codigo] = get_next_draw_info(lot.codigo)
    return schedules

@router.get("/lotteries/{lottery_code}/schedule")
def get_lottery_schedule(lottery_code: str):
    from ..database.schedule_helper import get_next_draw_info
    return get_next_draw_info(lottery_code)

