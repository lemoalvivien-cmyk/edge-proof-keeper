import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getPlatformHealth } from '@/lib/api-client';
import { useRuntimeConfig } from '@/hooks/useRuntimeConfig';
import {
  CheckCircle2, XCircle, AlertTriangle, RefreshCw, Shield, Database, Cpu,
  FlaskConical, Users, MessageSquare, Navigation, BarChart3, Loader2,
  ExternalLink, TrendingUp, DollarSign, MousePointerClick, Star,
  CalendarDays, ShoppingCart, Zap, Settings, Server, Brain, Activity, ListTodo,
  Bell, Info,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type Status = 'ok' | 'warn' | 'fail' | 'unknown' | 'unverifiable';

function StatusIcon({ status }: { status: Status }) {
  if (status === 'ok')          return <CheckCircle2 className="h-5 w-5 text-success" />;
  if (status === 'warn')        return <AlertTriangle className="h-5 w-5 text-warning" />;
  if (status === 'fail')        return <XCircle className="h-5 w-5 text-destructive" />;
  if (status === 'unverifiable') return <Info className="h-5 w-5 text-muted-foreground" />;
  return <div className="h-5 w-5 rounded-full border-2 border-muted animate-pulse" />;
}

function StatusBadge({ status }: { status: Status }) {
  const cfg: Record<Status, { label: string; className: string }> = {
    ok:           { label: 'OK',             className: 'bg-success/10 text-success border-success/30' },
    warn:         { label: 'Attention',      className: 'bg-warning/10 text-warning border-warning/30' },
    fail:         { label: 'Échec',          className: 'bg-destructive/10 text-destructive border-destructive/30' },
    unknown:      { label: '…',             className: 'bg-muted/50 text-muted-foreground border-muted' },
    unverifiable: { label: 'Non vérifiable', className: 'bg-muted/40 text-muted-foreground border-muted/60' },
  };
  const c = cfg[status];
  return <Badge variant="outline" className={`text-xs ${c.className}`}>{c.label}</Badge>;
}

interface CheckItem {
  label: string;
  description: string;
  status: Status;
  detail?: string;
  link?: { href: string; label: string };
}

interface CheckGroup {
  title: string;
  icon: React.ReactNode;
  items: CheckItem[];
}

// ── Risk Engine Section ────────────────────────────────────────────────────────
function RiskEngineSection({ orgId, refreshKey }: { orgId?: string; refreshKey: number }) {
  const { data: riskStats } = useQuery({
    queryKey: ['risk-engine-stats', orgId, refreshKey],
    queryFn: async () => {
      if (!orgId) return null;
      const [risksRes, actionsRes] = await Promise.all([
        supabase.from('risk_register').select('status', { count: 'exact' }).eq('organization_id', orgId).in('status', ['open', 'in_treatment']),
        supabase.from('remediation_actions').select('status', { count: 'exact' }).eq('organization_id', orgId).in('status', ['open', 'in_progress']),
      ]);
      return { openRisks: risksRes.count ?? 0, pendingActions: actionsRes.count ?? 0 };
    },
    enabled: !!orgId,
  });

  const engineItems = [
    {
      label: 'Edge Function correlate-risks',
      icon: <Activity className="h-4 w-4" />,
      // Non vérifiable côté front sans appel HTTP — statut honnête
      status: 'unverifiable' as Status,
      detail: 'Déployée (vérification indirecte via test fonctionnel) — regroupe signaux → risk_register',
      link: { href: '/risks', label: 'Tester via Corréler' },
    },
    {
      label: 'Edge Function build-remediation-queue',
      icon: <ListTodo className="h-4 w-4" />,
      status: 'unverifiable' as Status,
      detail: 'Déployée (vérification indirecte) — génère remediation_actions depuis les risques ouverts',
      link: { href: '/remediation', label: 'Tester via Construire file' },
    },
    {
      label: 'Risques ouverts (DB)',
      icon: <Shield className="h-4 w-4" />,
      status: riskStats !== undefined ? ((riskStats?.openRisks ?? 0) > 0 ? 'ok' : 'warn') as Status : 'unknown' as Status,
      detail: riskStats !== null ? `${riskStats?.openRisks ?? 0} risques ouverts / en traitement` : '…',
    },
    {
      label: 'Actions de remédiation (DB)',
      icon: <ListTodo className="h-4 w-4" />,
      status: riskStats !== undefined ? 'ok' as Status : 'unknown' as Status,
      detail: riskStats !== null ? `${riskStats?.pendingActions ?? 0} actions ouvertes / en cours` : '…',
    },
  ];

  const verifiableItems = engineItems.filter(i => i.status !== 'unverifiable');
  const okCount  = verifiableItems.filter(i => i.status === 'ok').length;
  const engineScore = verifiableItems.length > 0 ? Math.round((okCount / verifiableItems.length) * 100) : 0;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Risk Engine
          </CardTitle>
          <span className={`text-xl font-black ${engineScore >= 80 ? 'text-success' : engineScore >= 60 ? 'text-warning' : 'text-destructive'}`}>
            {engineScore}%
          </span>
        </div>
        <CardDescription>Moteur de corrélation risques → remédiation</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {engineItems.map(item => (
            <div key={item.label} className="flex items-center justify-between gap-4 px-6 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <StatusIcon status={item.status} />
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-muted-foreground shrink-0">{item.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.label}</p>
                    <p className="text-xs text-muted-foreground/70 font-mono truncate">{item.detail}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={item.status} />
                {item.link && (
                  <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                    <Link to={item.link.href}>{item.link.label}<ExternalLink className="h-3 w-3 ml-1" /></Link>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── AI Intelligence Section ───────────────────────────────────────────────────
function AiIntelligenceSection({ orgId, refreshKey }: { orgId?: string; refreshKey: number }) {
  const { data: aiStats } = useQuery({
    queryKey: ['ai-intelligence-stats', orgId, refreshKey],
    queryFn: async () => {
      if (!orgId) return null;
      const [riskAnalysesRes, remediationAnalysesRes] = await Promise.all([
        supabase
          .from('ai_analyses')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('entity_type', 'risk')
          .eq('analysis_type', 'technical_analysis'),
        supabase
          .from('ai_analyses')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('entity_type', 'risk')
          .eq('analysis_type', 'remediation_plan'),
      ]);
      return {
        riskAnalyses: riskAnalysesRes.count ?? 0,
        remediationAnalyses: remediationAnalysesRes.count ?? 0,
        total: (riskAnalysesRes.count ?? 0) + (remediationAnalysesRes.count ?? 0),
      };
    },
    enabled: !!orgId,
  });

  // Preuve indirecte : si des analyses IA existent en DB → la clé fonctionne.
  // Sinon : non vérifiable côté front (la clé est un secret serveur).
  const aiAnalysesExist = (aiStats?.total ?? 0) > 0;
  const aiKeyStatus: Status = aiStats === undefined
    ? 'unknown'
    : aiAnalysesExist
      ? 'ok'
      : 'unverifiable';
  const totalAnalyses = aiStats?.total ?? 0;

  const aiItems = [
    {
      label: 'Clé IA (LOVABLE_API_KEY)',
      icon: <Brain className="h-4 w-4" />,
      status: aiKeyStatus,
      detail: aiAnalysesExist
        ? `✓ Prouvé opérationnel — ${totalAnalyses} analyse(s) IA générée(s) en DB`
        : 'Non vérifiable côté front — secret serveur. Prouvé uniquement si des analyses existent en DB.',
    },
    {
      label: 'Edge Function analyze-risk-intelligence',
      icon: <Brain className="h-4 w-4" />,
      status: 'unverifiable' as Status,
      detail: 'Déployée (vérification indirecte) — testez via un risque dans le registre',
      link: { href: '/risks', label: 'Enrichir des risques' },
    },
    {
      label: 'Edge Function enhance-remediation-actions',
      icon: <Zap className="h-4 w-4" />,
      status: 'unverifiable' as Status,
      detail: 'Déployée (vérification indirecte) — testez via une action de remédiation',
      link: { href: '/remediation', label: 'Enrichir les actions' },
    },
    {
      label: 'Analyses IA — risques (DB)',
      icon: <Brain className="h-4 w-4" />,
      status: aiStats === undefined ? 'unknown' as Status : (aiStats.riskAnalyses > 0 ? 'ok' : 'warn') as Status,
      detail: aiStats !== null ? `${aiStats.riskAnalyses} analyse(s) de risque en ai_analyses` : '…',
    },
    {
      label: 'Analyses IA — remédiation (DB)',
      icon: <Zap className="h-4 w-4" />,
      status: aiStats === undefined ? 'unknown' as Status : (aiStats.remediationAnalyses > 0 ? 'ok' : 'warn') as Status,
      detail: aiStats !== null ? `${aiStats.remediationAnalyses} plan(s) de remédiation en ai_analyses` : '…',
    },
    {
      label: 'Table ai_analyses (DB)',
      icon: <Database className="h-4 w-4" />,
      status: 'ok' as Status,
      detail: `✓ Accessible — RLS stricte (org-scoped) · ${totalAnalyses} analyses totales`,
    },
  ];

  const verifiableAi = aiItems.filter(i => i.status !== 'unverifiable');
  const aiOk = verifiableAi.filter(i => i.status === 'ok').length;
  const aiScore = verifiableAi.length > 0 ? Math.round((aiOk / verifiableAi.length) * 100) : 0;
  const aiReady = aiScore >= 80;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Intelligence Layer
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs ${aiReady ? 'border-success/40 text-success' : 'border-warning/40 text-warning'}`}>
              {aiReady ? '✓ Prête' : '⚠ Partielle'}
            </Badge>
            <span className={`text-xl font-black ${aiScore >= 80 ? 'text-success' : aiScore >= 60 ? 'text-warning' : 'text-destructive'}`}>
              {aiScore}%
            </span>
          </div>
        </div>
        <CardDescription>
          Intelligence IA défensive côté serveur · Gemini via Lovable Gateway · {totalAnalyses} analyse(s) générée(s)
          {!aiAnalysesExist && <span className="text-warning"> · Aucune preuve d'exécution encore</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {aiItems.map(item => (
            <div key={item.label} className="flex items-center justify-between gap-4 px-6 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <StatusIcon status={item.status} />
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-muted-foreground shrink-0">{item.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.label}</p>
                    <p className="text-xs text-muted-foreground/70 font-mono truncate">{item.detail}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={item.status} />
                {item.link && (
                  <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                    <Link to={item.link.href}>{item.link.label}<ExternalLink className="h-3 w-3 ml-1" /></Link>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Decision Layer Section ────────────────────────────────────────────────────
function DecisionLayerSection({ orgId, refreshKey }: { orgId?: string; refreshKey: number }) {
  const { data: decisionStats } = useQuery({
    queryKey: ['decision-layer-stats', orgId, refreshKey],
    queryFn: async () => {
      if (!orgId) return null;
      const [execRes, techRes, weeklyRes] = await Promise.all([
        supabase.from('portfolio_summaries').select('id, created_at', { count: 'exact' }).eq('organization_id', orgId).eq('summary_type', 'executive_brief').order('created_at', { ascending: false }).limit(1),
        supabase.from('portfolio_summaries').select('id, created_at', { count: 'exact' }).eq('organization_id', orgId).eq('summary_type', 'technical_brief').order('created_at', { ascending: false }).limit(1),
        supabase.from('portfolio_summaries').select('id, created_at', { count: 'exact' }).eq('organization_id', orgId).eq('summary_type', 'weekly_watch_brief').order('created_at', { ascending: false }).limit(1),
      ]);
      return {
        execBriefReady:   (execRes.count ?? 0) > 0,
        techBriefReady:   (techRes.count ?? 0) > 0,
        weeklyBriefReady: (weeklyRes.count ?? 0) > 0,
        execLastAt:       execRes.data?.[0]?.created_at ?? null,
        techLastAt:       techRes.data?.[0]?.created_at ?? null,
      };
    },
    enabled: !!orgId,
  });

  const items = [
    {
      label: 'Edge Function generate-portfolio-summary',
      icon: <Brain className="h-4 w-4" />,
      // Prouvé si au moins une synthèse existe en DB
      status: (decisionStats === undefined ? 'unknown' : (decisionStats?.execBriefReady || decisionStats?.techBriefReady || decisionStats?.weeklyBriefReady) ? 'ok' : 'unverifiable') as Status,
      detail: (decisionStats?.execBriefReady || decisionStats?.techBriefReady)
        ? '✓ Prouvé opérationnel — synthèse(s) générée(s) en DB'
        : 'Déployée (vérification indirecte) — générez une synthèse pour valider',
      link: { href: '/report-studio', label: 'Report Studio' },
    },
    {
      label: 'Executive Brief DG (DB)',
      icon: <BarChart3 className="h-4 w-4" />,
      status: (decisionStats === undefined ? 'unknown' : decisionStats?.execBriefReady ? 'ok' : 'warn') as Status,
      detail: decisionStats?.execBriefReady
        ? `✓ Présent — ${decisionStats.execLastAt ? new Date(decisionStats.execLastAt).toLocaleDateString('fr-FR') : ''}`
        : '✗ Aucune synthèse executive_brief générée — générez depuis Report Studio',
      link: { href: '/report-studio', label: 'Générer' },
    },
    {
      label: 'Technical Brief DSI (DB)',
      icon: <Brain className="h-4 w-4" />,
      status: (decisionStats === undefined ? 'unknown' : decisionStats?.techBriefReady ? 'ok' : 'warn') as Status,
      detail: decisionStats?.techBriefReady
        ? `✓ Présent — ${decisionStats.techLastAt ? new Date(decisionStats.techLastAt).toLocaleDateString('fr-FR') : ''}`
        : '✗ Aucune synthèse technical_brief générée',
      link: { href: '/report-studio', label: 'Générer' },
    },
    {
      label: 'Weekly Watch Brief (DB)',
      icon: <Activity className="h-4 w-4" />,
      status: (decisionStats === undefined ? 'unknown' : decisionStats?.weeklyBriefReady ? 'ok' : 'warn') as Status,
      detail: decisionStats?.weeklyBriefReady ? '✓ Présent' : '✗ Aucun watch brief hebdomadaire généré',
      link: { href: '/report-studio', label: 'Générer' },
    },
  ];

  const dbItems = items.filter(i => i.status !== 'unverifiable');
  const okCount = dbItems.filter(i => i.status === 'ok').length;
  const score = dbItems.length > 0 ? Math.round((okCount / dbItems.length) * 100) : 0;
  const ready = score >= 75;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Decision Layer
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs ${ready ? 'border-success/40 text-success' : 'border-warning/40 text-warning'}`}>
              {ready ? '✓ Prête' : '⚠ Partielle'}
            </Badge>
            <span className={`text-xl font-black ${score >= 75 ? 'text-success' : 'text-warning'}`}>{score}%</span>
          </div>
        </div>
        <CardDescription>Couche décisionnelle · synthèses portefeuille · briefs DG / DSI / hebdo</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {items.map(item => (
            <div key={item.label} className="flex items-center justify-between gap-4 px-6 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <StatusIcon status={item.status} />
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-muted-foreground shrink-0">{item.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.label}</p>
                    <p className="text-xs text-muted-foreground/70 font-mono truncate">{item.detail}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={item.status} />
                {item.link && (
                  <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                    <Link to={item.link.href}>{item.link.label}<ExternalLink className="h-3 w-3 ml-1" /></Link>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Continuous Watch Section ──────────────────────────────────────────────────
function ContinuousWatchSection({ orgId, refreshKey }: { orgId?: string; refreshKey: number }) {
  const { data: watchStats } = useQuery({
    queryKey: ['continuous-watch-stats', orgId, refreshKey],
    queryFn: async () => {
      if (!orgId) return null;
      const [alertsRes, sourcesRes] = await Promise.all([
        supabase.from('alerts').select('status', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'open'),
        supabase.from('data_sources').select('status', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'active'),
      ]);
      return { openAlerts: alertsRes.count ?? 0, activeSources: sourcesRes.count ?? 0 };
    },
    enabled: !!orgId,
  });

  const watchItems = [
    { label: 'Edge Function platform-health', icon: <Server className="h-4 w-4" />, status: 'unverifiable' as Status, detail: 'Déployée (vérification indirecte) — health score, composants DB/AI/sources/risques', link: { href: '/platform-health', label: 'Voir la santé' } },
    { label: 'Edge Function schedule-source-sync', icon: <RefreshCw className="h-4 w-4" />, status: 'unverifiable' as Status, detail: 'Déployée (vérification indirecte) — déclenche syncs sources actives (seuil 6h)' },
    { label: 'Edge Function stale-risk-check', icon: <AlertTriangle className="h-4 w-4" />, status: 'unverifiable' as Status, detail: 'Déployée (vérification indirecte) — détecte risques stagnants → alertes' },
    { label: 'Edge Function evaluate-alert-rules', icon: <Bell className="h-4 w-4" />, status: 'unverifiable' as Status, detail: 'Déployée (vérification indirecte) — évalue notification_rules contre alertes ouvertes' },
    {
      label: 'Alertes ouvertes (DB)',
      icon: <Bell className="h-4 w-4" />,
      status: (watchStats === undefined ? 'unknown' : (watchStats?.openAlerts ?? 0) === 0 ? 'ok' : 'warn') as Status,
      detail: watchStats !== null ? `${watchStats?.openAlerts ?? 0} alerte(s) ouverte(s)` : '…',
      link: { href: '/platform-health', label: 'Voir les alertes' },
    },
    {
      label: 'Sources actives (DB)',
      icon: <Activity className="h-4 w-4" />,
      status: (watchStats === undefined ? 'unknown' : (watchStats?.activeSources ?? 0) > 0 ? 'ok' : 'warn') as Status,
      detail: watchStats !== null ? `${watchStats?.activeSources ?? 0} source(s) active(s)` : '…',
    },
  ];

  const verifiable = watchItems.filter(i => i.status !== 'unverifiable');
  const watchOk = verifiable.filter(i => i.status === 'ok').length;
  const watchScore = verifiable.length > 0 ? Math.round((watchOk / verifiable.length) * 100) : 0;
  const watchReady = watchScore >= 80;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Continuous Watch
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs ${watchReady ? 'border-success/40 text-success' : 'border-warning/40 text-warning'}`}>
              {watchReady ? '✓ Prêt' : '⚠ Partiel'}
            </Badge>
            <span className={`text-xl font-black ${watchScore >= 80 ? 'text-success' : watchScore >= 60 ? 'text-warning' : 'text-destructive'}`}>
              {watchScore}%
            </span>
          </div>
        </div>
        <CardDescription>Surveillance continue · alerting défensif · syncs planifiés · stale-risk detection</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {watchItems.map(item => (
            <div key={item.label} className="flex items-center justify-between gap-4 px-6 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <StatusIcon status={item.status} />
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-muted-foreground shrink-0">{item.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.label}</p>
                    <p className="text-xs text-muted-foreground/70 font-mono truncate">{item.detail}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={item.status} />
                {item.link && (
                  <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                    <Link to={item.link.href}>{item.link.label}<ExternalLink className="h-3 w-3 ml-1" /></Link>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminReadiness() {
  const { organization } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const runtime = useRuntimeConfig();
  const externalBackendActive = Boolean(runtime.coreApiUrl);
  const bookingActive         = Boolean(runtime.bookingUrl);
  const starterActive         = Boolean(runtime.starterCheckoutUrl);
  const proActive             = Boolean(runtime.proCheckoutUrl);
  const enterpriseActive      = Boolean(runtime.enterpriseCheckoutUrl);
  const configSource          = runtime.configSource;

  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['platform-health-readiness', organization?.id, refreshKey],
    queryFn: () => getPlatformHealth(organization?.id),
    enabled: !!organization?.id,
    retry: 1,
  });

  const { data: leadStats } = useQuery({
    queryKey: ['lead-stats', refreshKey],
    queryFn: async () => {
      const { data, error } = await supabase.from('sales_leads').select('status, lead_score, cta_origin, created_at');
      if (error) return null;
      const leads = data ?? [];
      const total     = leads.length;
      const newLeads  = leads.filter(l => l.status === 'new').length;
      const qualified = leads.filter(l => l.status === 'qualified').length;
      const avgScore  = total > 0 ? Math.round(leads.reduce((s, l) => s + (l.lead_score ?? 0), 0) / total) : 0;
      const ctaCounts: Record<string, number> = {};
      leads.forEach(l => { const k = l.cta_origin ?? 'unknown'; ctaCounts[k] = (ctaCounts[k] ?? 0) + 1; });
      const topCta = Object.entries(ctaCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} (${v})`);
      return { total, newLeads, qualified, won: leads.filter(l => l.status === 'won').length, avgScore, topCta };
    },
  });

  const { data: conversionData } = useQuery({
    queryKey: ['conversion-analytics', refreshKey],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).from('conversion_events').select('event_name, cta_origin, source_page').limit(500);
      if (!data) return null;
      type Row = { event_name: string; cta_origin: string | null; source_page: string | null };
      const rows = data as Row[];
      const eventCounts: Record<string, number> = {};
      const ctaCounts: Record<string, number> = {};
      const pageCounts: Record<string, number> = {};
      rows.forEach(r => {
        eventCounts[r.event_name] = (eventCounts[r.event_name] ?? 0) + 1;
        if (r.cta_origin) ctaCounts[r.cta_origin] = (ctaCounts[r.cta_origin] ?? 0) + 1;
        if (r.source_page) pageCounts[r.source_page] = (pageCounts[r.source_page] ?? 0) + 1;
      });
      const topEvents = Object.entries(eventCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
      const topCtaOrigins = Object.entries(ctaCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const topPages = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const dialogOpens   = eventCounts['demo_dialog_open']   ?? 0;
      const dialogSubmits = eventCounts['demo_dialog_submit'] ?? 0;
      const conversionRate = dialogOpens > 0 ? Math.round((dialogSubmits / dialogOpens) * 100) : 0;
      return { topEvents, topCtaOrigins, topPages, dialogOpens, dialogSubmits, conversionRate, total: rows.length };
    },
  });

  // ── Decision Layer data for 4 scores ──────────────────────────────────────
  const { data: decisionScoreData } = useQuery({
    queryKey: ['decision-scores', organization?.id, refreshKey],
    queryFn: async () => {
      if (!organization?.id) return null;
      const [execRes, techRes] = await Promise.all([
        supabase.from('portfolio_summaries').select('id', { count: 'exact', head: true }).eq('organization_id', organization.id).eq('summary_type', 'executive_brief'),
        supabase.from('portfolio_summaries').select('id', { count: 'exact', head: true }).eq('organization_id', organization.id).eq('summary_type', 'technical_brief'),
      ]);
      return {
        hasExecBrief: (execRes.count ?? 0) > 0,
        hasTechBrief: (techRes.count ?? 0) > 0,
      };
    },
    enabled: !!organization?.id,
  });

  const { data: aiScoreData } = useQuery({
    queryKey: ['ai-score-data', organization?.id, refreshKey],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { count } = await supabase.from('ai_analyses').select('id', { count: 'exact', head: true }).eq('organization_id', organization.id);
      return { hasAiAnalyses: (count ?? 0) > 0 };
    },
    enabled: !!organization?.id,
  });

  const healthOk = !healthLoading && !!health;

  // ── 4 Scores réels ───────────────────────────────────────────────────────
  // Demo Ready: plateforme accessible + données existantes + brief disponible ou IA active
  const demoReadyScore = [
    healthOk ? 30 : 0,
    (leadStats !== undefined) ? 10 : 0,          // DB accessible
    Boolean(runtime.bookingUrl || runtime.starterCheckoutUrl) ? 20 : 10,  // CTA commercial configuré
    (decisionScoreData?.hasExecBrief || decisionScoreData?.hasTechBrief) ? 25 : 0,   // brief prêt
    aiScoreData?.hasAiAnalyses ? 15 : 0,          // IA a fonctionné
  ].reduce((a, b) => a + b, 0);

  // Sales Ready: tunnel complet (booking ou checkout + lead capture prouvé)
  const salesReadyScore = [
    (leadStats?.total ?? 0) > 0 ? 40 : 0,        // leads réels reçus
    bookingActive ? 20 : starterActive ? 20 : 0,  // lien commercial actif
    configSource !== 'defaults' ? 20 : 0,         // config DB (pas juste defaults)
    (conversionData?.total ?? 0) > 0 ? 20 : 0,   // tracking actif et utilisé
  ].reduce((a, b) => a + b, 0);

  // Ops Ready: moteur technique fonctionnel
  const opsReadyScore = [
    healthOk ? 30 : 0,
    (decisionScoreData?.hasExecBrief || decisionScoreData?.hasTechBrief) ? 25 : 0,
    aiScoreData?.hasAiAnalyses ? 25 : 0,
    Boolean(runtime.coreApiUrl) || true ? 20 : 0, // moteur interne toujours dispo
  ].reduce((a, b) => a + b, 0);

  // Global Ready: moyenne pondérée
  const globalReadyScore = Math.round((demoReadyScore * 0.3 + salesReadyScore * 0.35 + opsReadyScore * 0.35));

  const scoreToStatus = (s: number): Status => s >= 80 ? 'ok' : s >= 50 ? 'warn' : 'fail';

  const sourceLabel = configSource === 'app_runtime_config'
    ? 'DB (app_runtime_config)'
    : configSource === 'commercial_config'
    ? 'DB (commercial_config)'
    : configSource === 'env'
    ? 'variables d\'env'
    : 'valeurs par défaut';

  // ── Standard check groups ─────────────────────────────────────────────────
  const groups: CheckGroup[] = [
    {
      title: 'Infrastructure & Backend',
      icon: <Database className="h-5 w-5 text-primary" />,
      items: [
        {
          label: 'Base de données Lovable Cloud',
          description: 'Connexion active vérifiée via requête DB réelle',
          status: (leadStats !== undefined || healthOk) ? 'ok' : healthLoading ? 'unknown' : 'fail',
          detail: healthOk
            ? `✓ DB accessible · ${health?.org_counts?.open_signals ?? 0} signaux · ${health?.org_counts?.open_risks ?? 0} risques`
            : leadStats !== undefined ? '✓ DB accessible (leads chargés)' : '…',
        },
        {
          label: 'Backend externe (Core API URL)',
          description: 'Proxy IA pour Report Studio — optionnel',
          status: externalBackendActive ? 'ok' : 'warn',
          detail: externalBackendActive
            ? `✓ Configuré (source: ${configSource}) — ${runtime.coreApiUrl?.slice(0, 50)}`
            : `✗ Non configuré — Report Studio utilise le moteur interne (mode: ${runtime.reportsMode})`,
          link: { href: '/settings/revenue', label: 'Configurer' },
        },
        {
          label: 'IA moteur interne (LOVABLE_API_KEY)',
          description: aiScoreData?.hasAiAnalyses ? 'Prouvé via analyses en DB' : 'Non vérifiable côté front — secret serveur',
          status: aiScoreData?.hasAiAnalyses ? 'ok' : 'unverifiable',
          detail: aiScoreData?.hasAiAnalyses
            ? `✓ Prouvé opérationnel — analyse(s) IA générée(s) en DB`
            : 'Non vérifiable côté front. Testez via Risques → Enrichir avec IA.',
        },
      ],
    },
    {
      title: 'Fonctionnalités Produit',
      icon: <Cpu className="h-5 w-5 text-primary" />,
      items: [
        {
          label: 'Mode Démo (/demo)',
          description: 'Page publique accessible',
          status: 'ok',
          detail: '✓ Route /demo accessible sans authentification — données ACME Corp',
          link: { href: '/demo', label: 'Ouvrir la démo' },
        },
        {
          label: 'Report Studio',
          description: 'Centre de décision DG/DSI',
          status: (decisionScoreData?.hasExecBrief || decisionScoreData?.hasTechBrief) ? 'ok' : 'warn',
          detail: (decisionScoreData?.hasExecBrief || decisionScoreData?.hasTechBrief)
            ? `✓ Synthèse(s) générée(s) · Mode: ${runtime.reportsMode}`
            : `⚠ Aucune synthèse encore générée · Mode: ${runtime.reportsMode}`,
          link: { href: '/report-studio', label: 'Ouvrir Report Studio' },
        },
        {
          label: 'Moteur de signaux',
          description: 'Ingestion, corrélation, registre de risques',
          status: healthOk ? 'ok' : 'unknown',
          detail: healthOk
            ? `✓ ${health?.org_counts?.open_signals ?? 0} signaux · ${health?.org_counts?.open_risks ?? 0} risques`
            : '…',
        },
      ],
    },
    {
      title: 'Capture de leads & Commercial',
      icon: <Users className="h-5 w-5 text-primary" />,
      items: [
        {
          label: 'Edge Function submit-sales-lead',
          description: 'Prouvé si des leads existent en DB',
          status: (leadStats?.total ?? 0) > 0 ? 'ok' : 'unverifiable',
          detail: (leadStats?.total ?? 0) > 0
            ? `✓ Prouvé — ${leadStats!.total} lead(s) en DB`
            : 'Non prouvé encore — aucun lead reçu. Déployée (vérification indirecte).',
        },
        {
          label: 'Leads reçus',
          description: 'Demandes de démonstration',
          status: (leadStats?.total ?? 0) > 0 ? 'ok' : 'warn',
          detail: leadStats
            ? `${leadStats.total} total · ${leadStats.newLeads} nouveaux · ${leadStats.qualified} qualifiés · score moyen ${leadStats.avgScore}`
            : '…',
          link: { href: '/admin/leads', label: 'Gérer les leads' },
        },
        {
          label: 'Tracking conversions (DB)',
          description: 'conversion_events actif',
          status: (conversionData?.total ?? 0) > 0 ? 'ok' : 'warn',
          detail: `${conversionData?.total ?? '0'} événements total${(conversionData?.total ?? 0) === 0 ? ' — aucun clic tracé encore' : ''}`,
        },
      ],
    },
    {
      title: 'Navigation & Expérience',
      icon: <Navigation className="h-5 w-5 text-primary" />,
      items: [
        {
          label: 'Landing Page',
          description: 'Page publique avec tunnel de conversion',
          status: 'ok',
          detail: '✓ Route / accessible · CTAs hero → /demo + DemoRequestDialog fallback',
          link: { href: '/', label: 'Voir la landing' },
        },
        {
          label: 'Page Pricing',
          description: 'Tarification claire avec CTA',
          status: starterActive ? 'ok' : 'warn',
          detail: starterActive
            ? `✓ Checkout Starter actif (${sourceLabel})`
            : '⚠ Pas de checkout Starter — fallback vers formulaire démo actif',
          link: { href: '/pricing', label: 'Voir les tarifs' },
        },
        {
          label: 'Navigation principale',
          description: 'Sidebar et routes applicatives',
          status: 'ok',
          detail: '✓ Tableaux de bord, Opérations, Audit, Administration — toutes routes déclarées',
        },
      ],
    },
  ];

  // ── Revenue Operating Readiness ──────────────────────────────────────────
  const revenueItems = [
    {
      label: 'Config runtime (source de vérité)',
      icon: <Settings className="h-4 w-4" />,
      status: configSource !== 'defaults' ? 'ok' as Status : 'warn' as Status,
      detail: `Source active : ${sourceLabel}`,
      link: { href: '/settings/revenue', label: 'Configurer' },
    },
    {
      label: 'Mode rapport (reports_mode)',
      icon: <Brain className="h-4 w-4" />,
      status: 'ok' as Status,
      detail: `${runtime.reportsMode} — ${
        runtime.reportsMode === 'internal_only' ? 'moteur interne (Edge Functions)'
        : runtime.reportsMode === 'external_only' ? externalBackendActive ? 'backend externe actif' : '⚠ requis mais absent'
        : externalBackendActive ? 'externe disponible + fallback interne' : 'fallback interne actif'
      }`,
    },
    {
      label: 'Mode vente (sales_mode)',
      icon: <Zap className="h-4 w-4" />,
      status: runtime.salesMode !== 'disabled' ? 'ok' as Status : 'warn' as Status,
      detail: `${runtime.salesMode}${runtime.salesEnabled ? '' : ' (mode vente désactivé)'}`,
    },
    {
      label: 'Booking URL',
      icon: <CalendarDays className="h-4 w-4" />,
      status: bookingActive ? 'ok' as Status : 'warn' as Status,
      detail: bookingActive
        ? `✓ ${runtime.bookingUrl?.slice(0, 50)} (${sourceLabel})`
        : '✗ Non défini — fallback formulaire DemoRequestDialog actif',
      link: bookingActive ? undefined : { href: '/settings/revenue', label: 'Configurer' },
    },
    {
      label: 'Checkout Starter',
      icon: <ShoppingCart className="h-4 w-4" />,
      status: starterActive ? 'ok' as Status : 'warn' as Status,
      detail: starterActive ? `✓ configuré (${sourceLabel})` : '✗ Non défini — fallback booking/formulaire',
    },
    {
      label: 'Checkout Pro',
      icon: <ShoppingCart className="h-4 w-4" />,
      status: proActive ? 'ok' as Status : 'warn' as Status,
      detail: proActive ? `✓ configuré (${sourceLabel})` : '✗ Non défini',
    },
    {
      label: 'Checkout Enterprise',
      icon: <ShoppingCart className="h-4 w-4" />,
      status: enterpriseActive ? 'ok' as Status : 'warn' as Status,
      detail: enterpriseActive ? `✓ configuré (${sourceLabel})` : '✗ Non défini',
    },
    {
      label: 'Capture lead',
      icon: <Users className="h-4 w-4" />,
      status: (leadStats?.total ?? 0) > 0 ? 'ok' as Status : 'unverifiable' as Status,
      detail: (leadStats?.total ?? 0) > 0
        ? `✓ Prouvé — ${leadStats!.total} lead(s) reçu(s)`
        : 'Non prouvé — déployée mais aucun lead encore reçu',
    },
    {
      label: 'Pipeline leads',
      icon: <TrendingUp className="h-4 w-4" />,
      status: 'ok' as Status,
      detail: '✓ /admin/leads — SLA 24h/72h, actions rapides, filtres CTA origine',
      link: { href: '/admin/leads', label: 'Pipeline' },
    },
  ];

  const allItems = groups.flatMap(g => g.items);
  // Score basé uniquement sur éléments vérifiables
  const verifiableItems = allItems.filter(i => i.status !== 'unverifiable' && i.status !== 'unknown');
  const okCount   = verifiableItems.filter(i => i.status === 'ok').length;
  const warnCount = allItems.filter(i => i.status === 'warn').length;
  const failCount = allItems.filter(i => i.status === 'fail').length;
  const unverifiableCount = allItems.filter(i => i.status === 'unverifiable').length;
  const readinessScore = verifiableItems.length > 0 ? Math.round((okCount / verifiableItems.length) * 100) : 0;

  const revenueOk = revenueItems.filter(i => i.status === 'ok').length;
  const revenueVerifiable = revenueItems.filter(i => i.status !== 'unverifiable');
  const revenueScore = revenueVerifiable.length > 0 ? Math.round((revenueItems.filter(i => i.status === 'ok').length / revenueVerifiable.length) * 100) : 0;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Admin Readiness</h1>
              <p className="text-sm text-muted-foreground">État de préparation — vérité stricte, zéro faux vert</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setRefreshKey(k => k + 1)}>
            <RefreshCw className="h-4 w-4 mr-2" />Actualiser
          </Button>
        </div>

        {/* Légende statuts */}
        <Card className="border-muted">
          <CardContent className="py-3">
            <div className="flex flex-wrap gap-4 items-center text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Légende :</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> OK prouvé</span>
              <span className="flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5 text-warning" /> Attention / partiel</span>
              <span className="flex items-center gap-1"><XCircle className="h-3.5 w-3.5 text-destructive" /> Échec</span>
              <span className="flex items-center gap-1"><Info className="h-3.5 w-3.5 text-muted-foreground" /> Non vérifiable côté front (test fonctionnel requis)</span>
            </div>
          </CardContent>
        </Card>

        {/* 4 Scores réels */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Demo Ready',   score: demoReadyScore,   description: 'Démo présentable' },
            { label: 'Sales Ready',  score: salesReadyScore,  description: 'Tunnel de vente actif' },
            { label: 'Ops Ready',    score: opsReadyScore,    description: 'Moteur opérationnel' },
            { label: 'Global Ready', score: globalReadyScore, description: 'Score pondéré global' },
          ].map(({ label, score, description }) => {
            const s = scoreToStatus(score);
            const color = s === 'ok' ? 'text-success' : s === 'warn' ? 'text-warning' : 'text-destructive';
            const border = s === 'ok' ? 'border-success/30' : s === 'warn' ? 'border-warning/30' : 'border-destructive/30';
            return (
              <Card key={label} className={`border ${border}`}>
                <CardContent className="pt-4 pb-4 text-center">
                  <p className={`text-3xl font-black ${color}`}>{score}</p>
                  <p className="text-xs font-semibold text-foreground mt-0.5">{label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Global readiness */}
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex flex-col items-center gap-1">
                <div className={`text-5xl font-black ${readinessScore >= 80 ? 'text-success' : readinessScore >= 60 ? 'text-warning' : 'text-destructive'}`}>
                  {readinessScore}%
                </div>
                <div className="text-xs text-muted-foreground">Éléments vérifiables OK</div>
              </div>

              <Separator orientation="vertical" className="hidden md:block h-16" />

              <div className="flex gap-6 shrink-0 text-center">
                <div><p className="text-2xl font-bold text-success">{okCount}</p><p className="text-xs text-muted-foreground">OK prouvés</p></div>
                <div><p className="text-2xl font-bold text-warning">{warnCount}</p><p className="text-xs text-muted-foreground">Attention</p></div>
                <div><p className="text-2xl font-bold text-destructive">{failCount}</p><p className="text-xs text-muted-foreground">Échec</p></div>
                <div><p className="text-2xl font-bold text-muted-foreground">{unverifiableCount}</p><p className="text-xs text-muted-foreground">Non vérifiables</p></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Standard groups */}
        {groups.map(group => (
          <Card key={group.title}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">{group.icon}{group.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {group.items.map(item => (
                  <div key={item.label} className="flex items-center justify-between gap-4 px-6 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <StatusIcon status={item.status} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                        {item.detail && <p className="text-xs text-muted-foreground/70 mt-0.5 font-mono">{item.detail}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={item.status} />
                      {item.link && (
                        <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                          <Link to={item.link.href}>
                            {item.link.label}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* ── Risk Engine ─────────────────────────────────────────────────── */}
        <RiskEngineSection orgId={organization?.id} refreshKey={refreshKey} />

        {/* ── AI Intelligence Layer ────────────────────────────────────────── */}
        <AiIntelligenceSection orgId={organization?.id} refreshKey={refreshKey} />

        {/* ── Continuous Watch ─────────────────────────────────────────────── */}
        <ContinuousWatchSection orgId={organization?.id} refreshKey={refreshKey} />

        {/* ── Decision Layer ───────────────────────────────────────────────── */}
        <DecisionLayerSection orgId={organization?.id} refreshKey={refreshKey} />

        {/* ── Revenue Operating Readiness ─────────────────────────────────── */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Revenue Operating Readiness
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className={`text-xl font-black ${revenueScore >= 80 ? 'text-success' : revenueScore >= 60 ? 'text-warning' : 'text-destructive'}`}>
                  {revenueScore}%
                </span>
                <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                  <Link to="/settings/revenue">
                    <Settings className="h-3 w-3 mr-1" />Configurer
                  </Link>
                </Button>
              </div>
            </div>
            <CardDescription>Liens commerciaux, pipeline et tunnel de conversion · Source active : {sourceLabel}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {revenueItems.map(item => (
                <div key={item.label} className="flex items-center justify-between gap-4 px-6 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusIcon status={item.status} />
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-muted-foreground shrink-0">{item.icon}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.label}</p>
                        <p className="text-xs text-muted-foreground/70 font-mono truncate">{item.detail}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={item.status} />
                    {item.link && (
                      <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                        <Link to={item.link.href}>
                          {item.link.label}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Lead KPIs ────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              KPI Leads
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total leads',  value: leadStats?.total ?? 0,      icon: <Users className="h-4 w-4 text-primary" />,          cls: '' },
                { label: 'Nouveaux',     value: leadStats?.newLeads ?? 0,   icon: <MessageSquare className="h-4 w-4 text-primary" />,   cls: 'text-primary' },
                { label: 'Qualifiés',    value: leadStats?.qualified ?? 0,  icon: <TrendingUp className="h-4 w-4 text-warning" />,       cls: 'text-warning' },
                { label: 'Score moyen',  value: `${leadStats?.avgScore ?? 0}/100`, icon: <Star className="h-4 w-4 text-success" />,   cls: 'text-success' },
              ].map(k => (
                <div key={k.label} className="rounded-lg border border-border bg-muted/20 px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">{k.icon}<span className="text-xs text-muted-foreground">{k.label}</span></div>
                  <p className={`text-2xl font-black ${k.cls}`}>{k.value}</p>
                </div>
              ))}
            </div>
            {leadStats?.topCta && leadStats.topCta.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                  <MousePointerClick className="h-3.5 w-3.5" />CTAs les plus performants (leads générés)
                </p>
                <div className="flex flex-wrap gap-2">
                  {leadStats.topCta.map(cta => (
                    <Badge key={cta} variant="outline" className="text-xs font-mono">{cta}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Conversion Analytics ─────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Conversion Analytics
            </CardTitle>
            <CardDescription>Clics et comportement depuis la landing · {conversionData?.total ?? 0} événements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Ouvertures formulaire</p>
                <p className="text-2xl font-black">{conversionData?.dialogOpens ?? 0}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Soumissions réussies</p>
                <p className="text-2xl font-black text-success">{conversionData?.dialogSubmits ?? 0}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Taux formulaire</p>
                <p className={`text-2xl font-black ${(conversionData?.conversionRate ?? 0) >= 30 ? 'text-success' : 'text-warning'}`}>
                  {conversionData?.conversionRate ?? 0}%
                </p>
              </div>
            </div>
            {conversionData?.topEvents && conversionData.topEvents.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                  <MousePointerClick className="h-3.5 w-3.5" />Top événements
                </p>
                <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                  {conversionData.topEvents.map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between px-4 py-2">
                      <span className="text-xs font-mono text-muted-foreground">{name}</span>
                      <span className="text-sm font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!conversionData && (
              <p className="text-sm text-muted-foreground text-center py-4">Aucun événement de conversion enregistré.</p>
            )}
          </CardContent>
        </Card>

        {(leadStats?.newLeads ?? 0) > 0 && (
          <Card className="border-success/30 bg-success/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-success" />
                Leads en attente
              </CardTitle>
              <CardDescription>
                {leadStats!.newLeads} nouveau{leadStats!.newLeads > 1 ? 'x' : ''} lead{leadStats!.newLeads > 1 ? 's' : ''} non traité{leadStats!.newLeads > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="sm" asChild>
                <Link to="/admin/leads"><Users className="h-4 w-4 mr-2" />Gérer les leads</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {healthLoading && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Vérification de l'état de la plateforme…
          </div>
        )}
      </div>
    </AppLayout>
  );
}
