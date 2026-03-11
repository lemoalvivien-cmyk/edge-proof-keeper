import { useState } from 'react';
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
  type ExecutiveReportResult,
  type TechnicalReportResult,
  type TechnicalFinding,
} from '@/lib/api-client';
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
} from 'lucide-react';

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

function ExecutiveReport({ data }: { data: ExecutiveReportResult }) {
  return (
    <div className="space-y-4 mt-4">
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Résumé exécutif
          </h2>
          <RiskBadge level={data.risk_level} />
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
                <span className="mt-0.5 h-4 w-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
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
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
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
            <Wrench className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
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
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-primary" />
          Résumé technique
        </h2>
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

  const backendConfigured = isExternalBackendConfigured();

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
      const result = await generateExecutiveReport(toolRunId.trim(), token);
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
      const result = await generateTechnicalReport(toolRunId.trim(), token);
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
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Report Studio</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Génère les rapports DG/PDG et DSI via votre backend externe.
          </p>
        </div>

        {/* Backend config warning */}
        {!backendConfigured && (
          <Alert variant="default" className="border-warning/40 bg-warning/5">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning-foreground">
              <strong>Backend externe non configuré.</strong> Définissez{' '}
              <code className="font-mono text-xs bg-muted px-1 rounded">VITE_CORE_API_URL</code> pour
              activer la génération de rapports via votre proxy IA.
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
              disabled={!backendConfigured || !toolRunId || executiveStatus === 'loading'}
              className="w-full"
            >
              {executiveStatus === 'loading' ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Génération…</>
              ) : 'Générer rapport DG / PDG'}
            </Button>

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
              disabled={!backendConfigured || !toolRunId || technicalStatus === 'loading'}
              className="w-full"
            >
              {technicalStatus === 'loading' ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Génération…</>
              ) : 'Générer rapport DSI'}
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
            Ce studio appelle exclusivement <code className="font-mono">VITE_CORE_API_URL/v1/reports/*</code>.
            Le frontend ne contacte jamais de fournisseur IA directement.
            Votre backend proxy est responsable de la génération et du stockage.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
