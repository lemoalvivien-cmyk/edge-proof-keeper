import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  generateExecutiveReport,
  generateTechnicalReport,
  generatePortfolioSummary,
  getLatestPortfolioSummary,
  isExternalBackendConfigured,
  setRuntimeApiUrls,
  type ExecutiveReportResult,
  type TechnicalReportResult,
  type TechnicalFinding,
  type ReportsMode,
} from '@/lib/api-client';
import type {
  ExecutiveBriefResult,
  TechnicalBriefResult,
  WeeklyWatchBriefResult,
  PortfolioSummary,
} from '@/types/engine';
import { useRuntimeConfig } from '@/hooks/useRuntimeConfig';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  FileText, Loader2, AlertTriangle, CheckCircle2, Info,
  ShieldAlert, TrendingUp, ListChecks, Lightbulb, Bug,
  Wrench, Server, ClipboardList, Zap, ExternalLink,
  BarChart3, Brain, Target, MessageSquare,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type ReportStatus = 'idle' | 'loading' | 'success' | 'error';

const SEVERITY_COLOR: Record<string, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  high:     'bg-orange-500 text-white',
  medium:   'bg-yellow-500 text-white',
  low:      'bg-blue-500 text-white',
  info:     'bg-muted text-muted-foreground',
};

const RISK_LABEL: Record<string, string> = {
  critical: 'Critique', high: 'Élevé', medium: 'Modéré', low: 'Faible', info: 'Info',
};

