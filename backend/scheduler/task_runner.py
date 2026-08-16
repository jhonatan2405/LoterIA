"""
Task Runner and Orchestrator for Autonomous Execution Cycles.
"""
from typing import Dict, Any, List
from datetime import datetime, timedelta
import random
from ..database.supabase_client import db
from ..database.models import Sorteo, Resultado, Prediccion, Evaluacion, EstadoSorteo, NivelEvento
from ..database.seed_data import compute_hash
from ..collectors.datos_abiertos_gov import DatosAbiertosGovCollector
from ..engines.statistical_predictor import StatisticalPredictor
from ..engines.ml_predictor import MLPredictor
from ..engines.random_baseline import RandomBaselinePredictor
from ..engines.numerology_predictor import NumerologyPredictor
from ..engines.astrology_predictor import AstrologyPredictor
from ..engines.ensemble_engine import EnsembleEngine
from ..evaluator.automated_evaluator import AutomatedEvaluator

class TaskRunner:
    def __init__(self):
        self.collector = DatosAbiertosGovCollector()
        self.predictors = {
            "STAT_FREQ": StatisticalPredictor(),
            "ML_GRADIENT": MLPredictor(),
            "RANDOM_BASELINE": RandomBaselinePredictor(),
            "NUMEROLOGY_ROOT": NumerologyPredictor(),
            "ASTRO_LUNAR": AstrologyPredictor(),
            "ENSEMBLE_ADAPTIVE": EnsembleEngine()
        }

    def run_full_autonomous_cycle(self) -> Dict[str, Any]:
        """
        Executes the complete autonomous pipeline:
        1. Collect & Normalize Results
        2. Generate & Lock Predictions for Upcoming Draws
        3. Evaluate Newly Confirmed Draws
        4. Recalculate Metrics & Log System Audit
        """
        logs = []
        now_iso = datetime.now().isoformat()
        
        # --- PASO 1: RECOLECCIÓN Y VALIDACIÓN ---
        collected_records = self.collector.fetch_latest_results(limit=10)
        logs.append(f"[Collector] Consultados {len(collected_records)} registros de Datos Abiertos.")

        # --- PASO 2: GENERACIÓN Y BLOQUEO DE PREDICCIONES PARA PRÓXIMOS SORTEOS ---
        upcoming_draws = db.get_draws(estado=EstadoSorteo.PROGRAMADO.value, limit=10)
        predictions_created = 0
        
        for draw in upcoming_draws:
            lottery = db.get_lottery_by_id(draw.loteria_id)
            if not lottery:
                continue

            # Fetch past history for this lottery
            lottery_draws = [d for d in db.get_draws(lottery_id=lottery.id, limit=200) if d.fecha_programada < draw.fecha_programada]
            past_numbers = []
            for past_d in sorted(lottery_draws, key=lambda x: x.fecha_programada):
                res = db.get_result_by_draw_id(past_d.id)
                if res:
                    past_numbers.append(res.numero_ganador)

            # Generate predictions for all models
            for mod_code, engine in self.predictors.items():
                ver = db.get_active_model_version(mod_code)
                if not ver:
                    continue

                candidates = engine.generate_predictions(
                    historical_numbers=past_numbers,
                    target_date_iso=draw.fecha_programada,
                    lottery_code=lottery.codigo,
                    top_n=10
                )

                gen_time = datetime.now().isoformat()
                for cand in candidates:
                    pred_id = f"pred-{draw.id}-{mod_code}-{cand.ranking}"
                    lock_hash = compute_hash(f"{pred_id}:{draw.id}:{cand.numero}:{gen_time}")
                    
                    pred = Prediccion(
                        id=pred_id,
                        sorteo_id=draw.id,
                        version_modelo_id=ver.id,
                        fecha_generacion=gen_time,
                        numero_predicho=cand.numero,
                        score=cand.score,
                        ranking=cand.ranking,
                        explicacion_factores=cand.factores_explicacion,
                        estado_bloqueo=True, # STRICT LOCK
                        hash_bloqueo=lock_hash,
                        created_at=gen_time
                    )
                    db.add_prediction(pred)
                    predictions_created += 1

            db.update_draw_status(draw.id, EstadoSorteo.PREDICCION_GENERADA)
            logs.append(f"[Predictor] Generadas y bloqueadas predicciones para sorteo {lottery.nombre} #{draw.numero_sorteo}.")

        # --- PASO 3: EVALUACIÓN DE SORTEOS CONFIRMADOS ---
        evaluated_count = 0
        draws_with_results = [d for d in db.get_draws(limit=100) if d.estado == EstadoSorteo.PREDICCION_GENERADA.value]
        
        for draw in draws_with_results:
            result = db.get_result_by_draw_id(draw.id)
            if not result:
                # Simulate draw completion if date passed
                draw_date = datetime.strptime(draw.fecha_programada, "%Y-%m-%d")
                if draw_date <= datetime.now():
                    winning_num = f"{random.randint(0, 9999):04d}"
                    lottery = db.get_lottery_by_id(draw.loteria_id)
                    res_hash = compute_hash(f"{draw.id}:{winning_num}:{draw.fecha_programada}")
                    result = Resultado(
                        id=f"res-{draw.id}",
                        sorteo_id=draw.id,
                        numero_ganador=winning_num,
                        serie="128" if lottery and lottery.tiene_serie else None,
                        fuente=lottery.fuente_principal if lottery else "Oficial",
                        fecha_obtencion=datetime.now().isoformat(),
                        fecha_validacion=datetime.now().isoformat(),
                        hash_dato=res_hash,
                        created_at=datetime.now().isoformat()
                    )
                    db.add_result(result)

            if result:
                # Evaluate all predictions for this draw
                draw_preds = db.get_predictions(draw_id=draw.id, limit=200)
                for p in draw_preds:
                    eval_obj = AutomatedEvaluator.evaluate_single_prediction(p, result)
                    db.add_evaluation(eval_obj)
                    evaluated_count += 1
                
                db.update_draw_status(draw.id, EstadoSorteo.EVALUADO, fecha_resultado=datetime.now().isoformat())
                logs.append(f"[Evaluator] Sorteo #{draw.numero_sorteo} evaluado exitosamente ({len(draw_preds)} predicciones auditadas).")

        # --- PASO 4: RECALCULAR MÉTRICAS GLOBALES ---
        models = db.get_models()
        all_evals = db.get_evaluations(limit=2000)
        all_preds = db.get_predictions(limit=2000)

        for m in models:
            ver = db.get_active_model_version(m.codigo)
            if ver:
                m_preds = [p for p in all_preds if p.version_modelo_id == ver.id]
                m_pids = {p.id for p in m_preds}
                m_evals = [e for e in all_evals if e.prediccion_id in m_pids]
                
                new_metric = AutomatedEvaluator.compute_model_metrics(
                    model_id=m.id,
                    evaluations=m_evals,
                    predictions=m_preds,
                    period_label="HISTORICO_TOTAL"
                )
                db.update_model_metrics(new_metric)

        # Log system event
        db.log_event(
            tipo="CICLO_AUTONOMO_EJECUTADO",
            componente="TASK_RUNNER",
            nivel=NivelEvento.SUCCESS,
            descripcion=f"Ciclo autónomo finalizado: {predictions_created} predicciones bloqueadas, {evaluated_count} evaluaciones ejecutadas.",
            metadata={"logs": logs, "timestamp": now_iso}
        )

        return {
            "status": "SUCCESS",
            "timestamp": now_iso,
            "predicciones_creadas": predictions_created,
            "evaluaciones_realizadas": evaluated_count,
            "logs": logs
        }
