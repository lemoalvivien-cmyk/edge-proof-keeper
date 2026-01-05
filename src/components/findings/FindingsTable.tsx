import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MoreHorizontal, Shield, AlertTriangle, Info, CheckCircle, XCircle, Eye, ListTodo } from 'lucide-react';
import type { Finding, FindingStatus, RiskLevel } from '@/types/findings';
import { useUpdateFindingStatus } from '@/hooks/useFindings';
import { useTasksByFinding } from '@/hooks/useRemediation';
import { CreateTaskDialog } from '@/components/remediation/CreateTaskDialog';
import { toast } from 'sonner';

interface FindingsTableProps {
  findings: Finding[];
  isLoading?: boolean;
  showFilters?: boolean;
  onFilterChange?: (filters: {
    severity?: RiskLevel;
    status?: FindingStatus;
    finding_type?: string;
  }) => void;
}

const severityConfig: Record<RiskLevel, { label: string; className: string; icon: React.ReactNode }> = {
  critical: { label: 'Critique', className: 'bg-destructive text-destructive-foreground', icon: <AlertTriangle className="h-3 w-3" /> },
  high: { label: 'Élevé', className: 'bg-orange-500 text-white', icon: <AlertTriangle className="h-3 w-3" /> },
  medium: { label: 'Moyen', className: 'bg-yellow-500 text-black', icon: <Shield className="h-3 w-3" /> },
  low: { label: 'Faible', className: 'bg-blue-500 text-white', icon: <Info className="h-3 w-3" /> },
  info: { label: 'Info', className: 'bg-muted text-muted-foreground', icon: <Info className="h-3 w-3" /> },
};