function RiskBadge({ level }: { level: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${SEVERITY_COLOR[level] ?? SEVERITY_COLOR.info}`}>
      {RISK_LABEL[level] ?? level}
    </span>
  );
}

function GeneratedByBadge({ by, model }: { by?: string; model?: string }) {
  if (!by) return null;
  const isAI = by === 'ai' || (model && model !== 'deterministic_fallback');
  return (
    <Badge variant="outline" className={`text-xs gap-1 ${isAI ? 'border-success/40 text-success' : 'border-primary/40 text-primary'}`}>
      <Zap className="h-3 w-3" />
      {isAI ? `IA — ${model ?? 'Gemini'}` : 'Fallback déterministe'}
    </Badge>
  );
}

// ── Executive Brief (Portfolio) ────────────────────────────────────────────────

function ExecutiveBriefPanel({ data, summary }: { data: ExecutiveBriefResult; summary?: PortfolioSummary | null }) {
  return (
    <div className="space-y-4 mt-4">
      {summary && (
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-muted-foreground">
          <span>Synthèse générée le {new Date(summary.created_at).toLocaleString('fr-FR')}</span>
          <GeneratedByBadge by={summary.model_name !== 'deterministic_fallback' ? 'ai' : 'internal'} model={summary.model_name ?? undefined} />
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Synthèse exécutive
          </h2>
          <RiskBadge level={data.overall_risk_level} />
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed font-mono">{data.headline}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{data.business_exposure_summary}</p>
      </div>

      {data.top_risks?.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-primary" />
            Risques dominants
          </h3>
          <ul className="space-y-1.5">
            {data.top_risks.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-0.5 h-4 w-4 rounded-full border border-primary/30 bg-primary/5 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.priority_actions?.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Actions prioritaires
          </h3>
          <ul className="space-y-1.5">
            {data.priority_actions.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.board_message && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-5 space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Message pour la Direction
          </h3>
          <p className="text-sm text-foreground leading-relaxed italic">&ldquo;{data.board_message}&rdquo;</p>
        </div>
      )}
    </div>
  );
}

// ── Technical Brief (Portfolio) ────────────────────────────────────────────────

function TechnicalBriefPanel({ data, summary }: { data: TechnicalBriefResult; summary?: PortfolioSummary | null }) {
  return (
    <div className="space-y-4 mt-4">
      {summary && (
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-muted-foreground">
          <span>Synthèse générée le {new Date(summary.created_at).toLocaleString('fr-FR')}</span>
          <GeneratedByBadge by={summary.model_name !== 'deterministic_fallback' ? 'ai' : 'internal'} model={summary.model_name ?? undefined} />
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Synthèse technique
          </h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed font-mono">{data.headline}</p>
      </div>

      {data.top_risk_clusters?.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-primary" />
            Clusters de risques
          </h3>
          <ul className="space-y-1.5">
            {data.top_risk_clusters.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-0.5 h-4 w-4 rounded-full border border-primary/30 bg-primary/5 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.stale_risks_summary && (
        <div className="rounded-lg border border-border bg-card p-5 space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Risques stagnants
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{data.stale_risks_summary}</p>
        </div>
      )}

      {data.priority_remediation_actions?.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" />
            Actions de remédiation prioritaires
          </h3>
          <ul className="space-y-1.5">
            {data.priority_remediation_actions.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.technical_message && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
          <p className="text-sm text-foreground leading-relaxed font-mono">{data.technical_message}</p>
        </div>
      )}
    </div>
  );
}

// ── Legacy Executive Report (tool-run based) ───────────────────────────────────

function ExecutiveReport({ data }: { data: ExecutiveReportResult }) {
  return (
    <div className="space-y-4 mt-4">
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />Résumé exécutif
          </h2>
          <div className="flex items-center gap-2">
            <RiskBadge level={data.risk_level} />
            <Badge variant="outline" className="text-xs border-muted text-muted-foreground">Basé sur tool run</Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{data.summary}</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-5 space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Impact métier</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{data.business_impact}</p>
      </div>
      {data.top_priorities?.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-primary" />Priorités immédiates</h3>
          <ul className="space-y-1.5">
            {data.top_priorities.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-0.5 h-4 w-4 rounded-full border border-primary/30 bg-primary/5 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.recommendations?.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" />Recommandations</h3>
          <ul className="space-y-1.5">
            {data.recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function FindingCard({ finding, index }: { finding: TechnicalFinding; index: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold flex items-center gap-2"><Bug className="h-4 w-4 text-destructive shrink-0" />{index + 1}. {finding.title}</h4>
        <RiskBadge level={finding.severity} />
      </div>
      <div className="grid grid-cols-1 gap-2 text-xs">
        {finding.asset && <div className="flex items-start gap-2"><Server className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" /><span className="text-muted-foreground"><span className="font-medium text-foreground">Actif :</span> {finding.asset}</span></div>}
        {finding.evidence && <div className="flex items-start gap-2"><ClipboardList className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" /><span className="text-muted-foreground"><span className="font-medium text-foreground">Preuve :</span> {finding.evidence}</span></div>}
        {finding.remediation && <div className="flex items-start gap-2"><Wrench className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /><span className="text-muted-foreground"><span className="font-medium text-foreground">Remédiation :</span> {finding.remediation}</span></div>}
      </div>
    </div>
  );
}

function TechnicalReport({ data }: { data: TechnicalReportResult }) {
  return (
    <div className="space-y-4 mt-4">
      <div className="rounded-lg border border-border bg-card p-5 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-base font-semibold flex items-center gap-2"><ListChecks className="h-4 w-4 text-primary" />Résumé technique</h2>
          <Badge variant="outline" className="text-xs border-muted text-muted-foreground">Basé sur tool run</Badge>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{data.summary}</p>
      </div>
      {data.findings?.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Findings ({data.findings.length})</h3>
          {data.findings.map((f, i) => <FindingCard key={i} finding={f} index={i} />)}
        </div>
      )}
      {(!data.findings || data.findings.length === 0) && (
        <p className="text-sm text-muted-foreground italic">Aucun finding retourné.</p>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ReportStudio() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  // Portfolio state
  const [portfolioExecStatus,  setPortfolioExecStatus]  = useState<ReportStatus>('idle');
  const [portfolioTechStatus,  setPortfolioTechStatus]  = useState<ReportStatus>('idle');
  const [portfolioExecResult,  setPortfolioExecResult]  = useState<ExecutiveBriefResult | null>(null);
  const [portfolioTechResult,  setPortfolioTechResult]  = useState<TechnicalBriefResult | null>(null);
  const [portfolioExecSummary, setPortfolioExecSummary] = useState<PortfolioSummary | null>(null);
  const [portfolioTechSummary, setPortfolioTechSummary] = useState<PortfolioSummary | null>(null);
  const [portfolioExecError,   setPortfolioExecError]   = useState<string | null>(null);
  const [portfolioTechError,   setPortfolioTechError]   = useState<string | null>(null);

  // Legacy tool-run state
  const [toolRunId,        setToolRunId]        = useState('');
  const [executiveStatus,  setExecutiveStatus]  = useState<ReportStatus>('idle');
  const [technicalStatus,  setTechnicalStatus]  = useState<ReportStatus>('idle');
  const [executiveResult,  setExecutiveResult]  = useState<ExecutiveReportResult | null>(null);
  const [technicalResult,  setTechnicalResult]  = useState<TechnicalReportResult | null>(null);
  const [executiveError,   setExecutiveError]   = useState<string | null>(null);
  const [technicalError,   setTechnicalError]   = useState<string | null>(null);

  const runtimeConfig = useRuntimeConfig();
  const reportsMode: ReportsMode = runtimeConfig.reportsMode;
  const externalBackendAvailable = Boolean(runtimeConfig.coreApiUrl) || isExternalBackendConfigured();

  useEffect(() => {
    setRuntimeApiUrls(runtimeConfig.coreApiUrl, runtimeConfig.aiGatewayUrl);
  }, [runtimeConfig.coreApiUrl, runtimeConfig.aiGatewayUrl]);

  // Load latest cached portfolio summaries on mount
  useEffect(() => {
    if (!orgId) return;
    getLatestPortfolioSummary(orgId, 'executive_brief').then(s => {
      if (s) {
        setPortfolioExecSummary(s);
        setPortfolioExecResult(s.output_json as ExecutiveBriefResult);
        setPortfolioExecStatus('success');
      }
    }).catch(() => {});
    getLatestPortfolioSummary(orgId, 'technical_brief').then(s => {
      if (s) {
        setPortfolioTechSummary(s);
        setPortfolioTechResult(s.output_json as TechnicalBriefResult);
        setPortfolioTechStatus('success');
      }
    }).catch(() => {});
  }, [orgId]);

  const modeLabel = {
    external_only:     'Backend externe (obligatoire)',
    internal_fallback: 'Fallback interne actif',
    internal_only:     'Moteur interne (Edge Functions)',
  }[reportsMode];

  const canGenerate = reportsMode !== 'external_only' || externalBackendAvailable;

  const getToken = async (): Promise<string | undefined> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? undefined;
  };

  const isValidUuid = (v: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v.trim());

  // ── Portfolio generation ──────────────────────────────────────────────────

  const handleGeneratePortfolioExec = async () => {
    if (!orgId) return;
    setPortfolioExecStatus('loading');
    setPortfolioExecError(null);
    try {
      const result = await generatePortfolioSummary(orgId, 'executive_brief');
      setPortfolioExecResult(result.output as ExecutiveBriefResult);
      setPortfolioExecSummary({ id: result.summary_id ?? '', organization_id: orgId, summary_type: 'executive_brief', model_name: result.model_name, source_snapshot: result.source_snapshot, output_json: result.output, period_label: result.period_label, created_at: new Date().toISOString() });
      setPortfolioExecStatus('success');
      toast({ title: 'Synthèse DG générée', description: result.ai_used ? `Modèle : ${result.model_name}` : 'Fallback déterministe utilisé' });
    } catch (err) {
      setPortfolioExecError(err instanceof Error ? err.message : 'Erreur inconnue');
      setPortfolioExecStatus('error');
    }
  };

  const handleGeneratePortfolioTech = async () => {
    if (!orgId) return;
    setPortfolioTechStatus('loading');
    setPortfolioTechError(null);
    try {
      const result = await generatePortfolioSummary(orgId, 'technical_brief');
      setPortfolioTechResult(result.output as TechnicalBriefResult);
      setPortfolioTechSummary({ id: result.summary_id ?? '', organization_id: orgId, summary_type: 'technical_brief', model_name: result.model_name, source_snapshot: result.source_snapshot, output_json: result.output, period_label: result.period_label, created_at: new Date().toISOString() });
      setPortfolioTechStatus('success');
      toast({ title: 'Synthèse DSI générée', description: result.ai_used ? `Modèle : ${result.model_name}` : 'Fallback déterministe utilisé' });
    } catch (err) {
      setPortfolioTechError(err instanceof Error ? err.message : 'Erreur inconnue');
      setPortfolioTechStatus('error');
    }
  };

  // ── Legacy tool-run generation ────────────────────────────────────────────

  const handleGenerateExecutive = async () => {
    if (!isValidUuid(toolRunId)) { setExecutiveError('UUID invalide.'); return; }
    setExecutiveStatus('loading'); setExecutiveError(null); setExecutiveResult(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Session expirée.');
      const result = await generateExecutiveReport(toolRunId.trim(), token, reportsMode);
      setExecutiveResult(result); setExecutiveStatus('success');
    } catch (err) {
      setExecutiveError(err instanceof Error ? err.message : 'Erreur inconnue');
      setExecutiveStatus('error');
    }
  };

  const handleGenerateTechnical = async () => {
    if (!isValidUuid(toolRunId)) { setTechnicalError('UUID invalide.'); return; }
    setTechnicalStatus('loading'); setTechnicalError(null); setTechnicalResult(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Session expirée.');
      const result = await generateTechnicalReport(toolRunId.trim(), token, reportsMode);
      setTechnicalResult(result); setTechnicalStatus('success');
    } catch (err) {
      setTechnicalError(err instanceof Error ? err.message : 'Erreur inconnue');
      setTechnicalStatus('error');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight">Report Studio</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Centre de décision — synthèses portefeuille DG / DSI et rapports audit.
            </p>
          </div>
          <Badge variant="outline" className="text-xs gap-1 border-primary/40 text-primary">
            <Zap className="h-3 w-3" />{modeLabel}
          </Badge>
        </div>

        {/* Tabs — Portfolio vs Tool Run */}
        <Tabs defaultValue="portfolio">
          <TabsList className="w-full">
            <TabsTrigger value="portfolio" className="flex-1 gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              Synthèse portefeuille
            </TabsTrigger>
            <TabsTrigger value="toolrun" className="flex-1 gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Rapport par Tool Run
            </TabsTrigger>
          </TabsList>

          {/* ── Portfolio Tab ─────────────────────────────────────────────── */}
          <TabsContent value="portfolio" className="space-y-6 mt-6">
            <Alert className="border-primary/30 bg-primary/5">
              <Brain className="h-4 w-4 text-primary" />
              <AlertDescription className="text-foreground text-xs">
                La synthèse portefeuille agrège <strong>risk_register · remediation_actions · alertes · analyses IA</strong>.
                Elle utilise Gemini si disponible, sinon un fallback déterministe. Les résultats sont persistés et rechargés automatiquement.
              </AlertDescription>
            </Alert>

            {/* DG / PDG — executive_brief */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Vue Direction Générale</CardTitle>
                  <Badge variant="secondary" className="text-xs">executive_brief</Badge>
                </div>
                <CardDescription className="text-xs">
                  Exposition globale, risques dominants, message COMEX, actions prioritaires.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Button
                  onClick={handleGeneratePortfolioExec}
                  disabled={!orgId || portfolioExecStatus === 'loading'}
                  className="w-full"
                >
                  {portfolioExecStatus === 'loading'
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Génération…</>
                    : <><BarChart3 className="h-4 w-4 mr-2" />Générer synthèse portefeuille DG</>}
                </Button>

                {portfolioExecStatus === 'error' && portfolioExecError && (
                  <div className="flex items-start gap-2 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /><span>{portfolioExecError}</span>
                  </div>
                )}

                {portfolioExecStatus === 'success' && portfolioExecResult && (
                  <ExecutiveBriefPanel data={portfolioExecResult} summary={portfolioExecSummary} />
                )}

                {portfolioExecStatus === 'idle' && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Aucune synthèse disponible. Cliquez sur &ldquo;Générer&rdquo; pour créer le brief.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* DSI — technical_brief */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Vue DSI / Technique</CardTitle>
                  <Badge variant="outline" className="text-xs">technical_brief</Badge>
                </div>
                <CardDescription className="text-xs">
                  Clusters de risques, actifs critiques, remédiation prioritaire, état du moteur.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  onClick={handleGeneratePortfolioTech}
                  disabled={!orgId || portfolioTechStatus === 'loading'}
                  className="w-full"
                >
                  {portfolioTechStatus === 'loading'
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Génération…</>
                    : <><Brain className="h-4 w-4 mr-2" />Générer synthèse portefeuille DSI</>}
                </Button>

                {portfolioTechStatus === 'error' && portfolioTechError && (
                  <div className="flex items-start gap-2 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /><span>{portfolioTechError}</span>
                  </div>
                )}

                {portfolioTechStatus === 'success' && portfolioTechResult && (
                  <TechnicalBriefPanel data={portfolioTechResult} summary={portfolioTechSummary} />
                )}

                {portfolioTechStatus === 'idle' && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Aucune synthèse disponible. Cliquez sur &ldquo;Générer&rdquo; pour créer le brief.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tool Run Tab ──────────────────────────────────────────────── */}
          <TabsContent value="toolrun" className="space-y-6 mt-6">

            {reportsMode === 'external_only' && !externalBackendAvailable && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Mode « external_only » actif mais backend externe non configuré.</strong>{' '}
                  <Link to="/settings/revenue" className="underline">Configurer</Link>{' '}
                  ou changer le mode en <code className="font-mono text-xs bg-muted px-1 rounded">internal_fallback</code>.
                </AlertDescription>
              </Alert>
            )}

            {/* Tool Run ID input */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Identifiant du run d'outil</CardTitle>
                <CardDescription>UUID du Tool Run dont vous souhaitez générer les rapports.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="tool-run-id">Tool Run ID</Label>
                  <Input
                    id="tool-run-id"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={toolRunId}
                    onChange={e => setToolRunId(e.target.value)}
                    className="font-mono text-sm"
                  />
                  {toolRunId && !isValidUuid(toolRunId) && (
                    <p className="text-xs text-destructive">Format UUID invalide.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Rapport DG */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Rapport DG / PDG</CardTitle>
                  <Badge variant="secondary" className="text-xs">Exécutif</Badge>
                </div>
                <CardDescription className="text-xs">Résumé, risques business, conformité, plan d'action.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Button onClick={handleGenerateExecutive} disabled={!canGenerate || !toolRunId || executiveStatus === 'loading'} className="w-full">
                  {executiveStatus === 'loading' ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Génération…</> : canGenerate ? 'Générer rapport DG / PDG' : 'Backend non disponible'}
                </Button>
                {!canGenerate && (
                  <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground">Configurez le backend ou changez le mode reporting.</p>
                    <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0" asChild>
                      <Link to="/settings/revenue">Configurer<ExternalLink className="h-3 w-3 ml-1" /></Link>
                    </Button>
                  </div>
                )}
                {executiveStatus === 'error' && executiveError && (
                  <div className="flex items-start gap-2 text-sm text-destructive"><AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /><span>{executiveError}</span></div>
                )}
                {executiveStatus === 'success' && executiveResult && <ExecutiveReport data={executiveResult} />}
              </CardContent>
            </Card>

            {/* Rapport DSI */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Rapport DSI</CardTitle>
                  <Badge variant="outline" className="text-xs">Technique</Badge>
                </div>
                <CardDescription className="text-xs">Périmètre, findings détaillés, recommandations, traçabilité.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Button variant="outline" onClick={handleGenerateTechnical} disabled={!canGenerate || !toolRunId || technicalStatus === 'loading'} className="w-full">
                  {technicalStatus === 'loading' ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Génération…</> : canGenerate ? 'Générer rapport DSI' : 'Backend non disponible'}
                </Button>
                {technicalStatus === 'error' && technicalError && (
                  <div className="flex items-start gap-2 text-sm text-destructive"><AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /><span>{technicalError}</span></div>
                )}
                {technicalStatus === 'success' && technicalResult && <TechnicalReport data={technicalResult} />}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="flex gap-2 text-xs text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            Mode actif : <strong>{modeLabel}</strong>.{' '}
            La synthèse portefeuille utilise toujours le moteur interne (Edge Functions Gemini).{' '}
            <Link to="/settings/revenue" className="underline">Modifier les paramètres →</Link>
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
