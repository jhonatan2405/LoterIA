-- ==============================================================================
-- LoterIA (ALPES - Autonomous Lottery Prediction & Evaluation System)
-- Supabase / PostgreSQL DDL Migration Script
-- Versión: 1.0.0
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS Y TIPOS
DO $$ BEGIN
    CREATE TYPE tipo_loteria_enum AS ENUM ('LOTERIA', 'CHANCE', 'EXTRA');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE estado_sorteo_enum AS ENUM (
        'PROGRAMADO', 
        'PREDICCION_GENERADA', 
        'SORTEADO', 
        'RESULTADO_CONFIRMADO', 
        'EVALUADO', 
        'ERROR'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE familia_modelo_enum AS ENUM (
        'ESTADISTICO', 
        'ML', 
        'ALEATORIO_CONTROL', 
        'EXPERIMENTAL_NUMEROLOGIA', 
        'EXPERIMENTAL_ASTROLOGIA', 
        'ENSEMBLE'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE nivel_evento_enum AS ENUM ('INFO', 'SUCCESS', 'WARN', 'ERROR');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. TABLA: LOTERIAS
CREATE TABLE IF NOT EXISTS loterias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    tipo tipo_loteria_enum NOT NULL DEFAULT 'LOTERIA',
    numero_digitos INTEGER NOT NULL DEFAULT 4,
    tiene_serie BOOLEAN NOT NULL DEFAULT TRUE,
    dias_sorteo TEXT[] NOT NULL,
    hora_sorteo TIME NOT NULL,
    zona_horaria VARCHAR(50) NOT NULL DEFAULT 'America/Bogota',
    fuente_principal TEXT NOT NULL,
    fuente_secundaria TEXT,
    logo_url TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABLA: SORTEOS
CREATE TABLE IF NOT EXISTS sorteos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loteria_id UUID NOT NULL REFERENCES loterias(id) ON DELETE CASCADE,
    numero_sorteo VARCHAR(50) NOT NULL,
    fecha_programada DATE NOT NULL,
    hora_programada TIME NOT NULL,
    fecha_resultado TIMESTAMPTZ,
    estado estado_sorteo_enum NOT NULL DEFAULT 'PROGRAMADO',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_sorteo_loteria_num_fecha UNIQUE (loteria_id, numero_sorteo, fecha_programada)
);

-- 5. TABLA: RESULTADOS
CREATE TABLE IF NOT EXISTS resultados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sorteo_id UUID UNIQUE NOT NULL REFERENCES sorteos(id) ON DELETE CASCADE,
    numero_ganador VARCHAR(10) NOT NULL,
    serie VARCHAR(10),
    tipo_premio VARCHAR(50) NOT NULL DEFAULT 'PREMIO_MAYOR',
    fuente TEXT NOT NULL,
    fecha_obtencion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_validacion TIMESTAMPTZ DEFAULT NOW(),
    hash_dato VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABLA: MODELOS
CREATE TABLE IF NOT EXISTS modelos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    familia familia_modelo_enum NOT NULL,
    descripcion TEXT NOT NULL,
    es_cientifico BOOLEAN NOT NULL DEFAULT TRUE,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    peso_ensemble_base NUMERIC(5,2) NOT NULL DEFAULT 1.0,
    badge_color VARCHAR(30) DEFAULT '#00f2fe',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABLA: VERSIONES_MODELO
CREATE TABLE IF NOT EXISTS versiones_modelo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    modelo_id UUID NOT NULL REFERENCES modelos(id) ON DELETE CASCADE,
    version VARCHAR(50) NOT NULL,
    fecha_entrenamiento TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cantidad_datos_entrenados INTEGER NOT NULL DEFAULT 0,
    variables_utilizadas JSONB NOT NULL DEFAULT '[]'::jsonb,
    hiperparametros JSONB NOT NULL DEFAULT '{}'::jsonb,
    metricas_validacion JSONB NOT NULL DEFAULT '{}'::jsonb,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_modelo_version UNIQUE (modelo_id, version)
);

