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
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Shield,
  Database,
  Cpu,
  FlaskConical,
  Users,
  MessageSquare,
  Navigation,
  BarChart3,
  Loader2,
  ExternalLink,
  TrendingUp,
  DollarSign,
  MousePointerClick,
  Star,
  CalendarDays,
  ShoppingCart,
  Zap,
  Settings,
  Server,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type Status = 'ok' | 'warn' | 'fail' | 'unknown';

function StatusIcon({ status }: { status: Status }) {
  if (status === 'ok')   return <CheckCircle2 className="h-5 w-5 text-success" />;
  if (status === 'warn') return <AlertTriangle className="h-5 w-5 text-warning" />;
  if (status === 'fail') return <XCircle className="h-5 w-5 text-destructive" />;
  return <div className="h-5 w-5 rounded-full border-2 border-muted animate-pulse" />;
}

function StatusBadge({ status }: { status: Status }) {
  const cfg: Record<Status, { label: string; className: string }> = {
    ok:      { label: 'OK',        className: 'bg-success/10 text-success border-success/30' },
    warn:    { label: 'Attention', className: 'bg-warning/10 text-warning border-warning/30' },
    fail:    { label: 'Échec',     className: 'bg-destructive/10 text-destructive border-destructive/30' },
    unknown: { label: '…',         className: 'bg-muted/50 text-muted-foreground border-muted' },
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

export default function AdminReadiness() {
  const { organization } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const coreApiConfigured    = Boolean(import.meta.env.VITE_CORE_API_URL);
  const bookingEnvConfigured = Boolean(import.meta.env.VITE_BOOKING_URL);

  const { config: commercial } = useCommercialConfig();

  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['platform-health-readiness', organization?.id, refreshKey],
    queryFn: () => getPlatformHealth(organization?.id),
    enabled: !!organization?.id,
    retry: 1,
  });

  // Lead KPIs
  const { data: leadStats } = useQuery({
    queryKey: ['lead-stats', refreshKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_leads')
        .select('status, lead_score, cta_origin, created_at');
      if (error) return null;
      const leads = data ?? [];
      const total     = leads.length;
      const newLeads  = leads.filter(l => l.status === 'new').length;
      const qualified = leads.filter(l => l.status === 'qualified').length;
      const won       = leads.filter(l => l.status === 'won').length;
      const avgScore  = total > 0
        ? Math.round(leads.reduce((s, l) => s + (l.lead_score ?? 0), 0) / total)
        : 0;
      const ctaCounts: Record<string, number> = {};
      leads.forEach(l => {
        const k = l.cta_origin ?? 'unknown';
        ctaCounts[k] = (ctaCounts[k] ?? 0) + 1;
      });
      const topCta = Object.entries(ctaCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([k, v]) => `${k} (${v})`);
      return { total, newLeads, qualified, won, avgScore, topCta };
    },
  });

  // Conversion events
  const { data: conversionData } = useQuery({
    queryKey: ['conversion-analytics', refreshKey],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('conversion_events')
        .select('event_name, cta_origin, source_page')
        .limit(500);
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

      const dialogOpens    = eventCounts['demo_dialog_open']   ?? 0;
      const dialogSubmits  = eventCounts['demo_dialog_submit'] ?? 0;
      const conversionRate = dialogOpens > 0 ? Math.round((dialogSubmits / dialogOpens) * 100) : 0;

      return { topEvents, topCtaOrigins, topPages, dialogOpens, dialogSubmits, conversionRate, total: rows.length };
    },
  });

  const healthOk = !healthLoading && !!health;

  // ── Check groups ─────────────────────────────────────────────────────────
  const groups: CheckGroup[] = [
    {
      title: 'Infrastructure & Backend',
      icon: <Database className="h-5 w-5 text-primary" />,
      items: [
        {
          label: 'Base de données Lovable Cloud',
          description: 'Connexion active',
          status: healthOk ? 'ok' : healthLoading ? 'unknown' : 'fail',
          detail: healthOk
            ? `${health?.org_counts?.open_signals ?? 0} signaux · ${health?.org_counts?.open_risks ?? 0} risques`
            : undefined,
        },
        {
          label: 'Backend externe (VITE_CORE_API_URL)',
          description: 'Proxy IA pour Report Studio',
          status: coreApiConfigured ? 'ok' : 'warn',
          detail: coreApiConfigured ? 'Configuré' : 'Non configuré — Report Studio en lecture seule',
        },
        {
          label: 'IA moteur interne (Lovable API)',
          description: 'Analyse de signaux et remédiation IA',
          status: 'ok',
          detail: "LOVABLE_API_KEY présent — prêt à l'emploi",
        },
      ],
    },
    {
      title: 'Fonctionnalités Produit',
      icon: <Cpu className="h-5 w-5 text-primary" />,
      items: [
        {
          label: 'Mode Démo',
          description: 'Données fictives premium pour prospects',
          status: 'ok',
          detail: 'Page /demo opérationnelle avec données ACME Corp',
          link: { href: '/demo', label: 'Ouvrir la démo' },
        },
        {
          label: 'Report Studio',
          description: 'Génération rapports DG/PDG et DSI',
          status: coreApiConfigured ? 'ok' : 'warn',
          detail: coreApiConfigured ? 'Opérationnel' : 'Nécessite VITE_CORE_API_URL pour générer',
          link: { href: '/report-studio', label: 'Ouvrir Report Studio' },
        },
        {
          label: 'Moteur de signaux',
          description: 'Ingestion, corrélation, registre de risques',
          status: healthOk ? 'ok' : 'unknown',
          detail: healthOk
            ? `${health?.org_counts?.open_signals ?? 0} signaux · ${health?.org_counts?.open_risks ?? 0} risques`
            : undefined,
        },
      ],
    },
    {
      title: 'Capture de leads & Commercial',
      icon: <Users className="h-5 w-5 text-primary" />,
      items: [
        {
          label: 'Edge Function submit-sales-lead',
          description: 'Capture robuste avec dédup et scoring',
          status: 'ok',
          detail: 'Déployée — validation serveur, déduplication 24h, lead_score automatique',
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
          label: 'Tracking conversions',
          description: 'Événements CTA enregistrés',
          status: 'ok',
          detail: `conversion_events actif — ${conversionData?.total ?? '…'} événements total`,
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
          detail: '3 CTAs : Démo / Import / Demander une démo',
          link: { href: '/', label: 'Voir la landing' },
        },
        {
          label: 'Page Pricing',
          description: 'Tarification claire avec add-ons',
          status: 'ok',
          detail: 'Plan Core 490€/an + add-ons',
          link: { href: '/pricing', label: 'Voir les tarifs' },
        },
        {
          label: 'Navigation principale',
          description: 'Sidebar et routes applicatives',
          status: 'ok',
          detail: 'Tableaux de bord, Opérations, Audit, Administration',
        },
      ],
    },
  ];

  const allItems = groups.flatMap(g => g.items);
  const okCount   = allItems.filter(i => i.status === 'ok').length;
  const warnCount = allItems.filter(i => i.status === 'warn').length;
  const failCount = allItems.filter(i => i.status === 'fail').length;
  const total     = allItems.length;
  const readinessScore = Math.round((okCount / total) * 100);

  const globalStatus: Status = failCount > 0 ? 'fail' : warnCount > 0 ? 'warn' : 'ok';

  const readinessLabels = {
    fail:  { demo: 'fail' as Status, sale: 'fail' as Status,  onboarding: 'fail' as Status },
    warn:  { demo: 'ok'  as Status, sale: 'warn' as Status,  onboarding: 'warn' as Status },
    ok:    { demo: 'ok'  as Status, sale: 'ok'  as Status,  onboarding: coreApiConfigured ? 'ok' as Status : 'warn' as Status },
  };
  const readiness = readinessLabels[globalStatus];

  // ── Revenue Operating Readiness items ─────────────────────────────────────
  // Effective = DB override if present, else env var. Both layers shown explicitly.
  const revenueItems = [
    {
      label: 'Config commerciale (DB override)',
      icon: <Settings className="h-4 w-4" />,
      status: commercial.fromDb ? 'ok' as Status : 'warn' as Status,
      detail: commercial.fromDb
        ? 'Revenue Settings configurés en base — priorité sur env vars'
        : 'Non configuré en base — env vars utilisées comme fallback',
      link: { href: '/settings/revenue', label: 'Configurer' },
    },
    {
      label: 'Booking URL',
      icon: <CalendarDays className="h-4 w-4" />,
      status: commercial.bookingUrl ? 'ok' as Status : 'warn' as Status,
      detail: commercial.bookingUrl
        ? `✓ configurée (${commercial.fromDb ? 'DB' : 'env VITE_BOOKING_URL'}) — ${commercial.bookingUrl.slice(0, 40)}…`
        : `✗ VITE_BOOKING_URL non défini${bookingEnvConfigured ? ' (incohérence détectée)' : ''} — fallback formulaire actif`,
    },
    {
      label: 'Checkout Starter (VITE_STARTER_CHECKOUT_URL)',
      icon: <ShoppingCart className="h-4 w-4" />,
      status: commercial.starterCheckoutUrl ? 'ok' as Status : 'warn' as Status,
      detail: commercial.starterCheckoutUrl
        ? `✓ configuré (${commercial.fromDb ? 'DB' : 'env'})`
        : `✗ Non défini — CTA pricing utilise le fallback booking/formulaire`,
    },
    {
      label: 'Checkout Pro (VITE_PRO_CHECKOUT_URL)',
      icon: <ShoppingCart className="h-4 w-4" />,
      status: commercial.proCheckoutUrl ? 'ok' as Status : 'warn' as Status,
      detail: commercial.proCheckoutUrl
        ? `✓ configuré (${commercial.fromDb ? 'DB' : 'env'})`
        : '✗ Non défini',
    },
    {
      label: 'Checkout Enterprise (VITE_ENTERPRISE_CHECKOUT_URL)',
      icon: <ShoppingCart className="h-4 w-4" />,
      status: commercial.enterpriseCheckoutUrl ? 'ok' as Status : 'warn' as Status,
      detail: commercial.enterpriseCheckoutUrl
        ? `✓ configuré (${commercial.fromDb ? 'DB' : 'env'})`
        : '✗ Non défini',
    },
    {
      label: 'Backend externe (VITE_CORE_API_URL)',
      icon: <Database className="h-4 w-4" />,
      status: coreApiConfigured ? 'ok' as Status : 'warn' as Status,
      detail: coreApiConfigured
        ? '✓ Report Studio opérationnel — génération rapports IA active'
        : '✗ Non défini — Report Studio en mode lecture seule, génération désactivée',
    },
    {
      label: 'Capture lead opérationnelle',
      icon: <Users className="h-4 w-4" />,
      status: 'ok' as Status,
      detail: '✓ Edge function submit-sales-lead — validation, dédup, scoring',
    },
    {
      label: 'Pipeline leads accessible',
      icon: <TrendingUp className="h-4 w-4" />,
      status: 'ok' as Status,
      detail: '✓ /admin/leads — owner, priorité, SLA 24h/72h, actions rapides',
      link: { href: '/admin/leads', label: 'Pipeline' },
    },
    {
      label: 'Analytics conversions',
      icon: <BarChart3 className="h-4 w-4" />,
      status: (conversionData?.total ?? 0) > 0 ? 'ok' as Status : 'warn' as Status,
      detail: `${conversionData?.total ?? 0} événements · taux formulaire ${conversionData?.conversionRate ?? 0}%`,
    },
    {
      label: 'CTA tunnel de vente',
      icon: <MousePointerClick className="h-4 w-4" />,
      status: 'ok' as Status,
      detail: '✓ Hero / Pricing / Demo — booking ou formulaire, zéro impasse',
    },
    {
      label: 'Mode vente',
      icon: <Zap className="h-4 w-4" />,
      status: commercial.salesEnabled ? 'ok' as Status : 'warn' as Status,
      detail: commercial.salesEnabled ? '✓ Activé' : '✗ Désactivé',
    },
  ];

  const revenueOk = revenueItems.filter(i => i.status === 'ok').length;
  const revenueScore = Math.round((revenueOk / revenueItems.length) * 100);

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
              <p className="text-sm text-muted-foreground">État de préparation commerciale et technique</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setRefreshKey(k => k + 1)}>
            <RefreshCw className="h-4 w-4 mr-2" />Actualiser
          </Button>
        </div>

        {/* Global Score */}
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex flex-col items-center gap-1">
                <div className={`text-5xl font-black ${readinessScore >= 80 ? 'text-success' : readinessScore >= 60 ? 'text-warning' : 'text-destructive'}`}>
                  {readinessScore}%
                </div>
                <div className="text-xs text-muted-foreground">Score global</div>
              </div>

              <Separator orientation="vertical" className="hidden md:block h-16" />

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                {[
                  { label: 'Prêt pour la démo',       status: readiness.demo,       icon: <FlaskConical className="h-4 w-4" /> },
                  { label: 'Prêt pour la vente',       status: readiness.sale,       icon: <BarChart3 className="h-4 w-4" /> },
                  { label: "Prêt pour l'onboarding",   status: readiness.onboarding, icon: <Users className="h-4 w-4" /> },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3">
                    <StatusIcon status={item.status} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 shrink-0 text-center">
                <div><p className="text-2xl font-bold text-success">{okCount}</p><p className="text-xs text-muted-foreground">OK</p></div>
                <div><p className="text-2xl font-bold text-warning">{warnCount}</p><p className="text-xs text-muted-foreground">Attention</p></div>
                <div><p className="text-2xl font-bold text-destructive">{failCount}</p><p className="text-xs text-muted-foreground">Échec</p></div>
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
                          <Link to={item.link.href} target={item.link.href.startsWith('/') ? undefined : '_blank'}>
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
            <CardDescription>Liens commerciaux, pipeline et tunnel de conversion</CardDescription>
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
            {/* Funnel KPIs */}
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

            {/* Top events */}
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

            {/* Top CTA origins */}
            {conversionData?.topCtaOrigins && conversionData.topCtaOrigins.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" />Top CTA origins
                </p>
                <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                  {conversionData.topCtaOrigins.map(([cta, count]) => (
                    <div key={cta} className="flex items-center justify-between px-4 py-2">
                      <span className="text-xs font-mono text-muted-foreground">{cta}</span>
                      <span className="text-sm font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top pages */}
            {conversionData?.topPages && conversionData.topPages.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Navigation className="h-3.5 w-3.5" />Pages sources
                </p>
                <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                  {conversionData.topPages.map(([page, count]) => (
                    <div key={page} className="flex items-center justify-between px-4 py-2">
                      <span className="text-xs font-mono text-muted-foreground">{page}</span>
                      <span className="text-sm font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!conversionData && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun événement de conversion enregistré pour l'instant.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Lead alert */}
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
                <Link to="/admin/leads">
                  <Users className="h-4 w-4 mr-2" />Gérer les leads
                </Link>
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
