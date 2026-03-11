import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { generateExecutiveReport, generateTechnicalReport, isExternalBackendConfigured } from '@/lib/api-client';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Loader2, AlertTriangle, CheckCircle2, Info, ExternalLink } from 'lucide-react';

type ReportStatus = 'idle' | 'loading' | 'success' | 'error';

interface ReportResult {
  report_id: string;
  status: string;
}

export default function ReportStudio() {
  const [toolRunId, setToolRunId] = useState('');
  const [executiveStatus, setExecutiveStatus] = useState<ReportStatus>('idle');
  const [technicalStatus, setTechnicalStatus] = useState<ReportStatus>('idle');
  const [executiveResult, setExecutiveResult] = useState<ReportResult | null>(null);
  const [technicalResult, setTechnicalResult] = useState<ReportResult | null>(null);
  const [executiveError, setExecutiveError] = useState<string | null>(null);
  const [technicalError, setTechnicalError] = useState<string | null>(null);

  const backendConfigured = isExternalBackendConfigured();

  const getToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
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
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
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
          <Alert variant="default" className="border-yellow-500/40 bg-yellow-500/5">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-600 dark:text-yellow-400">
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

        {/* Report generators */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Executive */}
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
            <CardContent className="flex flex-col gap-3 flex-1">
              <Button
                onClick={handleGenerateExecutive}
                disabled={!backendConfigured || !toolRunId || executiveStatus === 'loading'}
                className="w-full"
              >
                {executiveStatus === 'loading' ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Génération…</>
                ) : 'Générer rapport DG / PDG'}
              </Button>

              {executiveStatus === 'success' && executiveResult && (
                <div className="flex items-start gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    Rapport créé —{' '}
                    <a
                      href={`/reports`}
                      className="underline underline-offset-2 inline-flex items-center gap-1"
                    >
                      Voir les rapports <ExternalLink className="h-3 w-3" />
                    </a>
                    <br />
                    <span className="font-mono text-xs text-muted-foreground">
                      {executiveResult.report_id}
                    </span>
                  </span>
                </div>
              )}
              {executiveStatus === 'error' && executiveError && (
                <div className="flex items-start gap-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{executiveError}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Technical */}
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
            <CardContent className="flex flex-col gap-3 flex-1">
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

              {technicalStatus === 'success' && technicalResult && (
                <div className="flex items-start gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    Rapport créé —{' '}
                    <a
                      href={`/reports`}
                      className="underline underline-offset-2 inline-flex items-center gap-1"
                    >
                      Voir les rapports <ExternalLink className="h-3 w-3" />
                    </a>
                    <br />
                    <span className="font-mono text-xs text-muted-foreground">
                      {technicalResult.report_id}
                    </span>
                  </span>
                </div>
              )}
              {technicalStatus === 'error' && technicalError && (
                <div className="flex items-start gap-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{technicalError}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

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