-- 8. TABLA: PREDICCIONES (CON BLOQUEO ESTRICTO DE INMUTABILIDAD)
CREATE TABLE IF NOT EXISTS predicciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sorteo_id UUID NOT NULL REFERENCES sorteos(id) ON DELETE CASCADE,
    version_modelo_id UUID NOT NULL REFERENCES versiones_modelo(id) ON DELETE CASCADE,
    fecha_generacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    numero_predicho VARCHAR(10) NOT NULL,
    score NUMERIC(8,4) NOT NULL,
    ranking INTEGER NOT NULL CHECK (ranking >= 1),
    explicacion_factores JSONB NOT NULL DEFAULT '{}'::jsonb,
    estado_bloqueo BOOLEAN NOT NULL DEFAULT TRUE,
    hash_bloqueo VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_sorteo_modelo_ranking UNIQUE (sorteo_id, version_modelo_id, ranking)
);

-- 9. TRIGGER DE INMUTABILIDAD POSTGRESQL PARA PREDICCIONES BLOQUEADAS
CREATE OR REPLACE FUNCTION trg_check_prediction_lock_fn()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estado_bloqueo = TRUE THEN
        RAISE EXCEPTION 'VIOLACIÓN DE INTEGRIDAD ANTI-LEAKAGE: La predicción ID % está bloqueada y no permite modificaciones ni eliminaciones.', OLD.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_locked_predictions ON predicciones;
CREATE TRIGGER trg_protect_locked_predictions
BEFORE UPDATE OR DELETE ON predicciones
FOR EACH ROW EXECUTE FUNCTION trg_check_prediction_lock_fn();

-- 10. TABLA: EVALUACIONES
CREATE TABLE IF NOT EXISTS evaluaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediccion_id UUID UNIQUE NOT NULL REFERENCES predicciones(id) ON DELETE CASCADE,
    resultado_id UUID NOT NULL REFERENCES resultados(id) ON DELETE CASCADE,
    resultado_real VARCHAR(10) NOT NULL,
    acierto_exacto BOOLEAN NOT NULL DEFAULT FALSE,
    aciertos_3_cifras BOOLEAN NOT NULL DEFAULT FALSE,
    aciertos_2_cifras BOOLEAN NOT NULL DEFAULT FALSE,
    aciertos_1_cifra BOOLEAN NOT NULL DEFAULT FALSE,
    posiciones_correctas INTEGER NOT NULL DEFAULT 0,
    digitos_coincidentes INTEGER NOT NULL DEFAULT 0,
    top_k_match INTEGER,
    fecha_evaluacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. TABLA: METRICAS_MODELO
CREATE TABLE IF NOT EXISTS metricas_modelo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    modelo_id UUID NOT NULL REFERENCES modelos(id) ON DELETE CASCADE,
    periodo VARCHAR(50) NOT NULL DEFAULT 'HISTORICO_TOTAL',
    total_predicciones INTEGER NOT NULL DEFAULT 0,
    aciertos_exactos INTEGER NOT NULL DEFAULT 0,
    aciertos_3_cifras INTEGER NOT NULL DEFAULT 0,
    aciertos_2_cifras INTEGER NOT NULL DEFAULT 0,
    aciertos_posicionales_promedio NUMERIC(5,3) NOT NULL DEFAULT 0.0,
    top_1_accuracy NUMERIC(6,4) NOT NULL DEFAULT 0.0,
    top_5_accuracy NUMERIC(6,4) NOT NULL DEFAULT 0.0,
    top_10_accuracy NUMERIC(6,4) NOT NULL DEFAULT 0.0,
    ratio_vs_random NUMERIC(6,3) NOT NULL DEFAULT 1.000,
    p_value_vs_random NUMERIC(8,6) NOT NULL DEFAULT 1.000000,
    intervalo_confianza_95 NUMERIC(6,4)[] NOT NULL DEFAULT ARRAY[0.0, 0.0],
    ultima_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_modelo_periodo UNIQUE (modelo_id, periodo)
);

-- 12. TABLA: EVENTOS_SISTEMA (LOG DE AUDITORÍA)
CREATE TABLE IF NOT EXISTS eventos_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_evento VARCHAR(100) NOT NULL,
    componente VARCHAR(50) NOT NULL,
    nivel nivel_evento_enum NOT NULL DEFAULT 'INFO',
    descripcion TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. TABLA: REGISTROS_ACTUALIZACION
CREATE TABLE IF NOT EXISTS registros_actualizacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fuente VARCHAR(100) NOT NULL,
    registros_leidos INTEGER NOT NULL DEFAULT 0,
    registros_insertados INTEGER NOT NULL DEFAULT 0,
    registros_duplicados INTEGER NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    error_log TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. ÍNDICES PARA ALTO RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_sorteos_fecha ON sorteos(fecha_programada DESC);
