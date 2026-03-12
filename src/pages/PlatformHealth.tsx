import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  getPlatformHealth,
  getAlerts,
  runScheduledSourceSync,
  runStaleRiskCheck,
  evaluateAlertRules,
  updateAlertStatus,
  getLatestPortfolioSummary,
  generatePortfolioSummary,
  verifyEvidenceChain,
} from "@/lib/api-client";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { WeeklyWatchBriefResult } from "@/types/engine";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Database,
  Brain,
  Shield,
  ListTodo,
  Bell,
  Play,
  Zap,
  Clock,
  Server,
  Loader2,
  Eye,
  ArrowRight,
  Hash,
  BarChart3,
  Link2,
} from "lucide-react";
import { Link } from "react-router-dom";

type SeverityKey = "critical" | "high" | "medium" | "low";

// ── Watch Brief sub-component ─────────────────────────────────────────────────
function WatchBriefSection({ orgId }: { orgId?: string }) {
  const { data: brief, isLoading } = useQuery({
    queryKey: ["weekly-watch-brief", orgId],
    queryFn: () => getLatestPortfolioSummary(orgId!, "weekly_watch_brief"),
    enabled: !!orgId,
    staleTime: 5 * 60_000,
  });

  const output = brief?.output_json as WeeklyWatchBriefResult | undefined;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Watch Brief hebdomadaire
            </CardTitle>
            <CardDescription>
              Dernière synthèse opérationnelle générée{brief?.created_at ? ` · ${new Date(brief.created_at).toLocaleString("fr-FR")}` : ""}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
            <Link to="/report-studio">
              Report Studio <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : !brief || !output ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Eye className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">Aucun watch brief disponible</p>
            <p className="text-xs text-muted-foreground/70 mt-1 mb-3">Générez une synthèse depuis Report Studio</p>
            <Button size="sm" variant="outline" asChild>
              <Link to="/report-studio">Générer un Watch Brief</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Headline */}
            <p className="text-sm font-semibold leading-snug">{output.headline}</p>

            {/* New alerts summary */}
            {output.new_alerts_summary && (
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Résumé alertes</p>
                <p className="text-sm">{output.new_alerts_summary}</p>
              </div>
            )}

            {/* Top changes */}
            {output.top_changes && output.top_changes.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">Changements notables</p>
                <ul className="space-y-1">
                  {output.top_changes.map((change, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-0.5 shrink-0">·</span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Top actions this week */}
            {output.top_actions_this_week && output.top_actions_this_week.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">Actions prioritaires cette semaine</p>
                <ul className="space-y-1">
                  {output.top_actions_this_week.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0 mt-0.5 border-primary/30 text-primary">
                        {i + 1}
                      </Badge>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Period label */}
            {brief.period_label && (
              <p className="text-[10px] text-muted-foreground/60 font-mono">{brief.period_label}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const SEVERITY_CONFIG: Record<SeverityKey, { label: string; className: string; dot: string }> = {
  critical: { label: "Critique", className: "bg-destructive/10 text-destructive border-destructive/30", dot: "bg-destructive" },
  high:     { label: "Élevé",    className: "bg-orange-500/10 text-orange-600 border-orange-500/30", dot: "bg-orange-500" },
  medium:   { label: "Moyen",    className: "bg-warning/10 text-warning border-warning/30", dot: "bg-warning" },
  low:      { label: "Faible",   className: "bg-muted/50 text-muted-foreground border-muted", dot: "bg-muted-foreground" },
};

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-destructive";
  const bg    = score >= 80 ? "border-success" : score >= 60 ? "border-warning" : "border-destructive";
  return (
    <div className={`flex flex-col items-center justify-center w-28 h-28 rounded-full border-4 ${bg}`}>
      <span className={`text-4xl font-black ${color}`}>{score}</span>
      <span className="text-xs text-muted-foreground mt-0.5">/ 100</span>
    </div>
  );
}

function StatusDot({ ok }: { ok: boolean | undefined }) {
  if (ok === undefined) return <div className="h-2.5 w-2.5 rounded-full bg-muted animate-pulse" />;
  return <div className={`h-2.5 w-2.5 rounded-full ${ok ? "bg-success" : "bg-destructive"}`} />;
}

export default function PlatformHealth() {
  const { organization } = useAuth();
  const qc = useQueryClient();
  const orgId = organization?.id;

  const [syncing, setSyncing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── Platform health status (edge function) ────────────────────────────────
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ["platform-health-page", orgId],
    queryFn: () => getPlatformHealth(orgId),
    enabled: !!orgId,
    retry: 1,
    refetchInterval: 60_000,
  });

  // ── Open alerts ───────────────────────────────────────────────────────────
  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ["open-alerts", orgId],
    queryFn: () => getAlerts(orgId!, { status: "open", limit: 20 }),
    enabled: !!orgId,
    refetchInterval: 30_000,
  });

  // ── Engine counts from DB directly ───────────────────────────────────────
  const { data: engineStats } = useQuery({
    queryKey: ["platform-engine-stats", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const [sources, signals, risks, actions, analyses] = await Promise.all([
        supabase.from("data_sources").select("id", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "active"),
        supabase.from("signals").select("id", { count: "exact", head: true }).eq("organization_id", orgId).in("status", ["new", "acknowledged"]),
        supabase.from("risk_register").select("id", { count: "exact", head: true }).eq("organization_id", orgId).in("status", ["open", "in_treatment"]),
        supabase.from("remediation_actions").select("id", { count: "exact", head: true }).eq("organization_id", orgId).in("status", ["open", "in_progress"]),
        supabase.from("ai_analyses").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
      ]);
      return {
        active_sources: sources.count ?? 0,
        open_signals:   signals.count ?? 0,
        open_risks:     risks.count ?? 0,
        pending_actions: actions.count ?? 0,
        ai_analyses:    analyses.count ?? 0,
      };
    },
    enabled: !!orgId,
    refetchInterval: 60_000,
  });

  // ── Derived health score ──────────────────────────────────────────────────
  const dbOk     = health?.components?.database?.status === "ok";
  const aiOk     = health?.components?.ai_gateway?.status === "configured";
  const tablesOk = health?.components?.tables?.status === "ok";
  const openAlertsCount   = alerts?.length ?? 0;
  const criticalAlerts    = alerts?.filter(a => a.severity === "critical").length ?? 0;

  const scoreComponents = [
    dbOk     ? 30 : 0,
    tablesOk ? 25 : 0,
    aiOk     ? 15 : 0,
    (engineStats?.active_sources ?? 0) > 0 ? 10 : 0,
    criticalAlerts === 0 ? 20 : criticalAlerts <= 2 ? 10 : 0,
  ];
  const healthScore = healthLoading ? 0 : scoreComponents.reduce((a, b) => a + b, 0);

  // ── Refresh all ───────────────────────────────────────────────────────────
  const handleRefreshAll = async () => {
    setRefreshing(true);
    await Promise.all([refetchHealth(), refetchAlerts(), qc.invalidateQueries({ queryKey: ["platform-engine-stats", orgId] })]);
    setRefreshing(false);
    toast({ title: "État rafraîchi" });
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleSyncSources = async () => {
    if (!orgId) return;
    setSyncing(true);
    try {
      const r = await runScheduledSourceSync(orgId);
      toast({ title: "Syncs planifiés", description: `${r.syncs_triggered} source(s) déclenchée(s) sur ${r.sources_considered} évaluées` });
      qc.invalidateQueries({ queryKey: ["platform-engine-stats", orgId] });
    } catch (e: unknown) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally { setSyncing(false); }
  };

  const handleStaleCheck = async () => {
    if (!orgId) return;
    setChecking(true);
    try {
      const r = await runStaleRiskCheck(orgId);
      toast({ title: "Vérification terminée", description: `${r.stale_risks_found} risque(s) stagnant(s) · ${r.alerts_created} alerte(s) créée(s)` });
      refetchAlerts();
    } catch (e: unknown) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally { setChecking(false); }
  };

  const handleEvaluateRules = async () => {
    if (!orgId) return;
    setEvaluating(true);
    try {
      const r = await evaluateAlertRules(orgId);
      toast({ title: "Règles évaluées", description: `${r.rules_evaluated} règle(s) · ${r.alerts_matched} alerte(s) correspondante(s)` });
    } catch (e: unknown) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally { setEvaluating(false); }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await updateAlertStatus(alertId, "acknowledged");
      toast({ title: "Alerte acquittée" });
      refetchAlerts();
    } catch (e: unknown) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    }
  };

  // ── Engine component cards ────────────────────────────────────────────────
  const engineComponents = [
    { label: "Base de données",   icon: <Database className="h-5 w-5" />, ok: dbOk,     detail: dbOk ? "Connectée" : "Erreur de connexion" },
    { label: "Tables critiques",  icon: <Server   className="h-5 w-5" />, ok: tablesOk, detail: tablesOk ? "Toutes opérationnelles" : "Tables manquantes" },
    { label: "Gateway IA",        icon: <Brain    className="h-5 w-5" />, ok: aiOk,     detail: aiOk ? "Gemini configuré" : "Non configuré" },
    { label: "Sources actives",   icon: <Activity className="h-5 w-5" />, ok: (engineStats?.active_sources ?? 0) > 0,   detail: `${engineStats?.active_sources ?? 0} source(s)` },
    { label: "Signaux ouverts",   icon: <AlertTriangle className="h-5 w-5" />, ok: true, detail: `${engineStats?.open_signals ?? 0} signal(s)` },
    { label: "Risques ouverts",   icon: <Shield   className="h-5 w-5" />, ok: true,     detail: `${engineStats?.open_risks ?? 0} risque(s)` },
    { label: "Actions remédiation", icon: <ListTodo className="h-5 w-5" />, ok: true,   detail: `${engineStats?.pending_actions ?? 0} action(s) en cours` },
    { label: "Analyses IA",       icon: <Brain    className="h-5 w-5" />, ok: (engineStats?.ai_analyses ?? 0) > 0,       detail: `${engineStats?.ai_analyses ?? 0} analyse(s)` },
    { label: "Alertes ouvertes",  icon: <Bell     className="h-5 w-5" />, ok: criticalAlerts === 0, detail: `${openAlertsCount} alerte(s) · ${criticalAlerts} critique(s)` },
  ];

  return (
    <AppLayout>
      <div className="container py-6 space-y-6 max-w-5xl">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              Santé de la Plateforme
            </h1>
            <p className="text-sm text-muted-foreground">Surveillance continue · Alertes · État du moteur</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefreshAll} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Rafraîchir
          </Button>
        </div>

        {/* Health Score + Status Grid */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Score */}
          <Card className="flex items-center justify-center p-6">
            {healthLoading ? (
              <Skeleton className="h-28 w-28 rounded-full" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <ScoreGauge score={healthScore} />
                <p className="text-xs text-muted-foreground mt-1">Score de santé</p>
                <Badge
                  variant="outline"
                  className={healthScore >= 80 ? "border-success/40 text-success" : healthScore >= 60 ? "border-warning/40 text-warning" : "border-destructive/40 text-destructive"}
                >
                  {healthScore >= 80 ? "Opérationnelle" : healthScore >= 60 ? "Dégradée" : "Alerte"}
                </Badge>
              </div>
            )}
          </Card>

          {/* Quick stats */}
          <Card className="col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Compteurs temps réel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Sources actives",    value: engineStats?.active_sources ?? 0,   icon: <Server className="h-4 w-4 text-primary" /> },
                  { label: "Signaux ouverts",    value: engineStats?.open_signals ?? 0,     icon: <AlertTriangle className="h-4 w-4 text-warning" /> },
                  { label: "Risques ouverts",    value: engineStats?.open_risks ?? 0,       icon: <Shield className="h-4 w-4 text-destructive" /> },
                  { label: "Actions remédiation", value: engineStats?.pending_actions ?? 0, icon: <ListTodo className="h-4 w-4 text-primary" /> },
                  { label: "Analyses IA",        value: engineStats?.ai_analyses ?? 0,      icon: <Brain className="h-4 w-4 text-primary" /> },
                  { label: "Alertes ouvertes",   value: openAlertsCount,                    icon: <Bell className={`h-4 w-4 ${criticalAlerts > 0 ? "text-destructive" : "text-muted-foreground"}`} /> },
                ].map(item => (
                  <div key={item.label} className="rounded-lg border border-border bg-muted/20 p-3">
                    <div className="flex items-center gap-1.5 mb-1">{item.icon}<span className="text-xs text-muted-foreground">{item.label}</span></div>
                    <p className="text-2xl font-black">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleRefreshAll} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Vérifier la santé
          </Button>
          <Button onClick={handleSyncSources} disabled={syncing}>
            {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            {syncing ? "Lancement…" : "Lancer les syncs"}
          </Button>
          <Button onClick={handleStaleCheck} disabled={checking} variant="secondary">
            {checking ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Clock className="h-4 w-4 mr-2" />}
            {checking ? "Vérification…" : "Vérifier les risques stagnants"}
          </Button>
          <Button onClick={handleEvaluateRules} disabled={evaluating} variant="outline">
            {evaluating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            {evaluating ? "Évaluation…" : "Évaluer les règles d'alerte"}
          </Button>
        </div>

        {/* Engine Component Grid */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              État du Moteur
            </CardTitle>
            <CardDescription>Composants critiques de la plateforme</CardDescription>
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {engineComponents.map(c => (
                  <div
                    key={c.label}
                    className={`flex items-start gap-2 p-3 rounded-lg border ${c.ok ? "border-success/20 bg-success/5" : "border-destructive/20 bg-destructive/5"}`}
                  >
                    <div className={`mt-0.5 ${c.ok ? "text-success" : "text-destructive"}`}>
                      {c.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Alertes récentes
                </CardTitle>
                <CardDescription>
                  {openAlertsCount} alerte(s) ouverte(s) · {criticalAlerts} critique(s)
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => refetchAlerts()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {alertsLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : !alerts || alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-8 w-8 text-success mb-2" />
                <p className="text-sm font-medium text-success">Aucune alerte ouverte</p>
                <p className="text-xs text-muted-foreground mt-1">La plateforme est saine</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {alerts.map(alert => {
                  const sev = SEVERITY_CONFIG[alert.severity as SeverityKey] ?? SEVERITY_CONFIG.low;
                  return (
                    <div key={alert.id} className="flex items-start justify-between gap-3 px-6 py-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${sev.dot}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{alert.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{alert.description}</p>
                          <p className="text-[10px] text-muted-foreground/70 font-mono mt-0.5">
                            {new Date(alert.last_detected_at).toLocaleString("fr-FR")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className={`text-xs ${sev.className}`}>{sev.label}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                        >
                          Acquitter
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Watch Brief ──────────────────────────────────────────────── */}
        <WatchBriefSection orgId={orgId} />

        {/* ── Core Proof — Evidence Chain + Portfolio smoke test ─────────── */}
        <CoreProofBlock orgId={orgId} />

        {/* DB Component detail */}
        {health?.components?.tables?.detail && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Tables DB
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(health.components.tables.detail).map(([table, ok]) => (
                  <div key={table} className="flex items-center gap-2 text-sm">
                    <StatusDot ok={ok} />
                    <span className="font-mono text-xs">{table}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
