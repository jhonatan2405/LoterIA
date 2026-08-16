import { useState } from 'react';
import { 
  Database, 
  ShieldCheck, 
  Copy, 
  Check, 
  Activity,
  FileCode
} from 'lucide-react';
import type { EventoSistema } from '../../api/client';

interface AuditViewProps {
  events: EventoSistema[];
  supabaseSchema: string;
}

export const AuditView = ({ events, supabaseSchema }: AuditViewProps) => {
  const [copiedSql, setCopiedSql] = useState(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(supabaseSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'SUCCESS':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'WARN':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'ERROR':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Supabase Architecture & Schema Viewer */}
      <div className="white-card p-6 md:p-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              <h2 className="text-xl font-extrabold text-slate-900 font-heading">
                Arquitectura Supabase (PostgreSQL) &amp; Trigger Inmutable
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Esquema relacional con Row Level Security (RLS) y trigger de inmutabilidad SHA-256
            </p>
          </div>

          <button
            onClick={handleCopySql}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all self-start md:self-auto shadow-sm"
          >
            {copiedSql ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>SQL Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar SQL DDL para Supabase</span>
              </>
            )}
          </button>
        </div>

        {/* Security Notification */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-xs text-emerald-950">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="font-bold">Garantía Anti-Leakage de Supabase:</strong>
            <p className="text-emerald-800 leading-relaxed text-[11px]">
              La tabla <code className="text-emerald-900 font-mono bg-emerald-100/80 px-1 py-0.2 rounded">predicciones</code> cuenta con el trigger <code className="text-emerald-900 font-mono bg-emerald-100/80 px-1 py-0.2 rounded">trg_protect_locked_predictions</code>. Una vez bloqueado el sorteo, la base de datos rechaza cualquier mutación posterior.
            </p>
          </div>
        </div>

        {/* SQL Schema Code Viewer */}
        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 text-slate-200">
          <div className="bg-slate-950 px-4 py-2 text-xs font-mono text-slate-400 border-b border-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-blue-400" />
              <span>supabase_schema.sql (DDL + Triggers + RLS)</span>
            </span>
            <span className="text-[10px] text-slate-400">PostgreSQL 15+</span>
          </div>
          <pre className="p-4 text-xs font-mono text-slate-300 max-h-64 overflow-y-auto">
            {supabaseSchema}
          </pre>
        </div>
      </div>

      {/* 2. Audit Event Timeline */}
      <div className="white-card p-6 md:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-heading">
            <Activity className="w-4 h-4 text-blue-600" /> Registro de Auditoría &amp; Eventos del Sistema
          </h3>
          <span className="text-xs font-mono text-slate-500">
            {events.length} Eventos Registrados
          </span>
        </div>

        <div className="space-y-2.5">
          {events.map((ev) => {
            const badge = getLevelBadge(ev.nivel);
            return (
              <div 
                key={ev.id} 
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-start md:items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border font-mono ${badge}`}>
                    {ev.nivel}
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 font-mono mr-2">{ev.tipo_evento}</span>
                    <span className="text-slate-600">{ev.descripcion}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px] shrink-0">
                  <span>[{ev.componente}]</span>
                  <span>{ev.created_at.slice(0, 19).replace('T', ' ')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
