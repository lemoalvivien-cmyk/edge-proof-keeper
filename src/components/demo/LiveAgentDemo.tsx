/**
 * SECURIT-E — LiveAgentDemo (Simulation)
 * 47-second simulated pipeline: seed → 6 skills → Evidence Vault
 * Animated logs via Framer Motion — données simulées
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, CheckCircle2, AlertCircle, Loader2, Shield, Zap,
  Terminal, Lock, Activity, Clock, Database, RefreshCw, AlertTriangle,
} from 'lucide-react';
import { EXECUTION_MODE_LABELS, tagLogs } from '@/types/execution';
import type { ExecutionMode } from '@/types/execution';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Skills } from '@/lib/skills';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

interface AgentStep {
  id: string;
  agent: string;
  skill: string;
  label: string;
  description: string;
  icon: typeof Shield;
  color: string;
  bgColor: string;
  targetTime: number; // seconds into the 47s sequence
  params: Record<string, unknown>;
}

const AGENT_STEPS: AgentStep[] = [
  {
    id: 'seed',
    agent: 'Scout',
    skill: 'seed',
    label: 'Scout — EASM Scan',
    description: 'Détection CVE-2025-1337 · Port 8443 exposé · Signal créé',
    icon: Activity,
    color: 'text-primary',
    bgColor: 'bg-primary/10 border-primary/30',
    targetTime: 0,
    params: {},
  },
  {
    id: 'fix_port',
    agent: 'Executor',
    skill: 'fix_port',
    label: 'Executor — fix_port',
    description: 'Fermeture port 8443/tcp · AWS SG revoke · Pre-state sauvé',
    icon: Lock,
    color: 'text-warning',
    bgColor: 'bg-warning/10 border-warning/30',
    targetTime: 8,
    params: { host: 'api.client.fr', port: 8443, protocol: 'tcp', reason: 'CVE-2025-1337', agent_id: 'executor-001', cloud_provider: 'aws', cloud_resource_id: 'sg-0a1b2c3d', proof_required: true },
  },
  {
    id: 'patch_vuln',
    agent: 'Executor',
    skill: 'patch_vuln',
    label: 'Executor — patch_vuln',
    description: 'nginx 1.24.0 → 1.26.1 · apt-get upgrade · NVD API vérifié',
    icon: Zap,
    color: 'text-accent',
    bgColor: 'bg-accent/10 border-accent/30',
    targetTime: 16,
    params: { cve_id: 'CVE-2025-1337', target_host: 'api.client.fr', package_name: 'nginx', current_version: '1.24.0', target_version: '1.26.1', agent_id: 'executor-001', patch_method: 'apt', proof_required: true },
  },
  {
    id: 'rotate_creds',
    agent: 'Executor',
    skill: 'rotate_creds',
    label: 'Executor — rotate_creds',
    description: 'API key compromise → rotation AWS IAM · Old key révoquée',
    icon: RefreshCw,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10 border-yellow-500/30',
    targetTime: 24,
    params: { service: 'aws_iam', credential_id: 'svc-api-client-fr', reason: 'Preventive rotation post-CVE', agent_id: 'executor-001', notify_owner: true },
  },
  {
    id: 'close_domain',
    agent: 'Executor',
    skill: 'close_domain',
    label: 'Executor — close_domain',
    description: 'Typosquat detecté → DNS sinkhole → Cloudflare block',
    icon: Shield,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10 border-destructive/30',
    targetTime: 31,
    params: { domain: 'api-c1ient.fr', reason: 'typosquat', action: 'block_dns', agent_id: 'executor-001', proof_required: true },
  },
  {
    id: 'swarm_collaborate',
    agent: 'Swarm',
    skill: 'swarm_collaborate',
    label: 'Swarm — swarm_collaborate',
    description: '500+ tenants alertés · IOC hashes partagés · 0 PII',
    icon: Activity,
    color: 'text-success',
    bgColor: 'bg-success/10 border-success/30',
    targetTime: 37,
    params: { signal_type: 'cve_exploited', severity: 'critical', confidence_score: 0.94, agent_id: 'swarm-001', receive_intel: true, anonymized_payload: { cvss: 9.1, mitre: 'T1190', vector: 'NETWORK', attack_complexity: 'LOW' } },
  },
  {
    id: 'notify_rollback',
    agent: 'Verifier',
    skill: 'notify_rollback',
    label: 'Verifier — notify_rollback',
    description: 'QA validé · DSI notifié · Vault scellé · Preuve NIS2 ✓',
    icon: CheckCircle2,
    color: 'text-success',
    bgColor: 'bg-success/10 border-success/30',
    targetTime: 42,
    params: { action_id: 'RE-0841', action_type: 'fix_port', target: 'api.client.fr', failure_reason: 'N/A — Success path', agent_id: 'verifier-001', rollback_required: false, notify_channels: ['dsi_dashboard', 'slack', 'email'], proof_required: true },
  },
];

type StepStatus = 'idle' | 'running' | 'done' | 'error';

interface StepState {
  status: StepStatus;
  logs: string[];
  proof?: string;
  duration?: number;
}

export function LiveAgentDemo({ compact = false }: { compact?: boolean }) {
  const { organization } = useAuth();
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [steps, setSteps] = useState<Record<string, StepState>>(() =>
    Object.fromEntries(AGENT_STEPS.map(s => [s.id, { status: 'idle', logs: [] }]))
  );
  const [vaultEntries, setVaultEntries] = useState<number>(0);
  const [globalStatus, setGlobalStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const updateStep = useCallback((id: string, patch: Partial<StepState>) => {
    setSteps(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [steps]);

  const startDemo = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setGlobalStatus('running');
    setElapsed(0);
    setErrorMsg(null);
    setVaultEntries(0);
    setSteps(Object.fromEntries(AGENT_STEPS.map(s => [s.id, { status: 'idle', logs: [] }])));

    // Start 47s timer
    const startMs = Date.now();
    timerRef.current = setInterval(() => {
      const e = Math.floor((Date.now() - startMs) / 1000);
      setElapsed(Math.min(e, 47));
    }, 200);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Session requise');
      const tok = session.access_token;
      const orgId = organization?.id;

      // ── T+0s: Scout — seed-demo-run ────────────────────────────────────────
      updateStep('seed', { status: 'running', logs: tagLogs(['[T+0s] Scout EASM scan starting...', '[T+200ms] Connecting to OSINT feeds: Shodan, Censys...', '[T+800ms] Port scan: api.client.fr...', '[T+1200ms] CVE-2025-1337 matched on port 8443 (nginx 1.24.0)', '[T+1800ms] Signal created: { severity: CRITICAL, confidence: 0.94 }', '[T+2100ms] Evidence pre-proof: SHA-256 generated ✓'], 'simulated') });

      let toolRunId: string | null = null;
      if (orgId) {
        const seedRes = await fetch(`${SUPABASE_URL}/functions/v1/seed-demo-run`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
          body: JSON.stringify({ organization_id: orgId }),
        });
        const seedJson = await seedRes.json();
        if (seedRes.ok && seedJson.tool_run_id) {
          toolRunId = seedJson.tool_run_id;
          updateStep('seed', {
            status: 'done',
            logs: tagLogs([
              `[T+0s] Scout EASM scan: api.client.fr`,
              `[T+800ms] CVE-2025-1337 — CVSS 9.1 — port 8443/tcp`,
              `[T+1.5s] Tool run created: ${toolRunId}`,
              `[T+2.1s] ${seedJson.findings_inserted} findings inserted to DB`,
              `[T+2.4s] Evidence chain: SHA-256 logged ✓`,
            ], 'simulated'),
            proof: `sha256:seed:${toolRunId?.slice(0, 16)}...`,
          });
          setVaultEntries(v => v + 1);
        } else {
          updateStep('seed', { status: 'done', logs: tagLogs(['[DEMO] Seed completed (no org context)', '[T+2s] Mock data ready ✓'], 'simulated'), proof: `sha256:demo:${Date.now().toString(16)}` });
          setVaultEntries(v => v + 1);
        }
      } else {
        updateStep('seed', { status: 'done', logs: tagLogs(['[DEMO] Scout scan completed', '[T+2s] Signal CVE-2025-1337 created ✓'], 'simulated'), proof: `sha256:demo:${Date.now().toString(16)}` });
        setVaultEntries(v => v + 1);
      }

      // ── Execute all 6 skills sequentially with delays ─────────────────────
      const skillSteps = AGENT_STEPS.filter(s => s.id !== 'seed');

      for (const step of skillSteps) {
        // Delay to match the 47s timeline
        const now = (Date.now() - startMs) / 1000;
        const delay = Math.max(0, (step.targetTime - now) * 1000);
        if (delay > 0) await new Promise(r => setTimeout(r, delay));

        updateStep(step.id, {
          status: 'running',
          logs: [`[T+${step.targetTime}s] ${step.agent} agent dispatching ${step.skill}...`],
        });

        try {
          const t0 = Date.now();
          const skillKey = step.skill as keyof typeof Skills;
          const result = await Skills[skillKey](
            { ...step.params, agent_id: `${step.agent.toLowerCase()}-001` },
            orgId
          );
          const duration = Date.now() - t0;

          updateStep(step.id, {
            status: 'done',
            logs: result.logs ?? [`[T+${step.targetTime}s] ${step.skill} executed in ${duration}ms ✓`],
            proof: result.proof?.hash ? `sha256:${result.proof.hash.slice(0, 32)}...` : undefined,
            duration,
          });
          setVaultEntries(v => v + 1);
        } catch (err) {
          // Skills may fail without org context — show structured demo output
          const demoLogs = step.params.host
            ? [`[T+${step.targetTime}s] ${step.skill}: executing on ${step.params.host}...`, `[T+${step.targetTime + 1}s] Action completed ✓`, `[T+${step.targetTime + 1}s] SHA-256 proof generated ✓`]
            : [`[T+${step.targetTime}s] ${step.skill} completed ✓`];
          updateStep(step.id, {
            status: 'done',
            logs: demoLogs,
            proof: `sha256:demo:${Date.now().toString(16)}`,
            duration: 400 + Math.floor(Math.random() * 300),
          });
          setVaultEntries(v => v + 1);
        }
      }

      // Wait until ~47s
      const finalDelay = Math.max(0, 47000 - (Date.now() - startMs));
      if (finalDelay > 0) await new Promise(r => setTimeout(r, finalDelay));

      setGlobalStatus('done');
    } catch (err) {
      setGlobalStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsed(47);
    }
  }, [running, organization, updateStep]);

  const allDone = globalStatus === 'done';
  const totalSteps = AGENT_STEPS.length;
  const doneSteps = Object.values(steps).filter(s => s.status === 'done').length;
  const progress = Math.round((doneSteps / totalSteps) * 100);

  if (compact) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${running ? 'bg-primary animate-pulse' : allDone ? 'bg-success' : 'bg-muted-foreground'}`} />
            <span className="text-xs font-mono text-muted-foreground">
              {running ? `SIMULATION EN COURS — ${elapsed}s / 47s` : allDone ? 'SIMULATION COMPLÈTE — 47s ✓' : 'PRÊT'}
            </span>
          </div>
          {allDone && (
            <Badge variant="outline" className="text-xs text-success border-success/30 bg-success/10">
              {vaultEntries} preuves vault
            </Badge>
          )}
        </div>

        {(running || allDone) && (
          <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}

        <Button
          onClick={startDemo}
          disabled={running}
          size="sm"
          className="w-full gap-2 font-mono text-xs"
        >
          {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
          {running ? `Simulation en cours (${elapsed}s)...` : allDone ? 'Relancer la simulation' : 'Lancer simulation agents (47s)'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Terminal className="w-5 h-5 text-primary" />
            Simulation Agents — Séquence 47s
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Simulation sécurisée — données fictives · preuves SHA-256 de démonstration
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(running || allDone) && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/50">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span className="font-mono text-sm font-bold text-primary">{elapsed}s / 47s</span>
            </div>
          )}
          <Button
            onClick={startDemo}
            disabled={running}
            className="gap-2 font-bold"
            size="sm"
          >
            {running
              ? <><Loader2 className="w-4 h-4 animate-spin" /> En cours…</>
              : allDone
                ? <><RefreshCw className="w-4 h-4" /> Relancer</>
                : <><Play className="w-4 h-4 fill-current" /> Lancer la démo (47s)</>}
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      {(running || allDone) && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{doneSteps}/{totalSteps} skills</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--success)))' }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* Timeline grid */}
      <div className="grid gap-3">
        {AGENT_STEPS.map((step, idx) => {
          const state = steps[step.id];
          const Icon = step.icon;
          const isRunning = state.status === 'running';
          const isDone = state.status === 'done';
          const isError = state.status === 'error';

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0.4 }}
              animate={{
                opacity: state.status === 'idle' && !running ? 0.5 : 1,
                scale: isRunning ? 1.01 : 1,
              }}
              transition={{ duration: 0.3 }}
              className={`rounded-xl border p-4 transition-all ${
                isRunning ? `${step.bgColor} shadow-lg` :
                isDone ? 'border-success/20 bg-success/5' :
                isError ? 'border-destructive/30 bg-destructive/5' :
                'border-border/50 bg-card'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Step number / status icon */}
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  isDone ? 'bg-success text-success-foreground' :
                  isRunning ? 'bg-primary text-primary-foreground' :
                  isError ? 'bg-destructive text-destructive-foreground' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> :
                   isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> :
                   isError ? <AlertCircle className="w-4 h-4" /> :
                   <span>{idx + 1}</span>}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  {/* Header */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${isDone ? 'text-success' : step.color}`} />
                      <span className="font-mono text-sm font-bold">{step.label}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        T+{step.targetTime}s
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {isDone && state.duration && (
                        <span className="text-[10px] text-muted-foreground font-mono">{state.duration}ms</span>
                      )}
                      {isDone && (
                        <Badge variant="outline" className={`text-[10px] ${EXECUTION_MODE_LABELS.simulated.color} ${EXECUTION_MODE_LABELS.simulated.borderColor} ${EXECUTION_MODE_LABELS.simulated.bgColor}`}>
                          ✓ {EXECUTION_MODE_LABELS.simulated.badge}
                        </Badge>
                      )}
                      {isRunning && (
                        <Badge variant="outline" className="text-[10px] text-primary border-primary/30 bg-primary/10 animate-pulse">
                          EN COURS
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">{step.description}</p>

                  {/* Logs */}
                  <AnimatePresence>
                    {(isRunning || isDone) && state.logs.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-background/60 rounded-lg p-3 border border-border/30 overflow-hidden"
                      >
                        <div className="space-y-0.5 max-h-32 overflow-y-auto">
                          {state.logs.map((log, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="font-mono text-[10px] text-muted-foreground"
                            >
                              {log}
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Proof hash */}
                  {isDone && state.proof && (
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-success/80">
                      <Database className="w-3 h-3" />
                      <span className="truncate">Vault: {state.proof}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Result panel */}
      <AnimatePresence>
        {allDone && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="rounded-xl border border-success/40 bg-success/5 p-5 space-y-3"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <span className="font-bold text-success">Pipeline complète — 47 secondes ✓</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {[
                { label: 'Skills exécutés', value: '6/6', color: 'text-success' },
                { label: 'Preuves Vault', value: `${vaultEntries}`, color: 'text-primary' },
                { label: 'Intervention humaine', value: '0', color: 'text-success' },
                { label: 'Conformité NIS2', value: '✓', color: 'text-success' },
              ].map((stat, i) => (
                <div key={i} className="p-3 rounded-lg bg-background/60 border border-border/30">
                  <div className={`text-xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Badge className="bg-success/20 text-success border-success/30 text-xs">
                Simulation complète — données fictives
              </Badge>
              <span className="text-xs text-muted-foreground">SHA-256 · Merkle Light · Evidence Vault immutable</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {errorMsg && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
          <span className="text-sm text-destructive">{errorMsg}</span>
        </div>
      )}

      <div ref={logsEndRef} />
    </div>
  );
}
