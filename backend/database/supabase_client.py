"""
Supabase repository and local fallback store for LoterIA (ALPES).
Provides unified querying, prediction locking enforcement, and data persistence.
"""
import os
import json
from dotenv import load_dotenv

# Load .env from backend or root directory
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv()

from typing import List, Dict, Any, Optional
from datetime import datetime
from .models import (
    Loteria, Sorteo, Resultado, Modelo, VersionModelo,
    Prediccion, Evaluacion, MetricaModelo, EventoSistema,
    EstadoSorteo, NivelEvento
)
from .seed_data import generate_historical_dataset, compute_hash
from .sqlite_manager import sqlite_store

class DatabaseRepository:
    def __init__(self):
        self.supabase_url = os.environ.get("SUPABASE_URL")
        self.supabase_key = os.environ.get("SUPABASE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        self.use_remote = bool(self.supabase_url and self.supabase_key)
        self.client = None

        if self.use_remote:
            try:
                from supabase import create_client
                self.client = create_client(self.supabase_url, self.supabase_key)
                print(f"[Supabase] Conectado exitosamente a Supabase: {self.supabase_url}")
            except Exception as e:
                print(f"[Supabase] Error al conectar con Supabase remoto ({e}). Usando motor local integrado.")
                self.use_remote = False

        # In-memory unified store
        self._data: Dict[str, List[Any]] = {
            "loterias": [],
            "modelos": [],
            "versiones_modelo": [],
            "sorteos": [],
            "resultados": [],
            "predicciones": [],
            "evaluaciones": [],
            "metricas_modelo": [],
            "eventos_sistema": [],
            "registros_actualizacion": []
        }
        self._initialize_local_seed()

    def _initialize_local_seed(self):
        """Populates the database repository with Colombian lotteries and historical seed, persisting to SQLite."""
        seed = generate_historical_dataset(num_draws_per_lottery=40)
        for key in seed:
            self._data[key] = seed[key]
        try:
            sqlite_store.sync_dataset(seed)
            print(f"[DatabaseRepository] SQLite 'loteria_db.sqlite' sincronizada con {len(self._data['loterias'])} loterías, {len(self._data['sorteos'])} sorteos, {len(self._data['predicciones'])} predicciones.")
        except Exception as err:
            print(f"[DatabaseRepository] Advertencia SQLite: {err}")

    # -------------------------------------------------------------
    # LOTERIAS
    # -------------------------------------------------------------
    def get_lotteries(self) -> List[Loteria]:
        return self._data["loterias"]

    def get_lottery_by_id(self, lottery_id: str) -> Optional[Loteria]:
        for lot in self._data["loterias"]:
            if lot.id == lottery_id or lot.codigo == lottery_id:
                return lot
        return None

    # -------------------------------------------------------------
    # SORTEOS
    # -------------------------------------------------------------
    def get_draws(self, lottery_id: Optional[str] = None, estado: Optional[str] = None, limit: int = 50) -> List[Sorteo]:
        draws = self._data["sorteos"]
        if lottery_id:
            draws = [d for d in draws if d.loteria_id == lottery_id]
        if estado:
            draws = [d for d in draws if d.estado == estado]
        return sorted(draws, key=lambda x: x.fecha_programada, reverse=True)[:limit]

    def get_draw_by_id(self, draw_id: str) -> Optional[Sorteo]:
        for d in self._data["sorteos"]:
            if d.id == draw_id:
                return d
        return None

    def add_draw(self, draw: Sorteo) -> Sorteo:
        # Check duplicate
        for d in self._data["sorteos"]:
            if d.loteria_id == draw.loteria_id and d.numero_sorteo == draw.numero_sorteo and d.fecha_programada == draw.fecha_programada:
                return d
        self._data["sorteos"].append(draw)
        return draw

    def update_draw_status(self, draw_id: str, new_status: EstadoSorteo, fecha_resultado: Optional[str] = None):
        for d in self._data["sorteos"]:
            if d.id == draw_id:
                d.estado = new_status
                if fecha_resultado:
                    d.fecha_resultado = fecha_resultado
                break

    # -------------------------------------------------------------
    # RESULTADOS
    # -------------------------------------------------------------
    def get_results(self, limit: int = 50) -> List[Resultado]:
        return sorted(self._data["resultados"], key=lambda r: r.fecha_obtencion or "", reverse=True)[:limit]

    def get_result_by_draw_id(self, draw_id: str) -> Optional[Resultado]:
        for r in self._data["resultados"]:
            if r.sorteo_id == draw_id:
                return r
        return None

    def add_result(self, result: Resultado) -> Resultado:
        # Check duplicate
        for r in self._data["resultados"]:
            if r.sorteo_id == result.sorteo_id:
                return r
        self._data["resultados"].append(result)
        try:
            sqlite_store.insert_result(result)
        except Exception:
            pass
        return result

    # -------------------------------------------------------------
    # MODELOS Y VERSIONES
    # -------------------------------------------------------------
    def get_models(self) -> List[Modelo]:
        return self._data["modelos"]

    def get_model_by_id(self, model_id: str) -> Optional[Modelo]:
        for m in self._data["modelos"]:
            if m.id == model_id or m.codigo == model_id:
                return m
        return None

    def get_model_versions(self, model_id: Optional[str] = None) -> List[VersionModelo]:
        vers = self._data["versiones_modelo"]
        if model_id:
            vers = [v for v in vers if v.modelo_id == model_id]
        return vers

    def get_active_model_version(self, model_id: str) -> Optional[VersionModelo]:
        for v in self._data["versiones_modelo"]:
            if (v.modelo_id == model_id or v.id == f"ver-{model_id.lower()}") and v.activo:
                return v
        return None

    # -------------------------------------------------------------
    # PREDICCIONES (CON BLOQUEO ESTRICTO)
    # -------------------------------------------------------------
    def get_predictions(self, draw_id: Optional[str] = None, version_id: Optional[str] = None, limit: int = 100) -> List[Prediccion]:
        preds = self._data["predicciones"]
        if draw_id:
            preds = [p for p in preds if p.sorteo_id == draw_id]
        if version_id:
            preds = [p for p in preds if p.version_modelo_id == version_id]
        return sorted(preds, key=lambda p: (p.fecha_generacion or "", p.ranking), reverse=True)[:limit]

    def add_prediction(self, prediction: Prediccion) -> Prediccion:
        """
        Enforces locking hash generation and immutable storage.
        """
        if not prediction.hash_bloqueo:
            prediction.hash_bloqueo = compute_hash(
                f"{prediction.id}:{prediction.sorteo_id}:{prediction.numero_predicho}:{prediction.fecha_generacion}"
            )
        prediction.estado_bloqueo = True
        self._data["predicciones"].append(prediction)
        try:
            sqlite_store.insert_prediction(prediction)
        except Exception:
            pass
        return prediction

    def update_prediction(self, prediction_id: str, **kwargs):
        """
        Simulates the PostgreSQL lock trigger: updates are strictly FORBIDDEN if estado_bloqueo is TRUE.
        """
        for p in self._data["predicciones"]:
            if p.id == prediction_id:
                if p.estado_bloqueo:
                    raise PermissionError(
                        f"VIOLACIÓN DE INTEGRIDAD ANTI-LEAKAGE: La predicción ID {prediction_id} está bloqueada y no permite modificaciones."
                    )
                for k, v in kwargs.items():
                    setattr(p, k, v)
                return p
        raise ValueError(f"Predicción {prediction_id} no encontrada.")

    # -------------------------------------------------------------
    # EVALUACIONES
    # -------------------------------------------------------------
    def get_evaluations(self, limit: int = 100) -> List[Evaluacion]:
        return sorted(self._data["evaluaciones"], key=lambda e: e.fecha_evaluacion or "", reverse=True)[:limit]

    def add_evaluation(self, eval_obj: Evaluacion) -> Evaluacion:
        self._data["evaluaciones"].append(eval_obj)
        try:
            sqlite_store.insert_evaluation(eval_obj)
        except Exception:
            pass
        return eval_obj

    # -------------------------------------------------------------
    # METRICAS
    # -------------------------------------------------------------
    def get_metrics(self) -> List[MetricaModelo]:
        return self._data["metricas_modelo"]

    def update_model_metrics(self, metric: MetricaModelo):
        for idx, m in enumerate(self._data["metricas_modelo"]):
            if m.modelo_id == metric.modelo_id and m.periodo == metric.periodo:
                self._data["metricas_modelo"][idx] = metric
                return
        self._data["metricas_modelo"].append(metric)

    # -------------------------------------------------------------
    # EVENTOS DE SISTEMA & AUDITORIA
    # -------------------------------------------------------------
    def log_event(self, tipo: str, componente: str, nivel: NivelEvento, descripcion: str, metadata: Optional[Dict[str, Any]] = None) -> EventoSistema:
        ev = EventoSistema(
            tipo_evento=tipo,
            componente=componente,
            nivel=nivel,
            descripcion=descripcion,
            metadata=metadata or {},
            created_at=datetime.now().isoformat()
        )
        self._data["eventos_sistema"].append(ev)
        return ev

    def get_system_events(self, limit: int = 50) -> List[EventoSistema]:
        return sorted(self._data["eventos_sistema"], key=lambda e: e.created_at or "", reverse=True)[:limit]

# Singleton instance
db = DatabaseRepository()
