import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useFindingCounts, useFindings } from "@/hooks/useFindings";
import type { RiskLevel, FindingStatus } from "@/types/findings";
import { 
  AlertTriangle, 
  ShieldAlert, 
  Shield, 
  Info, 
  TrendingUp, 
  Filter,
  RefreshCw,
  ExternalLink,
  AlertCircle
} from "lucide-react";

const SEVERITY_CONFIG = {
  critical: { label: "Critique", color: "bg-red-500", icon: AlertCircle, textColor: "text-red-600" },
  high: { label: "Élevé", color: "bg-orange-500", icon: ShieldAlert, textColor: "text-orange-600" },
  medium: { label: "Moyen", color: "bg-yellow-500", icon: AlertTriangle, textColor: "text-yellow-600" },
  low: { label: "Faible", color: "bg-blue-500", icon: Shield, textColor: "text-blue-600" },
  info: { label: "Info", color: "bg-slate-400", icon: Info, textColor: "text-slate-600" },
};

const STATUS_OPTIONS = [
  { value: "all", label: "Tous les statuts" },
  { value: "open", label: "Ouverts" },
  { value: "acknowledged", label: "Acceptés" },
  { value: "remediated", label: "Remédiés" },
  { value: "false_positive", label: "Faux positifs" },
];

export default function Risks() {
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { data: counts, isLoading: countsLoading, refetch: refetchCounts } = useFindingCounts();
  
  const filters = useMemo(() => ({
    severity: severityFilter !== "all" ? severityFilter as RiskLevel : undefined,
    status: statusFilter !== "all" ? statusFilter as FindingStatus : undefined,
  }), [severityFilter, statusFilter]);
  
  const { data: findings, isLoading: findingsLoading, refetch: refetchFindings } = useFindings(filters);

  const handleRefresh = () => {
    refetchCounts();
    refetchFindings();
  };

  const totalFindings = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;
  const openCriticalHigh = (counts?.critical || 0) + (counts?.high || 0);

  // Group findings by category for top categories
  const categoryCounts = useMemo(() => {
    if (!findings) return [];
    const categoryMap = new Map<string, number>();
    findings.forEach(f => {
      const cat = f.finding_type || 'unknown';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    });
    return Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [findings]);

  // Top assets by finding count
  const assetCounts = useMemo(() => {
    if (!findings) return [];
    const assetMap = new Map<string, { count: number; critical: number }>();
    findings.forEach(f => {
      const assetId = f.asset_id || 'non-attribué';
      const existing = assetMap.get(assetId) || { count: 0, critical: 0 };
      existing.count++;
      if (f.severity === 'critical' || f.severity === 'high') {
        existing.critical++;
      }
      assetMap.set(assetId, existing);
    });
    return Array.from(assetMap.entries())
      .sort((a, b) => b[1].critical - a[1].critical || b[1].count - a[1].count)
      .slice(0, 5);
  }, [findings]);

  return (
    <AppLayout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tableau des Risques</h1>
            <p className="text-muted-foreground">
              Vue consolidée des vulnérabilités et expositions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button asChild>
              <Link to="/findings">
                Voir tous les findings
                <ExternalLink className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {countsLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-8 w-12 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card className="border-l-4 border-l-foreground">
                <CardContent className="p-4">
                  <div className="text-3xl font-bold">{totalFindings}</div>
                  <div className="text-sm text-muted-foreground">Total findings</div>
                </CardContent>
              </Card>
              {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
                <Card key={key} className={`border-l-4`} style={{ borderLeftColor: `hsl(var(--${key === 'critical' ? 'destructive' : key === 'high' ? 'warning' : 'muted'}))` }}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <config.icon className={`h-5 w-5 ${config.textColor}`} />
                      <span className="text-2xl font-bold">{counts?.[key as keyof typeof counts] || 0}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{config.label}</div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>

        {/* Alert banner for critical/high */}
        {openCriticalHigh > 0 && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="py-4 flex items-center gap-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <div>
                <p className="font-medium text-destructive">
                  {openCriticalHigh} vulnérabilité{openCriticalHigh > 1 ? 's' : ''} critique{openCriticalHigh > 1 ? 's' : ''}/élevée{openCriticalHigh > 1 ? 's' : ''} ouverte{openCriticalHigh > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-muted-foreground">
                  Action requise dans les 7 jours selon les bonnes pratiques de sécurité
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <CardTitle className="text-base">Filtres</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="w-48">
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sévérité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes sévérités</SelectItem>
                    {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(severityFilter !== "all" || statusFilter !== "all") && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => { setSeverityFilter("all"); setStatusFilter("all"); }}
                >
                  Réinitialiser
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Two columns: Top Categories + Top Assets */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top 5 Catégories
              </CardTitle>
              <CardDescription>Types de vulnérabilités les plus fréquents</CardDescription>
            </CardHeader>
            <CardContent>
              {findingsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : categoryCounts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucune catégorie détectée
                </p>
              ) : (
                <div className="space-y-3">
                  {categoryCounts.map(([cat, count], idx) => (
                    <div key={cat} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground">#{idx + 1}</span>
                        <span className="font-medium">{cat}</span>
                      </div>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Assets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                Actifs à Risque
              </CardTitle>
              <CardDescription>Actifs avec le plus de vulnérabilités critiques</CardDescription>
            </CardHeader>
            <CardContent>
              {findingsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : assetCounts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucun actif affecté
                </p>
              ) : (
                <div className="space-y-3">
                  {assetCounts.map(([assetId, data], idx) => (
                    <div key={assetId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground">#{idx + 1}</span>
                        <span className="font-medium font-mono text-sm truncate max-w-[200px]">
                          {assetId === 'non-attribué' ? '(Non attribué)' : assetId.slice(0, 8)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {data.critical > 0 && (
                          <Badge variant="destructive">{data.critical} crit/high</Badge>
                        )}
                        <Badge variant="secondary">{data.count} total</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Findings Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Derniers Findings</CardTitle>
                <CardDescription>Les 10 vulnérabilités les plus récentes</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/findings">Voir tout</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {findingsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !findings || findings.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Aucun finding détecté. Importez des résultats de scan pour commencer.
                </p>
                <Button className="mt-4" asChild>
                  <Link to="/tools">Importer des résultats</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {findings.slice(0, 10).map((finding) => {
                  const config = SEVERITY_CONFIG[finding.severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.info;
                  return (
                    <div 
                      key={finding.id} 
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-2 h-2 rounded-full ${config.color}`} />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{finding.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {finding.finding_type} • {new Date(finding.first_seen).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={finding.status === 'open' ? 'destructive' : 'secondary'}
                          className="capitalize"
                        >
                          {finding.status}
                        </Badge>
                        <Badge variant="outline" className={config.textColor}>
                          {config.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SLA Warning */}
        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Bonnes pratiques de remédiation</p>
                <p>
                  • Critiques : sous 24h • Élevées : sous 7 jours • Moyennes : sous 30 jours • Faibles : selon planification
                </p>
                <p className="mt-1">
                  Ces délais sont indicatifs et basés sur les standards de l'industrie (NIST, ISO 27001).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
