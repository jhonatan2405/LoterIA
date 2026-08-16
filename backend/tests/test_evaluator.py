"""
Unit tests for Automated Evaluator, Immutability Locking and Metrics vs Chance.
"""
import pytest
from backend.evaluator.automated_evaluator import AutomatedEvaluator
from backend.database.models import Prediccion, Resultado
from backend.database.supabase_client import DatabaseRepository

def test_evaluation_exact_match():
    pred = Prediccion(
        id="p1",
        sorteo_id="s1",
        version_modelo_id="v1",
        numero_predicho="4827",
        score=95.0,
        ranking=1,
        hash_bloqueo="hash1"
    )
    res = Resultado(
        id="r1",
        sorteo_id="s1",
        numero_ganador="4827",
        fuente="Oficial",
        hash_dato="h1"
    )
    
    ev = AutomatedEvaluator.evaluate_single_prediction(pred, res)
    assert ev.acierto_exacto is True
    assert ev.posiciones_correctas == 4
    assert ev.digitos_coincidentes == 4
    assert ev.aciertos_3_cifras is True
    assert ev.aciertos_2_cifras is True
    assert ev.aciertos_1_cifra is True

def test_evaluation_partial_match():
    pred = Prediccion(
        id="p2",
        sorteo_id="s2",
        version_modelo_id="v1",
        numero_predicho="4872",
        score=90.0,
        ranking=2,
        hash_bloqueo="hash2"
    )
    res = Resultado(
        id="r2",
        sorteo_id="s2",
        numero_ganador="4827",
        fuente="Oficial",
        hash_dato="h2"
    )
    
    ev = AutomatedEvaluator.evaluate_single_prediction(pred, res)
    assert ev.acierto_exacto is False
    assert ev.posiciones_correctas == 2 # 4 and 8 in pos 0 and 1
    assert ev.digitos_coincidentes == 4 # 4, 8, 7, 2 all present
    assert ev.aciertos_2_cifras is False

def test_immutable_lock_enforcement():
    db_test = DatabaseRepository()
    pred = Prediccion(
        id="test-locked-pred",
        sorteo_id="s_test",
        version_modelo_id="v_test",
        numero_predicho="1234",
        score=88.0,
        ranking=1,
        estado_bloqueo=True,
        hash_bloqueo="lock_abc"
    )
    db_test.add_prediction(pred)

    # Attempting to modify locked prediction must raise PermissionError
    with pytest.raises(PermissionError) as exc_info:
        db_test.update_prediction("test-locked-pred", numero_predicho="9999")
    
    assert "VIOLACIÓN DE INTEGRIDAD ANTI-LEAKAGE" in str(exc_info.value)
