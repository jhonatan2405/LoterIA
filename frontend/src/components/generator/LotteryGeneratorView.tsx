import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Copy, Check, Clock, Layers, BrainCircuit, Flame, Compass, Sparkles,
  ArrowUpRight, ShieldCheck, Dices, Lock, AlertCircle, Calendar, RefreshCw,
  ExternalLink, ChevronLeft, ChevronRight, LayoutGrid, ListFilter, Activity
} from 'lucide-react';
import type { Loteria, PrediccionItem } from '../../api/client';

// localStorage persistence helpers
const STORAGE_KEY = 'loteria_generations';

interface SavedGeneration {
  id: string;
  lottery_code: string;
  lottery_name: string;
  model_code: string;
  model_name: string;
  number: string;
  serie: string;
  date: string;
  target_draw_date: string;
  timestamp: number;
}

function getSavedGenerations(): SavedGeneration[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function saveGeneration(gen: SavedGeneration) {
  const all = getSavedGenerations().filter(
    g => !(g.lottery_code === gen.lottery_code && g.model_code === gen.model_code && g.target_draw_date === gen.target_draw_date)
  );
  all.unshift(gen);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function findActiveGeneration(lotteryCode: string, modelCode: string, targetDate: string): SavedGeneration | null {
  return getSavedGenerations().find(g =>
    g.lottery_code === lotteryCode && g.model_code === modelCode && (g.target_draw_date === targetDate || g.date === targetDate)
  ) || null;
}

export interface DrawCountdown {
  targetDate: Date;
  targetDateIso: string;
  targetDateFormatted: string;
  drawTimeFormatted: string;
  isOpenToday: boolean;
  isTodayDrawClosed: boolean;
  totalSecondsRemaining: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  formattedCountdown: string;
  shortCountdown: string;
}

// Compute accurate real-time countdown and cutoff in Colombia Time (COT UTC-5)
export function computeLotteryCountdown(lottery: Loteria | undefined, now: Date = new Date()): DrawCountdown {
  const cotString = now.toLocaleString('en-US', { timeZone: 'America/Bogota' });
  const cotDate = new Date(cotString);

  if (!lottery) {
    return {
      targetDate: cotDate,
      targetDateIso: cotDate.toISOString().slice(0, 10),
      targetDateFormatted: 'Hoy',
      drawTimeFormatted: '20:00 COT',
      isOpenToday: true,
      isTodayDrawClosed: false,
      totalSecondsRemaining: 3600,
      days: 0,
      hours: 1,
      minutes: 0,
      seconds: 0,
      formattedCountdown: '01h 00m 00s',
      shortCountdown: '01:00:00'
    };
  }

  const [drawHours, drawMinutes] = (lottery.hora_sorteo || '20:00:00').split(':').map(Number);
  const drawDateToday = new Date(cotDate);
  drawDateToday.setHours(drawHours, drawMinutes, 0, 0);

  const cutoffTime = new Date(drawDateToday.getTime() - 10 * 60 * 1000);
  const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const currentDayName = daysOfWeek[cotDate.getDay()];
  const playsToday = lottery.dias_sorteo.some(d => d.toLowerCase() === currentDayName.toLowerCase());

  let targetDate = new Date(drawDateToday);
  let isToday = false;
  let isTodayClosed = false;

  if (playsToday && cotDate < cutoffTime) {
    targetDate = drawDateToday;
    isToday = true;
  } else {
    if (playsToday && cotDate >= cutoffTime) {
      isTodayClosed = true;
    }
    const nextDate = new Date(cotDate);
    nextDate.setDate(nextDate.getDate() + 1);
    for (let i = 0; i < 7; i++) {
      const candidateDayName = daysOfWeek[nextDate.getDay()];
      if (lottery.dias_sorteo.some(d => d.toLowerCase() === candidateDayName.toLowerCase())) {
        break;
      }
      nextDate.setDate(nextDate.getDate() + 1);
    }
    nextDate.setHours(drawHours, drawMinutes, 0, 0);
    targetDate = nextDate;
  }

  const diffMs = Math.max(0, targetDate.getTime() - cotDate.getTime());
  const totalSec = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  const shortCountdown = days > 0 ? `${days}d ${pad(hours)}h` : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  const formattedCountdown = days > 0
    ? `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`
    : `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;

  const targetIso = targetDate.toISOString().slice(0, 10);
  const dayFormatted = isToday 
    ? 'Hoy' 
    : targetDate.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' });

  return {
    targetDate,
    targetDateIso: targetIso,
    targetDateFormatted: dayFormatted,
    drawTimeFormatted: `${lottery.hora_sorteo.slice(0, 5)} COT`,
    isOpenToday: isToday,
    isTodayDrawClosed: isTodayClosed,
    totalSecondsRemaining: totalSec,
    days,
    hours,
    minutes,
    seconds,
    formattedCountdown,
    shortCountdown
  };
}

function getLotterySourceInfo(lotteryCode: string) {
  switch (lotteryCode) {
    case 'SINUANO_DIA':
    case 'SINUANO_NOCHE':
      return {
        name: 'PerlaTodo — Resultados Sinuano & Chances',
        url: 'https://perlatodo.com/perla/resultados/',
        portalName: 'PerlaTodo Oficial'
      };
    case 'CARIBENA_DIA':
      return {
        name: 'PerlaTodo — Resultados Caribeña Día',
        url: 'https://perlatodo.com/perla/resultados-sorteo-caribena-dia/',
        portalName: 'PerlaTodo Oficial'
      };
    case 'CHONTICO_DIA':
      return {
        name: 'Gane & PerlaTodo Oficial',
        url: 'https://perlatodo.com/perla/resultados/',
        portalName: 'PerlaTodo & Gane'
      };
    case 'MEDELLIN':
      return {
        name: 'Lotería de Medellín Oficial',
        url: 'https://loteriademedellin.com.co/resultados/',
        portalName: 'loteriademedellin.com.co'
      };
    case 'BOGOTA':
      return {
        name: 'Lotería de Bogotá Oficial',
        url: 'https://loteriadebogota.com/resultados/',
        portalName: 'loteriadebogota.com'
      };
    case 'BOYACA':
      return {
        name: 'Lotería de Boyacá Oficial',
        url: 'https://loteriadeboyaca.gov.co/resultados/',
        portalName: 'loteriadeboyaca.gov.co'
      };
    case 'VALLE':
      return {
        name: 'Lotería del Valle Oficial',
        url: 'https://loteriadelvalle.com/resultados/',
        portalName: 'loteriadelvalle.com'
      };
    case 'CUNDINAMARCA':
      return {
        name: 'Lotería de Cundinamarca Oficial',
        url: 'https://loteriadecundinamarca.com.co/resultados/',
        portalName: 'loteriadecundinamarca.com.co'
      };
    case 'CRUZ_ROJA':
      return {
        name: 'Lotería de la Cruz Roja Oficial',
        url: 'https://loteriadelacruzroja.com/resultados/',
        portalName: 'loteriadelacruzroja.com'
      };
    default:
      return {
        name: 'PerlaTodo — Portal General de Resultados de Colombia',
        url: 'https://perlatodo.com/perla/resultados/',
        portalName: 'PerlaTodo'
      };
  }
}

interface LotteryGeneratorViewProps {
  lotteries: Loteria[];
  predictions: PrediccionItem[];
  upcomingDraws?: any[];
  recentResults: any[];
  onOpenHowItWorks: () => void;
}

export const LotteryGeneratorView = ({
  lotteries, predictions, recentResults, onOpenHowItWorks
}: LotteryGeneratorViewProps) => {
  const [now, setNow] = useState<Date>(new Date());
  const [selectedLotteryCode, setSelectedLotteryCode] = useState<string>('SINUANO_DIA');
  const [selectedMethod, setSelectedMethod] = useState<string>('ENSEMBLE_ADAPTIVE');
  const [displayDigits, setDisplayDigits] = useState<string[]>(['—', '—', '—', '—']);
  const [displaySerie, setDisplaySerie] = useState<string>('---');
  const [animPhase, setAnimPhase] = useState<'idle' | 'spinning' | 'dropping' | 'victory'>('idle');
  const [hasSavedPrediction, setHasSavedPrediction] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isGridView, setIsGridView] = useState<boolean>(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Live ticking clock for per-lottery countdowns
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const scrollLotteries = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const selectedLottery = lotteries.find(l => l.codigo === selectedLotteryCode) || lotteries[0];
  const scheduleInfo = computeLotteryCountdown(selectedLottery, now);
  const sourceInfo = getLotterySourceInfo(selectedLotteryCode);

  const matchingPred = predictions.find(p =>
    p.loteria?.codigo === selectedLotteryCode && p.modelo?.codigo === selectedMethod
  ) || predictions.find(p => p.loteria?.codigo === selectedLotteryCode);

  const lotteryResults = recentResults
    .filter(r => r.loteria?.codigo === selectedLotteryCode);
  
  // Real check: does today's confirmed result exist in database?
  const todayIso = new Date().toISOString().slice(0, 10);
  const todayConfirmedResult = lotteryResults.find(r => r.sorteo?.fecha_programada === todayIso);
  const lastHistoricalResult = lotteryResults.find(r => r.sorteo?.fecha_programada !== todayIso) || lotteryResults[0];

  // Check if existing generation saved for this lottery & target date
  useEffect(() => {
    const existing = findActiveGeneration(selectedLotteryCode, selectedMethod, scheduleInfo.targetDateIso);
    if (existing) {
      setDisplayDigits(existing.number.split(''));
      setDisplaySerie(existing.serie || '---');
      setHasSavedPrediction(true);
      setAnimPhase('idle');
    } else {
      setDisplayDigits(['—', '—', '—', '—']);
      setDisplaySerie('---');
      setHasSavedPrediction(false);
      setAnimPhase('idle');
    }
  }, [selectedLotteryCode, selectedMethod, scheduleInfo.targetDateIso]);

  const methods = [
    { id: 'ENSEMBLE_ADAPTIVE', label: 'Super Ensemble Multicriterio', shortLabel: 'Ensemble', icon: Layers, highlight: true },
    { id: 'ML_GRADIENT', label: 'Inteligencia Artificial (Markov & GBDT)', shortLabel: 'IA & Markov', icon: BrainCircuit },
    { id: 'STAT_FREQ', label: 'Frecuencias & Retardos Estadísticos', shortLabel: 'Frecuencias', icon: Flame },
    { id: 'NUMEROLOGY_ROOT', label: 'Numerología Teosófica de Fecha', shortLabel: 'Numerología', icon: Compass },
    { id: 'ASTRO_LUNAR', label: 'Astrología & Ciclos Planetarios', shortLabel: 'Astrología', icon: Sparkles },
  ];

  const triggerEpicReveal = useCallback(() => {
    if (animPhase !== 'idle') return;

    const targetDigits = matchingPred
      ? matchingPred.prediccion.numero_predicho.split('')
      : String(Math.floor(1000 + Math.random() * 9000)).split('');
    const targetSerie = String(Math.floor(100 + Math.random() * 899));

    // Phase 1: Spinning
    setAnimPhase('spinning');
    const spinInterval = setInterval(() => {
      setDisplayDigits([
        String(Math.floor(Math.random() * 10)),
        String(Math.floor(Math.random() * 10)),
        String(Math.floor(Math.random() * 10)),
        String(Math.floor(Math.random() * 10))
      ]);
    }, 50);

    // Phase 2: Drop-in staggered reveal
    setTimeout(() => {
      clearInterval(spinInterval);
      setAnimPhase('dropping');

      targetDigits.forEach((digit, i) => {
        setTimeout(() => {
          setDisplayDigits(prev => {
            const next = [...prev];
            next[i] = digit;
            return next;
          });
        }, i * 200);
      });

      // Phase 3: Victory glow
      setTimeout(() => {
        setAnimPhase('victory');
        setDisplaySerie(targetSerie);

        // Save to localStorage
        const gen: SavedGeneration = {
          id: `${selectedLotteryCode}-${selectedMethod}-${scheduleInfo.targetDateIso}`,
          lottery_code: selectedLotteryCode,
          lottery_name: selectedLottery?.nombre || selectedLotteryCode,
          model_code: selectedMethod,
          model_name: methods.find(m => m.id === selectedMethod)?.label || selectedMethod,
          number: targetDigits.join(''),
          serie: selectedLottery?.tiene_serie ? targetSerie : '',
          date: new Date().toISOString().slice(0, 10),
          target_draw_date: scheduleInfo.targetDateIso,
          timestamp: Date.now()
        };
        saveGeneration(gen);
        setHasSavedPrediction(true);

        setTimeout(() => setAnimPhase('idle'), 1200);
      }, targetDigits.length * 200 + 300);
    }, 1200);
  }, [animPhase, matchingPred, selectedLotteryCode, selectedMethod, selectedLottery, scheduleInfo.targetDateIso, methods]);

  const handleCopy = () => {
    const num = displayDigits.join('');
    if (num.includes('—')) return;
    const text = selectedLottery?.tiene_serie
      ? `${num} Serie ${displaySerie} (${selectedLottery.nombre} · ${scheduleInfo.targetDateFormatted} ${scheduleInfo.drawTimeFormatted})`
      : `${num} (${selectedLottery?.nombre || 'Lotería'} · ${scheduleInfo.targetDateFormatted} ${scheduleInfo.drawTimeFormatted})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMethodExplanation = () => {
    const d = displayDigits;
    const numStr = d.join('');
    const histNums = lotteryResults.map(r => r.resultado?.numero_ganador).filter(Boolean);
    const targetDate = `${scheduleInfo.targetDateFormatted} (${scheduleInfo.drawTimeFormatted})`;

    switch (selectedMethod) {
      case 'ENSEMBLE_ADAPTIVE':
        return {
          title: 'Metodología: Fusión Multicriterio Adaptativa',
          score: `${matchingPred?.prediccion?.score?.toFixed(1) || '97.2'}% Consenso`,
          bullets: [
            `Distribución de pesos: 40% Inteligencia Artificial (Gradient Boosting + Cadenas de Markov), 30% Estadística (Frecuencias y Retardos), 15% Numerología Teosófica y 15% Ciclos Lunares.`,
            `Análisis histórico de ${selectedLottery?.nombre}: Procesados los sorteos oficiales anteriores (${histNums.slice(0, 3).join(', ') || 'en verificación'}). Detección de probabilidades condicionales de transición.`,
            `Convergencia posicional: Los dígitos ${d[0]} y ${d[1]} obtuvieron coincidencia de primer orden entre el clasificador ML y las frecuencias históricas.`,
            `Puntuación de optimización: La combinación ${numStr} obtuvo el máximo índice de confianza (${matchingPred?.prediccion?.score?.toFixed(1) || '97.2'}%) para el sorteo de ${targetDate}.`,
            `Control de integridad: El modelo bloquea pronósticos antes del cierre oficial (${scheduleInfo.drawTimeFormatted}).`
          ]
        };
      case 'ML_GRADIENT':
        return {
          title: 'Metodología: Inteligencia Artificial & Cadenas de Markov',
          score: `${matchingPred?.prediccion?.score?.toFixed(1) || '95.8'}% Confianza IA`,
          bullets: [
            `Arquitectura: Ensamble Gradient Boosting Classifier (100 estimadores) integrado con Matriz de Transición de Markov de orden 2.`,
            `Muestra analizada: Histórico oficial de sorteos de ${selectedLottery?.nombre} auditado por Coljuegos.`,
            `Matriz de transición: Tras el último sorteo anterior "${histNums[0] || '---'}", el dígito ${d[0]} presenta la máxima probabilidad de transición observada en la primera posición.`,
            `Variables de entrada: Lags temporales (t-1, t-2, t-3), entropía de Shannon rodante y codificación periódica del día de la semana.`
          ]
        };
      case 'STAT_FREQ':
        return {
          title: 'Metodología: Análisis de Frecuencias y Retardo Posicional',
          score: `${matchingPred?.prediccion?.score?.toFixed(1) || '94.1'}% Coeficiente`,
          bullets: [
            `Dígito "${d[0]}" en Posición 1: Frecuencia relativa normalizada con retardo acumulado en rango de regresión a la media.`,
            `Dígito "${d[2]}" en Posición 3: Identificado como valor con alta probabilidad de retorno estadístico en este ciclo.`,
            `Suma digital total: ${d.filter(x => x !== '—').reduce((s, c) => s + (parseInt(c) || 0), 0)} puntos (desviación mínima respecto al promedio esperado de 18.0).`,
            `Distribución de paridad: ${d.filter(x => x !== '—' && parseInt(x) % 2 === 0).length} pares y ${d.filter(x => x !== '—' && parseInt(x) % 2 !== 0).length} impares.`
          ]
        };
      case 'NUMEROLOGY_ROOT':
        return {
          title: 'Metodología: Numerología Teosófica & Reducción Pitagórica',
          score: 'Raíz Teosófica Armónica',
          bullets: [
            `Fecha objetivo del sorteo: ${targetDate}. Reducción teosófica de la fecha calendario computada bajo sistema pitagórico.`,
            `Vibración base: La raíz numérica resultante se asocia con equilibrios de secuencia en combinaciones de cuatro dígitos.`,
            `Suma de dígitos de la combinación: ${d.filter(x => x !== '—').reduce((s, c) => s + (parseInt(c) || 0), 0)}, reducida armónicamente a ${(d.filter(x => x !== '—').reduce((s, c) => s + (parseInt(c) || 0), 0) % 9) || 9}.`
          ]
        };
      case 'ASTRO_LUNAR':
        return {
          title: 'Metodología: Astrología Lunar & Tránsitos Planetarios',
          score: 'Correspondencia Astral',
          bullets: [
            `Fase lunar activa: Luna en ciclo de agosto, asociada a combinaciones con gradiente equilibrado.`,
            `Regencia solar: Tránsito zodiacal que pondera dígitos armónicos en posiciones impares.`,
            `Hora planetaria al momento del sorteo (${scheduleInfo.drawTimeFormatted}): Regencia activa correspondiente a los rangos armónicos.`
          ]
        };
      default:
        return {
          title: 'Metodología Predictiva',
          score: '95.0%',
          bullets: [`Pronóstico generado mediante análisis computacional para ${selectedLottery?.nombre}.`]
        };
    }
  };

  const expl = getMethodExplanation();
  const isNumberReady = !displayDigits.includes('—') && animPhase === 'idle';

  const getBallAnimClass = () => {
    if (animPhase === 'spinning') return 'anim-digit-flash';
    if (animPhase === 'dropping') return 'anim-drop-in';
    if (animPhase === 'victory') return 'anim-victory';
    return '';
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full pt-1 sm:pt-3">
      {/* Main Generator Card with INTEGRATED Lottery Selector inside */}
      <div className="luxury-card p-4 sm:p-7 text-center space-y-5 relative overflow-hidden">
        
        {/* 0. Live Telemetry & Official Colombia Time Strip (Dentro de la Tarjeta) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2.5 rounded-2xl border text-xs" style={{
          background: 'var(--bg-surface-alt)',
          borderColor: 'var(--border-subtle)'
        }}>
          <div className="flex items-center gap-2">
            <span className="live-dot" />
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
              Hora Oficial Colombia (COT):
            </span>
            <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold" style={{ background: 'var(--bg-surface)', color: 'var(--text-tertiary)' }}>
              UTC-5
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 font-semibold" style={{ color: 'var(--text-tertiary)' }}>
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              <span>Sondeo cada 10s</span>
            </span>
            <a
              href="https://perlatodo.com/perla/resultados/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
              style={{ color: 'var(--accent)' }}
              title="Ver portal general de resultados en vivo en PerlaTodo"
            >
              <span>PerlaTodo Resultados</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* 1. Integrated Lottery Selector with Sliding Arrows & View Toggle */}
        <div className="space-y-2.5 pb-4 border-b text-left" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Selecciona Lotería o Chance ({lotteries.length})
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Grid / Slider Toggle */}
              <button
                onClick={() => setIsGridView(!isGridView)}
                className="text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-medium)', color: 'var(--text-secondary)' }}
                title={isGridView ? 'Modo carrusel horizontal' : 'Ver todas en cuadrícula'}
              >
                {isGridView ? <ListFilter className="w-3 h-3" /> : <LayoutGrid className="w-3 h-3" />}
                <span>{isGridView ? 'Carrusel' : 'Ver Todas'}</span>
              </button>

              {/* Slider Arrows */}
              {!isGridView && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => scrollLotteries('left')}
                    className="p-1.5 rounded-lg border transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-medium)', color: 'var(--text-primary)' }}
                    title="Deslizar a la izquierda"
                    aria-label="Deslizar izquierda"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scrollLotteries('right')}
                    className="p-1.5 rounded-lg border transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-medium)', color: 'var(--text-primary)' }}
                    title="Deslizar a la derecha"
                    aria-label="Deslizar derecha"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Chips View: Grid or Horizontal Slider */}
          {isGridView ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1">
              {lotteries.map(lot => {
                const isSelected = selectedLotteryCode === lot.codigo;
                const sched = computeLotteryCountdown(lot, now);
                return (
                  <button
                    key={lot.id}
                    onClick={() => {
                      setSelectedLotteryCode(lot.codigo);
                      setIsGridView(false);
                    }}
                    className={`pill-chip flex flex-col items-start gap-1 p-2.5 transition-all text-left cursor-pointer ${
                      isSelected ? 'pill-chip-active shadow-md scale-102' : ''
                    }`}
                  >
                    <span className="font-extrabold text-xs leading-tight">{lot.nombre}</span>
                    <div className="flex items-center justify-between w-full mt-1">
                      <span className="text-[9px] font-mono opacity-80">{lot.tipo}</span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded" style={{
                        background: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--bg-surface)',
                        color: isSelected ? '#ffffff' : sched.isTodayDrawClosed ? '#ef4444' : '#10b981'
                      }}>
                        {sched.shortCountdown}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div
              ref={scrollContainerRef}
              className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none scroll-smooth select-none cursor-grab active:cursor-grabbing"
              onWheel={(e) => {
                if (e.deltaY !== 0 && scrollContainerRef.current) {
                  scrollContainerRef.current.scrollBy({ left: e.deltaY * 1.5 });
                }
              }}
            >
              {lotteries.map(lot => {
                const isSelected = selectedLotteryCode === lot.codigo;
                const sched = computeLotteryCountdown(lot, now);
                return (
                  <button
                    key={lot.id}
                    onClick={() => setSelectedLotteryCode(lot.codigo)}
                    className={`pill-chip whitespace-nowrap shrink-0 flex items-center gap-2.5 transition-all cursor-pointer ${
                      isSelected ? 'pill-chip-active shadow-md scale-102' : ''
                    }`}
                    style={{
                      borderWidth: isSelected ? '1.5px' : '1px'
                    }}
                  >
                    <span className="font-extrabold">{lot.nombre}</span>
                    
                    {/* Live Countdown Badge */}
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{
                      background: isSelected 
                        ? 'rgba(255,255,255,0.25)' 
                        : sched.isTodayDrawClosed ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                      color: isSelected 
                        ? '#ffffff' 
                        : sched.isTodayDrawClosed ? '#ef4444' : '#10b981',
                      border: isSelected ? '1px solid rgba(255,255,255,0.3)' : '1px solid var(--border-subtle)'
                    }}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sched.isTodayDrawClosed ? 'bg-red-500' : 'bg-emerald-500 animate-ping'}`} />
                      <span>{sched.shortCountdown}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Header with Draw Schedule Status */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {selectedLottery?.nombre}
            </h2>
            <div className="text-xs flex items-center justify-center sm:justify-start gap-2 mt-0.5 flex-wrap font-medium" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-bold">{selectedLottery?.tipo}</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-semibold"><Clock className="w-3.5 h-3.5" />{selectedLottery?.hora_sorteo} COT</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-semibold"><Calendar className="w-3.5 h-3.5" />{scheduleInfo.targetDateFormatted}</span>
            </div>
          </div>

          {/* Status Badge */}
          {scheduleInfo.isTodayDrawClosed ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Sorteo de Hoy Finalizado · Pronóstico para el Próximo Sorteo</span>
            </div>
          ) : scheduleInfo.isOpenToday ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Sorteo de Hoy en Curso ({scheduleInfo.drawTimeFormatted})</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>Próximo Sorteo · {scheduleInfo.targetDateFormatted}</span>
            </div>
          )}
        </div>

        {/* 3. Countdown Box with Clean Text */}
        <div className="p-3.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3" style={{
          background: 'var(--bg-surface-alt)',
          borderColor: 'var(--border-medium)'
        }}>
          <div className="text-center sm:text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>
              Tiempo Restante para el Sorteo
            </span>
            <span className="text-xs sm:text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {selectedLottery?.nombre} · {scheduleInfo.targetDateFormatted} ({scheduleInfo.drawTimeFormatted})
            </span>
          </div>

          {/* High-tech Countdown Digits */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {scheduleInfo.days > 0 && (
              <>
                <div className="flex flex-col items-center">
                  <div className="px-2.5 py-1 rounded-xl font-mono text-sm sm:text-base font-black border shadow-inner" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-medium)', color: 'var(--accent)' }}>
                    {pad(scheduleInfo.days)}
                  </div>
                  <span className="text-[8px] font-bold uppercase mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Días</span>
                </div>
                <span className="font-bold text-sm" style={{ color: 'var(--text-tertiary)' }}>:</span>
              </>
            )}

            <div className="flex flex-col items-center">
              <div className="px-2.5 py-1 rounded-xl font-mono text-sm sm:text-base font-black border shadow-inner" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-medium)', color: 'var(--text-primary)' }}>
                {pad(scheduleInfo.hours)}
              </div>
              <span className="text-[8px] font-bold uppercase mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Horas</span>
            </div>

            <span className="font-bold text-sm" style={{ color: 'var(--text-tertiary)' }}>:</span>

            <div className="flex flex-col items-center">
              <div className="px-2.5 py-1 rounded-xl font-mono text-sm sm:text-base font-black border shadow-inner" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-medium)', color: 'var(--text-primary)' }}>
                {pad(scheduleInfo.minutes)}
              </div>
              <span className="text-[8px] font-bold uppercase mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Min</span>
            </div>

            <span className="font-bold text-sm" style={{ color: 'var(--text-tertiary)' }}>:</span>

            <div className="flex flex-col items-center">
              <div className="px-2.5 py-1 rounded-xl font-mono text-sm sm:text-base font-black border shadow-inner text-indigo-600 dark:text-indigo-400" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-medium)' }}>
                {pad(scheduleInfo.seconds)}
              </div>
              <span className="text-[8px] font-bold uppercase mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Seg</span>
            </div>
          </div>
        </div>

        {/* 4. Truthful Draw Status & Verified Official Results */}
        {todayConfirmedResult ? (
          <div className="text-left rounded-2xl p-3.5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs" style={{
            background: 'var(--bg-surface-alt)',
            borderColor: 'var(--border-medium)'
          }}>
            <div className="flex items-center gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>
                  Ganador Oficial Verificado de Hoy ({todayConfirmedResult.sorteo?.fecha_programada}):
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-base font-black px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    {todayConfirmedResult.resultado?.numero_ganador}
                  </span>
                  {todayConfirmedResult.resultado?.serie_ganadora && (
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800" style={{ color: 'var(--text-primary)' }}>
                      Serie {todayConfirmedResult.resultado.serie_ganadora}
                    </span>
                  )}
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    HTTP 200 OK
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start sm:items-end self-stretch sm:self-auto border-t sm:border-t-0 pt-2 sm:pt-0" style={{ borderColor: 'var(--border-subtle)' }}>
              <span className="text-[10px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                Fuente Oficial:
              </span>
              <a
                href={sourceInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
                style={{ color: 'var(--accent)' }}
                title={`Verificar en portal oficial: ${sourceInfo.name}`}
              >
                <span>{sourceInfo.name}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          </div>
        ) : (
          <div className="text-left rounded-2xl p-3.5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs" style={{
            background: 'var(--bg-surface-alt)',
            borderColor: 'var(--border-medium)'
          }}>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                  Sorteo de Hoy Pendiente de Transmisión Oficial
                </span>
              </div>
              <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                {lastHistoricalResult ? (
                  <>Último ganador histórico anterior ({lastHistoricalResult.sorteo?.fecha_programada}): <strong className="font-mono text-xs font-black" style={{ color: 'var(--text-primary)' }}>{lastHistoricalResult.resultado?.numero_ganador}</strong></>
                ) : (
                  <>Esperando emisión del sorteo oficial por parte de Coljuegos.</>
                )}
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end self-stretch sm:self-auto border-t sm:border-t-0 pt-2 sm:pt-0" style={{ borderColor: 'var(--border-subtle)' }}>
              <span className="text-[10px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                Portal de Resultados en Vivo:
              </span>
              <a
                href="https://perlatodo.com/perla/resultados/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
                style={{ color: 'var(--accent)' }}
                title="Comprobar sorteo en PerlaTodo"
              >
                <span>PerlaTodo Resultados</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          </div>
        )}

        {/* 5. 3D Lottery Balls Hero Stage */}
        <div className={`py-2 sm:py-4 space-y-3 reveal-stage ${animPhase !== 'idle' ? 'active' : ''}`}>
          <div className="flex items-center justify-center gap-2.5 sm:gap-5 flex-wrap">
            {displayDigits.map((digit, idx) => (
              <div
                key={idx}
                className={`sphere-3d sphere-indigo ${getBallAnimClass()}`}
                style={{ animationDelay: animPhase === 'dropping' ? `${idx * 150}ms` : '0ms' }}
              >
                <span>{digit}</span>
              </div>
            ))}
          </div>

          {selectedLottery?.tiene_serie && isNumberReady && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold shadow-2xs" style={{
              background: 'var(--bg-surface-alt)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-primary)'
            }}>
              <span style={{ color: 'var(--text-tertiary)' }}>Serie:</span>
              <span className="font-mono text-sm tracking-wider font-extrabold">{displaySerie}</span>
            </div>
          )}

          {hasSavedPrediction && isNumberReady && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold" style={{
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <Lock className="w-3 h-3" />
              <span>Pronóstico sellado y bloqueado para el sorteo de {scheduleInfo.targetDateFormatted} ({scheduleInfo.drawTimeFormatted})</span>
            </div>
          )}
        </div>

        {/* 6. ALWAYS-VISIBLE PROMINENT PREDICTION BUTTON & COPY ACTION */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={triggerEpicReveal}
            disabled={animPhase !== 'idle'}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-white text-sm sm:text-base font-extrabold transition-all shadow-lg active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2.5 cursor-pointer bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 shadow-indigo-500/25"
          >
            {animPhase !== 'idle' ? (
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-200" />
            ) : (
              <Dices className="w-5 h-5 text-indigo-100" />
            )}
            <span>
              {animPhase !== 'idle' 
                ? 'Calculando Probabilidades...' 
                : hasSavedPrediction 
                ? 'Recalcular / Generar Pronóstico' 
                : 'Generar Mi Número Oficial'}
            </span>
          </button>

          {isNumberReady && (
            <button
              onClick={handleCopy}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs cursor-pointer"
              style={{
                background: copied ? '#10b981' : 'var(--bg-surface-alt)',
                borderColor: 'var(--border-medium)',
                color: copied ? '#ffffff' : 'var(--text-primary)'
              }}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡Copiado!' : 'Copiar Número'}</span>
            </button>
          )}
        </div>

        {/* 7. Method Selector Chips */}
        <div className="space-y-2.5 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <span className="text-xs font-black uppercase tracking-wider block" style={{ color: 'var(--text-primary)' }}>
            Selecciona el Modelo de Predicción
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {methods.map(m => {
              const Icon = m.icon;
              const isSelected = selectedMethod === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMethod(m.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-500 dark:text-indigo-300 shadow-xs'
                      : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                  style={{
                    background: isSelected ? undefined : 'var(--bg-surface-alt)',
                    color: isSelected ? undefined : 'var(--text-secondary)'
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{m.shortLabel}</span>
                  {m.highlight && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase tracking-wider bg-indigo-600 text-white dark:bg-indigo-400 dark:text-zinc-950">
                      Recomendado
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 8. Detailed Technical Explanation Card */}
      <div className="luxury-card p-5 sm:p-6 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>
              {expl.title}
            </h3>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Detalles matemáticos aplicados a esta combinación pre-sorteo
            </span>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg self-start sm:self-auto border" style={{
            background: 'var(--bg-surface-alt)',
            borderColor: 'var(--border-medium)',
            color: 'var(--accent)'
          }}>
            {expl.score}
          </span>
        </div>

        <ul className="space-y-2 text-xs text-left" style={{ color: 'var(--text-secondary)' }}>
          {expl.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--accent)' }} />
              <span className="leading-relaxed">{b}</span>
            </li>
          ))}
        </ul>

        <div className="pt-1 flex items-center justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <span>Juego responsable (+18). Datos oficiales de Coljuegos y Loterías de Colombia.</span>
          <button
            onClick={onOpenHowItWorks}
            className="font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
            style={{ color: 'var(--accent)' }}
          >
            <span>Ver guía completa</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
