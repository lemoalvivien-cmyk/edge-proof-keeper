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
} from 'lucide-react';
import { useState } from 'react';
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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export default function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { organization, profile } = useAuth();
  const { data: findingCounts } = useFindingCounts();
  const { data: topFindings = [] } = useTopPriorityFindings(5);
  const { data: taskCounts } = useTaskCounts();

  // Pipeline live proof state
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineState, setPipelineState] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [pipelineMsg, setPipelineMsg] = useState<string | null>(null);

  // Fetch compliance stats
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

  // Fetch asset count
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

  // Pipeline proof status (DB state)
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
  });

  // Quick E2E pipeline launcher (uses seed path for speed)
  const handleQuickPipeline = async () => {
    if (!organization?.id || pipelineRunning) return;
    setPipelineRunning(true);
    setPipelineState('running');
    setPipelineMsg('Injection du scénario [DEMO]…');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Session expirée');
      const tok = session.access_token;

      // Step 1: seed demo run
      const seedRes = await fetch(`${SUPABASE_URL}/functions/v1/seed-demo-run`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({ organization_id: organization.id }),
      });
      const seedJson = await seedRes.json();
      if (!seedRes.ok || !seedJson.tool_run_id) throw new Error(seedJson?.error ?? `HTTP ${seedRes.status}`);
      setPipelineMsg(`Run créé (${seedJson.findings_inserted} findings). Génération synthèse…`);

      // Step 2: portfolio summary
      await generatePortfolioSummary(organization.id, 'executive_brief');

      setPipelineState('done');
      setPipelineMsg(`✓ ${seedJson.findings_inserted} findings [DEMO] en DB · synthèse executive générée · pipeline prouvé`);
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
    return 'text-red-600';
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

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vue Direction</h1>
            <p className="text-muted-foreground">
              Bienvenue, {profile?.full_name ?? 'Utilisateur'}. Voici l'état de votre posture cyber.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard/technical')}>
            Vue Technique
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Risk Score */}
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

          {/* Findings Count */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Findings Ouverts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{findingCounts?.total ?? 0}</div>
              <div className="flex gap-2 mt-2">
                {(findingCounts?.critical ?? 0) > 0 && (
                  <Badge variant="destructive">{findingCounts?.critical} critiques</Badge>
                )}
                {(findingCounts?.high ?? 0) > 0 && (
                  <Badge className="bg-orange-500">{findingCounts?.high} élevés</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Compliance */}
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

          {/* Assets */}
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
            <CardDescription>
              Findings critiques et élevés nécessitant une action immédiate
            </CardDescription>
          </CardHeader>
          <CardContent>
          {topFindings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-success" />
                <p className="mb-4">Aucun finding critique ou élevé à traiter</p>
                <Button variant="outline" size="sm" onClick={() => navigate('/tools')} className="gap-2">
                  <Zap className="h-4 w-4" />
                  Importer un scan
                </Button>
              </div>
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
            <CardDescription>
              Suivi des actions correctives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="font-bold">{taskCounts?.open ?? 0}</span>
                <span className="text-muted-foreground">ouvertes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="font-bold">{taskCounts?.in_progress ?? 0}</span>
                <span className="text-muted-foreground">en cours</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span className="font-bold text-destructive">{taskCounts?.overdue ?? 0}</span>
                <span className="text-muted-foreground">en retard</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="font-bold">{taskCounts?.done ?? 0}</span>
                <span className="text-muted-foreground">terminées</span>
              </div>
            </div>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/tasks')}>
              Voir toutes les tâches
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Status Summary */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Statut Opérationnel
              </CardTitle>
              <CardDescription>
                État de votre plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 text-green-600">
                <CheckCircle2 className="h-6 w-6" />
                <div>
                  <p className="font-medium">Plateforme active</p>
                  <p className="text-sm text-muted-foreground">
                    Prêt pour les opérations
                  </p>
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
              <CardDescription>
                Points clés à retenir
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <p className="text-sm">
                  {criticalHighCount > 0 
                    ? `${criticalHighCount} finding(s) critique(s)/élevé(s) à traiter en priorité`
                    : 'Aucun finding critique ou élevé'
                  }
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <p className="text-sm">
                  Conformité globale à {complianceStats?.percentage ?? 0}% pour GDPR/NIS2
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <p className="text-sm">
                  {assetCount ?? 0} actif(s) sous surveillance active
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}