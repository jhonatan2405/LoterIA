"""
Models and Scientific Benchmark API routes.
"""
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from ..database.supabase_client import db
from ..database.models import Modelo, VersionModelo, MetricaModelo

router = APIRouter(prefix="/api/models", tags=["Modelos y Benchmark vs Azar"])

@router.get("", response_model=List[Modelo])
def get_all_models():
    return db.get_models()

@router.get("/benchmark")
def get_model_benchmark_comparison():
    """
    Returns comparative benchmark of all models directly evaluated against the Random Baseline (1.00x).
    """
    models = db.get_models()
    metrics = db.get_metrics()
    versions = db.get_model_versions()

    benchmark_list = []
    for m in models:
        # Find metric
        met = next((item for item in metrics if item.modelo_id == m.id and item.periodo == "HISTORICO_TOTAL"), None)
        active_ver = next((v for v in versions if v.modelo_id == m.id and v.activo), None)

        benchmark_list.append({
            "modelo_id": m.id,
            "codigo": m.codigo,
            "nombre": m.nombre,
            "familia": m.familia,
            "es_cientifico": m.es_cientifico,
            "badge_color": m.badge_color,
            "version": active_ver.version if active_ver else "v1.0.0",
            "metricas": met,
            "ratio_vs_random": met.ratio_vs_random if met else 1.000,
            "p_value_vs_random": met.p_value_vs_random if met else 1.000000,
            "significativo_95": (met.p_value_vs_random < 0.05) if met else False,
            "interpretacion_cientifica": (
                "Supera el umbral de significancia estadística (p < 0.05)" 
                if met and met.p_value_vs_random < 0.05 
                else "Rendimiento no diferenciable del azar estadístico (p >= 0.05)"
            )
        })

    # Sort descending by ratio vs random
    benchmark_list.sort(key=lambda x: x["ratio_vs_random"], reverse=True)
    return benchmark_list

@router.get("/{model_id}")
def get_model_detail(model_id: str):
    m = db.get_model_by_id(model_id)
    if not m:
        raise HTTPException(status_code=404, detail="Modelo no encontrado")
    vers = db.get_model_versions(model_id=m.id)
    mets = [item for item in db.get_metrics() if item.modelo_id == m.id]
    return {
        "modelo": m,
        "versiones": vers,
        "metricas": mets
    }
