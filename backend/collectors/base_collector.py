"""
Base Collector Interface and normalization utilities for Colombian Lottery Data.
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import hashlib
import re
from datetime import datetime

class NormalizedDrawRecord:
    def __init__(
        self,
        lottery_code: str,
        draw_number: str,
        draw_date: str, # YYYY-MM-DD
        draw_time: str, # HH:MM:SS
        winning_number: str, # 4 digits
        winning_series: Optional[str] = None, # 3 digits
        prize_type: str = "PREMIO_MAYOR",
        source_url: str = "",
        raw_payload: Optional[Dict[str, Any]] = None
    ):
        self.lottery_code = lottery_code.upper().strip()
        self.draw_number = str(draw_number).strip()
        self.draw_date = draw_date.strip()
        self.draw_time = draw_time.strip()
        self.winning_number = self._clean_number(winning_number, 4)
        self.winning_series = self._clean_number(winning_series, 3) if winning_series else None
        self.prize_type = prize_type.strip()
        self.source_url = source_url.strip()
        self.raw_payload = raw_payload or {}
        self.hash_signature = self._generate_hash()

    def _clean_number(self, val: Any, expected_len: int) -> str:
        if val is None:
            return "0" * expected_len
        s = re.sub(r'\D', '', str(val))
        return s.zfill(expected_len)[-expected_len:]

    def _generate_hash(self) -> str:
        content = f"{self.lottery_code}:{self.draw_number}:{self.draw_date}:{self.winning_number}:{self.winning_series}:{self.source_url}"
        return hashlib.sha256(content.encode('utf-8')).hexdigest()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "lottery_code": self.lottery_code,
            "draw_number": self.draw_number,
            "draw_date": self.draw_date,
            "draw_time": self.draw_time,
            "winning_number": self.winning_number,
            "winning_series": self.winning_series,
            "prize_type": self.prize_type,
            "source_url": self.source_url,
            "hash_signature": self.hash_signature
        }

class BaseCollector(ABC):
    @abstractmethod
    def fetch_latest_results(self, limit: int = 50) -> List[NormalizedDrawRecord]:
        """Fetches and normalizes the latest results from the source."""
        pass

    @abstractmethod
    def get_source_name(self) -> str:
        """Returns the human-readable name of the source."""
        pass
