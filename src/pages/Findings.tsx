import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useFindings, useUpdateFindingStatus } from "@/hooks/useFindings";
import type { RiskLevel, FindingStatus } from "@/types/findings";
import { toast } from "@/hooks/use-toast";
import { 
  Search, 
  Filter, 
  ChevronRight, 
  Shield,
  ExternalLink,
  Clock,
  FileText,
} from "lucide-react";

const SEVERITY_CONFIG = {
  critical: { label: "Critique", color: "bg-red-500", textColor: "text-red-600" },
  high: { label: "Élevé", color: "bg-orange-500", textColor: "text-orange-600" },
  medium: { label: "Moyen", color: "bg-yellow-500", textColor: "text-yellow-600" },
  low: { label: "Faible", color: "bg-blue-500", textColor: "text-blue-600" },
  info: { label: "Info", color: "bg-slate-400", textColor: "text-slate-600" },
};

const STATUS_OPTIONS: { value: FindingStatus; label: string }[] = [
  { value: "open", label: "Ouvert" },
  { value: "acknowledged", label: "Accepté" },
  { value: "remediated", label: "Remédié" },
  { value: "false_positive", label: "Faux positif" },
];

export default function Findings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFinding, setSelectedFinding] = useState<string | null>(null);
  
  const severityFilter = searchParams.get("severity") || "all";
  const statusFilter = searchParams.get("status") || "all";
  const typeFilter = searchParams.get("type") || "all";
  
  const filters = useMemo(() => ({
    severity: severityFilter !== "all" ? severityFilter as RiskLevel : undefined,
    status: statusFilter !== "all" ? statusFilter as FindingStatus : undefined,
    finding_type: typeFilter !== "all" ? typeFilter : undefined,
  }), [severityFilter, statusFilter, typeFilter]);
  
  const { data: findings, isLoading, refetch } = useFindings(filters);
  const updateStatus = useUpdateFindingStatus();

  // Get unique finding types for filter
  const findingTypes = useMemo(() => {
    if (!findings) return [];
    const types = new Set(findings.map(f => f.finding_type));
    return Array.from(types).sort();
  }, [findings]);

  // Filter by search query
  const filteredFindings = useMemo(() => {
    if (!findings) return [];
    if (!searchQuery.trim()) return findings;
    const q = searchQuery.toLowerCase();
    return findings.filter(f => 
      f.title.toLowerCase().includes(q) ||
      f.finding_type.toLowerCase().includes(q)
    );
  }, [findings, searchQuery]);

  const handleUpdateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "all") {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  const handleStatusChange = async (findingId: string, newStatus: FindingStatus) => {
    try {
      await updateStatus.mutateAsync({ findingId, status: newStatus });
      toast({
        title: "Statut mis à jour",
        description: `Finding marqué comme "${STATUS_OPTIONS.find(s => s.value === newStatus)?.label}"`,
      });
      refetch();
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Échec de la mise à jour",
        variant: "destructive",
      });
    }
  };

  const currentFinding = findings?.find(f => f.id === selectedFinding);

  return (
    <AppLayout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Findings</h1>
            <p className="text-muted-foreground">
              Liste détaillée des vulnérabilités et expositions détectées
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/risks">
              <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
              Retour au tableau des risques
            </Link>
          </Button>
        </div>

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
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="w-40">
                <Select value={severityFilter} onValueChange={(v) => handleUpdateFilter("severity", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sévérité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40">
                <Select value={statusFilter} onValueChange={(v) => handleUpdateFilter("status", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    {STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Select value={typeFilter} onValueChange={(v) => handleUpdateFilter("type", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous types</SelectItem>
                    {findingTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Findings List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filteredFindings.length} Finding{filteredFindings.length !== 1 ? 's' : ''}
            </CardTitle>
            <CardDescription>
              Cliquez sur un finding pour voir les détails et gérer son statut
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredFindings.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Aucun finding trouvé avec ces critères
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFindings.map((finding) => {
                  const config = SEVERITY_CONFIG[finding.severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.info;
                  return (
                    <Dialog key={finding.id} open={selectedFinding === finding.id} onOpenChange={(open) => setSelectedFinding(open ? finding.id : null)}>
                      <DialogTrigger asChild>
                        <div 
                          className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className={`w-3 h-3 rounded-full ${config.color} shrink-0`} />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{finding.title}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <span>{finding.finding_type}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(finding.first_seen).toLocaleDateString('fr-FR')}
                                </span>
                                {finding.confidence && (
                                  <>
                                    <span>•</span>
                                    <span>Confiance: {finding.confidence}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge 
                              variant={finding.status === 'open' ? 'destructive' : 'secondary'}
                              className="capitalize"
                            >
                              {STATUS_OPTIONS.find(s => s.value === finding.status)?.label || finding.status}
                            </Badge>
                            <Badge variant="outline" className={config.textColor}>
                              {config.label}
                            </Badge>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${config.color}`} />
                            <DialogTitle className="text-lg">{finding.title}</DialogTitle>
                          </div>
                          <DialogDescription>
                            {finding.finding_type} • Détecté le {new Date(finding.first_seen).toLocaleDateString('fr-FR')}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 mt-4">
                          {/* Metadata */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Sévérité</p>
                              <Badge variant="outline" className={config.textColor}>{config.label}</Badge>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Confiance</p>
                              <p className="capitalize">{finding.confidence || 'Non spécifiée'}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Tool Run</p>
                              <Link to={`/runs/${finding.tool_run_id}`} className="text-primary hover:underline text-sm flex items-center gap-1">
                                {finding.tool_run_id.slice(0, 8)}...
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">ID Finding</p>
                              <p className="font-mono text-xs">{finding.id.slice(0, 12)}...</p>
                            </div>
                          </div>

                          {/* Evidence */}
                          {finding.evidence && Object.keys(finding.evidence).length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Preuves (Evidence)
                              </p>
                              <div className="bg-muted/50 rounded-lg p-3 text-sm font-mono overflow-x-auto">
                                <pre className="whitespace-pre-wrap">
                                  {JSON.stringify(finding.evidence, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}

                          {/* References */}
                          {finding.references && finding.references.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-2">Références</p>
                              <div className="space-y-1">
                                {finding.references.map((ref, idx) => (
                                  <a 
                                    key={idx}
                                    href={ref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline text-sm flex items-center gap-1"
                                  >
                                    {ref}
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Status Change */}
                          <div className="border-t pt-4">
                            <p className="text-sm font-medium mb-3">Changer le statut</p>
                            <div className="flex flex-wrap gap-2">
                              {STATUS_OPTIONS.map(opt => (
                                <Button
                                  key={opt.value}
                                  variant={finding.status === opt.value ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleStatusChange(finding.id, opt.value)}
                                  disabled={updateStatus.isPending}
                                >
                                  {opt.label}
                                </Button>
                              ))}
                            </div>
                          </div>

                          {/* Compliance Links */}
                          {finding.finding_control_links && finding.finding_control_links.length > 0 && (
                            <div className="border-t pt-4">
                              <p className="text-sm font-medium text-muted-foreground mb-2">
                                Impact conformité (indicatif)
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {finding.finding_control_links.map((link: { id: string; framework: string; compliance_controls?: { control_id: string; title: string } }) => (
                                  <Badge key={link.id} variant="secondary">
                                    {link.framework.toUpperCase()}: {link.compliance_controls?.control_id || 'N/A'}
                                  </Badge>
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                ⚠️ Mapping automatique - validation humaine recommandée
                              </p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
