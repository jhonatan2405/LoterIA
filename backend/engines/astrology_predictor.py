"""
Astrology Predictor: Moon Phases, Solar Zodiac Aspects and Planetary Rulers.
[EXPERIMENTAL - NO CIENTÍFICO]
"""
from typing import List, Dict, Any
from datetime import datetime
import math
from .base_predictor import BasePredictor, PredictionCandidate

ZODIAC_SIGNS = [
    ("Capricornio", (1, 1), (1, 19), "Tierra", [8, 4, 2, 0]),
    ("Acuario", (1, 20), (2, 18), "Aire", [4, 7, 1, 9]),
    ("Piscis", (2, 19), (3, 20), "Agua", [3, 7, 9, 2]),
    ("Aries", (3, 21), (4, 19), "Fuego", [9, 1, 5, 8]),
    ("Tauro", (4, 20), (5, 20), "Tierra", [6, 4, 2, 8]),
    ("Géminis", (5, 21), (6, 20), "Aire", [5, 3, 1, 7]),
    ("Cáncer", (6, 21), (7, 22), "Agua", [2, 7, 0, 4]),
    ("Leo", (7, 23), (8, 22), "Fuego", [1, 9, 5, 3]),
    ("Virgo", (8, 23), (9, 22), "Tierra", [5, 6, 8, 2]),
    ("Libra", (9, 23), (10, 22), "Aire", [6, 3, 7, 9]),
    ("Escorpio", (10, 23), (11, 21), "Agua", [9, 8, 0, 4]),
    ("Sagitario", (11, 22), (12, 21), "Fuego", [3, 9, 5, 1]),
    ("Capricornio", (12, 22), (12, 31), "Tierra", [8, 4, 2, 0])
]

PLANETARY_RULERS = [
    ("Luna", "Lunes", [2, 7, 0]),
    ("Marte", "Martes", [9, 1, 5]),
    ("Mercurio", "Miércoles", [5, 3, 8]),
    ("Júpiter", "Jueves", [3, 9, 4]),
    ("Venus", "Viernes", [6, 2, 7]),
    ("Saturno", "Sábado", [8, 4, 1]),
    ("Sol", "Domingo", [1, 9, 6])
]

class AstrologyPredictor(BasePredictor):
    def get_model_code(self) -> str:
        return "ASTRO_LUNAR"

    def is_scientific(self) -> bool:
        return False

    def _get_moon_phase(self, dt: datetime) -> (str, float):
        """Calculates synodic lunar phase approximation (29.530588 days)."""
        # Known new moon reference: 2000-01-06 18:14 UTC
        ref = datetime(2000, 1, 6, 18, 14)
        days = (dt - ref).total_seconds() / 86400.0
        phase = (days % 29.530588) / 29.530588 # 0.0 to 1.0

        if phase < 0.03 or phase > 0.97:
            return "Luna Nueva (Inicio)", phase
        elif phase < 0.22:
            return "Luna Creciente", phase
        elif phase < 0.28:
            return "Cuarto Creciente", phase
        elif phase < 0.47:
            return "Gibosa Creciente", phase
        elif phase < 0.53:
            return "Luna Llena (Plenitud)", phase
        elif phase < 0.72:
            return "Gibosa Menguante", phase
        elif phase < 0.78:
            return "Cuarto Menguante", phase
        else:
            return "Luna Menguante", phase

    def _get_zodiac(self, dt: datetime):
        m, d = dt.month, dt.day
        for name, (sm, sd), (em, ed), element, digits in ZODIAC_SIGNS:
            if sm == em:
                if m == sm and sd <= d <= ed:
                    return name, element, digits
            else:
                if (m == sm and d >= sd) or (m == em and d <= ed):
                    return name, element, digits
        return "Aries", "Fuego", [9, 1, 5, 8]

    def generate_predictions(
        self,
        historical_numbers: List[str],
        target_date_iso: str,
        lottery_code: str,
        top_n: int = 10
    ) -> List[PredictionCandidate]:
        try:
            dt = datetime.strptime(target_date_iso[:10], "%Y-%m-%d")
        except Exception:
            dt = datetime.now()

        moon_name, moon_fraction = self._get_moon_phase(dt)
        zodiac_name, element, zodiac_digits = self._get_zodiac(dt)
        weekday_idx = dt.weekday()
        planet_ruler, day_name, planet_digits = PLANETARY_RULERS[weekday_idx]

        candidates = []
        seen = set()

        # Combine zodiac digits, planetary rulers and lunar index
        lunar_offset = int(moon_fraction * 10)

        for i in range(top_n * 3):
            d0 = (zodiac_digits[i % len(zodiac_digits)] + lunar_offset) % 10
            d1 = (planet_digits[i % len(planet_digits)] + i) % 10
            d2 = (zodiac_digits[(i + 1) % len(zodiac_digits)] + weekday_idx) % 10
            d3 = (planet_digits[(i + 2) % len(planet_digits)] + lunar_offset * 2) % 10

            c_num = f"{d0}{d1}{d2}{d3}"
            if c_num not in seen:
                seen.add(c_num)
                rank = len(candidates) + 1
                score = round(81.5 - (rank * 2.5) + (2.0 if "Llena" in moon_name or "Nueva" in moon_name else 0.0), 2)
                
                factors = {
                    "clasificacion": "[EXPERIMENTAL - HIPÓTESIS NO CIENTÍFICA]",
                    "fase_lunar": f"{moon_name} ({moon_fraction*100:.1f}% ciclo)",
                    "signo_zodiacal": f"{zodiac_name} (Elemento {element})",
                    "regente_planetario": f"{planet_ruler} (Día {day_name})",
                    "resonancia_astral": f"Armonía elemental sobre dígitos base [{d0}, {d1}, {d2}, {d3}]"
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
