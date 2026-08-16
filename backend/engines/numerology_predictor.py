"""
Numerology Predictor: Digital Root Reductions, Theosophic Sums and Pythagorean Vibrations.
[EXPERIMENTAL - NO CIENTÍFICO]
"""
from typing import List, Dict, Any
from datetime import datetime
from .base_predictor import BasePredictor, PredictionCandidate

class NumerologyPredictor(BasePredictor):
    def get_model_code(self) -> str:
        return "NUMEROLOGY_ROOT"

    def is_scientific(self) -> bool:
        return False

    def _digital_root(self, n: int) -> int:
        while n > 9 and n not in (11, 22, 33):
            n = sum(int(d) for d in str(n))
        return n

    def generate_predictions(
        self,
        historical_numbers: List[str],
        target_date_iso: str,
        lottery_code: str,
        top_n: int = 10
    ) -> List[PredictionCandidate]:
        # Parse target date
        try:
            dt = datetime.strptime(target_date_iso[:10], "%Y-%m-%d")
        except Exception:
            dt = datetime.now()

        # 1. Calculate Life Path / Date Root
        day_root = self._digital_root(dt.day)
        month_root = self._digital_root(dt.month)
        year_root = self._digital_root(dt.year)
        total_date_root = self._digital_root(dt.day + dt.month + dt.year)

        # 2. Derive Pythagorean Sequences
        base_vibrations = [day_root, month_root, year_root, total_date_root]
        master_numbers = [11, 22, 33, 7, 9]

        candidates = []
        seen = set()

        # Combine historical digital roots with date vibrations
        hist_roots = []
        for num in historical_numbers[-10:] if historical_numbers else ["1234"]:
            clean = str(num).zfill(4)[-4:]
            hist_roots.append(self._digital_root(sum(int(d) for d in clean)))

        # Algorithmic derivation of candidates based on numerological tables
        for i in range(top_n * 3):
            d0 = (day_root + i * 2) % 10
            d1 = (month_root + i * 3) % 10
            d2 = (year_root + i) % 10
            d3 = (total_date_root + i * 4) % 10

            c_num = f"{d0}{d1}{d2}{d3}"
            if c_num not in seen:
                seen.add(c_num)
                rank = len(candidates) + 1
                
                sum_c = sum(int(d) for d in c_num)
                root_c = self._digital_root(sum_c)
                is_master = root_c in (11, 22, 33, 7, 9)

                score = round(84.0 - (rank * 2.2) + (3.0 if is_master else 0.0), 2)
                
                factors = {
                    "clasificacion": "[EXPERIMENTAL - HIPÓTESIS NO CIENTÍFICA]",
                    "raiz_fecha": f"Día:{day_root} + Mes:{month_root} + Año:{year_root} = {total_date_root}",
                    "raiz_candidato": f"Suma {sum_c} -> Raíz {root_c}",
                    "vibracion_maestra": "SÍ (Armónico Fuerte)" if is_master else "NO",
                    "reduccion_teosofica": f"Dígitos derivados de progresión {dt.strftime('%d/%m/%Y')}"
                }

                candidates.append(
                    PredictionCandidate(
                        numero=c_num,
                        score=score,
                        ranking=rank,
                        factores_explicacion=factors,
                        modelo_codigo=self.get_model_code()
                    )
                )

            if len(candidates) >= top_n:
                break

        return candidates[:top_n]
