import { useState } from 'react';
import { 
  Lock, 
  Copy, 
  Check, 
  Info, 
  ShieldCheck, 
  ChevronDown,
  ChevronUp,
  Search
} from 'lucide-react';
import type { PrediccionItem, Loteria } from '../../api/client';

interface PredictionsViewProps {
  predictions: PrediccionItem[];
  lotteries: Loteria[];
}

export const PredictionsView = ({
  predictions,
  lotteries
}: PredictionsViewProps) => {
  const [selectedLottery, setSelectedLottery] = useState<string>('ALL');
  const [selectedModel, setSelectedModel] = useState<string>('ALL');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [expandedPredId, setExpandedPredId] = useState<string | null>(null);
  const [searchDigit, setSearchDigit] = useState<string>('');

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filtered = predictions.filter((item) => {
    const lotMatch = selectedLottery === 'ALL' || item.loteria?.codigo === selectedLottery;
    const modMatch = selectedModel === 'ALL' || item.modelo?.codigo === selectedModel;
    const digitMatch = !searchDigit || item.prediccion.numero_predicho.includes(searchDigit);
    return lotMatch && modMatch && digitMatch;
  });

  return (
    <div className="space-y-6">
      {/* 1. Filter and Search Bar */}
      <div className="white-card p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 font-heading">
              <Lock className="w-5 h-5 text-purple-600" /> Predicciones Selladas &amp; Hash SHA-256
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Auditoría completa de predicciones bloqueadas antes de los sorteos oficiales
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 self-start md:self-auto">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Inmutabilidad Anti-Leakage</span>
          </div>
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por dígitos..."
              value={searchDigit}
              onChange={(e) => setSearchDigit(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl pl-8 pr-3 py-2.5 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <select
              value={selectedLottery}
              onChange={(e) => setSelectedLottery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="ALL">Todas las Loterías ({lotteries.length})</option>
              {lotteries.map((l) => (
                <option key={l.id} value={l.codigo}>
                  {l.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="ALL">Todos los Motores</option>
              <option value="ENSEMBLE_ADAPTIVE">Ensemble Inteligente</option>
              <option value="ML_GRADIENT">Inteligencia Artificial (Markov/Trees)</option>
              <option value="STAT_FREQ">Estadística &amp; Frecuencias</option>
              <option value="NUMEROLOGY_ROOT">Numerología</option>
              <option value="ASTRO_LUNAR">Astrología Lunar</option>
              <option value="RANDOM_BASELINE">Control Aleatorio (H0)</option>
            </select>
          </div>

          <div className="flex items-center justify-end text-xs text-slate-500 font-medium">
            <span>{filtered.length} predicciones encontradas</span>
          </div>
        </div>
      </div>

      {/* 2. Structured 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((item) => {
          const p = item.prediccion;
          const lot = item.loteria;
          const mod = item.modelo;
          const isExpanded = expandedPredId === p.id;

          return (
            <div 
              key={p.id} 
              className="white-card p-5 flex flex-col justify-between space-y-4 hover:border-blue-200"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                      {lot?.codigo || 'LOTERIA'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Sorteo #{item.sorteo?.numero_sorteo}
                    </span>
                  </div>
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                    Rank #{p.ranking}
                  </span>
                </div>

                {/* Digit Tiles */}
                <div className="my-5 flex items-center justify-center gap-2">
                  {p.numero_predicho.split('').map((digit, dIdx) => (
                    <span key={dIdx} className="lottery-digit-tile">
                      {digit}
                    </span>
                  ))}
                </div>

                {/* Model Info & Score */}
                <div className="flex items-center justify-between text-xs my-2">
                  <span className="text-slate-700 font-bold">{mod?.nombre}</span>
                  <span className="font-mono font-bold text-blue-600">{p.score.toFixed(1)} / 100 pts</span>
                </div>

                {/* Score Bar */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${p.score}%` }}
                  />
                </div>

                {/* Factor Explainability */}
                <div className="border-t border-slate-100 pt-3">
                  <button
                    onClick={() => setExpandedPredId(isExpanded ? null : p.id)}
                    className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    <span className="flex items-center gap-1.5 font-medium">
                      <Info className="w-3.5 h-3.5 text-blue-600" />
                      <span>Ver factores del cálculo</span>
                    </span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {isExpanded && p.explicacion_factores && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1 text-slate-700">
                      {Object.entries(p.explicacion_factores).map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-2">
                          <span className="text-slate-500 capitalize">{k.replace(/_/g, ' ')}:</span>
                          <span className="font-mono font-bold text-slate-800">
                            {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* SHA-256 Sello */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono truncate max-w-[150px]" title={p.hash_bloqueo}>
                  {p.hash_bloqueo}
                </span>
                <button
                  onClick={() => handleCopyHash(p.hash_bloqueo)}
                  className="hover:text-blue-600 font-semibold p-1 flex items-center gap-1 transition-colors text-[11px] text-slate-500"
                >
                  {copiedHash === p.hash_bloqueo ? (
                    <span className="text-emerald-600 flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Copiado
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5">
                      <Copy className="w-3 h-3" /> Hash
                    </span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
