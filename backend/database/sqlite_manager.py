"""
SQLite Persistent Storage Layer for LoterIA (ALPES).
Creates and maintains 'backend/database/loteria_db.sqlite' on disk with full transactional integrity.
"""
import os
import sqlite3
import json
from typing import List, Dict, Any, Optional
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "loteria_db.sqlite")

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_sqlite_db():
    """Initializes SQLite schema with strict integrity constraints and indices."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS loterias (
        id TEXT PRIMARY KEY,
        codigo TEXT UNIQUE NOT NULL,
        nombre TEXT NOT NULL,
        tipo TEXT NOT NULL,
        numero_digitos INTEGER NOT NULL,
        tiene_serie INTEGER NOT NULL,
        dias_sorteo TEXT NOT NULL,
        hora_sorteo TEXT NOT NULL,
        fuente_principal TEXT NOT NULL,
        fuente_secundaria TEXT,
        logo_url TEXT,
        estado TEXT NOT NULL,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS modelos (
        id TEXT PRIMARY KEY,
        codigo TEXT UNIQUE NOT NULL,
        nombre TEXT NOT NULL,
        familia TEXT NOT NULL,
        descripcion TEXT,
        es_cientifico INTEGER NOT NULL,
        badge_color TEXT,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS versiones_modelo (
        id TEXT PRIMARY KEY,
        modelo_id TEXT NOT NULL,
        version TEXT NOT NULL,
        hiperparametros TEXT,
        activo INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (modelo_id) REFERENCES modelos(id)
    );

    CREATE TABLE IF NOT EXISTS sorteos (
        id TEXT PRIMARY KEY,
        loteria_id TEXT NOT NULL,
        numero_sorteo TEXT NOT NULL,
        fecha_programada TEXT NOT NULL,
        hora_programada TEXT NOT NULL,
        fecha_resultado TEXT,
        estado TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (loteria_id) REFERENCES loterias(id)
    );

    CREATE TABLE IF NOT EXISTS resultados (
        id TEXT PRIMARY KEY,
        sorteo_id TEXT UNIQUE NOT NULL,
        numero_ganador TEXT NOT NULL,
        serie TEXT,
        tipo_premio TEXT NOT NULL,
        fuente TEXT NOT NULL,
        fecha_obtencion TEXT NOT NULL,
        hash_dato TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (sorteo_id) REFERENCES sorteos(id)
    );

    CREATE TABLE IF NOT EXISTS predicciones (
        id TEXT PRIMARY KEY,
        sorteo_id TEXT NOT NULL,
        version_modelo_id TEXT NOT NULL,
        fecha_generacion TEXT NOT NULL,
        numero_predicho TEXT NOT NULL,
        score REAL NOT NULL,
        ranking INTEGER NOT NULL,
        explicacion_factores TEXT,
        estado_bloqueo INTEGER NOT NULL DEFAULT 1,
        hash_bloqueo TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (sorteo_id) REFERENCES sorteos(id),
        FOREIGN KEY (version_modelo_id) REFERENCES versiones_modelo(id)
    );

    CREATE TABLE IF NOT EXISTS evaluaciones (
        id TEXT PRIMARY KEY,
        prediccion_id TEXT NOT NULL,
        resultado_id TEXT,
        resultado_real TEXT,
        acierto_exacto INTEGER NOT NULL,
        aciertos_3_cifras INTEGER NOT NULL,
        aciertos_2_cifras INTEGER NOT NULL,
        posiciones_correctas INTEGER NOT NULL,
        digitos_coincidentes INTEGER NOT NULL,
        fecha_evaluacion TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (prediccion_id) REFERENCES predicciones(id)
    );

    CREATE TABLE IF NOT EXISTS metricas_modelo (
        id TEXT PRIMARY KEY,
        modelo_id TEXT NOT NULL,
        periodo TEXT NOT NULL,
        total_predicciones INTEGER NOT NULL,
        aciertos_exactos INTEGER NOT NULL,
        aciertos_3_cifras INTEGER NOT NULL,
        aciertos_2_cifras INTEGER NOT NULL,
        aciertos_posicionales_promedio REAL NOT NULL,
        top_1_accuracy REAL NOT NULL,
        top_5_accuracy REAL NOT NULL,
        ratio_vs_random REAL NOT NULL,
        p_value_vs_random REAL NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (modelo_id) REFERENCES modelos(id)
    );

    CREATE TABLE IF NOT EXISTS eventos_sistema (
        id TEXT PRIMARY KEY,
        tipo_evento TEXT NOT NULL,
        componente TEXT NOT NULL,
        nivel TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        metadata_json TEXT,
        created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sorteos_fecha ON sorteos(fecha_programada);
    CREATE INDEX IF NOT EXISTS idx_predicciones_sorteo ON predicciones(sorteo_id);
    CREATE INDEX IF NOT EXISTS idx_evaluaciones_pred ON evaluaciones(prediccion_id);
    """);
    conn.commit()
    conn.close()

