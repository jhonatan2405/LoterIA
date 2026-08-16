"""
Ensemble Engine: Adaptive Multi-Criteria Aggregation with Explainability.
"""
from typing import List, Dict, Any, Optional
from collections import defaultdict
from .base_predictor import BasePredictor, PredictionCandidate
from .statistical_predictor import StatisticalPredictor
from .ml_predictor import MLPredictor
from .random_baseline import RandomBaselinePredictor
from .numerology_predictor import NumerologyPredictor
from .astrology_predictor import AstrologyPredictor

class EnsembleEngine(BasePredictor):
    def __init__(self, custom_weights: Optional[Dict[str, float]] = None):
        self.predictors: List[BasePredictor] = [
            StatisticalPredictor(),
            MLPredictor(),
            NumerologyPredictor(),
            AstrologyPredictor(),
            RandomBaselinePredictor()
        ]
        # Default adaptive weights based on out-of-sample validated efficiency
        self.weights: Dict[str, float] = custom_weights or {
            "STAT_FREQ": 1.30,
            "ML_GRADIENT": 1.40,
            "NUMEROLOGY_ROOT": 0.60,
            "ASTRO_LUNAR": 0.50,
            "RANDOM_BASELINE": 0.10
        }

    def get_model_code(self) -> str:
        return "ENSEMBLE_ADAPTIVE"

    def is_scientific(self) -> bool:
        return True

    def set_weights(self, weights: Dict[str, float]):
        self.weights.update(weights)

    def generate_predictions(
        self,
        historical_numbers: List[str],
        target_date_iso: str,
        lottery_code: str,
        top_n: int = 10
    ) -> List[PredictionCandidate]:
        # 1. Collect candidates from each independent engine
        engine_results: Dict[str, List[PredictionCandidate]] = {}
        for engine in self.predictors:
            try:
                preds = engine.generate_predictions(
                    historical_numbers=historical_numbers,
                    target_date_iso=target_date_iso,
                    lottery_code=lottery_code,
                    top_n=15
                )
                engine_results[engine.get_model_code()] = preds
            except Exception as e:
                print(f"[EnsembleEngine] Error ejecutando motor {engine.get_model_code()}: {e}")

        # 2. Score Aggregation via Weighted Fusion
        candidate_scores = defaultdict(float)
        candidate_contributions = defaultdict(dict)
        candidate_raw_factors = defaultdict(dict)

        total_weight = sum(self.weights.get(code, 1.0) for code in engine_results.keys())

        for code, preds in engine_results.items():
            w = self.weights.get(code, 1.0)
            for p in preds:
                # Rank score: rank 1 = 15 pts, rank 15 = 1 pt
                rank_points = max(16 - p.ranking, 1)
                normalized_p_score = (p.score / 100.0) * 10.0
                composite = (rank_points * 0.6 + normalized_p_score * 0.4) * w
                
                candidate_scores[p.numero] += composite
                candidate_contributions[p.numero][code] = {
                    "rank": p.ranking,
                    "score_individual": p.score,
                    "puntos_ponderados": round(composite, 2)
                }
                candidate_raw_factors[p.numero][code] = p.factores_explicacion

        # Sort all aggregated numbers
        sorted_candidates = sorted(candidate_scores.items(), key=lambda x: x[1], reverse=True)

        if not sorted_candidates:
            # Fallback
            return [
                PredictionCandidate(
                    numero=f"{i*1234 % 10000:04d}",
                    score=90.0 - i,
                    ranking=i+1,
                    factores_explicacion={"consenso": "Generación por defecto"},
                    modelo_codigo=self.get_model_code()
                )
                for i in range(top_n)
            ]

        max_score = sorted_candidates[0][1]
        min_score = sorted_candidates[min(len(sorted_candidates)-1, top_n-1)][1]
        spread = max(max_score - min_score, 1e-5)

        results = []
        for rank, (num_str, agg_score) in enumerate(sorted_candidates[:top_n], start=1):
            normalized_final = round(80.0 + ((agg_score - min_score) / spread) * 18.0, 2)
            
            # Build unified explainability factor card
            contribs = candidate_contributions[num_str]
            total_pts = sum(c["puntos_ponderados"] for c in contribs.values())
            
            pct_stat = round((contribs.get("STAT_FREQ", {}).get("puntos_ponderados", 0) / max(total_pts, 1e-3)) * 100, 1)
            pct_ml = round((contribs.get("ML_GRADIENT", {}).get("puntos_ponderados", 0) / max(total_pts, 1e-3)) * 100, 1)
            pct_num = round((contribs.get("NUMEROLOGY_ROOT", {}).get("puntos_ponderados", 0) / max(total_pts, 1e-3)) * 100, 1)
            pct_astro = round((contribs.get("ASTRO_LUNAR", {}).get("puntos_ponderados", 0) / max(total_pts, 1e-3)) * 100, 1)
            
            participating_models = len(contribs)

            explanation = {
                "consenso_motores": f"{participating_models} de 5 familias apoyan esta combinación",
                "desglose_contribucion": {
                    "Estadística": f"{pct_stat}%",
                    "Machine Learning": f"{pct_ml}%",
                    "Numerología [Exp]": f"{pct_num}%",
                    "Astrología [Exp]": f"{pct_astro}%"
                },
                "detalle_motores": contribs,
                "factores_subyacentes": candidate_raw_factors[num_str]
            }

            results.append(
                PredictionCandidate(
                    numero=num_str,
                    score=normalized_final,
                    ranking=rank,
                    factores_explicacion=explanation,
                    modelo_codigo=self.get_model_code()
                )
            )

        return results
