"""
Random Baseline Predictor: Pure Pseudo-Random Uniform Control Model (H0 Hypothesis).
"""
import random
from typing import List, Dict, Any
from .base_predictor import BasePredictor, PredictionCandidate

class RandomBaselinePredictor(BasePredictor):
    def get_model_code(self) -> str:
        return "RANDOM_BASELINE"

    def is_scientific(self) -> bool:
        return True

    def generate_predictions(
        self,
        historical_numbers: List[str],
        target_date_iso: str,
        lottery_code: str,
        top_n: int = 10
    ) -> List[PredictionCandidate]:
        # Cryptographic/deterministic PRNG seeded by target date and lottery for consistency
        seed_val = int(sum(ord(c) for c in f"{target_date_iso}:{lottery_code}"))
        rng = random.Random(seed_val)
        
        candidates = []
        seen = set()
        while len(candidates) < top_n:
            num = f"{rng.randint(0, 9999):04d}"
            if num not in seen:
                seen.add(num)
                rank = len(candidates) + 1
                candidates.append(
                    PredictionCandidate(
                        numero=num,
                        score=round(50.0 - (rank * 0.5) + rng.uniform(-0.2, 0.2), 2),
                        ranking=rank,
                        factores_explicacion={
                            "metodo": "Muestreo IID Uniforme U(0000, 9999)",
                            "probabilidad_teorica_acierto": "0.01% (1 / 10,000)",
                            "funcion_control": "Hipótesis Nula (H0)",
                            "semilla_referencia": seed_val
                        },
                        modelo_codigo=self.get_model_code()
                    )
                )

        return candidates
