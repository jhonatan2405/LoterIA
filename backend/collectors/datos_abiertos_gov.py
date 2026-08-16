"""
Data Collector for Datos Abiertos Colombia (Coljuegos / Socrata API).
Endpoint: https://www.datos.gov.co/resource/i3kx-3zps.json
"""
import requests
import re
from typing import List, Dict, Any, Optional
from datetime import datetime
from .base_collector import BaseCollector, NormalizedDrawRecord

LOTTERY_NAME_MAPPINGS = {
    "MEDELLIN": "MEDELLIN",
    "MEDELLÍN": "MEDELLIN",
    "LOTERIA DE MEDELLIN": "MEDELLIN",
    "BOGOTA": "BOGOTA",
    "BOGOTÁ": "BOGOTA",
    "LOTERIA DE BOGOTA": "BOGOTA",
    "BOYACA": "BOYACA",
    "BOYACÁ": "BOYACA",
    "LOTERIA DE BOYACA": "BOYACA",
    "CUNDINAMARCA": "CUNDINAMARCA",
    "VALLE": "VALLE",
    "CRUZ ROJA": "CRUZ_ROJA",
    "SINUANO DIA": "SINUANO_DIA",
    "SINUANO NOCHE": "SINUANO_NOCHE",
    "CARIBEÑA DIA": "CARIBENA_DIA",
    "CARIBENA DIA": "CARIBENA_DIA",
    "CHONTICO DIA": "CHONTICO_DIA"
}

class DatosAbiertosGovCollector(BaseCollector):
    SOCRATA_ENDPOINT = "https://www.datos.gov.co/resource/i3kx-3zps.json"

    def get_source_name(self) -> str:
        return "Datos Abiertos Colombia (Coljuegos i3kx-3zps)"

    def fetch_latest_results(self, limit: int = 50) -> List[NormalizedDrawRecord]:
        results = []
        try:
            params = {
                "$limit": limit,
                "$order": "fecha DESC"
            }
            resp = requests.get(self.SOCRATA_ENDPOINT, params=params, timeout=5)
            if resp.status_code == 200:
                raw_data = resp.json()
                for item in raw_data:
                    record = self._parse_item(item)
                    if record:
                        results.append(record)
        except Exception as e:
            print(f"[{self.get_source_name()}] Error en conexión con Socrata API: {e}. Usando datos de respaldo.")
        
        return results

    def _parse_item(self, item: Dict[str, Any]) -> Optional[NormalizedDrawRecord]:
        try:
            # Handle column naming variations in Socrata dataset
            lot_raw = item.get("loter_a") or item.get("loteria") or item.get("nombre_loteria") or ""
            lot_clean = re.sub(r'[^\w\s]', '', lot_raw).upper().strip()
            lot_code = LOTTERY_NAME_MAPPINGS.get(lot_clean, lot_clean[:20])

            draw_num = str(item.get("n_mero_del_sorteo") or item.get("numero_sorteo") or item.get("sorteo") or "0")
            
            # Parse Date
            raw_date = item.get("fecha") or item.get("fecha_del_sorteo") or datetime.now().strftime("%Y-%m-%d")
            # Format usually ISO or YYYY-MM-DDTHH:MM:SS
            draw_date = raw_date.split("T")[0] if "T" in raw_date else raw_date[:10]

            winning_num = str(item.get("n_mero_del_billete_ganador") or item.get("numero_ganador") or item.get("billete") or "0000")
            winning_series = str(item.get("n_mero_de_serie_ganadora") or item.get("serie") or "")
            prize = str(item.get("tipo_de_premio") or item.get("premio") or "PREMIO_MAYOR")

            return NormalizedDrawRecord(
                lottery_code=lot_code,
                draw_number=draw_num,
                draw_date=draw_date,
                draw_time="22:30:00",
                winning_number=winning_num,
                winning_series=winning_series,
                prize_type=prize,
                source_url=self.SOCRATA_ENDPOINT,
                raw_payload=item
            )
        except Exception as err:
            print(f"[DatosAbiertos] Error parseando registro: {err}")
            return None
