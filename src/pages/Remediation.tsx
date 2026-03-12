import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRemediationActions, useRemediationActionCounts, useUpdateRemediationAction } from "@/hooks/useRisks";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { enhanceRemediationActions, getRiskAiAnalysis } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import type { RemediationAction } from "@/types/engine";
import type { EnhancedRemediationResult } from "@/types/engine";
import {
  ListTodo,
  RefreshCw,
  Filter,
  Play,
  CheckCircle2,
  Clock,
  Brain,
  Loader2,
  Lightbulb,
  Target,
  BarChart2,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const PRIORITY_CONFIG: Record<string, { label: string; variant: "destructive" | "default" | "secondary" | "outline" }> = {
  critical: { label: "Critique", variant: "destructive" },
  high:     { label: "Élevé",    variant: "default" },
  medium:   { label: "Moyen",    variant: "secondary" },
  low:      { label: "Faible",   variant: "outline" },
};

const STATUS_LABELS: Record<string, string> = {
  open:        "À faire",
  in_progress: "En cours",
  done:        "Terminé",
  cancelled:   "Annulé",
};

const ACTION_TYPE_LABELS: Record<string, string> = {
  patch:      "Patch",
  config:     "Configuration",
  process:    "Processus",
  monitoring: "Surveillance",
  accept:     "Acceptation",
};

type ActionWithRisk = RemediationAction & {
  risk_register?: { id: string; title: string; risk_level: string; score: number };
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

async function callBuildQueue(orgId: string, token: string) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/build-remediation-queue`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ organization_id: orgId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error ?? `build-remediation-queue error ${res.status}`);
  return json as { risks_processed: number; actions_created: number; actions_updated: number; errors_count: number };
}

// ── AI Enhancement Panel for a single risk's actions ─────────────────────────

function AiEnhancementPanel({
  riskId,
  riskTitle,
  orgId,
}: {
  riskId: string;
  riskTitle: string;
  orgId: string;
}) {
  const [enhancing, setEnhancing] = useState(false);
  const qc = useQueryClient();

  const { data: analysis, isLoading } = useQuery({
    queryKey: ["remediation-ai-analysis", riskId, orgId],
    queryFn: () => getRiskAiAnalysis(orgId, riskId, "remediation_plan"),
    enabled: !!riskId && !!orgId,
  });

  const enhanced = analysis?.output_json as unknown as EnhancedRemediationResult | undefined;

  const handleEnhance = async () => {
    setEnhancing(true);
    try {
      const result = await enhanceRemediationActions(orgId, riskId);
      if (!result.success && result.ai_available === false) {
        toast({
          title: "IA non configurée",
          description: "LOVABLE_API_KEY absent — l'intelligence IA n'est pas disponible.",
          variant: "destructive",
        });
        return;
      }
      if (!result.success) {
        toast({ title: "Erreur IA", description: (result as { error?: string }).error ?? "Erreur inconnue", variant: "destructive" });
        return;
      }
      toast({ title: "Remédiation enrichie", description: result.cached ? "Résultat depuis le cache." : "Enrichissement IA généré." });
      qc.invalidateQueries({ queryKey: ["remediation-ai-analysis", riskId] });
    } catch (e: unknown) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally {
      setEnhancing(false);
    }
  };

  if (isLoading) {
    return <div className="pt-2"><Skeleton className="h-8 w-full" /></div>;
  }

  if (!enhanced) {
    return (
      <div className="pt-2">
        <div className="rounded border border-dashed border-primary/30 bg-primary/5 p-3 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Brain className="h-3.5 w-3.5 text-primary" />
            Pas encore d'enrichissement IA pour : <span className="font-medium">{riskTitle.slice(0, 50)}</span>
          </p>
          <Button size="sm" variant="outline" onClick={handleEnhance} disabled={enhancing} className="h-7 text-xs shrink-0">
            {enhancing ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />…</> : <><Brain className="h-3 w-3 mr-1" />Enrichir</>}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold uppercase text-primary">Enrichissement IA</span>
        </div>
        <Button size="sm" variant="ghost" onClick={handleEnhance} disabled={enhancing} className="h-6 text-xs">
          {enhancing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        </Button>
      </div>

      {enhanced.overall_strategy && (
        <div className="rounded border border-border bg-card p-3">
          <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
            <Target className="h-3 w-3" />Stratégie globale
          </p>
          <p className="text-xs text-muted-foreground">{enhanced.overall_strategy}</p>
        </div>
      )}

      {enhanced.total_effort_estimate && (
        <p className="text-xs text-muted-foreground font-mono">
          Effort total estimé : <span className="font-semibold text-foreground">{enhanced.total_effort_estimate}</span>
        </p>
      )}

      {enhanced.actions?.length > 0 && (
        <div className="space-y-1.5">
          {enhanced.actions.sort((a, b) => (a.execution_order ?? 99) - (b.execution_order ?? 99)).map((act, i) => (
            <div key={i} className="rounded border border-border bg-muted/20 p-2.5 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-primary border border-primary/30 rounded px-1.5 py-0.5">
                  #{act.execution_order ?? i + 1}
                </span>
                <p className="text-xs font-medium truncate">{act.original_title}</p>
                {act.estimated_effort && (
                  <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{act.estimated_effort}</span>
                )}
              </div>
              {act.business_justification && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Justification :</span> {act.business_justification}
                </p>
              )}
              {act.expected_gain && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Gain :</span> {act.expected_gain}
                </p>
              )}
              {act.implementation_notes && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Notes :</span> {act.implementation_notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Risk Group Row (groups actions by risk) ───────────────────────────────────

function RiskGroupRow({
  riskTitle,
  riskId,
  riskLevel,
  actions,
  orgId,
  onStatusChange,
}: {
  riskTitle: string;
  riskId: string;
  riskLevel: string;
  actions: ActionWithRisk[];
  orgId: string;
  onStatusChange: (id: string, status: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const lvl = PRIORITY_CONFIG[riskLevel] ?? PRIORITY_CONFIG.low;

  return (
    <div className="border-b border-border last:border-0">
      {/* Group header */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
        onClick={() => setOpen(v => !v)}
      >
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
        <Badge variant={lvl.variant} className="shrink-0">{lvl.label}</Badge>
        <span className="text-sm font-medium truncate">{riskTitle}</span>
        <span className="ml-auto text-xs text-muted-foreground shrink-0">{actions.length} action(s)</span>
      </button>

      {open && (
        <div className="px-4 pb-4">
          {/* Actions table for this risk */}
          <div className="rounded border border-border overflow-hidden mb-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead>Gain attendu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actions.map((action) => {
                  const pri = PRIORITY_CONFIG[action.priority] ?? PRIORITY_CONFIG.low;
                  const isOverdue = action.due_date &&
                    new Date(action.due_date) < new Date() &&
                    action.status !== "done" &&
                    action.status !== "cancelled";
                  return (
                    <TableRow key={action.id}>
                      <TableCell>
                        <div className="font-medium truncate max-w-xs">{action.title}</div>
                        {action.implementation_notes && (
                          <div className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
                            {action.implementation_notes.slice(0, 80)}…
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {ACTION_TYPE_LABELS[action.action_type] ?? action.action_type}
                      </TableCell>
                      <TableCell><Badge variant={pri.variant}>{pri.label}</Badge></TableCell>
                      <TableCell>
                        <Select value={action.status} onValueChange={val => onStatusChange(action.id, val)}>
                          <SelectTrigger className="h-7 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">À faire</SelectItem>
                            <SelectItem value="in_progress">En cours</SelectItem>
                            <SelectItem value="done">Terminé</SelectItem>
                            <SelectItem value="cancelled">Annulé</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{action.owner ?? "—"}</TableCell>
                      <TableCell className={`text-sm ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                        {action.due_date ? new Date(action.due_date).toLocaleDateString("fr-FR") : "—"}
                        {isOverdue && " ⚠"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[140px] truncate">
                        {action.expected_gain || "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* AI Enhancement Panel */}
          <AiEnhancementPanel riskId={riskId} riskTitle={riskTitle} orgId={orgId} />
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function Remediation() {
  const { organization } = useAuth();
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("open");
  const [search, setSearch] = useState("");
  const [building, setBuilding] = useState(false);
  const [viewMode, setViewMode] = useState<"flat" | "grouped">("grouped");

  const { data: counts, isLoading: countsLoading, refetch: refetchCounts } = useRemediationActionCounts();
  const { data: actions, isLoading: actionsLoading, refetch: refetchActions } = useRemediationActions({
    status: statusFilter !== "all" ? statusFilter : undefined,
    priority: priorityFilter !== "all" ? priorityFilter : undefined,
  });
  const updateAction = useUpdateRemediationAction();

  const filtered = useMemo(() => {
    if (!actions) return [];
    if (!search.trim()) return actions;
    const q = search.toLowerCase();
    return actions.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.owner?.toLowerCase().includes(q) ||
      a.risk_register?.title?.toLowerCase().includes(q)
    );
  }, [actions, search]);

  // Group by risk_id
  const groupedByRisk = useMemo(() => {
    const map = new Map<string, { riskTitle: string; riskLevel: string; actions: ActionWithRisk[] }>();
    for (const a of filtered) {
      const riskId = a.risk_id;
      const riskTitle = a.risk_register?.title ?? "Risque inconnu";
      const riskLevel = a.risk_register?.risk_level ?? a.priority;
      if (!map.has(riskId)) {
        map.set(riskId, { riskTitle, riskLevel, actions: [] });
      }
      map.get(riskId)!.actions.push(a);
    }
    return Array.from(map.entries()).map(([riskId, v]) => ({ riskId, ...v }));
  }, [filtered]);

  const handleBuildQueue = async () => {
    if (!organization?.id) return;
    setBuilding(true);
    try {
      const { data: { session } } = await import("@/integrations/supabase/client").then(m => m.supabase.auth.getSession());
      if (!session?.access_token) throw new Error("Non authentifié");
      const result = await callBuildQueue(organization.id, session.access_token);
      toast({
        title: "File de remédiation construite",
        description: `${result.actions_created} créées, ${result.actions_updated} mises à jour (${result.risks_processed} risques traités)`,
      });
      refetchActions();
      refetchCounts();
    } catch (e: unknown) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBuilding(false);
    }
  };

  const handleStatusChange = async (actionId: string, newStatus: string) => {
    try {
      await updateAction.mutateAsync({ id: actionId, status: newStatus as RemediationAction["status"] });
      toast({ title: "Statut mis à jour" });
    } catch (e: unknown) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ListTodo className="h-6 w-6 text-primary" />
              File de Remédiation
            </h1>
            <p className="text-muted-foreground">
              Actions prioritaires issues du registre des risques — enrichies par IA
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { refetchActions(); refetchCounts(); }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button
              onClick={handleBuildQueue}
              disabled={building}
              size="sm"
            >
              <Play className={`h-4 w-4 mr-2 ${building ? "animate-spin" : ""}`} />
              {building ? "Construction…" : "Construire la file de remédiation"}
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
                  <div className="text-3xl font-bold text-destructive">{counts?.critical ?? 0}</div>
                  <div className="text-sm text-muted-foreground">Priorité critique</div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="text-3xl font-bold">{counts?.open ?? 0}</div>
                  <div className="text-sm text-muted-foreground">À faire</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-3xl font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                    {counts?.done ?? 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Terminées</div>
                </CardContent>
              </Card>
              <Card className={(counts?.overdue ?? 0) > 0 ? "border-l-4 border-l-yellow-500" : ""}>
                <CardContent className="p-4">
                  <div className={`text-3xl font-bold ${(counts?.overdue ?? 0) > 0 ? "text-yellow-600" : ""}`}>
                    {counts?.overdue ?? 0}
                  </div>
                  <div className="text-sm text-muted-foreground">En retard</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

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
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40 h-9">
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes priorités</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="low">Faible</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-44 h-9">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="open">À faire</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="done">Terminé</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={viewMode === "grouped" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode(v => v === "grouped" ? "flat" : "grouped")}
                className="ml-auto"
              >
                <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
                {viewMode === "grouped" ? "Vue groupée" : "Vue liste"}
              </Button>
              {(priorityFilter !== "all" || statusFilter !== "open" || search) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setPriorityFilter("all"); setStatusFilter("open"); setSearch(""); }}
                >
                  Réinitialiser
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {actionsLoading ? "Chargement…" : `${filtered.length} action${filtered.length !== 1 ? "s" : ""}`}
            </CardTitle>
            <CardDescription>
              {viewMode === "grouped"
                ? "Groupé par risque — cliquez pour développer et enrichir avec IA"
                : "Actions générées depuis le registre des risques"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {actionsLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <ListTodo className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground font-medium">Aucune action trouvée</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Utilisez "Construire la file de remédiation" pour générer les actions depuis les risques ouverts.
                </p>
              </div>
            ) : viewMode === "grouped" ? (
              <div>
                {groupedByRisk.map(({ riskId, riskTitle, riskLevel, actions: riskActions }) => (
                  <RiskGroupRow
                    key={riskId}
                    riskId={riskId}
                    riskTitle={riskTitle}
                    riskLevel={riskLevel}
                    actions={riskActions}
                    orgId={organization?.id ?? ""}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Risque lié</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead>Gain attendu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((action: ActionWithRisk) => {
                    const pri = PRIORITY_CONFIG[action.priority] ?? PRIORITY_CONFIG.low;
                    const isOverdue = action.due_date &&
                      new Date(action.due_date) < new Date() &&
                      action.status !== "done" &&
                      action.status !== "cancelled";
                    return (
                      <TableRow key={action.id}>
                        <TableCell>
                          <div className="font-medium truncate max-w-xs">{action.title}</div>
                          {action.implementation_notes && (
                            <div className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
                              {action.implementation_notes.slice(0, 80)}…
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {action.risk_register ? (
                            <span className="text-sm truncate max-w-[160px] block">
                              {action.risk_register.title.slice(0, 50)}
                            </span>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {ACTION_TYPE_LABELS[action.action_type] ?? action.action_type}
                        </TableCell>
                        <TableCell><Badge variant={pri.variant}>{pri.label}</Badge></TableCell>
                        <TableCell>
                          <Select
                            value={action.status}
                            onValueChange={val => handleStatusChange(action.id, val)}
                          >
                            <SelectTrigger className="h-7 w-32 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">À faire</SelectItem>
                              <SelectItem value="in_progress">En cours</SelectItem>
                              <SelectItem value="done">Terminé</SelectItem>
                              <SelectItem value="cancelled">Annulé</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{action.owner ?? "—"}</TableCell>
                        <TableCell className={`text-sm ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                          {action.due_date ? new Date(action.due_date).toLocaleDateString("fr-FR") : "—"}
                          {isOverdue && " ⚠"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">
                          {action.expected_gain || "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Info footer */}
        <Card className="bg-muted/30">
          <CardContent className="py-3">
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mt-0.5 shrink-0" />
              <p>
                Les actions sont générées automatiquement depuis les risques ouverts.
                En vue groupée, cliquez sur un groupe pour afficher les détails et enrichir les actions via IA.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
