import { useState, useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { LotteryGeneratorView } from './components/generator/LotteryGeneratorView';
import { HowItWorksView } from './components/how-it-works/HowItWorksView';
import { ModelArenaView } from './components/models/ModelArenaView';
import { ResultsView } from './components/results/ResultsView';
import { MyNumbersView } from './components/history/MyNumbersView';
import { SourcesView } from './components/sources/SourcesView';
import { 
  api, 
  type SystemHealth, 
  type Loteria, 
  type PrediccionItem, 
  type ModeloBenchmark
} from './api/client';
import { CheckCircle2 } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('generator');
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [lotteries, setLotteries] = useState<Loteria[]>([]);
  const [upcomingDraws, setUpcomingDraws] = useState<any[]>([]);
  const [activePredictions, setActivePredictions] = useState<PrediccionItem[]>([]);
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [benchmarks, setBenchmarks] = useState<ModeloBenchmark[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [isRunningCycle, setIsRunningCycle] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'info' } | null>(null);

  const loadAllData = async () => {
    try {
      const [
        hData,
        lData,
        uData,
        pData,
        rData,
        bData,
        eData
      ] = await Promise.all([
        api.getHealth().catch(() => null),
        api.getLotteries().catch(() => []),
        api.getUpcomingDraws().catch(() => []),
        api.getActivePredictions(300).catch(() => []),
        api.getRecentResults(30).catch(() => []),
        api.getModelBenchmark().catch(() => []),
        api.getRecentEvaluations(50).catch(() => [])
      ]);

      if (hData) setHealth(hData);
      if (lData) setLotteries(lData);
      if (uData) setUpcomingDraws(uData);
      if (pData) setActivePredictions(pData);
      if (rData) setRecentResults(rData);
      if (bData) setBenchmarks(bData);
      if (eData) setEvaluations(eData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error cargando datos en tiempo real:', err);
    }
  };

  useEffect(() => {
    loadAllData();
    // Guaranteed live background polling every 10 seconds
    const interval = setInterval(loadAllData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRunCycle = async () => {
    setIsRunningCycle(true);
    try {
      const res = await api.triggerAutonomousCycle();
      setNotification({
        msg: `Predicciones actualizadas en tiempo real: ${res.predicciones_creadas} combinaciones calculadas.`,
        type: 'success'
      });
      await loadAllData();
    } catch (e: any) {
      setNotification({
        msg: `Error actualizando: ${e.message}`,
        type: 'info'
      });
    } finally {
      setIsRunningCycle(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  return (
    <AppLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      health={health}
      onRunCycle={handleRunCycle}
      isRunningCycle={isRunningCycle}
      lastUpdated={lastUpdated}
    >
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-50 animate-bounce">
          <div className="p-4 rounded-2xl text-white text-xs font-semibold shadow-2xl flex items-center gap-2.5"
            style={{ background: 'var(--text-primary)', border: '1px solid var(--border-medium)' }}>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification.msg}</span>
          </div>
        </div>
      )}

      {/* 1. Main Generator Tab */}
      {activeTab === 'generator' && (
        <LotteryGeneratorView
          lotteries={lotteries}
          predictions={activePredictions}
          upcomingDraws={upcomingDraws}
          recentResults={recentResults}
          onOpenHowItWorks={() => setActiveTab('how-it-works')}
        />
      )}

      {/* 2. Beginner-Friendly How It Works Tab */}
      {activeTab === 'how-it-works' && (
        <HowItWorksView
          onGoToGenerator={() => setActiveTab('generator')}
        />
      )}

      {/* 3. Official Results Feed Tab */}
      {activeTab === 'results' && (
        <ResultsView
          results={recentResults}
          lotteries={lotteries}
          onRefresh={loadAllData}
        />
      )}

      {/* 4. Live Official Sources & Transparency Tab */}
      {activeTab === 'sources' && (
        <SourcesView
          lotteries={lotteries}
          recentResults={recentResults}
          onRefresh={loadAllData}
        />
      )}

      {/* 5. Compare Methods & Hit Audit Tab */}
      {activeTab === 'models' && (
        <ModelArenaView
          benchmarks={benchmarks}
          evaluations={evaluations}
          predictions={activePredictions}
          lotteries={lotteries}
          health={health}
        />
      )}

      {/* 6. My Numbers History Tab */}
      {activeTab === 'my-numbers' && (
        <MyNumbersView recentResults={recentResults} />
      )}
    </AppLayout>
  );
}

export default App;
