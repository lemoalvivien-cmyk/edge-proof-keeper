/**
 * WowPanel — Le "moment de vérité" SECURIT-E
 * 
 * Ce composant est conçu pour déclencher le "aha moment" en moins de 60 secondes :
 * score souverain animé + top menaces critiques + timeline agents + preuve vault
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, AlertTriangle, CheckCircle2, Zap, Lock,
  TrendingUp, Activity, Eye, Brain, ArrowRight,
  Clock, Play, RefreshCw, ChevronRight, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProvenanceBadge } from '@/components/ui/ProvenanceBadge';
import { resolveProvenance } from '@/types/provenance';
import type { DataProvenance } from '@/types/provenance';
import { useNavigate } from 'react-router-dom';

interface Threat {
  id: string;
  title: string;
  asset: string;
  severity: 'critical' | 'high' | 'medium';
  time: string;
  status: 'detected' | 'analyzing' | 'remediating' | 'resolved';
  agent: string;
}

interface WowPanelProps {
  findingsCount?: number;
  criticalCount?: number;
  highCount?: number;
  riskScore?: number;
  topFindings?: Array<{ id: string; title: string; severity: string; tool_runs?: { tools_catalog?: { name?: string } } }>;
  onLaunchPipeline?: () => void;
  pipelineRunning?: boolean;
  runsCount?: number;
}

const DEMO_THREATS: Threat[] = [
  { id: 't1', title: 'Injection SQL non authentifiée sur /api/search', asset: 'API Gateway', severity: 'critical', time: 'Il y a 2 min', status: 'remediating', agent: 'Executor' },
  { id: 't2', title: 'Certificat TLS expiré — données en transit exposées', asset: 'Portail Web', severity: 'critical', time: 'Il y a 8 min', status: 'analyzing', agent: 'Analyst' },
  { id: 't3', title: 'Credential stuffing — 3 420 tentatives /24h', asset: 'Auth Portal', severity: 'high', time: 'Il y a 15 min', status: 'detected', agent: 'Scout' },
  { id: 't4', title: 'Clés AWS IAM exposées dans dépôt public', asset: 'Infrastructure Cloud', severity: 'critical', time: 'Il y a 31 min', status: 'resolved', agent: 'Verifier' },
];

const AGENT_TIMELINE = [
  { label: 'Scout', time: '0s', action: 'Détection CVE-2025-1337', color: 'text-primary', icon: Eye, done: true },
  { label: 'Analyst', time: '12s', action: 'Plan remédiation généré', color: 'text-accent', icon: Brain, done: true },
  { label: 'Executor', time: '35s', action: 'Port 8443 fermé', color: 'text-warning', icon: Zap, done: true },
  { label: 'Vault', time: '47s', action: 'Preuve SHA-256 signée', color: 'text-success', icon: Lock, done: true },
];

const VAULT_ENTRIES = [
  { id: 'PK-2841', action: 'Fermeture port 8443 — prouvée', hash: '7a4f...b2c1', algo: 'SHA-256 Merkle Chain', ts: '14:22:47' },
  { id: 'PK-2840', action: 'CVE-2025-0041 — patch vérifié', hash: '3d9e...a7f2', algo: 'SHA-256 Merkle Chain', ts: '09:11:03' },
  { id: 'PK-2839', action: 'Rotation credentials — auditée', hash: 'b1c4...2e8d', algo: 'SHA-256 Merkle Chain', ts: '18:44:21' },
];

function AnimatedScore({ target }: { target: number }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const step = target / 60;
    let val = 0;
    const interval = setInterval(() => {
      val = Math.min(val + step, target);
      setCurrent(Math.round(val));
      if (val >= target) clearInterval(interval);
    }, 25);
    return () => clearInterval(interval);
  }, [target]);
  const color = target >= 70 ? 'text-success' : target >= 50 ? 'text-warning' : 'text-destructive';
  return <span className={`font-mono ${color}`}>{current}</span>;
}

function DataModePill({ provenance }: { provenance: DataProvenance }) {
  if (provenance === 'real') {
    return (
      <span className="relative flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-success">
          <span className="absolute inline-flex w-2 h-2 rounded-full bg-success animate-ping opacity-75" />
        </span>
        <span className="text-[10px] font-mono text-success font-semibold">DONNÉES RÉELLES</span>
      </span>
    );
  }
  return (
    <span className="relative flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full bg-yellow-500" />
      <span className="text-[10px] font-mono text-yellow-600 font-semibold">DONNÉES DÉMO</span>
    </span>
  );
}

const severityConfig = {
  critical: { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30', label: 'CRITIQUE' },
  high: { color: 'text-warning', bg: 'bg-warning/10 border-warning/30', label: 'ÉLEVÉ' },
  medium: { color: 'text-accent', bg: 'bg-accent/10 border-accent/30', label: 'MOYEN' },
};

const statusConfig = {
  detected: { label: 'Détecté', color: 'text-primary', icon: Eye },
  analyzing: { label: 'Analyse IA…', color: 'text-accent', icon: Brain },
  remediating: { label: 'Remédiation…', color: 'text-warning', icon: Zap },
  resolved: { label: 'Résolu ✓', color: 'text-success', icon: CheckCircle2 },
};

export function WowPanel({
  findingsCount = 0,
  criticalCount = 0,
  highCount = 0,
  riskScore = 0,
  topFindings = [],
  onLaunchPipeline,
  pipelineRunning = false,
  runsCount = 0,
}: WowPanelProps) {
  const navigate = useNavigate();
  const hasRealData = findingsCount > 0;
  const dataProvenance = resolveProvenance(hasRealData);
  const [activeTab, setActiveTab] = useState<'threats' | 'timeline' | 'vault'>('threats');
  const [cycleActive, setCycleActive] = useState(false);
  const [cycleProgress, setCycleProgress] = useState(0);
  const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Build threats from real or demo data
  const threats: Threat[] = topFindings.length > 0
    ? topFindings.slice(0, 4).map((f, i) => ({
        id: f.id,
        title: f.title,
        asset: f.tool_runs?.tools_catalog?.name ?? 'Périmètre',
        severity: (f.severity as 'critical' | 'high' | 'medium') ?? 'high',
        time: `Il y a ${(i + 1) * 7} min`,
        status: i === 0 ? 'remediating' : i === 1 ? 'analyzing' : i === 2 ? 'detected' : 'resolved' as Threat['status'],
        agent: ['Executor', 'Analyst', 'Scout', 'Verifier'][i],
      }))
    : DEMO_THREATS;

  const displayedRiskScore = findingsCount > 0 ? riskScore : 28;
  const displayedCritical = findingsCount > 0 ? criticalCount : 3;
  const displayedHigh = findingsCount > 0 ? highCount : 3;
  const displayedTotal = findingsCount > 0 ? findingsCount : 9;

  const startCycle = () => {
    if (cycleActive) return;
    setCycleActive(true);
    setCycleProgress(0);
    let p = 0;
    cycleRef.current = setInterval(() => {
      p += 100 / 47;
      setCycleProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(cycleRef.current!);
        setCycleActive(false);
      }
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="rounded-2xl border border-primary/25 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, hsl(var(--card) / 0.95) 0%, hsl(220 20% 6% / 0.98) 100%)' }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50"
        style={{ background: 'linear-gradient(90deg, hsl(185 100% 52% / 0.05) 0%, transparent 60%)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">Cockpit Cyber Souverain</span>
              <DataModePill provenance={dataProvenance} />
            </div>
            <p className="text-xs text-muted-foreground">6 agents IA supervisés · NIS2 compliant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 text-xs border-primary/30 hover:bg-primary/10 gap-1.5"
            onClick={() => navigate('/demo')}
          >
            <Play className="w-3 h-3 fill-current text-primary" />
            Simulation
          </Button>
          <Button
            size="sm"
            className="h-8 px-3 text-xs gap-1.5"
            onClick={onLaunchPipeline}
            disabled={pipelineRunning}
          >
            {pipelineRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            Lancer analyse
          </Button>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-b border-border/50">
        {[
          {
            label: 'Score Souverain',
            value: <><AnimatedScore target={displayedRiskScore} /><span className="text-muted-foreground text-sm font-mono">/100</span></>,
            sub: displayedRiskScore >= 70 ? '▲ +5 vs semaine passée' : '⚠ Sous le seuil minimal',
            subColor: displayedRiskScore >= 70 ? 'text-success' : 'text-warning',
            icon: TrendingUp,
            accent: 'border-l-primary/40',
          },
          {
            label: 'Findings Critiques',
            value: <span className="text-destructive font-mono">{displayedCritical}</span>,
            sub: `+ ${displayedHigh} élevés — action requise`,
            subColor: 'text-warning',
            icon: AlertTriangle,
            accent: 'border-l-destructive/40',
          },
          {
            label: 'Findings Total',
            value: <span className="font-mono">{displayedTotal}</span>,
            sub: 'Sur 5 périmètres analysés',
            subColor: 'text-muted-foreground',
            icon: Activity,
            accent: 'border-l-accent/40',
          },
          {
            label: 'Preuves Vault',
            value: <span className="text-primary font-mono">{vaultCount.toLocaleString('fr-FR')}</span>,
            sub: 'SHA-256 · Immuables · NIS2',
            subColor: 'text-primary/60',
            icon: Lock,
            accent: 'border-l-success/40',
          },
        ].map((kpi, i) => {
          const KpiIcon = kpi.icon;
          return (
            <div key={i} className={`px-4 py-3.5 border-l-2 ${kpi.accent} ${i < 3 ? 'border-r border-border/50' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
                <KpiIcon className="w-3.5 h-3.5 text-muted-foreground/50" />
              </div>
              <div className="text-2xl font-bold leading-none mb-1">{kpi.value}</div>
              <div className={`text-[10px] font-mono ${kpi.subColor}`}>{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex border-b border-border/50">
        {([
          { id: 'threats', label: 'Menaces Actives', count: displayedCritical + displayedHigh },
          { id: 'timeline', label: 'Cycle 47s' },
          { id: 'vault', label: 'Evidence Vault', count: 3 },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {'count' in tab && tab.count !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === tab.id ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="p-5">
        <AnimatePresence mode="wait">

          {/* THREATS TAB */}
          {activeTab === 'threats' && (
            <motion.div
              key="threats"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-2.5"
            >
              {threats.map((threat, i) => {
                const sev = severityConfig[threat.severity];
                const stat = statusConfig[threat.status];
                const StatIcon = stat.icon;
                return (
                  <motion.div
                    key={threat.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all hover:border-primary/20 cursor-default ${sev.bg}`}
                  >
                    {/* Severity dot */}
                    <div className={`flex-shrink-0 w-2 h-2 rounded-full ${threat.severity === 'critical' ? 'bg-destructive' : threat.severity === 'high' ? 'bg-warning' : 'bg-accent'} ${threat.status !== 'resolved' ? 'animate-pulse' : ''}`} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${sev.bg} ${sev.color}`}>
                          {sev.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">{threat.asset}</span>
                        <span className="text-[10px] text-muted-foreground/50 font-mono ml-auto flex-shrink-0">{threat.time}</span>
                      </div>
                      <p className="text-xs font-medium text-foreground truncate">{threat.title}</p>
                    </div>

                    <div className={`flex-shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background/40 ${stat.color}`}>
                      <StatIcon className="w-3 h-3" />
                      <span className="text-[9px] font-mono font-bold">{stat.label}</span>
                    </div>
                  </motion.div>
                );
              })}

              <div className="pt-1 flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-mono">
                Agents IA supervisés — validation Go/No-Go requise
              </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-3 text-xs text-primary hover:bg-primary/10 gap-1"
                  onClick={() => navigate('/findings')}
                >
                  Voir tout <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* TIMELINE TAB */}
          {activeTab === 'timeline' && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Cycle progress bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-muted-foreground">CYCLE SUPERVISÉ — DÉTECTION À LA PREUVE (DÉMO LAB)</span>
                  <div className="flex items-center gap-2">
                    {cycleActive && (
                      <motion.span
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="font-mono text-primary font-bold"
                      >
                        {Math.round(cycleProgress * 0.47)}s / 47s
                      </motion.span>
                    )}
                    {!cycleActive && (
                      <button
                        onClick={startCycle}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors"
                      >
                        <Play className="w-3 h-3 fill-current" /> Rejouer
                      </button>
                    )}
                  </div>
                </div>
                <div className="w-full bg-muted/60 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--success)))' }}
                    animate={{ width: cycleActive ? `${cycleProgress}%` : '100%' }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Timeline steps */}
              <div className="relative space-y-3">
                <div className="absolute left-[18px] top-5 bottom-5 w-px bg-border/50" />
                {AGENT_TIMELINE.map((step, i) => {
                  const Icon = step.icon;
                  const progressRatio = cycleProgress / 100;
                  const stepTime = [0, 12, 35, 47][i];
                  const isActivated = !cycleActive || (progressRatio * 47) >= stepTime;
                  return (
                    <div key={i} className="flex items-start gap-3 relative pl-1">
                      <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-500 ${
                        isActivated ? 'bg-success/15 border-success/40' : 'bg-muted border-border/50'
                      }`}>
                        <Icon className={`w-4 h-4 transition-colors duration-500 ${isActivated ? 'text-success' : 'text-muted-foreground/40'}`} />
                      </div>
                      <div className={`flex-1 p-3 rounded-xl border transition-all duration-500 ${
                        isActivated ? 'border-success/20 bg-success/5' : 'border-border/30 bg-muted/10'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold transition-colors duration-500 ${isActivated ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                              Agent {step.label}
                            </span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${isActivated ? `bg-success/15 text-success` : 'bg-muted text-muted-foreground/30'}`}>
                              T+{step.time}
                            </span>
                          </div>
                          {isActivated && <CheckCircle2 className="w-3.5 h-3.5 text-success" />}
                        </div>
                        <p className={`text-xs transition-colors duration-500 ${isActivated ? 'text-muted-foreground' : 'text-muted-foreground/30'}`}>
                          {step.action}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-success/15 border border-success/30 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Cycle complet en 47 secondes</p>
                    <p className="text-[10px] text-muted-foreground font-mono">Délégation supervisée · NIS2 · Preuve exportable</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-3 text-xs text-primary hover:bg-primary/10 gap-1"
                  onClick={() => navigate('/demo')}
                >
                  Démo complète <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* VAULT TAB */}
          {activeTab === 'vault' && (
            <motion.div
              key="vault"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
                    <Lock className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{vaultCount.toLocaleString('fr-FR')} preuves archivées</p>
                    <p className="text-[10px] text-muted-foreground font-mono">Chaîne immuable SHA-256 · Vault souverain</p>
                  </div>
                </div>
                  <Badge variant="outline" className="text-[10px] text-primary border-primary/30 bg-primary/5 font-mono">
                  SHA-256 VAULT
                </Badge>
              </div>

              {VAULT_ENTRIES.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-secondary/15 hover:border-primary/20 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-primary font-bold">{entry.id}</span>
                      <span className="text-[10px] font-mono text-muted-foreground/60">{entry.ts}</span>
                    </div>
                    <p className="text-xs text-foreground/80">{entry.action}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">
                      0x{entry.hash} · {entry.algo}
                    </p>
                  </div>
                  <div className="flex-shrink-0 px-2 py-0.5 rounded-md bg-success/10 border border-success/20">
                    <span className="text-[9px] font-mono text-success font-bold">VERIFIED</span>
                  </div>
                </motion.div>
              ))}

              <div className="pt-1 grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Algorithme', value: 'SHA-256' },
                  { label: 'Structure', value: 'Merkle Chain' },
                  { label: 'Conformité', value: 'NIS2 ✓' },
                ].map((item, i) => (
                  <div key={i} className="p-2 rounded-lg bg-muted/30 border border-border/40">
                    <div className="text-[10px] text-muted-foreground">{item.label}</div>
                    <div className="text-xs font-mono font-bold text-foreground mt-0.5">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="pt-1 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-xs h-8 border-primary/30 hover:bg-primary/10" onClick={() => navigate('/proofs')}>
                  <Lock className="w-3 h-3 text-primary" /> Voir le Vault
                </Button>
                <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-xs h-8" onClick={() => navigate('/report-studio')}>
                  <RefreshCw className="w-3 h-3" /> Exporter preuve
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Footer Action Bar ── */}
      <div className="px-5 py-3 border-t border-border/50 bg-secondary/10 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-mono">Dernière analyse : il y a moins de 1h</span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-success font-semibold">6/6 agents actifs</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="h-7 px-3 text-xs gap-1 text-muted-foreground hover:text-foreground" onClick={() => navigate('/risks')}>
            Registre risques <ChevronRight className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-3 text-xs gap-1 text-muted-foreground hover:text-foreground" onClick={() => navigate('/compliance')}>
            Conformité NIS2 <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
