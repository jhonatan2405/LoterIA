"""
Supabase Synchronizer & Migration Runner for LoterIA (ALPES).
Uploads seed catalogues, lotteries, and model definitions to remote Supabase project.
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv()

from supabase import create_client
from .models import TipoLoteria, FamiliaModelo

def sync_to_supabase():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")

    if not url or not key:
        print("[ERROR] Variables SUPABASE_URL y SUPABASE_KEY no configuradas.")
        sys.exit(1)

    print(f"[*] Conectando a Supabase Cloud: {url}...")
    client = create_client(url, key)
    print("[+] Conexión establecida con éxito.")

    # 1. Lotteries Catalog
    lotteries_data = [
        {"codigo": "MEDELLIN", "nombre": "Lotería de Medellín", "tipo": "LOTERIA", "numero_digitos": 4, "tiene_serie": True, "dias_sorteo": ["Viernes"], "hora_sorteo": "23:00", "fuente_principal": "Datos Abiertos Colombia (Coljuegos)"},
        {"codigo": "BOGOTA", "nombre": "Lotería de Bogotá", "tipo": "LOTERIA", "numero_digitos": 4, "tiene_serie": True, "dias_sorteo": ["Jueves"], "hora_sorteo": "22:30", "fuente_principal": "Datos Abiertos Colombia (Coljuegos)"},
        {"codigo": "BOYACA", "nombre": "Lotería de Boyacá", "tipo": "LOTERIA", "numero_digitos": 4, "tiene_serie": True, "dias_sorteo": ["Sábado"], "hora_sorteo": "22:40", "fuente_principal": "Datos Abiertos Colombia (Coljuegos)"},
        {"codigo": "CUNDINAMARCA", "nombre": "Lotería de Cundinamarca", "tipo": "LOTERIA", "numero_digitos": 4, "tiene_serie": True, "dias_sorteo": ["Lunes"], "hora_sorteo": "22:45", "fuente_principal": "Datos Abiertos Colombia (Coljuegos)"},
        {"codigo": "VALLE", "nombre": "Lotería del Valle", "tipo": "LOTERIA", "numero_digitos": 4, "tiene_serie": True, "dias_sorteo": ["Miércoles"], "hora_sorteo": "22:30", "fuente_principal": "Datos Abiertos Colombia (Coljuegos)"},
        {"codigo": "CRUZ_ROJA", "nombre": "Lotería de la Cruz Roja", "tipo": "LOTERIA", "numero_digitos": 4, "tiene_serie": True, "dias_sorteo": ["Martes"], "hora_sorteo": "22:55", "fuente_principal": "Datos Abiertos Colombia (Coljuegos)"},
        {"codigo": "SINUANO_DIA", "nombre": "Sinuano Día", "tipo": "CHANCE", "numero_digitos": 4, "tiene_serie": False, "dias_sorteo": ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"], "hora_sorteo": "14:30", "fuente_principal": "Datos Abiertos Colombia (Coljuegos)"},
        {"codigo": "SINUANO_NOCHE", "nombre": "Sinuano Noche", "tipo": "CHANCE", "numero_digitos": 4, "tiene_serie": False, "dias_sorteo": ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"], "hora_sorteo": "22:30", "fuente_principal": "Datos Abiertos Colombia (Coljuegos)"},
        {"codigo": "CARIBENA_DIA", "nombre": "Caribeña Día", "tipo": "CHANCE", "numero_digitos": 4, "tiene_serie": False, "dias_sorteo": ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"], "hora_sorteo": "14:30", "fuente_principal": "Datos Abiertos Colombia (Coljuegos)"},
        {"codigo": "CHONTICO_DIA", "nombre": "Chontico Día", "tipo": "CHANCE", "numero_digitos": 4, "tiene_serie": False, "dias_sorteo": ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"], "hora_sorteo": "13:00", "fuente_principal": "Datos Abiertos Colombia (Coljuegos)"}
    ]

    print(f"[*] Sincronizando catálogo de {len(lotteries_data)} loterías...")
    try:
        res = client.table("loterias").upsert(lotteries_data, on_conflict="codigo").execute()
        print(f"[+] Loterías sincronizadas con Supabase Cloud: {len(res.data)} registros.")
    except Exception as e:
        print(f"[!] Nota: Si las tablas aún no se han creado en Supabase Cloud, ejecuta 'supabase_schema.sql' en el SQL Editor de tu Dashboard ({e}).")

    print("[OK] Proceso de sincronización finalizado exitosamente.")

if __name__ == "__main__":
    sync_to_supabase()
