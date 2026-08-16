"""
Statistical Predictor: Positional frequencies, Hot/Cold/Delay scoring, Sums and Parity distributions.
"""
from typing import List, Dict, Any
import numpy as np
from collections import Counter
from .base_predictor import BasePredictor, PredictionCandidate

class StatisticalPredictor(BasePredictor):
    def get_model_code(self) -> str:
        return "STAT_FREQ"

    def is_scientific(self) -> bool:
        return True

    def generate_predictions(
        self,
        historical_numbers: List[str],
        target_date_iso: str,
        lottery_code: str,
        top_n: int = 10
    ) -> List[PredictionCandidate]:
        if not historical_numbers:
            # Fallback if no history
            return [
                PredictionCandidate(
                    numero=f"{i*1111:04d}",
                    score=50.0 - i,
                    ranking=i+1,
                    factores_explicacion={"nota": "Sin historial suficiente"},
                    modelo_codigo=self.get_model_code()
                )
                for i in range(top_n)
            ]

        # Calculate positional frequency tables (positions 0, 1, 2, 3)
        pos_freq = [Counter() for _ in range(4)]
        delays = [{d: 0 for d in range(10)} for _ in range(4)]
        
        # Walk through historical numbers
        for num in historical_numbers:
            clean_num = str(num).zfill(4)[-4:]
            for pos in range(4):
                digit = int(clean_num[pos])
                pos_freq[pos][digit] += 1
                # Update delays
                for d in range(10):
                    if d == digit:
                        delays[pos][d] = 0
                    else:
                        delays[pos][d] += 1

        total_draws = len(historical_numbers)
        pos_prob = []
        for pos in range(4):
            probs = {}
            for d in range(10):
                # Frequency score + delay penalty/bonus
                freq_ratio = (pos_freq[pos][d] + 1) / (total_draws + 10)
                # Digits that haven't appeared in a long time vs recent hot digits
                delay_val = delays[pos][d]
                # Combined metric: balanced mixture of high historic frequency and moderate delay
                prob_score = freq_ratio * 0.7 + (min(delay_val, 20) / 20.0) * 0.3
                probs[d] = prob_score
            pos_prob.append(probs)

        # Generate top combinations
        scored_combinations = []
        
        # Sort top digits per position
        sorted_pos = []
        for pos in range(4):
            sorted_pos.append(sorted(pos_prob[pos].items(), key=lambda x: x[1], reverse=True))

        # Generate candidates from Cartesian product of top positional digits
        for d0, s0 in sorted_pos[0][:4]:
            for d1, s1 in sorted_pos[1][:4]:
                for d2, s2 in sorted_pos[2][:4]:
                    for d3, s3 in sorted_pos[3][:4]:
                        num_str = f"{d0}{d1}{d2}{d3}"
                        
                        # Sum penalty/reward: Expected mean ~ 18 (4 * 4.5)
                        sum_digits = d0 + d1 + d2 + d3
                        # Gaussian probability density around mean=18, std=5.5
                        sum_prob = np.exp(-0.5 * ((sum_digits - 18) / 5.5) ** 2)
                        
                        # Parity balance: 2 Even, 2 Odd is most likely (37.5%)
                        even_count = sum(1 for d in (d0, d1, d2, d3) if d % 2 == 0)
                        parity_bonus = 1.1 if even_count == 2 else (0.95 if even_count in (1, 3) else 0.8)
                        
                        raw_score = (s0 * s1 * s2 * s3) * 100000.0 * sum_prob * parity_bonus
                        
                        delays_list = [delays[0][d0], delays[1][d1], delays[2][d2], delays[3][d3]]
                        hot_cold_label = "Caliente" if np.mean(delays_list) < 5 else ("Atrasado" if np.mean(delays_list) > 12 else "Equilibrado")
                        
                        factors = {
                            "frecuencia_posicional": f"[{pos_freq[0][d0]}, {pos_freq[1][d1]}, {pos_freq[2][d2]}, {pos_freq[3][d3]}] apariciones",
                            "retraso_medio": f"{np.mean(delays_list):.1f} sorteos",
                            "suma_total": f"{sum_digits} (desviación vs 18: {abs(sum_digits-18)})",
                            "paridad": f"{even_count} Pares / {4-even_count} Impares",
                            "temperatura": hot_cold_label
                        }
                        scored_combinations.append((num_str, raw_score, factors))

        # Sort by raw_score descending
        scored_combinations.sort(key=lambda x: x[1], reverse=True)
        
        # Deduplicate and scale scores to [70.0 - 95.0]
        max_s = max(s[1] for s in scored_combinations[:top_n]) if scored_combinations else 1.0
        min_s = min(s[1] for s in scored_combinations[:top_n]) if scored_combinations else 0.0
        spread = max(max_s - min_s, 1e-6)

        results = []
        for rank, (c_num, r_score, factors) in enumerate(scored_combinations[:top_n], start=1):
            normalized_score = round(75.0 + ((r_score - min_s) / spread) * 20.0, 2)
            results.append(
                PredictionCandidate(
                    numero=c_num,
                    score=normalized_score,
                    ranking=rank,
                    factores_explicacion=factors,
                    modelo_codigo=self.get_model_code()
                )
            )

        return results
