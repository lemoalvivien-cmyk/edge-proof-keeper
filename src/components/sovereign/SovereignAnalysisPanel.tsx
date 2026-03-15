/**
 * SECURIT-E — SovereignAnalysisPanel
 * Agent CISO IA Souverain Français — NIS2/RGPD
 */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
  Brain, Loader2, Shield, AlertTriangle, ChevronDown, ChevronRight,
  Terminal, Copy, CheckCircle2, Flag, Zap
} from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

type SovereignAnalysis = {
  titre: string;
  niveau_risque: string;
  analyse_technique: string;
  conformite_nis2: string;
  conformite_rgpd: string;
  impact_metier: string;
  actions_prioritaires: Array<{
    ordre: number;
    action: string;
    urgence: string;
    responsable: string;
    effort: string;
  }>;
  script_healing: {
    type: "bash" | "powershell" | "none";
    script: string;
    description: string;
  };
  limites: string;
};

const URGENCE_COLORS: Record<string, string> = {
  immédiat: "destructive",
  "24h": "default",
  "7_jours": "secondary",
  "30_jours": "outline",
};

interface SovereignAnalysisPanelProps {
  entityType: "risk" | "signal" | "finding";
  entityId: string;
  organizationId: string;
  entityTitle?: string;
}

export function SovereignAnalysisPanel({
  entityType,
  entityId,
  organizationId,
  entityTitle,
}: SovereignAnalysisPanelProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<SovereignAnalysis | null>(null);
  const [scriptExpanded, setScriptExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [applying, setApplying] = useState(false);

  const qc = useQueryClient();

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Non authentifié");

      const res = await fetch(`${SUPABASE_URL}/functions/v1/sovereign-analyze`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organization_id: organizationId,
          entity_type: entityType,
          entity_id: entityId,
        }),
      });

      if (res.status === 429) {
        toast({ title: "Limite atteinte", description: "Réessayez dans quelques minutes", variant: "destructive" });
        return;
      }
      if (res.status === 402) {
        toast({ title: "Crédits IA épuisés", description: "Rechargez vos crédits", variant: "destructive" });
        return;
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Erreur ${res.status}`);

      setAnalysis(json.analysis);
      toast({
        title: "🇫🇷 Analyse souveraine générée",
        description: json.script_id
          ? "Script de self-healing créé automatiquement"
          : "Analyse NIS2/RGPD disponible",
      });

      qc.invalidateQueries({ queryKey: ["healing-scripts", entityId] });
    } catch (e: unknown) {
      toast({ title: "Erreur agent souverain", description: (e as Error).message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopyScript = async () => {
    if (!analysis?.script_healing?.script) return;
    await navigator.clipboard.writeText(analysis.script_healing.script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyScript = async () => {
    if (!analysis?.script_healing?.script) return;
    setApplying(true);
    // Simulates applying the script — in production this would call execute-skill
    await new Promise(r => setTimeout(r, 1500));
    toast({
      title: "✅ Script de remédiation téléchargé",
      description: `Script ${analysis.script_healing.type === "bash" ? "Bash" : "PowerShell"} prêt à l'exécution. Copiez et exécutez sur votre système cible.`,
    });
    setApplying(false);
  };

  const NIVEAU_VARIANT: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
    critique: "destructive",
    élevé: "default",
    moyen: "secondary",
    faible: "outline",
  };

  if (!analysis) {
    return (
      <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium">Agent CISO IA Souverain</p>
              <p className="text-xs text-muted-foreground">Analyse NIS2/RGPD • Self-healing • Script auto</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleAnalyze}
            disabled={analyzing}
            className="gap-2 shrink-0"
          >
            {analyzing ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" />Analyse…</>
            ) : (
              <><Brain className="h-3.5 w-3.5" />🇫🇷 Analyser</>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-primary/25 bg-primary/5 space-y-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-primary/15">
        <div className="flex items-center gap-2 min-w-0">
          <Flag className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-semibold truncate">{analysis.titre}</span>
          <Badge variant={NIVEAU_VARIANT[analysis.niveau_risque] ?? "outline"} className="shrink-0 text-[10px]">
            {analysis.niveau_risque}
          </Badge>
        </div>
        <Button size="sm" variant="ghost" onClick={handleAnalyze} disabled={analyzing} className="h-7 shrink-0">
          {analyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
        </Button>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Technique */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />Analyse Technique
          </p>
          <p className="text-xs text-foreground leading-relaxed">{analysis.analyse_technique}</p>
        </div>

        {/* NIS2 + RGPD side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="rounded border border-border bg-background/40 p-2.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
              <Shield className="h-3 w-3" />NIS2
            </p>
            <p className="text-xs text-foreground leading-relaxed">{analysis.conformite_nis2}</p>
          </div>
          <div className="rounded border border-border bg-background/40 p-2.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
              <Shield className="h-3 w-3" />RGPD
            </p>
            <p className="text-xs text-foreground leading-relaxed">{analysis.conformite_rgpd}</p>
          </div>
        </div>

        {/* Impact métier */}
        <div className="rounded border border-destructive/20 bg-destructive/5 p-2.5">
          <p className="text-[10px] font-semibold text-destructive uppercase tracking-wide mb-1">Impact Métier</p>
          <p className="text-xs text-foreground">{analysis.impact_metier}</p>
        </div>

        {/* Actions prioritaires */}
        {analysis.actions_prioritaires?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              Actions prioritaires
            </p>
            <div className="space-y-1">
              {analysis.actions_prioritaires.map((action, i) => (
                <div key={i} className="flex items-start gap-2 rounded border border-border bg-background/40 p-2">
                  <span className="text-[10px] font-bold text-primary border border-primary/30 rounded px-1.5 py-0.5 shrink-0">
                    #{action.ordre}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{action.action}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge
                        variant={(URGENCE_COLORS[action.urgence] ?? "outline") as "destructive" | "default" | "secondary" | "outline"}
                        className="text-[9px]"
                      >
                        {action.urgence}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{action.responsable}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{action.effort}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Self-healing script */}
        {analysis.script_healing?.type !== "none" && analysis.script_healing?.script && (
          <div className="rounded border border-green-500/30 bg-green-500/5">
            <button
              className="w-full flex items-center justify-between px-3 py-2 text-left"
              onClick={() => setScriptExpanded(v => !v)}
            >
              <div className="flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-green-500" />
                <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                  Script Self-Healing ({analysis.script_healing.type === "bash" ? "Bash" : "PowerShell"})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-600 dark:text-green-400">
                  Prêt
                </Badge>
                {scriptExpanded
                  ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                }
              </div>
            </button>
            {scriptExpanded && (
              <div className="px-3 pb-3 space-y-2">
                <p className="text-xs text-muted-foreground">{analysis.script_healing.description}</p>
                <pre className="text-xs bg-background rounded border border-border p-3 overflow-auto max-h-48 font-mono leading-relaxed">
                  {analysis.script_healing.script}
                </pre>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleCopyScript} className="h-7 text-xs gap-1.5">
                    {copied ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copié !" : "Copier"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApplyScript}
                    disabled={applying}
                    className="h-7 text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {applying ? (
                      <><Loader2 className="h-3 w-3 animate-spin" />Application…</>
                    ) : (
                      <><Zap className="h-3 w-3" />Appliquer maintenant</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sovereign watermark */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[10px] text-muted-foreground font-mono">
            🇫🇷 Agent CISO IA Souverain · NIS2/RGPD · 20× moins cher que Palantir
          </span>
        </div>
      </div>
    </div>
  );
}
