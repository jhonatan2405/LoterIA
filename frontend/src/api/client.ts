/**
 * API Client for LoterIA (ALPES) Backend.
 */

const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE = rawBase.endsWith('/api') ? rawBase : `${rawBase.replace(/\/+$/, '')}/api`;

export interface Loteria {
  id: string;
  codigo: string;
  nombre: string;
  tipo: 'LOTERIA' | 'CHANCE' | 'EXTRA';
  numero_digitos: number;
  tiene_serie: boolean;
  dias_sorteo: string[];
  hora_sorteo: string;
  fuente_principal: string;
  fuente_secundaria?: string;
  logo_url?: string;
  estado: string;
}

export interface Sorteo {
  id: string;
  loteria_id: string;
  numero_sorteo: string;
  fecha_programada: string;
  hora_programada: string;
  fecha_resultado?: string;
  estado: string;
}

export interface Resultado {
  id: string;
  sorteo_id: string;
  numero_ganador: string;
  serie?: string;
  tipo_premio: string;
  fuente: string;
  fecha_obtencion?: string;
  hash_dato: string;
}

export interface ModeloBenchmark {
  modelo_id: string;
  codigo: string;
  nombre: string;
  familia: string;
  es_cientifico: boolean;
  badge_color: string;
  version: string;
  ratio_vs_random: number;
  p_value_vs_random: number;
  significativo_95: boolean;
  interpretacion_cientifica: string;
  metricas?: {
    total_predicciones: number;
    aciertos_exactos: number;
    aciertos_3_cifras: number;
    aciertos_2_cifras: number;
    aciertos_posicionales_promedio: number;
    top_1_accuracy: number;
    top_5_accuracy: number;
    top_10_accuracy: number;
    intervalo_confianza_95: [number, number];
  };
}

export interface PrediccionItem {
  prediccion: {
    id: string;
    sorteo_id: string;
    version_modelo_id: string;
    fecha_generacion: string;
    numero_predicho: string;
    score: number;
    ranking: number;
    explicacion_factores: any;
    estado_bloqueo: boolean;
    hash_bloqueo: string;
  };
  sorteo: Sorteo;
  loteria: Loteria;
  modelo: {
    id: string;
    codigo: string;
    nombre: string;
    familia: string;
    es_cientifico: boolean;
    badge_color: string;
  };
}

export interface SystemHealth {
  status: string;
  timestamp: string;
  services: {
    database_supabase: {
      status: string;
      mode: string;
      inmutabilidad_trigger: string;
      total_registros_historicos: number;
    };
    data_collector: {
      status: string;
      fuente_primaria: string;
      intervalo_consulta: string;
    };
    predictive_engines: {
      status: string;
      motores_activos: number;
      familias: string[];
    };
    evaluator_engine: {
      status: string;
      evaluaciones_realizadas: number;
      hipotesis_control: string;
    };
    anti_leakage_protection: {
      status: string;
      bloqueo_estricto: boolean;
      predicciones_bloqueadas: number;
    };
  };
  totals: {
    loterias: number;
    sorteos: number;
    resultados: number;
    predicciones: number;
    evaluaciones: number;
  };
}

export interface EventoSistema {
  id: string;
  tipo_evento: string;
  componente: string;
  nivel: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';
  descripcion: string;
  metadata: any;
  created_at: string;
}

export const api = {
  async getHealth(): Promise<SystemHealth> {
    const res = await fetch(`${API_BASE}/system/health`);
    if (!res.ok) throw new Error('Error al obtener estado de salud del sistema');
    return res.json();
  },

  async getLotteries(): Promise<Loteria[]> {
    const res = await fetch(`${API_BASE}/lotteries`);
    if (!res.ok) throw new Error('Error al obtener loterías');
    return res.json();
  },

  async getUpcomingDraws(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/draws/upcoming`);
    if (!res.ok) throw new Error('Error al obtener próximos sorteos');
    return res.json();
  },

  async getSchedules(): Promise<Record<string, any>> {
    const res = await fetch(`${API_BASE}/schedules`);
    if (!res.ok) return {};
    return res.json();
  },

  async getActivePredictions(limit: number = 50): Promise<PrediccionItem[]> {
    const res = await fetch(`${API_BASE}/predictions/active?limit=${limit}`);
    if (!res.ok) throw new Error('Error al obtener predicciones activas');
    return res.json();
  },

  async getRecentResults(limit: number = 30): Promise<any[]> {
    const res = await fetch(`${API_BASE}/results/recent?limit=${limit}`);
    if (!res.ok) throw new Error('Error al obtener resultados recientes');
    return res.json();
  },

  async getRecentEvaluations(limit: number = 50): Promise<any[]> {
    const res = await fetch(`${API_BASE}/evaluations/recent?limit=${limit}`);
    if (!res.ok) throw new Error('Error al obtener evaluaciones recientes');
    return res.json();
  },

  async getModelBenchmark(): Promise<ModeloBenchmark[]> {
    const res = await fetch(`${API_BASE}/models/benchmark`);
    if (!res.ok) throw new Error('Error al obtener benchmark de modelos');
    return res.json();
  },

  async getSystemEvents(limit: number = 30): Promise<EventoSistema[]> {
    const res = await fetch(`${API_BASE}/system/events?limit=${limit}`);
    if (!res.ok) throw new Error('Error al obtener eventos del sistema');
    return res.json();
  },

  async getSupabaseSchema(): Promise<{ schema_sql: string }> {
    const res = await fetch(`${API_BASE}/system/supabase-schema`);
    if (!res.ok) throw new Error('Error al obtener esquema Supabase');
    return res.json();
  },

  async triggerAutonomousCycle(): Promise<any> {
    const res = await fetch(`${API_BASE}/system/run-cycle`, { method: 'POST' });
    if (!res.ok) throw new Error('Error al ejecutar ciclo autónomo');
    return res.json();
  },

  async runBacktest(lotteryCode: string, lookbackWindow: number, topK: number = 10, models?: string[]): Promise<any> {
    const res = await fetch(`${API_BASE}/system/backtest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lottery_code: lotteryCode,
        lookback_window: lookbackWindow,
        top_k: topK,
        models
      })
    });
    if (!res.ok) throw new Error('Error ejecutando simulación de backtesting');
    return res.json();
  }
};
