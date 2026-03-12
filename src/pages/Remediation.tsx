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
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { RemediationAction } from "@/types/engine";
import {
  ListTodo,
  RefreshCw,
  Filter,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
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

export default function Remediation() {
  const { organization } = useAuth();
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("open");
  const [search, setSearch] = useState("");
  const [building, setBuilding] = useState(false);

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
              Actions prioritaires issues du registre des risques
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

        {/* Actions Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {actionsLoading ? "Chargement…" : `${filtered.length} action${filtered.length !== 1 ? "s" : ""}`}
            </CardTitle>
            <CardDescription>Actions générées depuis le registre des risques</CardDescription>
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
                Changez le statut directement dans le tableau. Les actions terminées sont conservées à des fins d'audit.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
