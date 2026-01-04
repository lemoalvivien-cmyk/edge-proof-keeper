import { useQuery } from '@tanstack/react-query';
import { 
  Shield, 
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Scan, Asset } from '@/types/database';

export default function DashboardTechnical() {
  const { organization } = useAuth();

  // Fetch recent scans with findings
  const { data: recentScans } = useQuery({
    queryKey: ['recent-scans', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('scans')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(10);
      return (data ?? []) as Scan[];
    },
    enabled: !!organization?.id,
  });

  // Fetch assets by risk level
  const { data: assets } = useQuery({
    queryKey: ['assets-by-risk', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('assets')
        .select('*')
        .eq('organization_id', organization.id)
        .order('risk_level', { ascending: true });
      return (data ?? []) as Asset[];
    },
    enabled: !!organization?.id,
  });

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'critical': return <AlertCircle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Info className="h-4 w-4" />;
      default: return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  const criticalAssets = assets?.filter(a => a.risk_level === 'critical' || a.risk_level === 'high') ?? [];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vue Technique</h1>
          <p className="text-muted-foreground">
            Détails des vulnérabilités, actifs à risque et actions de remédiation.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          {['critical', 'high', 'medium', 'low'].map(level => {
            const count = recentScans?.reduce((sum, scan) => {
              switch (level) {
                case 'critical': return sum + (scan.critical_count ?? 0);
                case 'high': return sum + (scan.high_count ?? 0);
                case 'medium': return sum + (scan.medium_count ?? 0);
                case 'low': return sum + (scan.low_count ?? 0);
                default: return sum;
              }
            }, 0) ?? 0;

            return (
              <Card key={level}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium capitalize">{level}</CardTitle>
                  {getRiskIcon(level)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{count}</div>
                  <p className="text-xs text-muted-foreground">vulnérabilités</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="findings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="findings">Résultats de Scans</TabsTrigger>
            <TabsTrigger value="assets">Actifs à Risque</TabsTrigger>
            <TabsTrigger value="remediation">Remédiation</TabsTrigger>
          </TabsList>

          <TabsContent value="findings">
            <Card>
              <CardHeader>
                <CardTitle>Derniers Scans</CardTitle>
                <CardDescription>
                  Résultats des analyses de sécurité récentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {recentScans?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">Aucun scan effectué</p>
                      <p className="text-sm text-muted-foreground">
                        Lancez votre premier scan pour voir les résultats ici
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentScans?.map(scan => (
                        <div
                          key={scan.id}
                          className="flex items-center justify-between rounded-lg border p-4"
                        >
                          <div className="space-y-1">
                            <p className="font-medium capitalize">
                              {scan.scan_type.replace('_', ' ')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(scan.created_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {scan.critical_count > 0 && (
                              <Badge variant="destructive">
                                {scan.critical_count} critique(s)
                              </Badge>
                            )}
                            {scan.high_count > 0 && (
                              <Badge variant="destructive">
                                {scan.high_count} élevée(s)
                              </Badge>
                            )}
                            {scan.medium_count > 0 && (
                              <Badge variant="secondary">
                                {scan.medium_count} moyenne(s)
                              </Badge>
                            )}
                            <Badge variant="outline">{scan.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assets">
            <Card>
              <CardHeader>
                <CardTitle>Actifs à Risque Élevé</CardTitle>
                <CardDescription>
                  Systèmes nécessitant une attention prioritaire
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {criticalAssets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                      <p className="text-lg font-medium">Aucun actif critique</p>
                      <p className="text-sm text-muted-foreground">
                        Tous vos actifs sont dans un état acceptable
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {criticalAssets.map(asset => (
                        <div
                          key={asset.id}
                          className="flex items-center justify-between rounded-lg border p-4"
                        >
                          <div className="space-y-1">
                            <p className="font-medium">{asset.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {asset.asset_type} • {asset.identifier ?? 'N/A'}
                            </p>
                          </div>
                          <Badge variant={getRiskBadgeVariant(asset.risk_level)}>
                            {asset.risk_level}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="remediation">
            <Card>
              <CardHeader>
                <CardTitle>Actions de Remédiation</CardTitle>
                <CardDescription>
                  Étapes recommandées pour améliorer votre posture
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">Mettre à jour les systèmes critiques</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Appliquez les derniers correctifs de sécurité sur les serveurs identifiés comme critiques.
                        </p>
                        <a
                          href="https://nvd.nist.gov/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary mt-2 hover:underline"
                        >
                          Voir CVE <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">Renforcer les politiques d'accès</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Implémentez l'authentification multi-facteur (MFA) sur tous les comptes administrateurs.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">Documenter les procédures</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Complétez la documentation de réponse aux incidents pour conformité NIS2.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
