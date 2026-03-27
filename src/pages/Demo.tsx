import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  Lightbulb,
  Bug,
  Wrench,
  Server,
  ClipboardList,
  ArrowLeft,
  Layers,
  BarChart3,
  FileText,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Lock,
  Wifi,
  Mail,
  Cloud,
  CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { DemoRequestDialog } from '@/components/ui/DemoRequestDialog';
import { openBookingOrFallback } from '@/lib/revenue-links';
import { trackEvent } from '@/lib/tracking';
import {
  DEMO_SUMMARY,
  DEMO_ASSETS,
  DEMO_EXECUTIVE_REPORT,
  DEMO_TECHNICAL_REPORT,
  type DemoFinding,
} from '@/lib/demo-data';


// ── Helpers ──────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  critical: { label: 'Critique',  cls: 'bg-destructive text-destructive-foreground', dot: 'bg-destructive' },
  high:     { label: 'Élevé',     cls: 'bg-orange-500 text-white',                    dot: 'bg-orange-500' },
  medium:   { label: 'Modéré',    cls: 'bg-yellow-500 text-black',                    dot: 'bg-yellow-500' },
  low:      { label: 'Faible',    cls: 'bg-blue-500 text-white',                      dot: 'bg-blue-500' },
  info:     { label: 'Info',      cls: 'bg-muted text-muted-foreground',               dot: 'bg-muted-foreground' },
};