class SQLiteStore:
    def __init__(self):
        init_sqlite_db()

    def sync_dataset(self, seed: Dict[str, List[Any]]):
        """Persists full dataset to SQLite disk storage."""
        conn = get_connection()
        cursor = conn.cursor()

        now_str = datetime.now().isoformat()

        # Loterias
        for lot in seed.get("loterias", []):
            dias_json = json.dumps(getattr(lot, "dias_sorteo", []))
            created_at = getattr(lot, "created_at", None) or now_str
            cursor.execute("""
                INSERT OR REPLACE INTO loterias (id, codigo, nombre, tipo, numero_digitos, tiene_serie, dias_sorteo, hora_sorteo, fuente_principal, fuente_secundaria, logo_url, estado, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                lot.id, lot.codigo, lot.nombre, getattr(lot.tipo, "value", lot.tipo),
                lot.numero_digitos, int(lot.tiene_serie), dias_json, lot.hora_sorteo,
                lot.fuente_principal, lot.fuente_secundaria, lot.logo_url,
                getattr(lot.estado, "value", lot.estado), created_at
            ))

        # Modelos
        for m in seed.get("modelos", []):
            created_at = getattr(m, "created_at", None) or now_str
            cursor.execute("""
                INSERT OR REPLACE INTO modelos (id, codigo, nombre, familia, descripcion, es_cientifico, badge_color, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                m.id, m.codigo, m.nombre, getattr(m.familia, "value", m.familia),
                m.descripcion, int(m.es_cientifico), m.badge_color,
                created_at
            ))

        # Versiones
        for v in seed.get("versiones_modelo", []):
            params_json = json.dumps(getattr(v, "hiperparametros", {}))
            created_at = getattr(v, "created_at", None) or now_str
            cursor.execute("""
                INSERT OR REPLACE INTO versiones_modelo (id, modelo_id, version, hiperparametros, activo, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                v.id, v.modelo_id, v.version, params_json,
                int(v.activo), created_at
            ))

        # Sorteos
        for s in seed.get("sorteos", []):
            created_at = getattr(s, "created_at", None) or now_str
            cursor.execute("""
                INSERT OR REPLACE INTO sorteos (id, loteria_id, numero_sorteo, fecha_programada, hora_programada, fecha_resultado, estado, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                s.id, s.loteria_id, s.numero_sorteo, s.fecha_programada, s.hora_programada,
                s.fecha_resultado, getattr(s.estado, "value", s.estado),
                created_at
            ))

        # Resultados
        for r in seed.get("resultados", []):
            created_at = getattr(r, "created_at", None) or now_str
            cursor.execute("""
                INSERT OR REPLACE INTO resultados (id, sorteo_id, numero_ganador, serie, tipo_premio, fuente, fecha_obtencion, hash_dato, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                r.id, r.sorteo_id, r.numero_ganador, r.serie, r.tipo_premio,
                r.fuente, r.fecha_obtencion or now_str, r.hash_dato,
                created_at
            ))

        # Predicciones
        for p in seed.get("predicciones", []):
            factores_json = json.dumps(getattr(p, "explicacion_factores", {}))
            created_at = getattr(p, "created_at", None) or now_str
            cursor.execute("""
                INSERT OR REPLACE INTO predicciones (id, sorteo_id, version_modelo_id, fecha_generacion, numero_predicho, score, ranking, explicacion_factores, estado_bloqueo, hash_bloqueo, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                p.id, p.sorteo_id, p.version_modelo_id, p.fecha_generacion, p.numero_predicho,
                p.score, p.ranking, factores_json, int(p.estado_bloqueo),
                p.hash_bloqueo, created_at
            ))

        # Evaluaciones
        for e in seed.get("evaluaciones", []):
            created_at = getattr(e, "created_at", None) or now_str
            cursor.execute("""
                INSERT OR REPLACE INTO evaluaciones (id, prediccion_id, resultado_id, resultado_real, acierto_exacto, aciertos_3_cifras, aciertos_2_cifras, posiciones_correctas, digitos_coincidentes, fecha_evaluacion, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                e.id, e.prediccion_id, getattr(e, "resultado_id", ""), getattr(e, "resultado_real", ""),
                int(e.acierto_exacto), int(e.aciertos_3_cifras), int(e.aciertos_2_cifras),
                e.posiciones_correctas, getattr(e, "digitos_coincidentes", 0),
                e.fecha_evaluacion or now_str, created_at
            ))

        # Metricas
        for m in seed.get("metricas_modelo", []):
            created_at = getattr(m, "ultima_actualizacion", None) or now_str
            cursor.execute("""
                INSERT OR REPLACE INTO metricas_modelo (id, modelo_id, periodo, total_predicciones, aciertos_exactos, aciertos_3_cifras, aciertos_2_cifras, aciertos_posicionales_promedio, top_1_accuracy, top_5_accuracy, ratio_vs_random, p_value_vs_random, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                m.id, m.modelo_id, m.periodo, m.total_predicciones, m.aciertos_exactos,
                m.aciertos_3_cifras, m.aciertos_2_cifras, getattr(m, "aciertos_posicionales_promedio", 0.0),
                m.top_1_accuracy, m.top_5_accuracy, m.ratio_vs_random, m.p_value_vs_random,
                created_at
            ))

        conn.commit()
        conn.close()

    def insert_prediction(self, p: Any):
        conn = get_connection()
        cursor = conn.cursor()
        factores_json = json.dumps(getattr(p, "explicacion_factores", {}))
        cursor.execute("""
            INSERT OR REPLACE INTO predicciones (id, sorteo_id, version_modelo_id, fecha_generacion, numero_predicho, score, ranking, explicacion_factores, estado_bloqueo, hash_bloqueo, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            p.id, p.sorteo_id, p.version_modelo_id, p.fecha_generacion, p.numero_predicho,
            p.score, p.ranking, factores_json, int(p.estado_bloqueo),
            p.hash_bloqueo, getattr(p, "created_at", datetime.now().isoformat())
        ))
        conn.commit()
        conn.close()

    def insert_result(self, r: Any):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO resultados (id, sorteo_id, numero_ganador, serie, tipo_premio, fuente, fecha_obtencion, hash_dato, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            r.id, r.sorteo_id, r.numero_ganador, r.serie, r.tipo_premio,
            r.fuente, r.fecha_obtencion or datetime.now().isoformat(), r.hash_dato,
            getattr(r, "created_at", datetime.now().isoformat())
        ))
        conn.commit()
        conn.close()

    def insert_evaluation(self, e: Any):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO evaluaciones (id, prediccion_id, resultado_id, resultado_real, acierto_exacto, aciertos_3_cifras, aciertos_2_cifras, posiciones_correctas, digitos_coincidentes, fecha_evaluacion, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            e.id, e.prediccion_id, getattr(e, "resultado_id", ""), getattr(e, "resultado_real", ""),
            int(e.acierto_exacto), int(e.aciertos_3_cifras), int(e.aciertos_2_cifras),
            e.posiciones_correctas, getattr(e, "digitos_coincidentes", 0),
            e.fecha_evaluacion or datetime.now().isoformat(), getattr(e, "created_at", datetime.now().isoformat())
        ))
        conn.commit()
        conn.close()

        conn.commit()
        conn.close()

    def insert_prediction(self, p: Any):
        conn = get_connection()
        cursor = conn.cursor()
        factores_json = json.dumps(getattr(p, "explicacion_factores", {}))
        cursor.execute("""
            INSERT OR REPLACE INTO predicciones (id, sorteo_id, version_modelo_id, fecha_generacion, numero_predicho, score, ranking, explicacion_factores, estado_bloqueo, hash_bloqueo, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            p.id, p.sorteo_id, p.version_modelo_id, p.fecha_generacion, p.numero_predicho,
            p.score, p.ranking, factores_json, int(p.estado_bloqueo),
            p.hash_bloqueo, getattr(p, "created_at", datetime.now().isoformat())
        ))
        conn.commit()
        conn.close()

    def insert_result(self, r: Any):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO resultados (id, sorteo_id, numero_ganador, serie, tipo_premio, fuente, fecha_obtencion, hash_dato, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            r.id, r.sorteo_id, r.numero_ganador, r.serie, r.tipo_premio,
            r.fuente, r.fecha_obtencion, r.hash_dato,
            getattr(r, "created_at", datetime.now().isoformat())
        ))
        conn.commit()
        conn.close()

    def insert_evaluation(self, e: Any):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO evaluaciones (id, prediccion_id, sorteo_id, acierto_exacto, aciertos_3_cifras, aciertos_2_cifras, posiciones_correctas, log_loss, fecha_evaluacion, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            e.id, e.prediccion_id, e.sorteo_id, int(e.acierto_exacto),
            int(e.aciertos_3_cifras), int(e.aciertos_2_cifras), e.posiciones_correctas,
            e.log_loss, e.fecha_evaluacion, getattr(e, "created_at", datetime.now().isoformat())
        ))
        conn.commit()
        conn.close()

    def get_stats(self) -> Dict[str, int]:
        conn = get_connection()
        cursor = conn.cursor()
        stats = {}
        for tbl in ["loterias", "modelos", "sorteos", "resultados", "predicciones", "evaluaciones", "metricas_modelo"]:
            cursor.execute(f"SELECT COUNT(*) FROM {tbl}")
            stats[tbl] = cursor.fetchone()[0]
        conn.close()
        return stats

sqlite_store = SQLiteStore()
