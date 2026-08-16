"""
Base Predictor Interface and Prediction Candidate types for LoterIA (ALPES).
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class PredictionCandidate(BaseModel):
    numero: str = Field(..., description="Número de 4 cifras (ej. 4827)")
    score: float = Field(..., description="Puntuación normalizada [0.0 - 100.0]")
    ranking: int = Field(..., description="Posición en el ranking (1 a K)")
    factores_explicacion: Dict[str, Any] = Field(default_factory=dict, description="Desglose de factores")
    modelo_codigo: str = Field(..., description="Código del modelo que generó el candidato")

class BasePredictor(ABC):
    @abstractmethod
    def get_model_code(self) -> str:
        """Returns unique code identifier of the model."""
        pass

    @abstractmethod
    def is_scientific(self) -> bool:
        """Whether the model is based on formal scientific/statistical methods or experimental hypotheses."""
        pass

    @abstractmethod
    def generate_predictions(
        self,
        historical_numbers: List[str], # List of historical 4-digit winning numbers ordered chronologically [oldest -> newest]
        target_date_iso: str,          # Target draw date YYYY-MM-DD
        lottery_code: str,             # Lottery identifier
        top_n: int = 10                # Number of candidates to return
    ) -> List[PredictionCandidate]:
        """
        Generates Top-N predictions for the target draw using ONLY historical data available prior to the draw.
        Zero data leakage guaranteed.
        """
        pass
