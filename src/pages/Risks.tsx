import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRisks, useRiskCounts } from "@/hooks/useRisks";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { correlateRisks, analyzeRiskIntelligence, getRiskAiAnalysis } from "@/lib/api-client";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Risk } from "@/types/engine";
import type { RiskIntelligenceResult } from "@/types/engine";
import {
  AlertTriangle,
  ShieldAlert,
  Shield,
  RefreshCw,
  Filter,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Activity,
  TrendingUp,
  Brain,
  Loader2,
  CheckCircle2,
  Lightbulb,
  Target,
  BarChart2,
} from "lucide-react";

const LEVEL_CONFIG: Record<string, { label: string; variant: "destructive" | "default" | "secondary" | "outline" }> = {
  critical: { label: "Critique", variant: "destructive" },
  high:     { label: "Élevé",    variant: "default" },
  medium:   { label: "Moyen",    variant: "secondary" },
  low:      { label: "Faible",   variant: "outline" },
};

const STATUS_CONFIG: Record<string, string> = {
  open:         "Ouvert",
  in_treatment: "En traitement",
  accepted:     "Accepté",
  closed:       "Clôturé",
};

const CONFIDENCE_CONFIG: Record<string, { label: string; className: string }> = {
  high:   { label: "Confiance haute",   className: "bg-success/10 text-success border-success/30" },
  medium: { label: "Confiance moyenne", className: "bg-warning/10 text-warning border-warning/30" },
  low:    { label: "Confiance faible",  className: "bg-muted/50 text-muted-foreground border-muted" },
};

// ── AI Intelligence Panel ─────────────────────────────────────────────────────

