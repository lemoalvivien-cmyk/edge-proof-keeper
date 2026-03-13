import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, Download, Upload, Shield, Hash, Clock, FileJson, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrustBanner } from '@/components/ui/TrustBanner';
import { ReportTabs } from '@/components/reports/ReportTabs';
import { FindingsTable } from '@/components/findings/FindingsTable';
import { useToolRun, useUploadToolRunArtifact } from '@/hooks/useTools';
import { useReportByToolRun, useGenerateReport } from '@/hooks/useReports';
import { useFindingsByToolRun, useNormalizeToolRun } from '@/hooks/useFindings';
import { CATEGORY_LABELS } from '@/types/tools';
import { useState, useRef } from 'react';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, string> = {
  requested: 'Demandé',
  awaiting_upload: 'En attente d\'upload',
  processing: 'Traitement en cours',
  done: 'Terminé',
  failed: 'Échec',
};

const STATUS_COLORS: Record<string, string> = {
  requested: 'bg-blue-500/10 text-blue-500',
  awaiting_upload: 'bg-yellow-500/10 text-yellow-500',
  processing: 'bg-purple-500/10 text-purple-500',
  done: 'bg-green-500/10 text-green-500',
  failed: 'bg-red-500/10 text-red-500',
};


export default function RunDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: run, isLoading } = useToolRun(id);
  const { data: report, refetch: refetchReport } = useReportByToolRun(id);
  const { data: findings = [], isLoading: findingsLoading, refetch: refetchFindings } = useFindingsByToolRun(id);
  const uploadMutation = useUploadToolRunArtifact();
  const generateReportMutation = useGenerateReport();
  const normalizeMutation = useNormalizeToolRun();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    setUploading(true);
    try {
      await uploadMutation.mutateAsync({ tool_run_id: id, file });
      toast.success('Fichier importé avec succès');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'import');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!id) return;
    try {
      await generateReportMutation.mutateAsync(id);
      refetchReport();
      toast.success('Rapport généré avec succès');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la génération');
    }
  };

  const handleNormalize = async () => {
    if (!id) return;
    try {
      await normalizeMutation.mutateAsync(id);
      refetchFindings();
      toast.success('Normalisation effectuée');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la normalisation');
    }
  };

  const handleExportJson = () => {
    if (!run?.normalized_output) return;
    const blob = new Blob([JSON.stringify(run.normalized_output, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `securit-e-run-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-4 w-96 bg-muted rounded" />
        </div>
      </AppLayout>
    );
  }

  if (!run) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Run non trouvé.</p>
          <Button variant="link" onClick={() => navigate('/runs')}>
            Retour aux imports
          </Button>
        </div>
      </AppLayout>
    );
  }

  const summaryFromDb = run.summary as { counts?: { critical?: number; high?: number; medium?: number; low?: number; info?: number; total?: number }; confidence?: string; limitations?: string[] } | undefined;

  return (
    <AppLayout>
      <div className="space-y-6 print:space-y-4">
        <div className="print:hidden">
          <TrustBanner />
        </div>

        <Button
          variant="ghost"
          onClick={() => navigate('/runs')}
          className="mb-4 print:hidden"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux imports
        </Button>

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between print:block">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {run.tools_catalog?.name || 'Import'}
              </h1>
              <Badge className={STATUS_COLORS[run.status]}>
                {STATUS_LABELS[run.status] || run.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {CATEGORY_LABELS[run.tools_catalog?.category || ''] || run.tools_catalog?.category}
              {' • '}
              {format(new Date(run.requested_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
            </p>
          </div>

          <div className="flex gap-2 print:hidden">
            {run.status === 'done' && findings.length === 0 && (
              <Button
                variant="outline"
                onClick={handleNormalize}
                disabled={normalizeMutation.isPending}
              >
                {normalizeMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Normalisation...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Normaliser
                  </>
                )}
              </Button>
            )}
            {run.status === 'done' && !report && (
              <Button
                onClick={handleGenerateReport}
                disabled={generateReportMutation.isPending}
              >
                {generateReportMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Générer rapports
                  </>
                )}
              </Button>
            )}
            {run.status === 'done' && run.normalized_output && (
              <Button variant="outline" onClick={handleExportJson}>
                <Download className="h-4 w-4 mr-2" />
                Exporter JSON
              </Button>
            )}
          </div>
        </div>

        {/* Report section */}
        {report && (
          <ReportTabs report={report} />
        )}

        {/* Upload zone for awaiting_upload status */}
        {run.status === 'awaiting_upload' && (
          <Card className="border-dashed border-2 print:hidden">
            <CardContent className="py-8">
              <div className="text-center space-y-4">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">Uploader le fichier résultat</h3>
                  <p className="text-sm text-muted-foreground">
                    {run.mode === 'import_json' && 'Format attendu : JSON'}
                    {run.mode === 'import_pdf' && 'Format attendu : PDF'}
                    {run.mode === 'import_csv' && 'Format attendu : CSV'}
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept={
                    run.mode === 'import_json' ? '.json,application/json' :
                    run.mode === 'import_pdf' ? '.pdf,application/pdf' :
                    '.csv,text/csv'
                  }
                  onChange={handleFileUpload}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Import en cours...' : 'Sélectionner un fichier'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Evidence info */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 print:grid-cols-2 print:gap-2">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Hash className="h-5 w-5 text-primary" />
                <div className="overflow-hidden">
                  <p className="text-sm text-muted-foreground">Hash SHA-256</p>
                  <p className="font-mono text-xs truncate">
                    {run.input_artifact_hash || '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Complété</p>
                  <p className="font-medium">
                    {run.completed_at
                      ? format(new Date(run.completed_at), 'dd/MM/yyyy HH:mm', { locale: fr })
                      : '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <FileJson className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Mode</p>
                  <p className="font-medium">
                    {run.mode.replace('import_', '').toUpperCase()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total findings</p>
                  <p className="font-medium">{summaryFromDb?.counts?.total ?? findings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary counts */}
        {summaryFromDb?.counts && !report && (
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle>Résumé des findings</CardTitle>
              {summaryFromDb.confidence && (
                <CardDescription>
                  Confiance: {summaryFromDb.confidence}
                  {summaryFromDb.limitations && summaryFromDb.limitations.length > 0 && (
                    <span className="text-destructive ml-2">
                      ({summaryFromDb.limitations.join(', ')})
                    </span>
                  )}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500" />
                  <span className="font-medium">{summaryFromDb.counts.critical ?? 0}</span>
                  <span className="text-muted-foreground">Critical</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-orange-500" />
                  <span className="font-medium">{summaryFromDb.counts.high ?? 0}</span>
                  <span className="text-muted-foreground">High</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-500" />
                  <span className="font-medium">{summaryFromDb.counts.medium ?? 0}</span>
                  <span className="text-muted-foreground">Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-500" />
                  <span className="font-medium">{summaryFromDb.counts.low ?? 0}</span>
                  <span className="text-muted-foreground">Low</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-500" />
                  <span className="font-medium">{summaryFromDb.counts.info ?? 0}</span>
                  <span className="text-muted-foreground">Info</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Findings table from DB */}
        {findings.length > 0 && !report && (
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle>Findings ({findings.length})</CardTitle>
              <CardDescription>
                Résultats normalisés stockés en base
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FindingsTable findings={findings} isLoading={findingsLoading} showFilters={false} />
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {run.normalized_output?.notes && !report && (
          <Alert className="print:hidden">
            <AlertDescription>
              {run.normalized_output.notes}
            </AlertDescription>
          </Alert>
        )}

        {/* Evidence Vault link */}
        <Card className="print:hidden">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Evidence Vault</p>
                <p className="text-sm text-muted-foreground">
                  Cet import est tracé dans le journal de preuves
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate('/evidence')}>
                Voir le journal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
