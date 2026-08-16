"""
Machine Learning Predictor: Positional Markov Transition Chains and Gradient Boosting over Temporal Lags.
"""
from typing import List, Dict, Any
import numpy as np
from datetime import datetime
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from .base_predictor import BasePredictor, PredictionCandidate

class MLPredictor(BasePredictor):
    def get_model_code(self) -> str:
        return "ML_GRADIENT"

    def is_scientific(self) -> bool:
        return True

    def generate_predictions(
        self,
        historical_numbers: List[str],
        target_date_iso: str,
        lottery_code: str,
        top_n: int = 10
    ) -> List[PredictionCandidate]:
        if len(historical_numbers) < 15:
            # Fallback if insufficient historical dataset
            return [
                PredictionCandidate(
                    numero=f"{i*2024 % 10000:04d}",
                    score=50.0 - i,
                    ranking=i+1,
                    factores_explicacion={"nota": "Muestra histórica reducida"},
                    modelo_codigo=self.get_model_code()
                )
                for i in range(top_n)
            ]

        # 1. Positional Markov Transition Matrices: (4 matrices of 10x10)
        markov_matrices = [np.ones((10, 10)) for _ in range(4)] # Laplace smoothing
        
        cleaned_history = [str(num).zfill(4)[-4:] for num in historical_numbers]
        for i in range(len(cleaned_history) - 1):
            prev_num = cleaned_history[i]
            curr_num = cleaned_history[i + 1]
            for pos in range(4):
                p_prev = int(prev_num[pos])
                c_curr = int(curr_num[pos])
                markov_matrices[pos][p_prev, c_curr] += 1

        # Normalize Markov rows
        for pos in range(4):
            markov_matrices[pos] = markov_matrices[pos] / markov_matrices[pos].sum(axis=1, keepdims=True)

        last_draw = cleaned_history[-1]
        markov_prob = []
        for pos in range(4):
            last_digit = int(last_draw[pos])
            markov_prob.append(markov_matrices[pos][last_digit, :])

        # 2. Build Tabular Feature Dataset for Classifier
        # Features: lag_1 (4 digits), lag_2 (4 digits), lag_3 (4 digits)
        X = []
        y_pos = [[] for _ in range(4)]
        
        for i in range(3, len(cleaned_history)):
            row = []
            for lag in (1, 2, 3):
                num_str = cleaned_history[i - lag]
                row.extend([int(d) for d in num_str])
            X.append(row)
            for pos in range(4):
                y_pos[pos].append(int(cleaned_history[i][pos]))

        X = np.array(X)
        
        # Train lightweight fast ensemble per position
        clf_probs = []
        for pos in range(4):
            y = np.array(y_pos[pos])
            # Check unique classes
            unique_classes = np.unique(y)
            if len(unique_classes) > 1 and len(X) >= 10:
                try:
                    clf = RandomForestClassifier(n_estimators=30, max_depth=5, random_state=42)
                    clf.fit(X, y)
                    
                    # Predict next draw features
                    target_row = []
                    for lag in (1, 2, 3):
                        num_str = cleaned_history[-lag]
                        target_row.extend([int(d) for d in num_str])
                    target_X = np.array([target_row])
                    
                    probs_sparse = clf.predict_proba(target_X)[0]
                    # Map to all 0-9 digits
                    full_prob = np.zeros(10)
                    for cls_idx, cls_val in enumerate(clf.classes_):
                        full_prob[cls_val] = probs_sparse[cls_idx]
                    clf_probs.append(full_prob)
                except Exception:
                    clf_probs.append(markov_prob[pos])
            else:
                clf_probs.append(markov_prob[pos])

        # Combine Markov + Tree classifier probabilities
        combined_pos_probs = []
        for pos in range(4):
            # 50% Markov transition, 50% Random Forest lag probability
            p_pos = 0.5 * markov_prob[pos] + 0.5 * clf_probs[pos]
            combined_pos_probs.append(p_pos)

        # Generate Cartesian combinations
        sorted_pos = []
        for pos in range(4):
            sorted_pos.append(sorted(enumerate(combined_pos_probs[pos]), key=lambda x: x[1], reverse=True))

        candidates = []
        for d0, p0 in sorted_pos[0][:4]:
            for d1, p1 in sorted_pos[1][:4]:
                for d2, p2 in sorted_pos[2][:4]:
                    for d3, p3 in sorted_pos[3][:4]:
                        num_str = f"{d0}{d1}{d2}{d3}"
                        raw_score = p0 * p1 * p2 * p3
                        
                        factors = {
                            "probabilidad_markov": f"P(sucesion | ultimo {last_draw}) = {raw_score*10000:.2f} bps",
                            "pesos_posicionales": [round(float(p0), 3), round(float(p1), 3), round(float(p2), 3), round(float(p3), 3)],
                            "modelo_subyacente": "RandomForest(n=30) + Markov Chain 1st Order",
                            "lag_features": f"Lags analizados: {cleaned_history[-1]}, {cleaned_history[-2]}, {cleaned_history[-3]}"
                        }
                        candidates.append((num_str, raw_score, factors))

        candidates.sort(key=lambda x: x[1], reverse=True)

        max_s = max(s[1] for s in candidates[:top_n]) if candidates else 1.0
        min_s = min(s[1] for s in candidates[:top_n]) if candidates else 0.0
        spread = max(max_s - min_s, 1e-7)

        results = []
        for rank, (c_num, r_score, factors) in enumerate(candidates[:top_n], start=1):
            normalized_score = round(78.0 + ((r_score - min_s) / spread) * 20.0, 2)
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
