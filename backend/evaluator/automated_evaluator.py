"""
Automated Evaluator and Statistical Hypothesis Testing for LoterIA (ALPES).
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from scipy import stats
import math
from ..database.models import Prediccion, Resultado, Evaluacion, MetricaModelo

class AutomatedEvaluator:
    @staticmethod
    def evaluate_single_prediction(
        prediction: Prediccion,
        result: Resultado
    ) -> Evaluacion:
        """
        Evaluates a locked prediction against the verified official winning number.
        """
        p_num = str(prediction.numero_predicho).zfill(4)[-4:]
        w_num = str(result.numero_ganador).zfill(4)[-4:]

        # Exact Match 4/4
        exact_match = (p_num == w_num)

        # Partial matches
        match_3 = (p_num[-3:] == w_num[-3:] or p_num[:3] == w_num[:3])
        match_2 = (p_num[-2:] == w_num[-2:])
        match_1 = (p_num[-1] == w_num[-1])

        # Positional correct digits count (0 to 4)
        pos_correct = sum(1 for i in range(4) if p_num[i] == w_num[i])

        # Digit set overlap (disordered digits)
        digit_overlap = sum(min(p_num.count(d), w_num.count(d)) for d in set(w_num))

        return Evaluacion(
            id=f"eval-{prediction.id}",
            prediccion_id=prediction.id,
            resultado_id=result.id,
            resultado_real=w_num,
            acierto_exacto=exact_match,
            aciertos_3_cifras=match_3,
            aciertos_2_cifras=match_2,
            aciertos_1_cifra=match_1,
            posiciones_correctas=pos_correct,
            digitos_coincidentes=digit_overlap,
            top_k_match=prediction.ranking if exact_match else None,
            fecha_evaluacion=datetime.now().isoformat(),
            created_at=datetime.now().isoformat()
        )

    @staticmethod
    def compute_model_metrics(
        model_id: str,
        evaluations: List[Evaluacion],
        predictions: List[Prediccion],
        period_label: str = "HISTORICO_TOTAL"
    ) -> MetricaModelo:
        """
        Calculates aggregate metrics and p-value statistical significance test vs Random Baseline.
        """
        total = len(evaluations)
        if total == 0:
            return MetricaModelo(
                id=f"met-{model_id}",
                modelo_id=model_id,
                periodo=period_label,
                total_predicciones=0,
                ultima_actualizacion=datetime.now().isoformat()
            )

        exact_hits = sum(1 for e in evaluations if e.acierto_exacto)
        hits_3 = sum(1 for e in evaluations if e.aciertos_3_cifras)
        hits_2 = sum(1 for e in evaluations if e.aciertos_2_cifras)
        total_pos = sum(e.posiciones_correctas for e in evaluations)
        avg_pos = total_pos / float(total)

        # Expected positional matches under pure chance = 4 * 0.1 = 0.400
        expected_pos_under_random = 0.400
        ratio_vs_random = round(avg_pos / expected_pos_under_random, 3) if avg_pos > 0 else 1.000

        # Top-K accuracy
        top1_pids = {p.id for p in predictions if p.ranking == 1}
        top1_evals = [e for e in evaluations if e.prediccion_id in top1_pids]
        top1_hits = sum(1 for e in top1_evals if e.acierto_exacto or e.aciertos_3_cifras)
        top1_acc = round(top1_hits / max(len(top1_evals), 1), 4)

        top5_pids = {p.id for p in predictions if p.ranking <= 5}
        top5_evals = [e for e in evaluations if e.prediccion_id in top5_pids]
        top5_hits = sum(1 for e in top5_evals if e.acierto_exacto or e.aciertos_3_cifras)
        top5_acc = round(top5_hits / max(len(top5_evals), 1), 4)

        top10_acc = round(sum(1 for e in evaluations if e.acierto_exacto or e.aciertos_3_cifras or e.aciertos_2_cifras) / float(total), 4)

        # Hypothesis test: Binomial test for positional hits vs binomial(n=total*4, p=0.10)
        total_trials = total * 4
        successes = total_pos
        try:
            # One-sided test: is probability of success significantly > 0.10?
            res = stats.binomtest(successes, total_trials, p=0.10, alternative='greater')
            p_val = round(float(res.pvalue), 6)
        except Exception:
            p_val = 1.0

        # Confidence interval 95% for ratio
        se = math.sqrt((avg_pos * (1 - avg_pos / 4.0)) / max(total, 1)) / expected_pos_under_random
        ci_low = max(0.0, round(ratio_vs_random - 1.96 * se, 3))
        ci_high = round(ratio_vs_random + 1.96 * se, 3)

        return MetricaModelo(
            id=f"met-{model_id}",
            modelo_id=model_id,
            periodo=period_label,
            total_predicciones=total,
            aciertos_exactos=exact_hits,
            aciertos_3_cifras=hits_3,
            aciertos_2_cifras=hits_2,
            aciertos_posicionales_promedio=round(avg_pos, 3),
            top_1_accuracy=top1_acc,
            top_5_accuracy=top5_acc,
            top_10_accuracy=top10_acc,
            ratio_vs_random=ratio_vs_random,
            p_value_vs_random=p_val,
            intervalo_confianza_95=[ci_low, ci_high],
            ultima_actualizacion=datetime.now().isoformat()
        )
