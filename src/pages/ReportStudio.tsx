import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  generateExecutiveReport,
  generateTechnicalReport,
  isExternalBackendConfigured,
  setRuntimeApiUrls,
  type ExecutiveReportResult,
  type TechnicalReportResult,
  type TechnicalFinding,
  type ReportsMode,
} from '@/lib/api-client';
import { useRuntimeConfig } from '@/hooks/useRuntimeConfig';
import { supabase } from '@/integrations/supabase/client';
import {
  FileText,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  TrendingUp,
  ListChecks,
  Lightbulb,
  Bug,
  Wrench,
  Server,
  ClipboardList,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type ReportStatus = 'idle' | 'loading' | 'success' | 'error';

const SEVERITY_COLOR: Record<string, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-white',
  low: 'bg-blue-500 text-white',
  info: 'bg-muted text-muted-foreground',
};

const RISK_LABEL: Record<string, string> = {
  critical: 'Critique',
  high: 'Élevé',
  medium: 'Modéré',
  low: 'Faible',
  info: 'Info',
};

function RiskBadge({ level }: { level: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${SEVERITY_COLOR[level] ?? SEVERITY_COLOR.info}`}>
      {RISK_LABEL[level] ?? level}
    </span>
  );
}

function GeneratedByBadge({ by }: { by?: string }) {
  if (!by) return null;
  return (
    <Badge variant="outline" className={`text-xs gap-1 ${by === 'external' ? 'border-success/40 text-success' : 'border-primary/40 text-primary'}`}>
      <Zap className="h-3 w-3" />
      {by === 'external' ? 'Backend externe' : 'Moteur interne'}
    </Badge>
  );
}

function ExecutiveReport({ data }: { data: ExecutiveReportResult }) {
  return (
    <div className="space-y-4 mt-4">
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Résumé exécutif
          </h2>
          <div className="flex items-center gap-2">
            <RiskBadge level={data.risk_level} />
            <GeneratedByBadge by={data.generated_by} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{data.summary}</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-5 space-y-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Impact métier
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{data.business_impact}</p>
      </div>

      {data.top_priorities?.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-primary" />
            Priorités immédiates
          </h3>
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
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            Recommandations
          </h3>
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
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Bug className="h-4 w-4 text-destructive shrink-0" />
          {index + 1}. {finding.title}
        </h4>
        <RiskBadge level={finding.severity} />
      </div>

      <div className="grid grid-cols-1 gap-2 text-xs">
        {finding.asset && (
          <div className="flex items-start gap-2">
            <Server className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <span className="text-muted-foreground"><span className="font-medium text-foreground">Actif :</span> {finding.asset}</span>
          </div>
        )}
        {finding.evidence && (
          <div className="flex items-start gap-2">
            <ClipboardList className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <span className="text-muted-foreground"><span className="font-medium text-foreground">Preuve :</span> {finding.evidence}</span>
          </div>
        )}
        {finding.remediation && (
          <div className="flex items-start gap-2">
            <Wrench className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <span className="text-muted-foreground"><span className="font-medium text-foreground">Remédiation :</span> {finding.remediation}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function TechnicalReport({ data }: { data: TechnicalReportResult }) {
  return (
    <div className="space-y-4 mt-4">
      <div className="rounded-lg border border-border bg-card p-5 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" />
            Résumé technique
          </h2>
          <GeneratedByBadge by={data.generated_by} />
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{data.summary}</p>
      </div>

      {data.findings?.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            Findings ({data.findings.length})
          </h3>
          {data.findings.map((f, i) => (
            <FindingCard key={i} finding={f} index={i} />
          ))}
        </div>
      )}

      {(!data.findings || data.findings.length === 0) && (
        <p className="text-sm text-muted-foreground italic">Aucun finding retourné.</p>
      )}
    </div>
  );
}

export default function ReportStudio() {
  const [toolRunId, setToolRunId] = useState('');
  const [executiveStatus, setExecutiveStatus] = useState<ReportStatus>('idle');
  const [technicalStatus, setTechnicalStatus] = useState<ReportStatus>('idle');
  const [executiveResult, setExecutiveResult] = useState<ExecutiveReportResult | null>(null);
  const [technicalResult, setTechnicalResult] = useState<TechnicalReportResult | null>(null);
  const [executiveError, setExecutiveError] = useState<string | null>(null);
  const [technicalError, setTechnicalError] = useState<string | null>(null);

  const runtimeConfig = useRuntimeConfig();
  const reportsMode: ReportsMode = runtimeConfig.reportsMode;
  const externalBackendAvailable = Boolean(runtimeConfig.coreApiUrl) || isExternalBackendConfigured();

  // Inject runtime URLs into api-client module
  useEffect(() => {
    setRuntimeApiUrls(runtimeConfig.coreApiUrl, runtimeConfig.aiGatewayUrl);
  }, [runtimeConfig.coreApiUrl, runtimeConfig.aiGatewayUrl]);

  // Derived mode labels
  const modeLabel = {
    external_only:      'Backend externe (obligatoire)',
    internal_fallback:  'Fallback interne actif',
    internal_only:      'Moteur interne (Edge Functions)',
  }[reportsMode];

  const modeVariant = reportsMode === 'external_only' && !externalBackendAvailable
    ? 'destructive'
    : reportsMode === 'internal_fallback'
    ? 'warning'
    : 'ok';

  const canGenerate =
    reportsMode !== 'external_only' || externalBackendAvailable;

  const getToken = async (): Promise<string | undefined> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? undefined;
  };

  const isValidUuid = (v: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v.trim());

  const handleGenerateExecutive = async () => {
    if (!isValidUuid(toolRunId)) {
      setExecutiveError('Veuillez saisir un Tool Run ID valide (format UUID).');
      return;
    }
    setExecutiveStatus('loading');
    setExecutiveError(null);
    setExecutiveResult(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Session expirée — veuillez vous reconnecter.');
      const result = await generateExecutiveReport(toolRunId.trim(), token, reportsMode);
      setExecutiveResult(result);
      setExecutiveStatus('success');
    } catch (err) {
      setExecutiveError(err instanceof Error ? err.message : 'Erreur inconnue');
      setExecutiveStatus('error');
    }
  };

  const handleGenerateTechnical = async () => {
    if (!isValidUuid(toolRunId)) {
      setTechnicalError('Veuillez saisir un Tool Run ID valide (format UUID).');
      return;
    }
    setTechnicalStatus('loading');
    setTechnicalError(null);
    setTechnicalResult(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Session expirée — veuillez vous reconnecter.');
      const result = await generateTechnicalReport(toolRunId.trim(), token, reportsMode);
      setTechnicalResult(result);
      setTechnicalStatus('success');
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
              Génère les rapports DG/PDG et DSI pour votre Direction.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-xs gap-1 ${
                modeVariant === 'ok' || modeVariant === 'warning'
                  ? 'border-primary/40 text-primary'
                  : 'border-destructive/40 text-destructive'
              }`}
            >
              <Zap className="h-3 w-3" />
              {modeLabel}
            </Badge>
          </div>
        </div>

        {/* Mode banner */}
        {reportsMode === 'external_only' && !externalBackendAvailable && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Mode « external_only » actif mais backend externe non configuré.</strong>{' '}
              <Link to="/settings/revenue" className="underline">Configurez l'URL du backend</Link>{' '}
              ou changez le mode en <code className="font-mono text-xs bg-muted px-1 rounded">internal_fallback</code> dans Revenue Settings.
            </AlertDescription>
          </Alert>
        )}

        {reportsMode === 'internal_fallback' && !externalBackendAvailable && (
          <Alert className="border-primary/30 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-foreground">
              <strong>Mode fallback interne actif.</strong>{' '}
              Les rapports sont générés par le moteur IA interne (Edge Functions Gemini).{' '}
              Pour activer un backend externe, <Link to="/settings/revenue" className="underline">configurez l'URL</Link>.
            </AlertDescription>
          </Alert>
        )}

        {reportsMode === 'internal_only' && (
          <Alert className="border-primary/30 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-foreground">
              <strong>Moteur interne actif.</strong>{' '}
              Les rapports sont générés directement via les Edge Functions Gemini. Aucun backend externe requis.
            </AlertDescription>
          </Alert>
        )}

        {/* Tool Run ID input */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Identifiant du run d'outil</CardTitle>
            <CardDescription>
              Collez l'UUID du Tool Run dont vous souhaitez générer les rapports.
            </CardDescription>
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

        {/* ── RAPPORT DG / PDG ── */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Rapport DG / PDG</CardTitle>
              <Badge variant="secondary" className="text-xs">Exécutif</Badge>
            </div>
            <CardDescription className="text-xs">
              Résumé, risques business, conformité GDPR/NIS2, plan d'action.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button
              onClick={handleGenerateExecutive}
              disabled={!canGenerate || !toolRunId || executiveStatus === 'loading'}
              className="w-full"
            >
              {executiveStatus === 'loading' ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Génération…</>
              ) : canGenerate ? 'Générer rapport DG / PDG' : 'Backend non disponible'}
            </Button>

            {!canGenerate && (
              <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-xs text-muted-foreground">
                  Configurez le backend ou changez le mode reporting.
                </p>
                <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0" asChild>
                  <Link to="/settings/revenue">
                    Configurer
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            )}

            {executiveStatus === 'error' && executiveError && (
              <div className="flex items-start gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{executiveError}</span>
              </div>
            )}

            {executiveStatus === 'success' && executiveResult && (
              <ExecutiveReport data={executiveResult} />
            )}
          </CardContent>
        </Card>

        {/* ── RAPPORT DSI ── */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Rapport DSI</CardTitle>
              <Badge variant="outline" className="text-xs">Technique</Badge>
            </div>
            <CardDescription className="text-xs">
              Périmètre, findings détaillés, recommandations, traçabilité.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={handleGenerateTechnical}
              disabled={!canGenerate || !toolRunId || technicalStatus === 'loading'}
              className="w-full"
            >
              {technicalStatus === 'loading' ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Génération…</>
              ) : canGenerate ? 'Générer rapport DSI' : 'Backend non disponible'}
            </Button>

            {technicalStatus === 'error' && technicalError && (
              <div className="flex items-start gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{technicalError}</span>
              </div>
            )}

            {technicalStatus === 'success' && technicalResult && (
              <TechnicalReport data={technicalResult} />
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* Architecture note */}
        <div className="flex gap-2 text-xs text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            Mode actif : <strong>{modeLabel}</strong>.{' '}
            {reportsMode === 'internal_fallback' || reportsMode === 'internal_only'
              ? 'Le moteur interne utilise les Edge Functions Gemini — aucune donnée ne quitte votre périmètre Lovable Cloud.'
              : 'Le backend externe est responsable de la génération et du stockage des rapports.'}
            {' '}<Link to="/settings/revenue" className="underline">Modifier les paramètres →</Link>
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
