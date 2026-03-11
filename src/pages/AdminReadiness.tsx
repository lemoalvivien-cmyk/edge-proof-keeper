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
} from 'lucide-react';
import { Link } from 'react-router-dom';

type Status = 'ok' | 'warn' | 'fail' | 'unknown';

function StatusIcon({ status }: { status: Status }) {
  if (status === 'ok') return <CheckCircle2 className="h-5 w-5 text-success" />;
  if (status === 'warn') return <AlertTriangle className="h-5 w-5 text-warning" />;
  if (status === 'fail') return <XCircle className="h-5 w-5 text-destructive" />;
  return <div className="h-5 w-5 rounded-full border-2 border-muted animate-pulse" />;
}

function StatusBadge({ status }: { status: Status }) {
  const cfg: Record<Status, { label: string; className: string }> = {
    ok:      { label: 'OK',       className: 'bg-success/10 text-success border-success/30' },
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

  const coreApiConfigured = Boolean(import.meta.env.VITE_CORE_API_URL);

  // Platform health
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['platform-health-readiness', organization?.id, refreshKey],
    queryFn: () => getPlatformHealth(organization?.id),
    enabled: !!organization?.id,
    retry: 1,
  });

  // Lead counts
  const { data: leadCount } = useQuery({
    queryKey: ['sales-leads-count', refreshKey],
    queryFn: async () => {
      const { count } = await supabase
        .from('sales_leads')
        .select('*', { count: 'exact', head: true });
      return count ?? 0;
    },
  });

  const { data: newLeadCount } = useQuery({
    queryKey: ['sales-leads-new-count', refreshKey],
    queryFn: async () => {
      const { count } = await supabase
        .from('sales_leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new');
      return count ?? 0;
    },
  });

  // Signal/risk counts
  const { data: signalCount } = useQuery({
    queryKey: ['signal-count', organization?.id, refreshKey],
    queryFn: async () => {
      if (!organization?.id) return 0;
      const { count } = await supabase
        .from('signals')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id);
      return count ?? 0;
    },
    enabled: !!organization?.id,
  });

  const { data: riskCount } = useQuery({
    queryKey: ['risk-count', organization?.id, refreshKey],
    queryFn: async () => {
      if (!organization?.id) return 0;
      const { count } = await supabase
        .from('risk_register')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .eq('status', 'open');
      return count ?? 0;
    },
    enabled: !!organization?.id,
  });

  const healthOk = !healthLoading && !!health;

  const groups: CheckGroup[] = [
    {
      title: 'Infrastructure & Backend',
      icon: <Database className="h-5 w-5 text-primary" />,
      items: [
        {
          label: 'Base de données Lovable Cloud',
          description: 'Connexion Supabase active',
          status: healthOk ? 'ok' : healthLoading ? 'unknown' : 'fail',
          detail: healthOk ? `${health?.org_counts?.open_signals ?? 0} signaux · ${health?.org_counts?.open_risks ?? 0} risques ouverts` : undefined,
        },
        {
          label: 'Backend externe (VITE_CORE_API_URL)',
          description: 'Proxy IA pour Report Studio',
          status: coreApiConfigured ? 'ok' : 'warn',
          detail: coreApiConfigured ? 'Configuré' : 'Non configuré — Report Studio en mode lecture seule',
        },
        {
          label: 'IA moteur interne (Lovable API)',
          description: 'Analyse de signaux et remédiation IA',
          status: 'ok',
          detail: "LOVABLE_API_KEY present -- pret a l'emploi",
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
          status: (signalCount !== undefined && riskCount !== undefined) ? 'ok' : 'unknown',
          detail: `${signalCount ?? '…'} signaux · ${riskCount ?? '…'} risques ouverts`,
        },
      ],
    },
    {
      title: 'Capture de leads & Commercial',
      icon: <Users className="h-5 w-5 text-primary" />,
      items: [
        {
          label: 'Formulaire de demande de démo',
          description: 'Capture de prospects depuis la landing',
          status: 'ok',
          detail: `Table sales_leads opérationnelle`,
        },
        {
          label: 'Leads reçus',
          description: 'Demandes de démonstration',
          status: (leadCount ?? 0) > 0 ? 'ok' : 'warn',
          detail: `${leadCount ?? '…'} leads total · ${newLeadCount ?? '…'} nouveaux`,
        },
      ],
    },
    {
      title: 'Navigation & Expérience',
      icon: <Navigation className="h-5 w-5 text-primary" />,
      items: [
        {
          label: 'Navigation principale',
          description: 'Sidebar et routes applicatives',
          status: 'ok',
          detail: 'Tableaux de bord, Opérations, Audit, Administration',
        },
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
      ],
    },
  ];

  const allItems = groups.flatMap(g => g.items);
  const okCount = allItems.filter(i => i.status === 'ok').length;
  const warnCount = allItems.filter(i => i.status === 'warn').length;
  const failCount = allItems.filter(i => i.status === 'fail').length;
  const total = allItems.length;
  const readinessScore = Math.round((okCount / total) * 100);

  const globalStatus: Status =
    failCount > 0 ? 'fail' :
    warnCount > 0 ? 'warn' : 'ok';

  const readinessLabels: Record<string, { demo: Status; sale: Status; onboarding: Status }> = {
    fail:    { demo: 'fail',    sale: 'fail',    onboarding: 'fail' },
    warn:    { demo: 'ok',      sale: 'warn',    onboarding: 'warn' },
    ok:      { demo: 'ok',      sale: 'ok',       onboarding: coreApiConfigured ? 'ok' : 'warn' },
  };
  const readiness = readinessLabels[globalStatus];

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
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>

        {/* Readiness Score */}
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Score circle */}
              <div className="flex flex-col items-center gap-1">
                <div className={`text-5xl font-black ${readinessScore >= 80 ? 'text-success' : readinessScore >= 60 ? 'text-warning' : 'text-destructive'}`}>
                  {readinessScore}%
                </div>
                <div className="text-xs text-muted-foreground">Score global</div>
              </div>

              <Separator orientation="vertical" className="hidden md:block h-16" />

              {/* Checklist */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                {[
                  { label: 'Prêt pour la démo', status: readiness.demo, icon: <FlaskConical className="h-4 w-4" /> },
                  { label: 'Prêt pour la vente', status: readiness.sale, icon: <BarChart3 className="h-4 w-4" /> },
                  { label: 'Prêt pour l\'onboarding', status: readiness.onboarding, icon: <Users className="h-4 w-4" /> },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3">
                    <StatusIcon status={item.status as Status} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <StatusBadge status={item.status as Status} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Counts */}
              <div className="flex gap-4 shrink-0 text-center">
                <div>
                  <p className="text-2xl font-bold text-success">{okCount}</p>
                  <p className="text-xs text-muted-foreground">OK</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-warning">{warnCount}</p>
                  <p className="text-xs text-muted-foreground">Attention</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">{failCount}</p>
                  <p className="text-xs text-muted-foreground">Échec</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Groups */}
        {groups.map(group => (
          <Card key={group.title}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {group.icon}
                {group.title}
              </CardTitle>
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
                        {item.detail && (
                          <p className="text-xs text-muted-foreground/70 mt-0.5 font-mono">{item.detail}</p>
                        )}
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

        {/* Lead capture status */}
        {(leadCount ?? 0) > 0 && (
          <Card className="border-success/30 bg-success/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-success" />
                Leads commerciaux
              </CardTitle>
              <CardDescription>
                {newLeadCount} nouveau{(newLeadCount ?? 0) > 1 ? 'x' : ''} lead{(newLeadCount ?? 0) > 1 ? 's' : ''} en attente de traitement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                <strong>{leadCount} demande{(leadCount ?? 0) > 1 ? 's' : ''}</strong> reçue{(leadCount ?? 0) > 1 ? 's' : ''} via le formulaire de démonstration.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Loading state */}
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
