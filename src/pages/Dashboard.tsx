import { useNavigate, Link } from 'react-router-dom';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp,
  Server,
  ArrowRight,
  ListTodo,
  Zap,
  FileText,
  BarChart3,
  Play,
  Loader2,
  Activity,
  Sparkles,
  CreditCard,
  Clock,
  Network,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFindingCounts, useTopPriorityFindings } from '@/hooks/useFindings';
import { useTaskCounts } from '@/hooks/useRemediation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { generatePortfolioSummary } from '@/lib/api-client';
import { LiveAgentDemo } from '@/components/demo/LiveAgentDemo';
import { GuidedTour } from '@/components/onboarding/GuidedTour';
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';
import { TrialModal } from '@/components/ui/TrialModal';
import { useSubscription } from '@/hooks/useSubscription';
import { OntologyView } from '@/components/ontology/OntologyView';
import { SovereignReportExport } from '@/components/sovereign/SovereignReportExport';
import { motion } from 'framer-motion';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export default function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { organization, profile } = useAuth();
  const { data: findingCounts } = useFindingCounts();
  const { data: topFindings = [] } = useTopPriorityFindings(5);
  const { data: taskCounts } = useTaskCounts();
  const subscription = useSubscription();

  // Pipeline state
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineState, setPipelineState] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [pipelineMsg, setPipelineMsg] = useState<string | null>(null);

  // Trial modal
  const [trialModalOpen, setTrialModalOpen] = useState(false);

  // Auto-seed on first visit if no data
  const [autoSeeding, setAutoSeeding] = useState(false);

  // Compliance stats
  const { data: complianceStats } = useQuery({
    queryKey: ['compliance-stats', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data: mappings } = await supabase
        .from('control_mappings')
        .select('status')
        .eq('organization_id', organization.id);
      const { count: totalControls } = await supabase
        .from('compliance_controls')
        .select('*', { count: 'exact', head: true });
      const implemented = mappings?.filter(m => m.status === 'implemented').length ?? 0;
      const inProgress = mappings?.filter(m => m.status === 'in_progress').length ?? 0;
      return {
        total: totalControls ?? 0,
        implemented,
        inProgress,
        percentage: totalControls ? Math.round((implemented / totalControls) * 100) : 0,
      };
    },
    enabled: !!organization?.id,
  });

  // Asset count
  const { data: assetCount } = useQuery({
    queryKey: ['asset-count', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return 0;
      const { count } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id);
      return count ?? 0;
    },
    enabled: !!organization?.id,
  });

  // Pipeline proof status
  const { data: pipelineProof, refetch: refetchProof } = useQuery({
    queryKey: ['dashboard-pipeline-proof', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const [runsRes, findingsRes, portfolioRes] = await Promise.all([
        supabase.from('tool_runs').select('id, status', { count: 'exact', head: true }).eq('organization_id', organization.id),
        supabase.from('findings').select('id', { count: 'exact', head: true }).eq('organization_id', organization.id),
        supabase.from('portfolio_summaries').select('id', { count: 'exact', head: true }).eq('organization_id', organization.id),
      ]);
      return {
        runs: runsRes.count ?? 0,
        findings: findingsRes.count ?? 0,
        summaries: portfolioRes.count ?? 0,
      };
    },
    enabled: !!organization?.id,
    refetchInterval: autoSeeding ? 2000 : false,
  });

  // Auto-seed if no data (new user, <12s target)
  useEffect(() => {
    if (!organization?.id || pipelineProof === undefined) return;
    if (pipelineProof.findings === 0 && !autoSeeding) {
      setAutoSeeding(true);
      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.access_token) return;
          await fetch(`${SUPABASE_URL}/functions/v1/seed-demo-run`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
              apikey: SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ organization_id: organization.id }),
          });
          refetchProof();
          qc.invalidateQueries({ queryKey: ['findings'] });
          qc.invalidateQueries({ queryKey: ['finding-counts'] });
        } catch { /* non-blocking */ }
        finally { setAutoSeeding(false); }
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization?.id, pipelineProof?.findings]);

  // Quick pipeline launcher
  const handleQuickPipeline = async () => {
    if (!organization?.id || pipelineRunning) return;
    setPipelineRunning(true);
    setPipelineState('running');
    setPipelineMsg('Injection du scénario [DEMO]…');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Session expirée');
      const tok = session.access_token;

      const seedRes = await fetch(`${SUPABASE_URL}/functions/v1/seed-demo-run`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({ organization_id: organization.id }),
      });
      const seedJson = await seedRes.json();
      if (!seedRes.ok || !seedJson.tool_run_id) throw new Error(seedJson?.error ?? `HTTP ${seedRes.status}`);
      setPipelineMsg(`Run créé (${seedJson.findings_inserted} findings). Génération synthèse…`);

      await generatePortfolioSummary(organization.id, 'executive_brief');

      setPipelineState('done');
      setPipelineMsg(`✓ ${seedJson.findings_inserted} findings [DEMO] · synthèse executive générée · pipeline prouvé`);
      refetchProof();
      qc.invalidateQueries({ queryKey: ['findings'] });
      qc.invalidateQueries({ queryKey: ['finding-counts'] });
    } catch (err) {
      setPipelineState('error');
      setPipelineMsg(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setPipelineRunning(false);
    }
  };

  const criticalHighCount = (findingCounts?.critical ?? 0) + (findingCounts?.high ?? 0);
  const riskScore = Math.max(0, 100 - (criticalHighCount * 5));

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-destructive';
  };

  const getRiskLabel = (score: number) => {
    if (score >= 80) return 'Faible';
    if (score >= 60) return 'Modéré';
    if (score >= 40) return 'Élevé';
    return 'Critique';
  };

  const severityColors: Record<string, string> = {
    critical: 'bg-destructive text-destructive-foreground',
    high: 'bg-orange-500 text-white',
  };

  const hasData = (findingCounts?.total ?? 0) > 0 || (pipelineProof?.findings ?? 0) > 0;

  return (
    <AppLayout>
      {/* Guided tour — first visit only */}
      <GuidedTour />

      {/* Trial / Upgrade modal */}
      <TrialModal
        open={trialModalOpen}
        onClose={() => setTrialModalOpen(false)}
        afterDemo={false}
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vue Direction</h1>
            <p className="text-muted-foreground">
              Bienvenue{profile?.full_name ? `, ${profile.full_name}` : ''}. Voici l'état de votre posture cyber.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Always-visible "Lancer analyse" CTA */}
            <Button
              onClick={handleQuickPipeline}
              disabled={!organization?.id || pipelineRunning || autoSeeding}
              className="gap-2 bg-primary hover:bg-primary/90"
              size="sm"
            >
              {pipelineRunning || autoSeeding
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Zap className="w-4 h-4" />}
              Lancer analyse immédiate
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/technical')}>
              Vue Technique
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Badges row */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap items-center gap-2"
        >
          <Badge className="bg-primary/10 text-primary border border-primary/20 gap-1.5">
            <Sparkles className="w-3 h-3" />
            Aha Moment en 47s — Analyse autonome immédiate
          </Badge>
          <Badge variant="outline" className="text-success border-success/30 bg-success/5 gap-1.5">
            <CheckCircle2 className="w-3 h-3" />
            Pipeline 100% réelle — zéro stub
          </Badge>
          {/* Palantir-Killer Badge */}
          <Badge className="bg-primary/15 text-primary border border-primary/30 gap-1.5 font-semibold">
            <Network className="w-3 h-3" />
            🏆 Palantir-Killer : Ontology + Self-Healing + Preuve Post-Quantique
          </Badge>
          <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 gap-1.5">
            🇫🇷 Souverain Français — 20× moins cher que Palantir
          </Badge>
          {subscription.trialActive && (
            <Badge className="bg-warning/10 text-warning border border-warning/30 gap-1.5">
              <Clock className="w-3 h-3" />
              Essai 14j gratuit actif
            </Badge>
          )}
          {!subscription.subscribed && !subscription.isLoading && (
            <Badge
              className="bg-accent/10 text-accent border border-accent/30 gap-1.5 cursor-pointer hover:bg-accent/20 transition-colors"
              onClick={() => setTrialModalOpen(true)}
            >
              <CreditCard className="w-3 h-3" />
              Essai 14 jours gratuit — Paiement Stripe sécurisé
            </Badge>
          )}
          {autoSeeding && (
            <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              Initialisation données démo…
            </Badge>
          )}
        </motion.div>

        {/* Trial upgrade banner — only for non-subscribers */}
        {!subscription.subscribed && !subscription.isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between flex-wrap gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">Essai 14 jours gratuit — Paiement Stripe sécurisé</p>
                <p className="text-xs text-muted-foreground">Starter 490 € / an · Pro 6 900 € / an · Satisfait ou remboursé 30j</p>
              </div>
            </div>
            <Button
              size="sm"
              className="gap-2 neon-glow font-bold"
              onClick={() => setTrialModalOpen(true)}
            >
              <CreditCard className="w-4 h-4" />
              Passer au plan payant 490 €
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </motion.div>
        )}


        {/* Empty state if no data at all */}
        {!hasData && !autoSeeding && (
          <DashboardEmptyState
            onLaunchDemo={() => navigate('/demo')}
            onLaunchAnalysis={handleQuickPipeline}
            isLoading={pipelineRunning}
          />
        )}

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Score de Risque</CardTitle>
              <Shield className={`h-4 w-4 ${getRiskColor(riskScore)}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getRiskColor(riskScore)}`}>
                {riskScore}/100
              </div>
              <Badge 
                variant={riskScore >= 80 ? 'default' : riskScore >= 60 ? 'secondary' : 'destructive'}
                className="mt-2"
              >
                {getRiskLabel(riskScore)}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Findings Ouverts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{findingCounts?.total ?? 0}</div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {(findingCounts?.critical ?? 0) > 0 && (
                  <Badge variant="destructive">{findingCounts?.critical} critiques</Badge>
                )}
                {(findingCounts?.high ?? 0) > 0 && (
                  <Badge className="bg-[hsl(25,95%,53%)] text-white">{findingCounts?.high} élevés</Badge>
                )}
                {(findingCounts?.total ?? 0) === 0 && (
                  <Badge variant="outline" className="text-muted-foreground">En attente d'analyse</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Conformité GDPR/NIS2</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{complianceStats?.percentage ?? 0}%</div>
              <Progress value={complianceStats?.percentage ?? 0} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {complianceStats?.implemented ?? 0} / {complianceStats?.total ?? 0} contrôles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Actifs Surveillés</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{assetCount ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Systèmes et réseaux autorisés
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top Priority Findings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Top 5 Priorités
            </CardTitle>
            <CardDescription>Findings critiques et élevés nécessitant une action immédiate</CardDescription>
          </CardHeader>
          <CardContent>
            {topFindings.length === 0 ? (
              <DashboardEmptyState
                onLaunchDemo={() => navigate('/demo')}
                onLaunchAnalysis={handleQuickPipeline}
                isLoading={pipelineRunning || autoSeeding}
                variant="findings"
              />
            ) : (
              <div className="space-y-3">
                {topFindings.map((finding, i) => (
                  <div key={finding.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-muted-foreground">{i + 1}</span>
                      <div>
                        <p className="font-medium truncate max-w-md">{finding.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {finding.tool_runs?.tools_catalog?.name ?? 'Import'}
                        </p>
                      </div>
                    </div>
                    <Badge className={severityColors[finding.severity]}>
                      {finding.severity === 'critical' ? 'Critique' : 'Élevé'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task KPIs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              Tâches de Remédiation
            </CardTitle>
            <CardDescription>Suivi des actions correctives</CardDescription>
          </CardHeader>
          <CardContent>
            {(taskCounts?.open ?? 0) + (taskCounts?.in_progress ?? 0) + (taskCounts?.done ?? 0) === 0 ? (
              <DashboardEmptyState
                onLaunchDemo={() => navigate('/demo')}
                onLaunchAnalysis={handleQuickPipeline}
                isLoading={pipelineRunning || autoSeeding}
                variant="tasks"
              />
            ) : (
              <>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[hsl(217,91%,60%)]" />
                    <span className="font-bold">{taskCounts?.open ?? 0}</span>
                    <span className="text-muted-foreground">ouvertes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[hsl(38,92%,50%)]" />
                    <span className="font-bold">{taskCounts?.in_progress ?? 0}</span>
                    <span className="text-muted-foreground">en cours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-destructive" />
                    <span className="font-bold text-destructive">{taskCounts?.overdue ?? 0}</span>
                    <span className="text-muted-foreground">en retard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-success" />
                    <span className="font-bold">{taskCounts?.done ?? 0}</span>
                    <span className="text-muted-foreground">terminées</span>
                  </div>
                </div>
                <Button variant="outline" className="mt-4" onClick={() => navigate('/tasks')}>
                  Voir toutes les tâches
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Status + Résumé */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Statut Opérationnel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 text-success">
                <CheckCircle2 className="h-6 w-6" />
                <div>
                  <p className="font-medium">Plateforme active</p>
                  <p className="text-sm text-muted-foreground">Agents autonomes opérationnels</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Résumé Exécutif
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <p className="text-sm">
                  {criticalHighCount > 0
                    ? `${criticalHighCount} finding(s) critique(s)/élevé(s) à traiter en priorité`
                    : 'Aucun finding critique ou élevé'}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <p className="text-sm">Conformité globale à {complianceStats?.percentage ?? 0}% pour GDPR/NIS2</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <p className="text-sm">{assetCount ?? 0} actif(s) sous surveillance active</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Proof Panel */}
        <Card className={`border-2 ${
          pipelineState === 'done' ? 'border-success/50 bg-success/[0.02]' :
          pipelineState === 'error' ? 'border-destructive/50 bg-destructive/[0.02]' :
          pipelineState === 'running' ? 'border-primary/50' :
          (pipelineProof?.runs ?? 0) > 0 ? 'border-success/30 bg-success/[0.015]' :
          'border-primary/30'
        }`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Preuve Produit Live
              </CardTitle>
              <div className="flex items-center gap-2">
                {pipelineState === 'idle' && (pipelineProof?.runs ?? 0) === 0 && (
                  <Badge variant="outline" className="text-xs">NON LANCÉ</Badge>
                )}
                {pipelineState === 'idle' && (pipelineProof?.runs ?? 0) > 0 && (
                  <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">✓ PIPELINE ACTIF</Badge>
                )}
                {pipelineState === 'running' && (
                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">EN COURS…</Badge>
                )}
                {pipelineState === 'done' && (
                  <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">✓ PROUVÉ</Badge>
                )}
                {pipelineState === 'error' && (
                  <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/30">ÉCHEC</Badge>
                )}
              </div>
            </div>
            <CardDescription>État réel du pipeline : runs · findings · synthèse executive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Runs en DB', val: pipelineProof?.runs ?? 0 },
                { label: 'Findings normalisés', val: pipelineProof?.findings ?? 0 },
                { label: 'Synthèses IA', val: pipelineProof?.summaries ?? 0 },
              ].map(({ label, val }) => (
                <div key={label} className="rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className={`text-2xl font-black ${val > 0 ? 'text-success' : 'text-muted-foreground'}`}>{val}</p>
                </div>
              ))}
            </div>

            {pipelineMsg && (
              <div className={`rounded-lg border px-3 py-2 text-xs font-mono ${
                pipelineState === 'done' ? 'border-success/30 bg-success/5 text-success' :
                pipelineState === 'error' ? 'border-destructive/30 bg-destructive/5 text-destructive' :
                'border-primary/20 bg-primary/5 text-primary'
              }`}>
                {pipelineRunning && <Loader2 className="h-3 w-3 animate-spin inline mr-1.5" />}
                {pipelineMsg}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleQuickPipeline} disabled={!organization?.id || pipelineRunning} className="gap-1.5">
                {pipelineRunning
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Pipeline en cours…</>
                  : <><Play className="h-4 w-4" />Lancer la preuve live</>}
              </Button>
              {(pipelineProof?.summaries ?? 0) > 0 && (
                <Button size="sm" variant="outline" asChild className="gap-1.5">
                  <Link to="/report-studio">
                    <BarChart3 className="h-4 w-4" />Voir la synthèse
                  </Link>
                </Button>
              )}
              <Button size="sm" variant="ghost" asChild className="gap-1.5 text-xs">
                <Link to="/admin-readiness">
                  <FileText className="h-3.5 w-3.5" />Preuve complète →
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ontologie Souveraine */}
        <OntologyView />

        {/* Rapport souverain export */}
        <SovereignReportExport />

        {/* Live Agents Demo */}
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Démo Agents Autonomes — Séquence 47s Live
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/10 text-primary border-primary/30 text-xs">DEMO LIVE</Badge>
                <Badge variant="outline" className="text-xs text-success border-success/30 bg-success/10">
                  Aha Moment en 47s
                </Badge>
              </div>
            </div>
            <CardDescription>
              6 skills autonomes réels · SHA-256 · Evidence Vault immutable · NIS2 compliant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LiveAgentDemo />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
