import { 
  BrainCircuit, 
  Flame, 
  Layers, 
  Compass, 
  Sparkles, 
  Award,
  ArrowRight,
  Lightbulb
} from 'lucide-react';

interface HowItWorksViewProps {
  onGoToGenerator: () => void;
}

export const HowItWorksView = ({ onGoToGenerator }: HowItWorksViewProps) => {
  const steps = [
    {
      step: '1',
      title: 'Recopilamos el Historial Oficial',
      desc: 'El sistema guarda automáticamente cada resultado oficial de las loterías de Colombia (Medellín, Bogotá, Boyacá, Chances, etc.).'
    },
    {
      step: '2',
      title: '5 Modelos Analizan los Datos',
      desc: 'Cada modelo busca patrones distintos: la IA busca secuencias, la estadística busca números retrasados y la numerología calcula la fecha.'
    },
    {
      step: '3',
      title: 'El Super Ensemble Elige lo Mejor',
      desc: 'Combina las opiniones de todos los métodos y te entrega los 4 dígitos con mayor consenso para que juegues informado.'
    }
  ];

  const beginnerMethods = [
    {
      title: 'Super Ensemble (Recomendado)',
      badge: 'El más confiable',
      icon: Layers,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      analogy: 'Como consultar a una junta de 5 expertos y elegir la combinación donde la mayoría está de acuerdo.',
      howItWorks: 'Toma lo mejor de la Inteligencia Artificial (40%), la Estadística (30%), la Numerología (15%) y la Astrología (15%) para darte un número de alto consenso.'
    },
    {
      title: 'Inteligencia Artificial (IA)',
      badge: 'Patrones y Secuencias',
      icon: BrainCircuit,
      color: 'bg-zinc-100 text-zinc-800 border-zinc-200',
      analogy: 'Funciona como el texto predictivo de tu teléfono celular.',
      howItWorks: 'Analiza qué dígitos suelen salir después del último número ganador utilizando algoritmos de aprendizaje automático.'
    },
    {
      title: 'Frecuencias & Retardos (Estadística)',
      badge: 'Matemática Pura',
      icon: Flame,
      color: 'bg-zinc-100 text-zinc-800 border-zinc-200',
      analogy: 'Identifica los números "calientes" que más se repiten y los números "fríos" que llevan muchos días sin salir.',
      howItWorks: 'Si el número 8 en la primera posición lleva 15 sorteos sin caer, la estadística lo prioriza porque está en su punto de retorno histórico.'
    },
    {
      title: 'Numerología de la Fecha',
      badge: 'Vibración del Día',
      icon: Compass,
      color: 'bg-zinc-100 text-zinc-800 border-zinc-200',
      analogy: 'Encuentra la armonía numérica del día del sorteo.',
      howItWorks: 'Suma los números del día, mes y año de hoy (por ejemplo 15/08/2026) hasta llegar a un número raíz que guía la combinación.'
    },
    {
      title: 'Astrología Lunar',
      badge: 'Tradición Popular',
      icon: Sparkles,
      color: 'bg-zinc-100 text-zinc-800 border-zinc-200',
      analogy: 'Mapea la posición de la luna al momento en que cae la balotera.',
      howItWorks: 'Aplica las tablas tradicionales de correspondencia entre la fase lunar (creciente/llena) y los signos zodiacales del sorteo.'
    }
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto w-full px-2 sm:px-0">
      {/* 1. Friendly Beginner Intro Banner */}
      <div className="luxury-card p-6 sm:p-8 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200/80">
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Guía Sencilla para Principiantes</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
          ¿Cómo calcula LoterIA los números sugeridos?
        </h2>

        <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          En los juegos de azar nunca existe una certeza del 100%. Lo que hace <strong>LoterIA</strong> es sustituir la elección al azar por un <strong>análisis matemático, estadístico y de inteligencia artificial</strong> basado en miles de sorteos históricos reales de Colombia.
        </p>
      </div>

      {/* 2. 3 Simple Steps */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider px-1" style={{ color: 'var(--text-tertiary)' }}>
          El Proceso en 3 Pasos
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {steps.map((s) => (
            <div key={s.step} className="luxury-card p-5 space-y-2">
              <div className="w-7 h-7 rounded-full font-black text-xs flex items-center justify-center" style={{ background: 'var(--text-primary)', color: 'var(--bg-surface)' }}>
                {s.step}
              </div>
              <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{s.title}</h4>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. The 5 Methods Explained for Anyone */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider px-1" style={{ color: 'var(--text-tertiary)' }}>
          Las 5 Formas de Calcular tu Número
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {beginnerMethods.map((m, idx) => {
            const Icon = m.icon;
            return (
              <div key={idx} className="luxury-card p-5 sm:p-6 space-y-3 hover:border-zinc-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${m.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{m.title}</h4>
                      <span className="text-[10px] font-mono font-semibold" style={{ color: 'var(--text-tertiary)' }}>{m.badge}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl text-xs italic" style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-medium)', color: 'var(--text-secondary)' }}>
                  "{m.analogy}"
                </div>

                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  <strong>Cómo funciona:</strong> {m.howItWorks}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Prize Table */}
      <div className="luxury-card p-6 space-y-4">
        <div className="flex items-center gap-2 font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
          <Award className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          <span>Modalidades y Premios Oficiales en Colombia</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
            <div className="text-xs text-zinc-500 font-medium">Directo 4 Cifras</div>
            <div className="text-base sm:text-lg font-black text-zinc-900 mt-0.5">4.500x</div>
            <div className="text-[10px] text-zinc-400">Pagas $1.000 → Ganas $4.5M</div>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
            <div className="text-xs text-zinc-500 font-medium">Combinado 4 Cifras</div>
            <div className="text-base sm:text-lg font-black text-zinc-900 mt-0.5">208x</div>
            <div className="text-[10px] text-zinc-400">En cualquier orden</div>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
            <div className="text-xs text-zinc-500 font-medium">Pleno 3 Cifras</div>
            <div className="text-base sm:text-lg font-black text-zinc-900 mt-0.5">400x</div>
            <div className="text-[10px] text-zinc-400">Últimas 3 cifras</div>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
            <div className="text-xs text-zinc-500 font-medium">Pata / 2 Cifras</div>
            <div className="text-base sm:text-lg font-black text-zinc-900 mt-0.5">50x</div>
            <div className="text-[10px] text-zinc-400">Últimas 2 cifras</div>
          </div>
        </div>
      </div>

      {/* 5. Direct CTA Button */}
      <div className="text-center pt-2 pb-4">
        <button
          onClick={onGoToGenerator}
          className="inline-flex items-center gap-2 py-3.5 px-8 rounded-2xl text-white font-bold text-xs shadow-md transition-all hover:scale-102"
          style={{ background: 'var(--text-primary)' }}
        >
          <span>Probar el Generador con tu Lotería</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
