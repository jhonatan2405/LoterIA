"""
Helper utilities for Colombian lottery draw scheduling, draw cutoff times, and state tracking.
Guarantees that predictions are never generated for draws that have already occurred.
"""
from datetime import datetime, date, time, timedelta
from typing import Dict, Any, Tuple, Optional

# Day mapping for Python weekday (0 = Monday, 6 = Sunday)
WEEKDAY_TO_SPANISH = {
    0: "Lunes",
    1: "Martes",
    2: "Miércoles",
    3: "Jueves",
    4: "Viernes",
    5: "Sábado",
    6: "Domingo"
}

SPANISH_TO_WEEKDAY = {
    "Lunes": 0, "lunes": 0,
    "Martes": 1, "martes": 1,
    "Miércoles": 2, "Miercoles": 2, "miércoles": 2, "miercoles": 2,
    "Jueves": 3, "jueves": 3,
    "Viernes": 4, "viernes": 4,
    "Sábado": 5, "Sabado": 5, "sábado": 5, "sabado": 5,
    "Domingo": 6, "domingo": 6
}

# Accurate schedules for Colombian lotteries and chances
LOTTERY_SCHEDULES = {
    "SINUANO_DIA": {
        "days": ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
        "draw_time": "14:30:00",
        "cutoff_minutes_before": 10
    },
    "SINUANO_NOCHE": {
        "days": ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
        "draw_time": "22:30:00",
        "cutoff_minutes_before": 10
    },
    "CARIBENA_DIA": {
        "days": ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
        "draw_time": "14:30:00",
        "cutoff_minutes_before": 10
    },
    "CARIBENA_NOCHE": {
        "days": ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
        "draw_time": "22:30:00",
        "cutoff_minutes_before": 10
    },
    "CHONTICO_DIA": {
        "days": ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
        "draw_time": "13:00:00",
        "cutoff_minutes_before": 10
    },
    "CHONTICO_NOCHE": {
        "days": ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
        "draw_time": "19:00:00",
        "cutoff_minutes_before": 10
    },
    "MEDELLIN": {
        "days": ["Viernes"],
        "draw_time": "23:00:00",
        "cutoff_minutes_before": 30
    },
    "BOGOTA": {
        "days": ["Jueves"],
        "draw_time": "22:30:00",
        "cutoff_minutes_before": 30
    },
    "BOYACA": {
        "days": ["Sábado"],
        "draw_time": "22:40:00",
        "cutoff_minutes_before": 30
    },
    "VALLE": {
        "days": ["Miércoles"],
        "draw_time": "22:30:00",
        "cutoff_minutes_before": 30
    },
    "CRUZ_ROJA": {
        "days": ["Martes"],
        "draw_time": "22:55:00",
        "cutoff_minutes_before": 30
    },
    "CUNDINAMARCA": {
        "days": ["Lunes"],
        "draw_time": "22:25:00",
        "cutoff_minutes_before": 30
    }
}

def get_next_draw_info(lottery_code: str, reference_dt: Optional[datetime] = None) -> Dict[str, Any]:
    """
    Computes the exact next valid draw date and status for a lottery.
    If today's draw has already occurred or is past the cutoff time, returns the NEXT upcoming draw date.
    
    Returns:
        {
            "lottery_code": str,
            "is_open_today": bool,
            "today_draw_completed": bool,
            "target_draw_date": "YYYY-MM-DD",
            "target_draw_time": "HH:MM:SS",
            "draw_day_name": str,
            "status_label": str,
            "message": str
        }
    """
    if reference_dt is None:
        reference_dt = datetime.now()

    sched = LOTTERY_SCHEDULES.get(lottery_code, {
        "days": ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
        "draw_time": "20:00:00",
        "cutoff_minutes_before": 15
    })

    current_weekday = reference_dt.weekday()
    current_time_str = reference_dt.strftime("%H:%M:%S")
    today_date_str = reference_dt.strftime("%Y-%m-%d")

    allowed_weekdays = [SPANISH_TO_WEEKDAY[d] for d in sched["days"] if d in SPANISH_TO_WEEKDAY]
    
    draw_hour, draw_min, draw_sec = map(int, sched["draw_time"].split(":"))
    cutoff_minutes = sched.get("cutoff_minutes_before", 10)
    
    # Calculate cutoff time for today
    draw_datetime_today = datetime.combine(
        reference_dt.date(),
        time(draw_hour, draw_min, draw_sec)
    )
    cutoff_datetime_today = draw_datetime_today - timedelta(minutes=cutoff_minutes)

    # Check if plays today
    plays_today = current_weekday in allowed_weekdays

    if plays_today:
        if reference_dt < cutoff_datetime_today:
            # Draw is open for today
            return {
                "lottery_code": lottery_code,
                "is_open_today": True,
                "today_draw_completed": False,
                "target_draw_date": today_date_str,
                "target_draw_time": sched["draw_time"],
                "draw_day_name": "Hoy (" + WEEKDAY_TO_SPANISH[current_weekday] + ")",
                "status_label": "ABIERTO PARA HOY",
                "message": f"Sorteo abierto para hoy a las {sched['draw_time'][:5]} COT"
            }
        else:
            # Draw has completed / closed for today. Find next occurrence date.
            today_draw_completed = reference_dt >= draw_datetime_today
            next_date = _find_next_draw_date(reference_dt.date() + timedelta(days=1), allowed_weekdays)
            return {
                "lottery_code": lottery_code,
                "is_open_today": False,
                "today_draw_completed": today_draw_completed,
                "target_draw_date": next_date.strftime("%Y-%m-%d"),
                "target_draw_time": sched["draw_time"],
                "draw_day_name": WEEKDAY_TO_SPANISH[next_date.weekday()],
                "status_label": "SORTEO DE HOY CERRADO",
                "message": f"El sorteo de hoy ({sched['draw_time'][:5]} COT) ya finalizó. Pronóstico para el {next_date.strftime('%d/%m/%Y')}."
            }
    else:
        # Doesn't play today. Find next occurrence.
        next_date = _find_next_draw_date(reference_dt.date() + timedelta(days=1), allowed_weekdays)
        return {
            "lottery_code": lottery_code,
            "is_open_today": False,
            "today_draw_completed": False,
            "target_draw_date": next_date.strftime("%Y-%m-%d"),
            "target_draw_time": sched["draw_time"],
            "draw_day_name": WEEKDAY_TO_SPANISH[next_date.weekday()],
            "status_label": f"PRÓXIMO: {WEEKDAY_TO_SPANISH[next_date.weekday()].upper()}",
            "message": f"Próximo sorteo programado para el {WEEKDAY_TO_SPANISH[next_date.weekday()]} {next_date.strftime('%d/%m/%Y')} a las {sched['draw_time'][:5]} COT."
        }

def _find_next_draw_date(start_date: date, allowed_weekdays: list) -> date:
    for i in range(14):
        candidate = start_date + timedelta(days=i)
        if candidate.weekday() in allowed_weekdays:
            return candidate
    return start_date + timedelta(days=1)
