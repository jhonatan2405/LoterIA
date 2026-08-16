import { useState } from 'react';
import { 
  FlaskConical, 
  Play, 
  RefreshCw, 
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { type Loteria, api } from '../../api/client';
import { SlidingNumber } from '../animate-ui/primitives/texts/sliding-number';

interface BacktestViewProps {
  lotteries: Loteria[];
}

export const BacktestView: React.FC<BacktestViewProps> = ({ lotteries }) => {
  const [selectedLottery, setSelectedLottery] = useState<string>('MEDELLIN');
  const [lookbackWindow, setLookbackWindow] = useState<number>(20);
  const [topK, setTopK] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRunBacktest = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.runBacktest(selectedLottery, lookbackWindow, topK);
      setSimulationResult(res);
    } catch (e: any) {
      setErrorMsg(e.message || 'Error en ejecución de backtesting');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Configuration Controls */}
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
              <FlaskConical className="w-5 h-5 text-blue-400" /> Laboratorio de Backtesting Fuera de Muestra
            </h2>
            <p className="text-xs text-slate-400">
              Simulación cronológica paso a paso (Walk-Forward) con protección estricta contra Data Leakage
            </p>
          </div>

          <div className="text-xs font-mono text-blue-300 bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20 self-start md:self-auto">
            Zero Lookahead Bias
          </div>
        </div>

        {/* Configuration Form Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Lotería a Evaluar:</label>
            <select
              value={selectedLottery}
              onChange={(e) => setSelectedLottery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
            >
              {lotteries.map((l) => (
                <option key={l.id} value={l.codigo}>
                  {l.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ventana Inicial (Sorteos):</label>
            <select
              value={lookbackWindow}
              onChange={(e) => setLookbackWindow(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
            >
              <option value={15}>15 Sorteos Previos</option>
              <option value={20}>20 Sorteos Previos</option>
              <option value={30}>30 Sorteos Previos</option>
              <option value={50}>50 Sorteos Previos</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Candidatos Top-K:</label>
            <select
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
            >
              <option value={5}>Top 5 Candidatos</option>
              <option value={10}>Top 10 Candidatos</option>
              <option value={20}>Top 20 Candidatos</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRunBacktest}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-sm disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Simulando...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Ejecutar Simulación</span>
                </>
              )}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {errorMsg}
          </div>
        )}
      </div>

      {/* 2. Simulation Summary & Comparative Ranking */}
      {simulationResult && (
        <div className="space-y-6">
          {/* Summary KPIs (3 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-semibold">Sorteos Fuera de Muestra</span>
              <div className="text-2xl font-bold text-white font-heading mt-1">
                <SlidingNumber value={simulationResult.total_sorteos_simulados} /> Sorteos
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-semibold">Tiempo de Computación</span>
              <div className="text-2xl font-bold text-blue-400 font-heading mt-1">
                {simulationResult.duracion_segundos}s
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-semibold">Modelo Líder en Test</span>
              <div className="text-2xl font-bold text-purple-400 font-heading mt-1">
                {simulationResult.modelos_resumen[0]?.modelo_codigo || 'N/A'}
              </div>
            </div>
          </div>

          {/* Model Ranking Table */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-heading">
                <BarChart3 className="w-4 h-4 text-blue-400" /> Tabla Comparativa de Rendimiento en Backtest
              </h3>
              <span className="text-xs text-slate-400">
                Ordenado por Ratio vs Random (H0)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Modelo</th>
                    <th className="py-3 px-4 text-center">4 Cifras (Exactos)</th>
                    <th className="py-3 px-4 text-center">3 Cifras</th>
                    <th className="py-3 px-4 text-center">2 Cifras</th>
                    <th className="py-3 px-4 text-center">Posiciones Promedio</th>
                    <th className="py-3 px-4 text-center">Top-1 Acc</th>
                    <th className="py-3 px-4 text-right">Ratio vs Azar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {simulationResult.modelos_resumen.map((m: any, idx: number) => {
                    const isBaseline = m.modelo_codigo === 'RANDOM_BASELINE';
                    return (
                      <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-white">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono mr-2 ${
                            isBaseline ? 'bg-slate-800 text-slate-400' : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                          }`}>
                            {m.modelo_codigo}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">{m.aciertos_exactos}</td>
                        <td className="py-3 px-4 text-center font-mono text-blue-300">{m.aciertos_3_cifras}</td>
                        <td className="py-3 px-4 text-center font-mono text-purple-300">{m.aciertos_2_cifras}</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-300">{m.aciertos_posicionales_promedio.toFixed(3)}</td>
                        <td className="py-3 px-4 text-center font-mono text-amber-300">{(m.top_1_accuracy * 100).toFixed(1)}%</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-sm text-blue-400">
                          {m.ratio_vs_random.toFixed(3)}x
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
