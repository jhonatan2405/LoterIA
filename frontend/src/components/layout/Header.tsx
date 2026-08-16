import React from 'react';
import { 
  Activity, 
  Database, 
  ShieldCheck, 
  Cpu, 
  TrendingUp, 
  Lock, 
  Trophy, 
  FlaskConical, 
  FileCode2, 
  Play, 
  RefreshCw 
} from 'lucide-react';
import type { SystemHealth } from '../../api/client';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  health: SystemHealth | null;
  onRunCycle: () => void;
  isRunningCycle: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  health,
  onRunCycle,
  isRunningCycle
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'models', label: 'Arena de Modelos (vs Azar)', icon: TrendingUp },
    { id: 'predictions', label: 'Predicciones Bloqueadas', icon: Lock },
    { id: 'results', label: 'Resultados Oficiales', icon: Trophy },
    { id: 'backtest', label: 'Laboratorio Backtesting', icon: FlaskConical },
    { id: 'audit', label: 'Auditoría & Supabase', icon: FileCode2 }
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#060913]/85 border-b border-white/10 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 border border-cyan-400/30">
            <Cpu className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-white font-['Outfit']">
                Loter<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">IA</span>
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                ALPES v1.0
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Database className="w-3 h-3" /> Supabase
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Sistema Autónomo de Análisis, Predicción y Evaluación Fuera de Muestra
            </p>
          </div>
        </div>

        {/* Health status badges & Action Button */}
        <div className="flex items-center gap-3">
          {health && (
            <div className="hidden lg:flex items-center gap-3 bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-white/5 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="pulse-dot" />
                <span className="font-medium">PostgreSQL Supabase</span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center gap-1 text-cyan-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Anti-Leakage Bloqueo: ACTIVO</span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="text-slate-300">
                <span className="font-semibold text-white">{health.totals.predicciones}</span> Predicciones
              </div>
            </div>
          )}

          <button
            onClick={onRunCycle}
            disabled={isRunningCycle}
            className="btn-primary text-xs py-2 px-3.5"
            title="Ejecutar ciclo completo: Recolectar datos, predecir, bloquear y evaluar"
          >
            {isRunningCycle ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Ejecutando Ciclo...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Ejecutar Ciclo Autónomo</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`nav-tab whitespace-nowrap ${isActive ? 'active' : ''}`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
