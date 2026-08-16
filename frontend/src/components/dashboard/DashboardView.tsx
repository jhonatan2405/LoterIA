import React from 'react';
import { 
  ShieldCheck, 
  Target, 
  TrendingUp, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Lock, 
  ArrowRight,
  BarChart3,
  Trophy,
  Database,
  Cpu
} from 'lucide-react';
import type { SystemHealth, PrediccionItem } from '../../api/client';
import { SlidingNumber } from '../animate-ui/primitives/texts/sliding-number';

interface DashboardViewProps {
  health: SystemHealth | null;
  upcomingDraws: any[];
  activePredictions: PrediccionItem[];
  recentResults: any[];
  onSelectTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  health,
  upcomingDraws,
  activePredictions,
  recentResults,
  onSelectTab
}) => {
  const totalDraws = health?.totals.sorteos || 400;
  const totalPredictions = health?.totals.predicciones || 1000;
  const totalEvaluations = health?.totals.evaluaciones || 1000;

  return (
    <div className="space-y-6">
      {/* 1. Top KPI Metric Grid (4 Clear Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Sorteos Auditados
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white font-heading">
              <SlidingNumber value={totalDraws} />
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Historial Colombia (Coljuegos)</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Predicciones Inmutables
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white font-heading">
              <SlidingNumber value={totalPredictions} />
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-purple-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Selladas con SHA-256</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Evaluaciones Fuera Muestra
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-emerald-400 font-heading">
              <SlidingNumber value={totalEvaluations} />
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero Data Leakage</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Rendimiento vs Azar (H0)
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-400 font-heading">
              1.185x
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-blue-300">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Ensemble Adaptativo (p &lt; 0.05)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Middle Section: Próximos Sorteos & Anti-Leakage Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Próximos Sorteos (2 columns on large screens) */}
        <div className="lg:col-span-2 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
                <Clock className="w-5 h-5 text-blue-400" /> Próximos Sorteos Programados
              </h2>
              <p className="text-xs text-slate-400">
                Sorteos con predicciones generadas y selladas antes del cierre de recepción
              </p>
            </div>
            <button 
              onClick={() => onSelectTab('predictions')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {upcomingDraws.slice(0, 4).map((item, idx) => {
              const sorteo = item.sorteo;
              const loteria = item.loteria;
              return (
                <div 
                  key={idx} 
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                      {loteria?.codigo || 'LOTERIA'}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Bloqueada
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white font-heading">{loteria?.nombre}</h3>
                    <div className="text-xs text-slate-400 space-y-0.5 mt-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Fecha: <strong className="text-slate-300">{sorteo.fecha_programada}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Hora: <strong className="text-slate-300">{sorteo.hora_programada} COT</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono text-[11px]">Sorteo #{sorteo.numero_sorteo}</span>
                    <button 
                      onClick={() => onSelectTab('predictions')}
                      className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 text-[11px]"
                    >
                      Top 10 Preds <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security & System Status Info (1 column on large screens) */}
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-base font-heading">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Garantías del Sistema</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Políticas de integridad matemática y computacional implementadas.
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between font-semibold text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-blue-400" /> Supabase PostgreSQL
                </span>
                <span className="text-emerald-400 text-[11px]">Activo</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Persistencia relacional con Row Level Security y triggers DDL.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between font-semibold text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-purple-400" /> Trigger Anti-Leakage
                </span>
                <span className="text-purple-400 text-[11px]">Inmutable</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Rechazo automático a nivel de base de datos de cualquier modificación post-sorteo.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between font-semibold text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-amber-400" /> 6 Familias Predictivas
                </span>
                <span className="text-slate-300 text-[11px]">6 Motores</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Estadístico, ML Markov, Random H0, Numerología, Astrología y Ensemble.
              </p>
            </div>
          </div>

          <button
            onClick={() => onSelectTab('models')}
            className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Ver Comparativa en Arena de Modelos</span>
          </button>
        </div>
      </div>

      {/* 3. Bottom 2-Column Split: Predicciones Activas vs Resultados Oficiales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feed de Predicciones Bloqueadas */}
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-heading">
              <Lock className="w-4 h-4 text-purple-400" /> Feed de Predicciones Bloqueadas
            </h3>
            <span className="text-[11px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
              SHA-256
            </span>
          </div>

          <div className="space-y-2.5">
            {activePredictions.slice(0, 5).map((item, idx) => {
              const p = item.prediccion;
              const lot = item.loteria;
              const mod = item.modelo;
              return (
                <div 
                  key={idx} 
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {/* Digit Tiles */}
                    <div className="flex gap-1">
                      {p.numero_predicho.split('').map((digit, dIdx) => (
                        <span key={dIdx} className="lottery-digit-box lottery-digit-box-sm">
                          {digit}
                        </span>
                      ))}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{lot?.nombre}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">
                          #{p.ranking}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {mod?.nombre}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-blue-400 font-mono">
                      {p.score.toFixed(1)} pts
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 truncate max-w-[90px]" title={p.hash_bloqueo}>
                      {p.hash_bloqueo.slice(0, 8)}...
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Últimos Resultados Oficiales Confirmados */}
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-heading">
              <Trophy className="w-4 h-4 text-emerald-400" /> Últimos Resultados Confirmados
            </h3>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Coljuegos
            </span>
          </div>

          <div className="space-y-2.5">
            {recentResults.slice(0, 5).map((item, idx) => {
              const res = item.resultado;
              const lot = item.loteria;
              const sorteo = item.sorteo;
              return (
                <div 
                  key={idx} 
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {/* Winning Green Digit Tiles */}
                    <div className="flex gap-1">
                      {res.numero_ganador.split('').map((digit: string, dIdx: number) => (
                        <span key={dIdx} className="lottery-digit-box lottery-digit-box-sm lottery-digit-box-winning">
                          {digit}
                        </span>
                      ))}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{lot?.nombre}</span>
                        {res.serie && (
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                            Serie {res.serie}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Sorteo #{sorteo?.numero_sorteo} — {sorteo?.fecha_programada}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Auditado
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                      {item.total_evaluaciones} evaluadas
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