const RISK_LEVEL_CONFIG: Record<string, { label: string; cls: string; icon: React.ReactNode; scoreColor: string }> = {
  critical: { label: 'CRITIQUE',  cls: 'border-destructive/40 bg-destructive/10 text-destructive',   icon: <AlertTriangle className="h-5 w-5" />, scoreColor: 'text-destructive' },
  high:     { label: 'ÉLEVÉ',     cls: 'border-orange-500/40 bg-orange-500/10 text-orange-400',      icon: <AlertTriangle className="h-5 w-5" />, scoreColor: 'text-orange-400' },
  medium:   { label: 'MODÉRÉ',    cls: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400',      icon: <Shield className="h-5 w-5" />,        scoreColor: 'text-yellow-400' },
  low:      { label: 'FAIBLE',    cls: 'border-success/40 bg-success/10 text-success',               icon: <CheckCircle2 className="h-5 w-5" />,  scoreColor: 'text-success' },
};

function SeverityBadge({ level }: { level: string }) {
  const cfg = SEVERITY_CONFIG[level] ?? SEVERITY_CONFIG.info;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

const ASSET_ICON: Record<string, React.ReactNode> = {
  web_application: <Layers className="h-4 w-4" />,
  api: <BarChart3 className="h-4 w-4" />,
  mail_server: <Mail className="h-4 w-4" />,
  cloud: <Cloud className="h-4 w-4" />,
  network: <Wifi className="h-4 w-4" />,
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  injection: <Bug className="h-4 w-4 text-destructive" />,
  configuration: <Wrench className="h-4 w-4 text-orange-400" />,
  authentication: <Lock className="h-4 w-4 text-yellow-400" />,
  secrets_exposure: <AlertTriangle className="h-4 w-4 text-destructive" />,
  email_security: <Mail className="h-4 w-4 text-blue-400" />,
  dependency: <Layers className="h-4 w-4 text-orange-400" />,
  network_exposure: <Wifi className="h-4 w-4 text-yellow-400" />,
};

// ── Finding Card (expandable) ────────────────────────────────────────────────
function FindingCard({ finding, index }: { finding: DemoFinding; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      <button
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-start gap-3 min-w-0">
          <span className="mt-0.5 shrink-0">{TYPE_ICON[finding.finding_type] ?? <Bug className="h-4 w-4 text-muted-foreground" />}</span>
          <div className="min-w-0">
            <span className="font-semibold text-sm text-foreground block truncate">
              {index + 1}. {finding.title}
            </span>
            <span className="text-xs text-muted-foreground mt-0.5 block">{finding.asset}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SeverityBadge level={finding.severity} />
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0 space-y-3 border-t border-border">
              {finding.evidence && (
                <div className="flex gap-3 pt-3">
                  <ClipboardList className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1">Preuve / Observation</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{finding.evidence}</p>
                  </div>
                </div>
              )}
              {finding.remediation && (
                <div className="flex gap-3">
                  <Wrench className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1">Plan de remédiation</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{finding.remediation}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-muted-foreground">Statut :</span>
                <Badge variant={finding.status === 'in_progress' ? 'default' : finding.status === 'resolved' ? 'secondary' : 'outline'} className="text-xs">
                  {finding.status === 'in_progress' ? 'En cours' : finding.status === 'resolved' ? 'Résolu' : 'Ouvert'}
                </Badge>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Sections ─────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'executive' | 'technical';

export default function Demo() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [demoContactOpen, setDemoContactOpen] = useState(false);
  const riskCfg = RISK_LEVEL_CONFIG[DEMO_EXECUTIVE_REPORT.risk_level] ?? RISK_LEVEL_CONFIG.medium;

  return (
    <div className="min-h-screen bg-background">
      <DemoBanner />

      {/* Nav bar */}
      <div className="border-b border-border bg-card/50 backdrop-blur sticky top-[48px] z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-warning" />
              <span className="font-semibold text-sm">Cyber Serenity — Démo Interactive</span>
              <Badge variant="secondary" className="text-xs">Données fictives</Badge>
            </div>
          </div>
          <Button onClick={() => navigate('/auth')} size="sm" className="neon-glow">
            Démarrer gratuitement
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Hero banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-secondary/20 p-6 md:p-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-primary" />
                Audit de sécurité complet — ACME Corp SA
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Rapport de Posture Cyber
              </h1>
              <p className="text-muted-foreground text-sm">
                Périmètre : 5 actifs · Durée : 47 min · Date : 03/11/2024 · Méthode : OWASP + Scan OSINT
              </p>
            </div>
            <div className={`flex items-center gap-3 rounded-xl border px-5 py-4 ${riskCfg.cls}`}>
              {riskCfg.icon}
              <div>
                <p className="text-xs font-medium opacity-70">Niveau de risque</p>
                <p className="text-2xl font-black tracking-wide">{riskCfg.label}</p>
              </div>
            </div>
          </div>

          {/* Score bar */}
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Score de sécurité</span>
              <span className={`font-bold ${riskCfg.scoreColor}`}>{DEMO_SUMMARY.risk_score} / 100</span>
            </div>
            <Progress value={DEMO_SUMMARY.risk_score} className="h-2" />
          </div>

          {/* Quick stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Critiques',  count: DEMO_SUMMARY.critical,  cls: 'text-destructive' },
              { label: 'Élevés',     count: DEMO_SUMMARY.high,       cls: 'text-orange-400' },
              { label: 'Modérés',    count: DEMO_SUMMARY.medium,     cls: 'text-yellow-400' },
              { label: 'Faibles',    count: DEMO_SUMMARY.low,        cls: 'text-blue-400' },
              { label: 'Total',      count: DEMO_SUMMARY.total_findings, cls: 'text-foreground' },
            ].map(s => (
              <div key={s.label} className="rounded-lg bg-muted/30 border border-border px-3 py-2.5 text-center">
                <p className={`text-2xl font-black ${s.cls}`}>{s.count}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 rounded-xl bg-muted/30 border border-border w-fit">
          {([
            { key: 'overview',   label: "Vue d'ensemble",   icon: <BarChart3 className="h-4 w-4" /> },
            { key: 'executive',  label: 'Rapport DG / PDG', icon: <TrendingUp className="h-4 w-4" /> },
            { key: 'technical',  label: 'Rapport DSI',      icon: <FileText className="h-4 w-4" /> },
          ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        <AnimatePresence mode="wait">
          {tab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              {/* Assets */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Server className="h-4 w-4 text-primary" />
                    Actifs scannés
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {DEMO_ASSETS.map((a, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">{ASSET_ICON[a.type] ?? <Server className="h-4 w-4" />}</span>
                        <div>
                          <p className="text-sm font-medium">{a.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{a.identifier}</p>
                        </div>
                      </div>
                      <SeverityBadge level={a.risk_level} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Finding distribution */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                    Distribution des findings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { level: 'critical', count: DEMO_SUMMARY.critical, total: DEMO_SUMMARY.total_findings },
                    { level: 'high',     count: DEMO_SUMMARY.high,     total: DEMO_SUMMARY.total_findings },
                    { level: 'medium',   count: DEMO_SUMMARY.medium,   total: DEMO_SUMMARY.total_findings },
                    { level: 'low',      count: DEMO_SUMMARY.low,      total: DEMO_SUMMARY.total_findings },
                  ].map(({ level, count, total }) => {
                    const cfg = SEVERITY_CONFIG[level];
                    return (
                      <div key={level} className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                        <span className="text-sm text-muted-foreground w-16">{cfg.label}</span>
                        <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${cfg.dot}`}
                            style={{ width: `${(count / total) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold w-4 text-right">{count}</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <div className="flex gap-3 flex-wrap">
                <Button onClick={() => setTab('executive')} className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Voir le rapport DG / PDG
                </Button>
                <Button variant="outline" onClick={() => setTab('technical')} className="gap-2">
                  <FileText className="h-4 w-4" />
                  Voir le rapport DSI
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── EXECUTIVE REPORT ── */}
          {tab === 'executive' && (
            <motion.div
              key="executive"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              {/* Summary */}
              <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/10 p-6 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Résumé Exécutif
                  </h2>
                  <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${riskCfg.cls}`}>
                    {riskCfg.icon}
                    Risque {riskCfg.label}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{DEMO_EXECUTIVE_REPORT.summary}</p>
              </div>

              {/* Business impact */}
              <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-6 space-y-3">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-400" />
                  Impact Métier
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{DEMO_EXECUTIVE_REPORT.business_impact}</p>
              </div>

              {/* Top priorities */}
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 space-y-4">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-destructive" />
                  Priorités Immédiates
                </h3>
                <ul className="space-y-3">
                  {DEMO_EXECUTIVE_REPORT.top_priorities.map((p, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-destructive/40 bg-destructive/10 text-destructive text-xs font-black">
                        {i + 1}
                      </span>
                      <span className="text-sm text-muted-foreground leading-relaxed">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 space-y-4">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Recommandations Stratégiques
                </h3>
                <ul className="space-y-3">
                  {DEMO_EXECUTIVE_REPORT.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground leading-relaxed">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-border bg-card/60 p-4 flex items-center justify-between flex-wrap gap-3">
                <p className="text-sm text-muted-foreground">
                  Convaincu ? Lancez votre vrai audit en moins de 10 minutes.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    onClick={() => {
                      trackEvent('cta_demander_demo', { source_page: '/demo', cta_origin: 'demo_executive_cta' });
                      openBookingOrFallback(() => setDemoContactOpen(true));
                    }}
                    className="gap-2"
                  >
                    <CalendarDays className="h-4 w-4" />
                    Demander une démo
                  </Button>
                  <Button onClick={() => navigate('/auth')} className="neon-glow gap-2">
                    <Shield className="h-4 w-4" />
                    Démarrer gratuitement
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── TECHNICAL REPORT ── */}
          {tab === 'technical' && (
            <motion.div
              key="technical"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              {/* Summary */}
              <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Résumé Technique
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{DEMO_TECHNICAL_REPORT.summary}</p>
              </div>

              {/* Findings */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Bug className="h-4 w-4 text-destructive" />
                    Findings détaillés ({DEMO_TECHNICAL_REPORT.findings.length})
                  </h3>
                  <span className="text-xs text-muted-foreground">Cliquez sur un finding pour le détail</span>
                </div>
                {DEMO_TECHNICAL_REPORT.findings.map((f, i) => (
                  <FindingCard key={f.id} finding={f} index={i} />
                ))}
              </div>

              <Separator />

              {/* Post-demo CTA — Stripe checkout */}
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-5 w-5 text-primary" />
                  <p className="font-bold text-foreground">Votre essai 14 jours est prêt !</p>
                </div>
                <p className="text-sm text-muted-foreground">
                   Activez votre compte maintenant — essai 14 jours, carte requise, annulation libre.
                  Starter 490 € / an · Pro 6 900 € / an · Satisfait ou remboursé 30j.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => navigate('/auth?tab=signup')}
                    className="neon-glow gap-2 font-bold"
                  >
                    <Shield className="h-4 w-4" />
                    Commencer l'essai 14 jours
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      trackEvent('cta_sandbox_supervisee', { source_page: '/demo', cta_origin: 'demo_sandbox_cta' });
                      openBookingOrFallback(() => setDemoContactOpen(true));
                    }}
                    className="gap-2"
                  >
                    <CalendarDays className="h-4 w-4" />
                    Demander une sandbox supervisée
                  </Button>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
                  <span>🔒 Paiement Stripe sécurisé</span>
                  <span>✓ Satisfait ou remboursé 30j</span>
                  <span>🇫🇷 Hébergement souverain</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <DemoRequestDialog
        open={demoContactOpen}
        onOpenChange={setDemoContactOpen}
        ctaOrigin="demo_page_bottom"
        sourcePage="/demo"
      />
    </div>
  );
}
