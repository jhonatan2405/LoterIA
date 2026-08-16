"""
Data models and types for LoterIA (ALPES).
"""
from datetime import date, time, datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum
import uuid

class TipoLoteria(str, Enum):
    LOTERIA = "LOTERIA"
    CHANCE = "CHANCE"
    EXTRA = "EXTRA"

class EstadoSorteo(str, Enum):
    PROGRAMADO = "PROGRAMADO"
    PREDICCION_GENERADA = "PREDICCION_GENERADA"
    SORTEADO = "SORTEADO"
    RESULTADO_CONFIRMADO = "RESULTADO_CONFIRMADO"
    EVALUADO = "EVALUADO"
    ERROR = "ERROR"

class FamiliaModelo(str, Enum):
    ESTADISTICO = "ESTADISTICO"
    ML = "ML"
    ALEATORIO_CONTROL = "ALEATORIO_CONTROL"
    EXPERIMENTAL_NUMEROLOGIA = "EXPERIMENTAL_NUMEROLOGIA"
    EXPERIMENTAL_ASTROLOGIA = "EXPERIMENTAL_ASTROLOGIA"
    ENSEMBLE = "ENSEMBLE"

class NivelEvento(str, Enum):
    INFO = "INFO"
    SUCCESS = "SUCCESS"
    WARN = "WARN"
    ERROR = "ERROR"

class Loteria(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    codigo: str
    nombre: str
    tipo: TipoLoteria = TipoLoteria.LOTERIA
    numero_digitos: int = 4
    tiene_serie: bool = True
    dias_sorteo: List[str]
    hora_sorteo: str
    zona_horaria: str = "America/Bogota"
    fuente_principal: str
    fuente_secundaria: Optional[str] = None
    logo_url: Optional[str] = None
    estado: str = "ACTIVO"
    created_at: Optional[str] = None

class Sorteo(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    loteria_id: str
    numero_sorteo: str
    fecha_programada: str # YYYY-MM-DD
    hora_programada: str # HH:MM:SS
    fecha_resultado: Optional[str] = None
    estado: EstadoSorteo = EstadoSorteo.PROGRAMADO
    created_at: Optional[str] = None

class Resultado(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sorteo_id: str
    numero_ganador: str
    serie: Optional[str] = None
    tipo_premio: str = "PREMIO_MAYOR"
    fuente: str
    fecha_obtencion: Optional[str] = None
    fecha_validacion: Optional[str] = None
    hash_dato: str
    created_at: Optional[str] = None

class Modelo(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    codigo: str
    nombre: str
    familia: FamiliaModelo
    descripcion: str
    es_cientifico: bool = True
    estado: str = "ACTIVO"
    peso_ensemble_base: float = 1.0
    badge_color: str = "#00f2fe"
    created_at: Optional[str] = None

class VersionModelo(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    modelo_id: str
    version: str
    fecha_entrenamiento: Optional[str] = None
    cantidad_datos_entrenados: int = 0
    variables_utilizadas: List[str] = []
    hiperparametros: Dict[str, Any] = {}
    metricas_validacion: Dict[str, Any] = {}
    activo: bool = True
    created_at: Optional[str] = None

class Prediccion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sorteo_id: str
    version_modelo_id: str
    fecha_generacion: Optional[str] = None
    numero_predicho: str
    score: float
    ranking: int
    explicacion_factores: Dict[str, Any] = {}
    estado_bloqueo: bool = True
    hash_bloqueo: str
    created_at: Optional[str] = None

class Evaluacion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    prediccion_id: str
    resultado_id: str
    resultado_real: str
    acierto_exacto: bool = False
    aciertos_3_cifras: bool = False
    aciertos_2_cifras: bool = False
    aciertos_1_cifra: bool = False
    posiciones_correctas: int = 0
    digitos_coincidentes: int = 0
    top_k_match: Optional[int] = None
    fecha_evaluacion: Optional[str] = None
    created_at: Optional[str] = None

class MetricaModelo(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    modelo_id: str
    periodo: str = "HISTORICO_TOTAL"
    total_predicciones: int = 0
    aciertos_exactos: int = 0
    aciertos_3_cifras: int = 0
    aciertos_2_cifras: int = 0
    aciertos_posicionales_promedio: float = 0.0
    top_1_accuracy: float = 0.0
    top_5_accuracy: float = 0.0
    top_10_accuracy: float = 0.0
    ratio_vs_random: float = 1.000
    p_value_vs_random: float = 1.000000
    intervalo_confianza_95: List[float] = [0.0, 0.0]
    ultima_actualizacion: Optional[str] = None

class EventoSistema(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tipo_evento: str
    componente: str
    nivel: NivelEvento = NivelEvento.INFO
    descripcion: str
    metadata: Dict[str, Any] = {}
    created_at: Optional[str] = None