function AiIntelligencePanel({
  riskId,
  orgId,
}: {
  riskId: string;
  orgId: string;
}) {
  const [analyzing, setAnalyzing] = useState(false);
  const qc = useQueryClient();

  const { data: analysis, isLoading } = useQuery({
    queryKey: ["risk-ai-analysis", riskId, orgId],
    queryFn: () => getRiskAiAnalysis(orgId, riskId, "technical_analysis"),
    enabled: !!riskId && !!orgId,
  });

  const intel = analysis?.output_json as RiskIntelligenceResult | undefined;

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = await analyzeRiskIntelligence(orgId, riskId);
      if (!result.success && result.ai_available === false) {
        toast({
          title: "IA non configurée",
          description: "LOVABLE_API_KEY absent — l'intelligence IA n'est pas disponible.",
          variant: "destructive",
        });
        return;
      }
      if (!result.success) {
        toast({ title: "Erreur IA", description: result.error ?? "Erreur inconnue", variant: "destructive" });
        return;
      }
      toast({ title: "Analyse IA terminée", description: result.cached ? "Résultat depuis le cache." : "Nouvelle analyse générée." });
      qc.invalidateQueries({ queryKey: ["risk-ai-analysis", riskId] });
    } catch (e: unknown) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="pt-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!intel) {
    return (
      <div className="pt-3">
        <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Brain className="h-4 w-4 text-primary shrink-0" />
            <span>Aucune analyse IA disponible pour ce risque.</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAnalyze}
            disabled={analyzing}
            className="shrink-0"
          >
            {analyzing ? (
              <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Analyse…</>
            ) : (
              <><Brain className="h-3.5 w-3.5 mr-1.5" />Enrichir avec IA</>
            )}
          </Button>
        </div>
      </div>
    );
  }

  const conf = CONFIDENCE_CONFIG[intel.confidence_assessment] ?? CONFIDENCE_CONFIG.low;

  return (
    <div className="pt-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">Intelligence IA</span>
          <Badge variant="outline" className={`text-[10px] ${conf.className}`}>{conf.label}</Badge>
        </div>
        <Button size="sm" variant="ghost" onClick={handleAnalyze} disabled={analyzing} className="h-7 text-xs">
          {analyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        </Button>
      </div>

      {/* Executive summary */}
      <div className="rounded-md border border-border bg-card p-3">
        <p className="text-xs font-semibold uppercase text-muted-foreground mb-1 flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5" />Résumé exécutif
        </p>
        <p className="text-sm leading-relaxed">{intel.executive_summary}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {/* Business impact */}
        <div className="rounded-md border border-border bg-card p-3">
          <p className="text-xs font-semibold uppercase text-muted-foreground mb-1 flex items-center gap-1.5">
            <BarChart2 className="h-3.5 w-3.5" />Impact Business IA
          </p>
          <p className="text-sm text-muted-foreground">{intel.business_impact}</p>
        </div>
        {/* Technical impact */}
        <div className="rounded-md border border-border bg-card p-3">
          <p className="text-xs font-semibold uppercase text-muted-foreground mb-1 flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" />Impact Technique IA
          </p>
          <p className="text-sm text-muted-foreground">{intel.technical_impact}</p>
        </div>
      </div>

      {/* Priority rationale */}
      <div className="rounded-md border border-border bg-card p-3">
        <p className="text-xs font-semibold uppercase text-muted-foreground mb-1 flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5" />Justification de priorité
        </p>
        <p className="text-sm text-muted-foreground">{intel.priority_rationale}</p>
      </div>

      {/* Next steps */}
      {intel.recommended_next_steps?.length > 0 && (
        <div className="rounded-md border border-border bg-card p-3">
          <p className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5" />Actions recommandées
          </p>
          <ul className="space-y-1.5">
            {intel.recommended_next_steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Risk Row ─────────────────────────────────────────────────────────────────

function RiskRow({
  risk,
  expanded,
  onToggle,
  orgId,
}: {
  risk: Risk;
  expanded: boolean;
  onToggle: () => void;
  orgId: string;
}) {
  const lvl = LEVEL_CONFIG[risk.risk_level] ?? LEVEL_CONFIG.low;
  const isOverdue = risk.due_date && new Date(risk.due_date) < new Date() && risk.status !== "closed";

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <TableCell className="w-8 text-muted-foreground">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </TableCell>
        <TableCell>
          <div className="font-medium truncate max-w-xs">{risk.title}</div>
          {risk.assets && (
            <div className="text-xs text-muted-foreground mt-0.5">{risk.assets.name}</div>
          )}
        </TableCell>
        <TableCell>
          <Badge variant={lvl.variant}>{lvl.label}</Badge>
        </TableCell>
        <TableCell className="font-mono font-bold">{Math.round(risk.score)}</TableCell>
        <TableCell>
          <Badge variant="outline">{STATUS_CONFIG[risk.status] ?? risk.status}</Badge>
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">{risk.owner ?? "—"}</TableCell>
        <TableCell className={`text-sm ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
          {risk.due_date ? new Date(risk.due_date).toLocaleDateString("fr-FR") : "—"}
          {isOverdue && " ⚠"}
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="bg-muted/30">
          <TableCell />
          <TableCell colSpan={6} className="pb-4">
            <div className="grid md:grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{risk.description || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Impact Business</p>
                <p className="text-sm">{risk.business_impact || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Impact Technique</p>
                <p className="text-sm">{risk.technical_impact || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Signaux sources</p>
                <p className="text-sm font-mono">
                  {Array.isArray(risk.source_signal_ids) ? risk.source_signal_ids.length : 0} signal(s)
                </p>
              </div>
            </div>
            {/* AI Intelligence Panel */}
            <AiIntelligencePanel riskId={risk.id} orgId={orgId} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function Risks() {
  const { organization } = useAuth();
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("open");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [correlating, setCorrelating] = useState(false);

  const { data: counts, isLoading: countsLoading, refetch: refetchCounts } = useRiskCounts();
  const { data: risks, isLoading: risksLoading, refetch: refetchRisks } = useRisks({
    status: statusFilter !== "all" ? statusFilter as Risk["status"] : undefined,
    risk_level: levelFilter !== "all" ? levelFilter : undefined,
  });

  const filtered = useMemo(() => {
    if (!risks) return [];
    if (!search.trim()) return risks;
    const q = search.toLowerCase();
    return risks.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      r.owner?.toLowerCase().includes(q)
    );
  }, [risks, search]);

  const handleCorrelate = async () => {
    if (!organization?.id) return;
    setCorrelating(true);
    try {
      const result = await correlateRisks(organization.id);
      toast({
        title: "Corrélation terminée",
        description: `${result.risks_created} créés, ${result.risks_updated} mis à jour (${result.signals_processed} signaux traités)`,
      });
      refetchRisks();
      refetchCounts();
    } catch (e: unknown) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally {
      setCorrelating(false);
    }
  };

  const criticalCount = counts?.critical ?? 0;
  const avgScore = counts?.avg_score ?? 0;
  const openCount = counts?.open ?? 0;
  const overdueCount = counts?.overdue ?? 0;

  return (
    <AppLayout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-destructive" />
              Registre des Risques
            </h1>
            <p className="text-muted-foreground">
              Risques corrélés depuis les signaux et les actifs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { refetchRisks(); refetchCounts(); }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button
              onClick={handleCorrelate}
              disabled={correlating}
              size="sm"
            >
              <Activity className={`h-4 w-4 mr-2 ${correlating ? "animate-spin" : ""}`} />
              {correlating ? "Corrélation…" : "Corréler les risques"}
            </Button>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {countsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-10 w-full" /></CardContent></Card>
            ))
          ) : (
            <>
              <Card className="border-l-4 border-l-destructive">
                <CardContent className="p-4">
                  <div className="text-3xl font-bold text-destructive">{criticalCount}</div>
                  <div className="text-sm text-muted-foreground">Critiques</div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="text-3xl font-bold">{openCount}</div>
                  <div className="text-sm text-muted-foreground">Ouverts</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-3xl font-bold flex items-center gap-1">
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    {avgScore}
                  </div>
                  <div className="text-sm text-muted-foreground">Score moyen</div>
                </CardContent>
              </Card>
              <Card className={overdueCount > 0 ? "border-l-4 border-l-yellow-500" : ""}>
                <CardContent className="p-4">
                  <div className={`text-3xl font-bold ${overdueCount > 0 ? "text-yellow-600" : ""}`}>
                    {overdueCount}
                  </div>
                  <div className="text-sm text-muted-foreground">En retard</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Alert banner */}
        {criticalCount > 0 && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="py-3 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              <p className="text-sm font-medium text-destructive">
                {criticalCount} risque{criticalCount > 1 ? "s" : ""} critique{criticalCount > 1 ? "s" : ""} nécessite{criticalCount > 1 ? "nt" : ""} une action immédiate.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-48 h-9"
              />
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-40 h-9">
                  <SelectValue placeholder="Niveau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous niveaux</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                  <SelectItem value="high">Élevé</SelectItem>
                  <SelectItem value="medium">Moyen</SelectItem>
                  <SelectItem value="low">Faible</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-44 h-9">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="open">Ouvert</SelectItem>
                  <SelectItem value="in_treatment">En traitement</SelectItem>
                  <SelectItem value="accepted">Accepté</SelectItem>
                  <SelectItem value="closed">Clôturé</SelectItem>
                </SelectContent>
              </Select>
              {(levelFilter !== "all" || statusFilter !== "open" || search) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setLevelFilter("all"); setStatusFilter("open"); setSearch(""); }}
                >
                  Réinitialiser
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Risks Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {risksLoading ? "Chargement…" : `${filtered.length} risque${filtered.length !== 1 ? "s" : ""}`}
            </CardTitle>
            <CardDescription>
              Cliquez sur une ligne pour afficher le détail et l'intelligence IA
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {risksLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground font-medium">Aucun risque trouvé</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Utilisez "Corréler les risques" pour générer le registre depuis vos signaux.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Risque</TableHead>
                    <TableHead>Niveau</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Échéance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(risk => (
                    <RiskRow
                      key={risk.id}
                      risk={risk}
                      orgId={organization?.id ?? ""}
                      expanded={expandedId === risk.id}
                      onToggle={() => setExpandedId(expandedId === risk.id ? null : risk.id)}
                    />
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* SLA Reminder */}
        <Card className="bg-muted/30">
          <CardContent className="py-3">
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>
                <span className="font-medium text-foreground">SLA indicatifs :</span>{" "}
                Critique : 48h • Élevé : 7j • Moyen : 30j • Faible : 90j (NIST / ISO 27001)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
