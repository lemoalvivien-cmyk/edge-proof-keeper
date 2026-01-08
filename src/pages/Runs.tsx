import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Eye, Filter, Search, Plus } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrustBanner } from '@/components/ui/TrustBanner';
import { useToolRuns } from '@/hooks/useTools';
import { CATEGORY_LABELS, ToolRunStatus } from '@/types/tools';

const STATUS_LABELS: Record<ToolRunStatus, string> = {
  requested: 'Demandé',
  awaiting_upload: 'En attente d\'upload',
  processing: 'Traitement',
  done: 'Terminé',
  failed: 'Échec',
};

const STATUS_COLORS: Record<ToolRunStatus, string> = {
  requested: 'bg-blue-500/10 text-blue-500',
  awaiting_upload: 'bg-yellow-500/10 text-yellow-500',
  processing: 'bg-purple-500/10 text-purple-500',
  done: 'bg-green-500/10 text-green-500',
  failed: 'bg-red-500/10 text-red-500',
};

export default function Runs() {
  const navigate = useNavigate();
  const { data: runs, isLoading } = useToolRuns();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredRuns = runs?.filter(run => {
    const matchesSearch = run.tools_catalog?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || run.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <TrustBanner />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Imports & Runs</h1>
            <p className="text-muted-foreground">
              Historique des imports de résultats
            </p>
          </div>
          <Button onClick={() => navigate('/tools')}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel import
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par outil..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Runs table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Chargement...
              </div>
            ) : filteredRuns.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Aucun import trouvé.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Outil</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Findings</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRuns.map(run => (
                    <TableRow key={run.id}>
                      <TableCell className="font-medium">
                        {run.tools_catalog?.name || 'Outil inconnu'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {CATEGORY_LABELS[run.tools_catalog?.category || ''] || run.tools_catalog?.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[run.status as ToolRunStatus]}>
                          {STATUS_LABELS[run.status as ToolRunStatus] || run.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {run.summary ? (
                          <div className="flex gap-1 text-xs">
                            {(run.summary.critical ?? 0) > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {run.summary.critical} C
                              </Badge>
                            )}
                            {(run.summary.high ?? 0) > 0 && (
                              <Badge className="bg-orange-500/10 text-orange-500 text-xs">
                                {run.summary.high} H
                              </Badge>
                            )}
                            {(run.summary.medium ?? 0) > 0 && (
                              <Badge className="bg-yellow-500/10 text-yellow-500 text-xs">
                                {run.summary.medium} M
                              </Badge>
                            )}
                            {(run.summary.low ?? 0) > 0 && (
                              <Badge className="bg-blue-500/10 text-blue-500 text-xs">
                                {run.summary.low} L
                              </Badge>
                            )}
                            {run.summary.total === 0 && (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(run.requested_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/runs/${run.id}`)}
                        >
                          <Eye className="h-4 w-4" />
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