CREATE INDEX IF NOT EXISTS idx_sorteos_estado ON sorteos(estado);
CREATE INDEX IF NOT EXISTS idx_sorteos_loteria ON sorteos(loteria_id);
CREATE INDEX IF NOT EXISTS idx_resultados_ganador ON resultados(numero_ganador);
CREATE INDEX IF NOT EXISTS idx_predicciones_sorteo ON predicciones(sorteo_id);
CREATE INDEX IF NOT EXISTS idx_predicciones_bloqueo ON predicciones(estado_bloqueo);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_exacto ON evaluaciones(acierto_exacto);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha ON eventos_sistema(created_at DESC);

-- 15. VISTAS SQL REUTILIZABLES
CREATE OR REPLACE VIEW vw_resumen_benchmark AS
SELECT 
    m.id AS modelo_id,
    m.codigo,
    m.nombre,
    m.familia,
    m.es_cientifico,
    m.badge_color,
    COALESCE(met.total_predicciones, 0) AS total_predicciones,
    COALESCE(met.aciertos_exactos, 0) AS aciertos_exactos,
    COALESCE(met.aciertos_3_cifras, 0) AS aciertos_3_cifras,
    COALESCE(met.aciertos_2_cifras, 0) AS aciertos_2_cifras,
    COALESCE(met.top_1_accuracy, 0) AS top_1_accuracy,
    COALESCE(met.top_5_accuracy, 0) AS top_5_accuracy,
    COALESCE(met.top_10_accuracy, 0) AS top_10_accuracy,
    COALESCE(met.ratio_vs_random, 1.000) AS ratio_vs_random,
    COALESCE(met.p_value_vs_random, 1.000000) AS p_value_vs_random,
    met.ultima_actualizacion
FROM modelos m
LEFT JOIN metricas_modelo met ON met.modelo_id = m.id AND met.periodo = 'HISTORICO_TOTAL'
WHERE m.estado = 'ACTIVO'
ORDER BY met.ratio_vs_random DESC NULLS LAST;

CREATE OR REPLACE VIEW vw_proximos_sorteos AS
SELECT 
    s.id AS sorteo_id,
    s.numero_sorteo,
    s.fecha_programada,
    s.hora_programada,
    s.estado,
    l.id AS loteria_id,
    l.codigo AS loteria_codigo,
    l.nombre AS loteria_nombre,
    l.tipo AS loteria_tipo,
    l.numero_digitos,
    (SELECT COUNT(*) FROM predicciones p WHERE p.sorteo_id = s.id) AS total_predicciones_generadas
FROM sorteos s
JOIN loterias l ON l.id = s.loteria_id
WHERE s.estado IN ('PROGRAMADO', 'PREDICCION_GENERADA')
ORDER BY s.fecha_programada ASC, s.hora_programada ASC;

-- 16. SEGURIDAD Y POLÍTICAS RLS (Row Level Security)
ALTER TABLE loterias ENABLE ROW LEVEL SECURITY;
ALTER TABLE sorteos ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados ENABLE ROW LEVEL SECURITY;
ALTER TABLE modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE versiones_modelo ENABLE ROW LEVEL SECURITY;
ALTER TABLE predicciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_modelo ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_actualizacion ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública (permitir consultar dashboard sin autenticación)
CREATE POLICY "Permitir lectura publica de loterias" ON loterias FOR SELECT USING (true);
CREATE POLICY "Permitir lectura publica de sorteos" ON sorteos FOR SELECT USING (true);
CREATE POLICY "Permitir lectura publica de resultados" ON resultados FOR SELECT USING (true);
CREATE POLICY "Permitir lectura publica de modelos" ON modelos FOR SELECT USING (true);
CREATE POLICY "Permitir lectura publica de versiones" ON versiones_modelo FOR SELECT USING (true);
CREATE POLICY "Permitir lectura publica de predicciones" ON predicciones FOR SELECT USING (true);
CREATE POLICY "Permitir lectura publica de evaluaciones" ON evaluaciones FOR SELECT USING (true);
CREATE POLICY "Permitir lectura publica de metricas" ON metricas_modelo FOR SELECT USING (true);
CREATE POLICY "Permitir lectura publica de eventos" ON eventos_sistema FOR SELECT USING (true);

-- ==============================================================================
-- FIN DDL SUPABASE
-- ==============================================================================
