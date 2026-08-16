"""
Data Collector for Perlatodo and Colombian Lottery Results portals.
Parses official winning numbers and draw metadata for Colombian lotteries and chances.
"""
import requests
import re
from typing import List, Dict, Any, Optional
from datetime import datetime, date
from .base_collector import BaseCollector, NormalizedDrawRecord

class PerlatodoCollector(BaseCollector):
    BASE_URL = "https://perlatodo.com/perla"
    
    CHANCE_ENDPOINTS = {
        "CARIBENA_DIA": "https://perlatodo.com/perla/resultados-sorteo-caribena-dia/",
        "CARIBENA_NOCHE": "https://perlatodo.com/perla/resultados-sorteo-caribena-noche/",
        "SINUANO_DIA": "https://perlatodo.com/perla/resultados-sorteo-sinuano-dia/",
        "SINUANO_NOCHE": "https://perlatodo.com/perla/resultados-sorteo-sinuano-noche/",
        "CHONTICO_DIA": "https://perlatodo.com/perla/resultados-sorteo-chontico-dia/",
        "CHONTICO_NOCHE": "https://perlatodo.com/perla/resultados-sorteo-chontico-noche/",
        "CULONA_DIA": "https://perlatodo.com/perla/resultados/resultados-sorteo-culona-dia/",
        "CULONA_NOCHE": "https://perlatodo.com/perla/resultados/resultados-sorteo-culona-noche/",
    }

    def get_source_name(self) -> str:
        return "Perlatodo (Juegos y Apuestas La Perla / Oficial Chances)"

    def fetch_latest_results(self, limit: int = 20) -> List[NormalizedDrawRecord]:
        results: List[NormalizedDrawRecord] = []
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

        for lot_code, url in self.CHANCE_ENDPOINTS.items():
            try:
                resp = requests.get(url, headers=headers, timeout=6)
                if resp.status_code == 200:
                    record = self._parse_html(lot_code, url, resp.text)
                    if record:
                        results.append(record)
            except Exception as e:
                # Log error and continue to next
                print(f"[{self.get_source_name()}] Error consultando {lot_code}: {e}")

        return results

    def _parse_html(self, lot_code: str, url: str, html_text: str) -> Optional[NormalizedDrawRecord]:
        try:
            # Match pattern like: Resultado 2026-08-15 or similar date headers
            date_match = re.search(r'Resultado\s+(\d{4}-\d{2}-\d{2})', html_text)
            draw_date = date_match.group(1) if date_match else datetime.now().strftime("%Y-%m-%d")

            # Match 4 digit winning number from ball containers or text patterns
            # E.g., numbers inside specific spans or demographic numbers
            num_match = re.search(r'(?:Ganador|Resultado|numero|balota)[^\d]*(\d{4})', html_text, re.IGNORECASE)
            
            # If not found directly, look for 4-digit sequences after the date
            if not num_match:
                after_date = html_text[date_match.end():] if date_match else html_text
                num_match = re.search(r'\b(\d{4})\b', after_date)

            if num_match:
                winning_number = num_match.group(1)
            else:
                return None

            draw_time_map = {
                "CARIBENA_DIA": "14:30:00",
                "CARIBENA_NOCHE": "22:30:00",
                "SINUANO_DIA": "14:30:00",
                "SINUANO_NOCHE": "22:30:00",
                "CHONTICO_DIA": "13:00:00",
                "CHONTICO_NOCHE": "19:00:00",
            }

            return NormalizedDrawRecord(
                lottery_code=lot_code,
                draw_number="0",
                draw_date=draw_date,
                draw_time=draw_time_map.get(lot_code, "20:00:00"),
                winning_number=winning_number,
                winning_series=None,
                prize_type="PREMIO_MAYOR",
                source_url=url,
                raw_payload={"source": "perlatodo_html", "scraped_at": datetime.now().isoformat()}
            )
        except Exception as err:
            print(f"[{self.get_source_name()}] Error parseando HTML de {lot_code}: {err}")
            return None
