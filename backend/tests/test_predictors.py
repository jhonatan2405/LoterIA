"""
Unit tests for Predictive Engines (Statistical, ML, Random Baseline, Numerology, Astrology, Ensemble).
"""
import pytest
from backend.engines.statistical_predictor import StatisticalPredictor
from backend.engines.ml_predictor import MLPredictor
from backend.engines.random_baseline import RandomBaselinePredictor
from backend.engines.numerology_predictor import NumerologyPredictor
from backend.engines.astrology_predictor import AstrologyPredictor
from backend.engines.ensemble_engine import EnsembleEngine

SAMPLE_HISTORY = [
    "4827", "1934", "6501", "8274", "3319", "0482", "7591", "2830",
    "9145", "5208", "3816", "6492", "1753", "8024", "4931", "2680",
    "9517", "3408", "7162", "5829", "0394", "8471", "2950", "6183"
]

def test_statistical_predictor():
    engine = StatisticalPredictor()
    assert engine.get_model_code() == "STAT_FREQ"
    assert engine.is_scientific() is True
    
    preds = engine.generate_predictions(
        historical_numbers=SAMPLE_HISTORY,
        target_date_iso="2026-08-15",
        lottery_code="MEDELLIN",
        top_n=10
    )
    assert len(preds) == 10
    for p in preds:
        assert len(p.numero) == 4
        assert p.numero.isdigit()
        assert 0.0 <= p.score <= 100.0
        assert "frecuencia_posicional" in p.factores_explicacion

def test_ml_predictor():
    engine = MLPredictor()
    assert engine.get_model_code() == "ML_GRADIENT"
    assert engine.is_scientific() is True
    
    preds = engine.generate_predictions(
        historical_numbers=SAMPLE_HISTORY,
        target_date_iso="2026-08-15",
        lottery_code="MEDELLIN",
        top_n=10
    )
    assert len(preds) == 10
    for p in preds:
        assert len(p.numero) == 4
        assert p.numero.isdigit()
        assert "probabilidad_markov" in p.factores_explicacion

def test_random_baseline_predictor():
    engine = RandomBaselinePredictor()
    assert engine.get_model_code() == "RANDOM_BASELINE"
    assert engine.is_scientific() is True
    
    preds = engine.generate_predictions(
        historical_numbers=SAMPLE_HISTORY,
        target_date_iso="2026-08-15",
        lottery_code="MEDELLIN",
        top_n=10
    )
    assert len(preds) == 10
    for p in preds:
        assert len(p.numero) == 4
        assert p.numero.isdigit()
        assert p.factores_explicacion["funcion_control"] == "Hipótesis Nula (H0)"

def test_numerology_predictor():
    engine = NumerologyPredictor()
    assert engine.get_model_code() == "NUMEROLOGY_ROOT"
    assert engine.is_scientific() is False # Experimental
    
    preds = engine.generate_predictions(
        historical_numbers=SAMPLE_HISTORY,
        target_date_iso="2026-08-15",
        lottery_code="MEDELLIN",
        top_n=10
    )
    assert len(preds) == 10
    for p in preds:
        assert len(p.numero) == 4
        assert p.numero.isdigit()
        assert "raiz_fecha" in p.factores_explicacion

def test_astrology_predictor():
    engine = AstrologyPredictor()
    assert engine.get_model_code() == "ASTRO_LUNAR"
    assert engine.is_scientific() is False # Experimental
    
    preds = engine.generate_predictions(
        historical_numbers=SAMPLE_HISTORY,
        target_date_iso="2026-08-15",
        lottery_code="MEDELLIN",
        top_n=10
    )
    assert len(preds) == 10
    for p in preds:
        assert len(p.numero) == 4
        assert p.numero.isdigit()
        assert "fase_lunar" in p.factores_explicacion

def test_ensemble_engine():
    engine = EnsembleEngine()
    assert engine.get_model_code() == "ENSEMBLE_ADAPTIVE"
    
    preds = engine.generate_predictions(
        historical_numbers=SAMPLE_HISTORY,
        target_date_iso="2026-08-15",
        lottery_code="MEDELLIN",
        top_n=10
    )
    assert len(preds) == 10
    for p in preds:
        assert len(p.numero) == 4
        assert p.numero.isdigit()
        assert "desglose_contribucion" in p.factores_explicacion
