import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileText, ExternalLink } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrustBanner } from '@/components/ui/TrustBanner';
import { useReports } from '@/hooks/useReports';

const STATUS_LABELS: Record<string, string> = {
  generating: 'Génération...',
  ready: 'Prêt',
  failed: 'Échec',
};

const STATUS_COLORS: Record<string, string> = {
  generating: 'bg-yellow-500/10 text-yellow-500',
  ready: 'bg-green-500/10 text-green-500',
  failed: 'bg-red-500/10 text-red-500',
};

export default function Reports() {
  const navigate = useNavigate();
  const { data: reports, isLoading } = useReports();

  return (
    <AppLayout>
      <div className="space-y-6">
        <TrustBanner />

        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Rapports
          </h1>
          <p className="text-muted-foreground mt-1">
            Rapports générés à partir de vos imports
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historique des rapports</CardTitle>
            <CardDescription>
              Tous les rapports générés pour votre organisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : !reports || reports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucun rapport généré</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Les rapports sont générés à partir des imports terminés
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate('/runs')}
                >
                  Voir les imports
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Outil</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Confiance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        {report.tool_runs?.tools_catalog?.name || 'Import'}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[report.status]}>
                          {STATUS_LABELS[report.status] || report.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(report.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        {report.status === 'ready' && report.executive_json ? (
                          <Badge variant="outline">
                            {report.executive_json.confidence}
                          </Badge>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/runs/${report.tool_run_id}`)}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Voir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