const statusConfig: Record<FindingStatus, { label: string; className: string }> = {
  open: { label: 'Ouvert', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  acknowledged: { label: 'Accepté', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  remediated: { label: 'Remédié', className: 'bg-green-500/10 text-green-600 border-green-500/20' },
  false_positive: { label: 'Faux positif', className: 'bg-muted text-muted-foreground border-muted' },
};

const findingTypes = [
  { value: 'subdomain', label: 'Sous-domaine' },
  { value: 'open_port', label: 'Port ouvert' },
  { value: 'tls_issue', label: 'Problème TLS' },
  { value: 'secret_leak', label: 'Fuite de secret' },
  { value: 'vuln_template', label: 'Vulnérabilité' },
  { value: 'dependency', label: 'Dépendance' },
  { value: 'iac_misconfig', label: 'Mauvaise config IaC' },
  { value: 'unknown', label: 'Inconnu' },
];

export function FindingsTable({ findings, isLoading, showFilters = true, onFilterChange }: FindingsTableProps) {
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [createTaskFinding, setCreateTaskFinding] = useState<Finding | null>(null);
  
  const updateStatus = useUpdateFindingStatus();

  const handleFilterChange = (type: 'severity' | 'status' | 'finding_type', value: string) => {
    const newFilters: { severity?: RiskLevel; status?: FindingStatus; finding_type?: string } = {};
    
    if (type === 'severity') {
      setSeverityFilter(value);
      if (value !== 'all') newFilters.severity = value as RiskLevel;
    } else {
      if (severityFilter !== 'all') newFilters.severity = severityFilter as RiskLevel;
    }
    
    if (type === 'status') {
      setStatusFilter(value);
      if (value !== 'all') newFilters.status = value as FindingStatus;
    } else {
      if (statusFilter !== 'all') newFilters.status = statusFilter as FindingStatus;
    }
    
    if (type === 'finding_type') {
      setTypeFilter(value);
      if (value !== 'all') newFilters.finding_type = value;
    } else {
      if (typeFilter !== 'all') newFilters.finding_type = typeFilter;
    }
    
    onFilterChange?.(newFilters);
  };

  const handleStatusUpdate = async (findingId: string, status: FindingStatus) => {
    try {
      await updateStatus.mutateAsync({ findingId, status });
      toast.success('Statut mis à jour');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex flex-wrap gap-4">
          <Select value={severityFilter} onValueChange={(v) => handleFilterChange('severity', v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sévérité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="critical">Critique</SelectItem>
              <SelectItem value="high">Élevé</SelectItem>
              <SelectItem value="medium">Moyen</SelectItem>
              <SelectItem value="low">Faible</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => handleFilterChange('status', v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="open">Ouvert</SelectItem>
              <SelectItem value="acknowledged">Accepté</SelectItem>
              <SelectItem value="remediated">Remédié</SelectItem>
              <SelectItem value="false_positive">Faux positif</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={(v) => handleFilterChange('finding_type', v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {findingTypes.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {findings.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Aucun finding trouvé
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead className="w-[100px]">Sévérité</TableHead>
                <TableHead className="w-[100px]">Confiance</TableHead>
                <TableHead className="w-[100px]">Statut</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {findings.map((finding) => {
                const sevConfig = severityConfig[finding.severity];
                const statConfig = statusConfig[finding.status];
                const typeLabel = findingTypes.find(t => t.value === finding.finding_type)?.label || finding.finding_type;
                
                return (
                  <TableRow key={finding.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {sevConfig.icon}
                        <span className="truncate max-w-[300px]">{finding.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {typeLabel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={sevConfig.className}>
                        {sevConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {finding.confidence}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statConfig.className}>
                        {statConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedFinding(finding)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusUpdate(finding.id, 'remediated')}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Marquer remédié
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusUpdate(finding.id, 'false_positive')}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Faux positif
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusUpdate(finding.id, 'acknowledged')}>
                            <Shield className="mr-2 h-4 w-4" />
                            Marquer accepté
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setCreateTaskFinding(finding)}>
                            <ListTodo className="mr-2 h-4 w-4" />
                            Créer une tâche
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Finding Detail Dialog */}
      <Dialog open={!!selectedFinding} onOpenChange={() => setSelectedFinding(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedFinding?.title}</DialogTitle>
            <DialogDescription>
              Détails du finding
            </DialogDescription>
          </DialogHeader>
          
          {selectedFinding && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Sévérité</p>
                  <Badge className={severityConfig[selectedFinding.severity].className}>
                    {severityConfig[selectedFinding.severity].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Confiance</p>
                  <Badge variant="outline" className="capitalize">{selectedFinding.confidence}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{findingTypes.find(t => t.value === selectedFinding.finding_type)?.label || selectedFinding.finding_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <Badge variant="outline" className={statusConfig[selectedFinding.status].className}>
                    {statusConfig[selectedFinding.status].label}
                  </Badge>
                </div>
              </div>

              {Object.keys(selectedFinding.evidence || {}).length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Evidence</p>
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                    {JSON.stringify(selectedFinding.evidence, null, 2)}
                  </pre>
                </div>
              )}

              {selectedFinding.references && selectedFinding.references.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Références</p>
                  <ul className="list-disc list-inside text-sm">
                    {selectedFinding.references.map((ref, i) => (
                      <li key={i} className="truncate">
                        {ref.startsWith('http') ? (
                          <a href={ref} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {ref}
                          </a>
                        ) : ref}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedFinding.finding_control_links && selectedFinding.finding_control_links.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Mapping Conformité</p>
                  <div className="space-y-2">
                    {selectedFinding.finding_control_links.map((link) => (
                      <div key={link.id} className="border rounded-md p-3 text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{link.framework.toUpperCase()}</Badge>
                          <span className="font-medium">
                            {link.compliance_controls?.control_id || 'N/A'}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{link.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                <p>Première détection : {new Date(selectedFinding.first_seen).toLocaleString('fr-FR')}</p>
                <p>Dernière mise à jour : {new Date(selectedFinding.updated_at).toLocaleString('fr-FR')}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={!!createTaskFinding}
        onOpenChange={(open) => !open && setCreateTaskFinding(null)}
        defaultFindingId={createTaskFinding?.id}
        defaultTitle={createTaskFinding ? `Remédier: ${createTaskFinding.title.substring(0, 50)}...` : undefined}
        defaultPriority={createTaskFinding?.severity}
      />
    </div>
  );
}
