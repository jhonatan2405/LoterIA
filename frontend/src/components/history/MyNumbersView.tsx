import { useState, useEffect } from 'react';
import { History, Calendar, Search, Trophy, CheckCircle2, Clock, Sparkles, AlertCircle, Lock } from 'lucide-react';

interface SavedGeneration {
  id: string;
  lottery_code: string;
  lottery_name: string;
  model_code: string;
  model_name: string;
  number: string;
  serie: string;
  date: string;
  target_draw_date?: string;
  timestamp: number;
}

interface MyNumbersViewProps {
  recentResults: any[];
}

export const MyNumbersView = ({ recentResults }: MyNumbersViewProps) => {
  const [generations, setGenerations] = useState<SavedGeneration[]>([]);
  const [filterLottery, setFilterLottery] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('loteria_generations') || '[]');
      setGenerations(saved);
    } catch { setGenerations([]); }
  }, []);

  // Get unique lotteries from generations
  const uniqueLotteries = Array.from(new Set(generations.map(g => g.lottery_code)))
    .map(code => ({ code, name: generations.find(g => g.lottery_code === code)?.lottery_name || code }));

  // Filter
  const filtered = generations.filter(g => {
    const matchesLottery = filterLottery === 'ALL' || g.lottery_code === filterLottery;
    const matchesSearch = !searchTerm || g.number.includes(searchTerm) || g.lottery_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLottery && matchesSearch;
  });

  // Strict match check: ONLY matches if official result's date EXACTLY equals target_draw_date
  const checkMatch = (gen: SavedGeneration): {
    isPending: boolean;
    exact: boolean;
    partial3: boolean;
    partial2: boolean;
    officialNumber?: string;
    targetDate: string;
  } => {
    const targetDate = gen.target_draw_date || gen.date;

    const matchResult = recentResults.find(r =>
      r.loteria?.codigo === gen.lottery_code &&
      r.sorteo?.fecha_programada === targetDate
    );

    if (!matchResult || !matchResult.resultado?.numero_ganador) {
      return { isPending: true, exact: false, partial3: false, partial2: false, targetDate };
    }

    const official = matchResult.resultado.numero_ganador;
    const exact = gen.number === official;
    const partial3 = gen.number.slice(-3) === official.slice(-3) || gen.number.slice(0, 3) === official.slice(0, 3);
    const partial2 = gen.number.slice(-2) === official.slice(-2);

    return { isPending: false, exact, partial3, partial2, officialNumber: official, targetDate };
  };

  // Group by target draw date
  const groupedByDate: Record<string, SavedGeneration[]> = {};
  filtered.forEach(g => {
    const d = g.target_draw_date || g.date;
    if (!groupedByDate[d]) groupedByDate[d] = [];
    groupedByDate[d].push(g);
  });

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  const formatDate = (dateStr: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (dateStr === today) return 'Hoy';
    if (dateStr === tomorrow) return 'Mañana';
    if (dateStr === yesterday) return 'Ayer';
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="luxury-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider" style={{ background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid var(--border-medium)' }}>
              HISTORIAL INMUTABLE
            </span>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>
              Almacenamiento Local Seguro
            </span>
          </div>
          <h2 className="text-xl font-bold mt-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <History className="w-5 h-5" style={{ color: 'var(--accent)' }} /> Mis Números Generados
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Tus pronósticos quedan registrados de forma permanente y se comparan únicamente contra el sorteo oficial de su fecha programada.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Buscar número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs rounded-xl pl-8 pr-3 py-2.5 focus:outline-none transition-all"
              style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)' }}
            />
          </div>
          <select
            value={filterLottery}
            onChange={(e) => setFilterLottery(e.target.value)}
            className="text-xs rounded-xl px-3 py-2.5 focus:outline-none transition-all font-bold"
            style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)' }}
          >
            <option value="ALL">Todas las Loterías</option>
            {uniqueLotteries.map(l => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Generados', value: generations.length, icon: History },
          { label: 'Loterías Jugadas', value: uniqueLotteries.length, icon: Trophy },
          { label: 'Pendientes por Sorteo', value: generations.filter(g => checkMatch(g).isPending).length, icon: Clock },
          { label: 'Aciertos Verificados', value: generations.filter(g => { const m = checkMatch(g); return !m.isPending && (m.exact || m.partial3 || m.partial2); }).length, icon: CheckCircle2 },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="luxury-card p-4 text-center">
              <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: 'var(--accent)' }} />
              <div className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{stat.value}</div>
              <div className="text-[10px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {generations.length === 0 && (
        <div className="luxury-card p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Aún no has generado números</h3>
          <p className="text-xs max-w-md mx-auto" style={{ color: 'var(--text-tertiary)' }}>
            Selecciona una lotería en el Generador y genera tu pronóstico. Quedará guardado y bloqueado para que puedas comprobarlo tras el sorteo oficial.
          </p>
        </div>
      )}

      {/* Grouped by Date */}
      {sortedDates.map(dateKey => (
        <div key={dateKey} className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              Sorteo Programado: {formatDate(dateKey)} ({dateKey})
            </span>
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
              ({groupedByDate[dateKey].length} {groupedByDate[dateKey].length === 1 ? 'pronóstico' : 'pronósticos'})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {groupedByDate[dateKey].map(gen => {
              const match = checkMatch(gen);
              return (
                <div key={gen.id} className="luxury-card p-4 space-y-3" style={{
                  borderColor: match.isPending ? 'var(--border-medium)' : match.exact ? '#10b981' : match.partial3 ? '#f59e0b' : match.partial2 ? '#06b6d4' : 'var(--border-medium)'
                }}>
                  {/* Top row */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{gen.lottery_name}</h4>
                      <div className="text-[11px] flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        <Clock className="w-3 h-3" />
                        <span>{gen.model_name}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {match.isPending ? (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <AlertCircle className="w-3 h-3" />
                        <span>Pendiente de Sorteo</span>
                      </span>
                    ) : match.exact ? (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                        ¡ACIERTO PLENO 4C!
                      </span>
                    ) : match.partial3 ? (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300">
                        Acierto 3 Cifras
                      </span>
                    ) : match.partial2 ? (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-300">
                        Acierto 2 Cifras
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-surface-alt)', color: 'var(--text-tertiary)' }}>
                        Sorteo Concluido
                      </span>
                    )}
                  </div>

                  {/* Numbers row */}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div>
                      <div className="text-[10px] font-semibold mb-1" style={{ color: 'var(--text-tertiary)' }}>Tu Pronóstico Bloqueado</div>
                      <div className="flex gap-1.5">
                        {gen.number.split('').map((d, i) => (
                          <div key={i} className="sphere-3d sphere-indigo" style={{ width: 36, height: 36, fontSize: '1rem' }}>{d}</div>
                        ))}
                      </div>
                      {gen.serie && <span className="text-[10px] font-mono mt-1 block" style={{ color: 'var(--text-tertiary)' }}>Serie {gen.serie}</span>}
                    </div>

                    {!match.isPending && match.officialNumber ? (
                      <div className="text-right">
                        <div className="text-[10px] font-semibold mb-1" style={{ color: 'var(--text-tertiary)' }}>Resultado Oficial</div>
                        <div className="flex gap-1.5 justify-end">
                          {match.officialNumber.split('').map((d, i) => (
                            <div key={i} className="sphere-3d sphere-winning" style={{ width: 32, height: 32, fontSize: '0.9rem' }}>{d}</div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-right p-2.5 rounded-xl border" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border-subtle)' }}>
                        <div className="text-[10px] font-semibold flex items-center justify-end gap-1" style={{ color: 'var(--text-secondary)' }}>
                          <Lock className="w-3 h-3 text-amber-500" />
                          <span>Bloqueado Pre-Sorteo</span>
                        </div>
                        <span className="text-[10px] block mt-0.5 font-medium" style={{ color: 'var(--text-tertiary)' }}>
                          En espera del sorteo oficial de {formatDate(match.targetDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
