import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp,
  FileCheck,
  Server,
  Scan as ScanIcon,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthorization } from '@/hooks/useAuthorization';
import { useFindingCounts, useTopPriorityFindings } from '@/hooks/useFindings';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function Dashboard() {
  const navigate = useNavigate();
  const { organization, profile } = useAuth();
  const { hasValidAuthorization } = useAuthorization();
  const { data: findingCounts } = useFindingCounts();
  const { data: topFindings = [] } = useTopPriorityFindings(5);

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

        {/* Authorization Warning */}
        {!hasValidAuthorization && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Aucune autorisation active</p>
                <p className="text-sm text-muted-foreground">
                  Vous devez créer une autorisation avant de pouvoir effectuer des scans ou imports.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

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
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>Aucun finding critique ou élevé à traiter</p>
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

        {/* Status Summary */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Statut des Autorisations
              </CardTitle>
              <CardDescription>
                État de vos autorisations légales
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasValidAuthorization ? (
                <div className="flex items-center gap-3 text-green-600">
                  <CheckCircle2 className="h-6 w-6" />
                  <div>
                    <p className="font-medium">Autorisation active</p>
                    <p className="text-sm text-muted-foreground">
                      Vous pouvez effectuer des opérations
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-destructive">
                  <AlertTriangle className="h-6 w-6" />
                  <div>
                    <p className="font-medium">Aucune autorisation valide</p>
                    <p className="text-sm text-muted-foreground">
                      Action requise avant tout scan
                    </p>
                  </div>
                </div>
              )}
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
