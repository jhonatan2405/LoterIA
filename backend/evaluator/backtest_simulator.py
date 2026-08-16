"""
Backtest Simulator: Strict Chronological Walk-Forward Simulation without Data Leakage.
"""
from typing import List, Dict, Any, Optional
import time
from datetime import datetime
from ..engines.statistical_predictor import StatisticalPredictor
from ..engines.ml_predictor import MLPredictor
from ..engines.random_baseline import RandomBaselinePredictor
from ..engines.numerology_predictor import NumerologyPredictor
from ..engines.astrology_predictor import AstrologyPredictor
from ..engines.ensemble_engine import EnsembleEngine
from .automated_evaluator import AutomatedEvaluator
from ..database.models import Prediccion, Resultado

class BacktestSimulator:
    def __init__(self):
        self.predictors = {
            "STAT_FREQ": StatisticalPredictor(),
            "ML_GRADIENT": MLPredictor(),
            "RANDOM_BASELINE": RandomBaselinePredictor(),
            "NUMEROLOGY_ROOT": NumerologyPredictor(),
            "ASTRO_LUNAR": AstrologyPredictor(),
            "ENSEMBLE_ADAPTIVE": EnsembleEngine()
        }

    def run_simulation(
        self,
        historical_draws: List[Dict[str, Any]], # List of dicts with keys: draw_number, date, winning_number
        lottery_code: str,
        lookback_window: int = 30,
        top_k: int = 10,
        models_to_test: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Executes step-by-step walk-forward backtest.
        At each step t:
        - History = draws[0 ... t-1]
        - Target = draws[t]
        - Predict -> Lock -> Evaluate vs draws[t] winning number
        """
        start_time = time.time()
        active_models = models_to_test or list(self.predictors.keys())

        # Ensure sorted chronologically
        draws = sorted(historical_draws, key=lambda d: d.get("date", ""))
        total_draws = len(draws)

        if total_draws <= lookback_window:
            return {
                "error": f"Historial insuficiente ({total_draws} sorteos). Se requieren al menos {lookback_window + 5} sorteos para backtesting.",
                "total_simulado": 0
            }

        model_stats = {
            m: {
                "total_evaluados": 0,
                "aciertos_exactos": 0,
                "aciertos_3_cifras": 0,
                "aciertos_2_cifras": 0,
                "aciertos_posicionales": 0,
                "top_1_hits": 0,
                "top_5_hits": 0,
                "evolucion_ratio": []
            }
            for m in active_models
        }

        timeline_points = []

        # Chronological walk-forward
        for step in range(lookback_window, total_draws):
            past_history = [d["winning_number"] for d in draws[:step]]
            target_draw = draws[step]
            target_date = target_draw.get("date", "2025-01-01")
            actual_winning_num = str(target_draw["winning_number"]).zfill(4)[-4:]

            step_summary = {
                "draw_number": target_draw.get("draw_number", str(step)),
                "date": target_date,
                "winning_number": actual_winning_num,
                "models": {}
            }

            for mod_code in active_models:
                engine = self.predictors.get(mod_code)
                if not engine:
                    continue

                # Generate candidates using ONLY past_history (No future data!)
                candidates = engine.generate_predictions(
                    historical_numbers=past_history,
                    target_date_iso=target_date,
                    lottery_code=lottery_code,
                    top_n=top_k
                )

                # Mock result for evaluation
                mock_res = Resultado(
                    sorteo_id=f"bt-sorteo-{step}",
                    numero_ganador=actual_winning_num,
                    fuente="BACKTEST_SIMULATOR",
                    hash_dato="bt_hash"
                )

                # Check highest match among candidates
                best_exact = False
                best_3 = False
                best_2 = False
                best_pos = 0
                top1_exact = False

                for cand in candidates:
                    mock_pred = Prediccion(
                        sorteo_id=f"bt-sorteo-{step}",
                        version_modelo_id=f"ver-{mod_code.lower()}",
                        numero_predicho=cand.numero,
                        score=cand.score,
                        ranking=cand.ranking,
                        hash_bloqueo="bt_lock"
                    )
                    ev = AutomatedEvaluator.evaluate_single_prediction(mock_pred, mock_res)
                    
                    if ev.acierto_exacto:
                        best_exact = True
                    if ev.aciertos_3_cifras:
                        best_3 = True
                    if ev.aciertos_2_cifras:
                        best_2 = True
                    if ev.posiciones_correctas > best_pos:
                        best_pos = ev.posiciones_correctas
                    if cand.ranking == 1 and (ev.acierto_exacto or ev.aciertos_3_cifras):
                        top1_exact = True

                # Update stats
                s = model_stats[mod_code]
                s["total_evaluados"] += 1
                if best_exact:
                    s["aciertos_exactos"] += 1
                if best_3:
                    s["aciertos_3_cifras"] += 1
                if best_2:
                    s["aciertos_2_cifras"] += 1
                s["aciertos_posicionales"] += best_pos
                if top1_exact:
                    s["top_1_hits"] += 1

                current_avg_pos = s["aciertos_posicionales"] / max(s["total_evaluados"], 1)
                # Pure chance benchmark = 0.400 * average top_k combinations
                current_ratio = round(current_avg_pos / 0.400, 3)
                
                step_summary["models"][mod_code] = {
                    "top_candidate": candidates[0].numero if candidates else "0000",
                    "best_pos_match": best_pos,
                    "hit_exact": best_exact,
                    "hit_3": best_3,
                    "hit_2": best_2,
                    "cumulative_ratio": current_ratio
                }

            timeline_points.append(step_summary)

        # Build final comparative summary
        total_steps = total_draws - lookback_window
        summary_results = []
        
        for mod_code, st in model_stats.items():
            tot = max(st["total_evaluados"], 1)
            avg_pos = st["aciertos_posicionales"] / float(tot)
            ratio = round(avg_pos / 0.400, 3)
            
            summary_results.append({
                "modelo_codigo": mod_code,
                "total_simulados": st["total_evaluados"],
                "aciertos_exactos": st["aciertos_exactos"],
                "aciertos_3_cifras": st["aciertos_3_cifras"],
                "aciertos_2_cifras": st["aciertos_2_cifras"],
                "aciertos_posicionales_promedio": round(avg_pos, 3),
                "top_1_accuracy": round(st["top_1_hits"] / float(tot), 4),
                "ratio_vs_random": ratio,
                "rendimiento_vs_azar_pct": f"{(ratio - 1.0) * 100:+.2f}%"
            })

        summary_results.sort(key=lambda x: x["ratio_vs_random"], reverse=True)

        return {
            "loteria_codigo": lottery_code,
            "total_sorteos_simulados": total_steps,
            "ventana_inicio": lookback_window,
            "duracion_segundos": round(time.time() - start_time, 2),
            "modelos_resumen": summary_results,
            "puntos_temporales": timeline_points[-30:] # Last 30 points for chart rendering
        }
