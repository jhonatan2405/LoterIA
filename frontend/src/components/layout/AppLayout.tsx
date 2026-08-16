import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dices,
  Trophy,
  HelpCircle,
  TrendingUp,
  History,
  Sun,
  Moon,
  Globe
} from 'lucide-react';
import type { SystemHealth } from '../../api/client';

interface AppLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  health?: SystemHealth | null;
  onRunCycle?: () => void;
  isRunningCycle?: boolean;
  lastUpdated?: Date;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  setActiveTab,
  children
}) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const pillRef = useRef<HTMLDivElement>(null);
  const navItemsRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const navItems = [
    { id: 'generator', label: 'Generador', icon: Dices },
    { id: 'results', label: 'Resultados', icon: Trophy },
    { id: 'my-numbers', label: 'Mis Números', icon: History },
    { id: 'sources', label: 'Fuentes Oficiales', icon: Globe },
    { id: 'models', label: 'Modelos & Auditoría', icon: TrendingUp },
    { id: 'how-it-works', label: 'Cómo Funciona', icon: HelpCircle },
  ];

  const mobileNavItems = [
    { id: 'generator', label: 'Generador', icon: Dices },
    { id: 'results', label: 'Resultados', icon: Trophy },
    { id: 'my-numbers', label: 'Mis Números', icon: History },
    { id: 'sources', label: 'Fuentes', icon: Globe },
    { id: 'models', label: 'Auditoría', icon: TrendingUp },
    { id: 'how-it-works', label: 'Guía', icon: HelpCircle },
  ];



  // Theme toggle
  const toggleTheme = useCallback(() => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  }, [theme]);

  // Animate the slider pill to the active button
  const updatePill = useCallback((smooth = true) => {
    if (!navItemsRef.current || !pillRef.current) return;
    const buttons = navItemsRef.current.querySelectorAll('.nav-btn-glass');
    const activeBtn = Array.from(buttons).find(b => b.classList.contains('active')) as HTMLElement;
    if (!activeBtn) return;

    const pill = pillRef.current;
    if (!smooth) pill.style.transition = 'none';
    else pill.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.2, 0.64, 1), width 0.4s cubic-bezier(0.34, 1.2, 0.64, 1), background 0.3s ease, box-shadow 0.3s ease';
    
    pill.style.width = `${activeBtn.offsetWidth}px`;
    pill.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
  }, []);

  useEffect(() => {
    const t = setTimeout(() => updatePill(false), 80);
    return () => clearTimeout(t);
  }, [activeTab, updatePill]);

  useEffect(() => {
    const handleResize = () => updatePill(false);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updatePill]);

  // Interactive glare
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!glareRef.current || !navRef.current) return;
    const rect = navRef.current.getBoundingClientRect();
    glareRef.current.style.setProperty('--x', `${e.clientX - rect.left}px`);
    glareRef.current.style.setProperty('--y', `${e.clientY - rect.top}px`);
  };

  return (
    <div className="min-h-screen flex flex-col antialiased" style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      {/* ========== DESKTOP LIQUID GLASS NAV ========== */}
      <div className="liquid-nav-wrapper hidden md:block">
        <div className="w-full px-6 md:px-8 lg:px-12 relative flex items-center justify-between min-h-[52px]">
          {/* Clean Typography Brand Name (Sin Logo - A la Izquierda) */}
          <div
            onClick={() => setActiveTab('generator')}
            className="flex items-center gap-2 cursor-pointer select-none group shrink-0 z-10"
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight leading-none group-hover:opacity-85 transition-opacity" style={{ color: 'var(--text-primary)' }}>
                  Loter<span style={{ color: '#4f8ef7' }}>IA</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider" style={{ background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid var(--border-medium)' }}>
                  COLOMBIA
                </span>
              </div>
              <span className="text-[10px] font-semibold tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                Sistema Autónomo Oficial
              </span>
            </div>
          </div>

          {/* 100% Optically and Mathematically Centered Glass Nav Pill */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto">
            <nav className="liquid-nav" ref={navRef} onMouseMove={handleMouseMove}>
              <div className="liquid-glare-container">
                <div className="liquid-glare" ref={glareRef} />
              </div>

              <div className="nav-items-glass" ref={navItemsRef}>
                <div className="active-pill" ref={pillRef} />
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`nav-btn-glass ${isActive ? 'active' : ''}`}
                      title={item.label}
                    >
                      <Icon className="w-4 h-4 shrink-0 transition-transform duration-200" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                className="theme-btn"
                onClick={toggleTheme}
                title={theme === 'light' ? 'Modo noche' : 'Modo día'}
                aria-label="Cambiar tema"
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" />
                )}
              </button>
            </nav>
          </div>

          {/* Right Spacer to preserve perfect symmetry */}
          <div className="shrink-0 z-10 hidden md:block w-16" />
        </div>
      </div>

      {/* ========== MOBILE TOP BAR ========== */}
      <div className="md:hidden sticky top-0 z-40 px-3.5 py-2.5" style={{ 
        background: 'var(--glass-bg)', 
        backdropFilter: 'blur(50px) saturate(200%)',
        borderBottom: '1px solid var(--glass-border)'
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setActiveTab('generator')}>
            <span className="text-lg font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Loter<span style={{ color: '#4f8ef7' }}>IA</span>
            </span>
            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
              COLOMBIA
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="theme-btn"
              onClick={toggleTheme}
              style={{ width: 34, height: 34 }}
              title={theme === 'light' ? 'Modo noche' : 'Modo día'}
            >
              {theme === 'light' ? (
                <Moon className="w-3.5 h-3.5 text-slate-700" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-32 md:pb-12">
        {children}
      </main>

      {/* ========== FOOTER (MOBILE & DESKTOP - GITHUB ONLY) ========== */}
      <footer className="border-t py-6 pb-24 md:pb-6 mt-8" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-center">
          <a
            href="https://github.com/jhonatan2405"
            target="_blank"
            rel="noopener noreferrer"
            className="premium-git-badge group"
            title="Perfil de GitHub — jhonatan2405"
          >
            <div className="git-badge-inner">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="transition-transform duration-300 group-hover:scale-115 group-hover:rotate-6"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span className="text-xs font-mono font-bold tracking-tight">
                jhonatan2405
              </span>
            </div>
          </a>
        </div>
      </footer>

      {/* ========== MOBILE FLOATING LIQUID GLASS DOCK ========== */}
      <div className="mobile-bottom-nav md:hidden">
        <div className="grid grid-cols-6 items-center gap-0.5 text-center">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl text-[9px] font-extrabold transition-all cursor-pointer ${
                  isActive ? 'shadow-xs scale-105' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ 
                  color: isActive ? 'var(--nav-icon-active)' : 'var(--nav-icon)',
                  background: isActive ? 'var(--pill-bg)' : 'transparent',
                  border: isActive ? '1px solid var(--border-medium)' : '1px solid transparent'
                }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate w-full block mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
