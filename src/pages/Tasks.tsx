import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  ListTodo, 
  Plus, 
  AlertTriangle, 
  Clock, 
  User,
  CheckCircle2,
  XCircle,
  Pause,
  ArrowRight,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CreateTaskDialog } from '@/components/remediation/CreateTaskDialog';
import { useRemediationTasks, useTaskCounts } from '@/hooks/useRemediation';
import { useAuth } from '@/contexts/AuthContext';
import type { TaskStatus, RiskLevel } from '@/types/remediation';

const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: React.ReactNode; color: string }> = {
  open: { label: 'Ouvert', icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-blue-500/10 text-blue-600' },
  in_progress: { label: 'En cours', icon: <Clock className="h-4 w-4" />, color: 'bg-yellow-500/10 text-yellow-600' },
  blocked: { label: 'Bloqué', icon: <Pause className="h-4 w-4" />, color: 'bg-orange-500/10 text-orange-600' },
  done: { label: 'Terminé', icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-green-500/10 text-green-600' },
  cancelled: { label: 'Annulé', icon: <XCircle className="h-4 w-4" />, color: 'bg-muted text-muted-foreground' },
};

const PRIORITY_COLORS: Record<RiskLevel, string> = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-white',
  low: 'bg-blue-500 text-white',
  info: 'bg-gray-500 text-white',
};

export default function Tasks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<RiskLevel | 'all'>('all');
  const [ownerFilter, setOwnerFilter] = useState<'all' | 'me'>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: tasks = [], isLoading } = useRemediationTasks({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    priority: priorityFilter !== 'all' ? priorityFilter : undefined,
    owner_id: ownerFilter === 'me' ? user?.id : undefined,
  });
  const { data: counts } = useTaskCounts();

  const today = new Date().toISOString().split('T')[0];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Remédiation</h1>
            <p className="text-muted-foreground">
              Gérez les tâches de remédiation et suivez leur avancement
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle tâche
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="cursor-pointer hover:border-primary" onClick={() => setStatusFilter('open')}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{counts?.open ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Ouvertes</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary" onClick={() => setStatusFilter('in_progress')}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{counts?.in_progress ?? 0}</p>
                  <p className="text-sm text-muted-foreground">En cours</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-destructive border-destructive/50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-destructive">{counts?.overdue ?? 0}</p>
                  <p className="text-sm text-muted-foreground">En retard</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary" onClick={() => setStatusFilter('done')}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{counts?.done ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Terminées (30j)</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TaskStatus | 'all')}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="open">Ouvert</SelectItem>
              <SelectItem value="in_progress">En cours</SelectItem>
              <SelectItem value="blocked">Bloqué</SelectItem>
              <SelectItem value="done">Terminé</SelectItem>
              <SelectItem value="cancelled">Annulé</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as RiskLevel | 'all')}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Priorité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes priorités</SelectItem>
              <SelectItem value="critical">Critique</SelectItem>
              <SelectItem value="high">Élevée</SelectItem>
              <SelectItem value="medium">Moyenne</SelectItem>
              <SelectItem value="low">Faible</SelectItem>
            </SelectContent>
          </Select>
          <Select value={ownerFilter} onValueChange={(v) => setOwnerFilter(v as 'all' | 'me')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Assigné" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les tâches</SelectItem>
              <SelectItem value="me">Mes tâches</SelectItem>
            </SelectContent>
          </Select>
          {(statusFilter !== 'all' || priorityFilter !== 'all' || ownerFilter !== 'all') && (
            <Button 
              variant="ghost" 
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
                setOwnerFilter('all');
              }}
            >
              Réinitialiser
            </Button>
          )}
        </div>

        {/* Tasks Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              Tâches ({tasks.length})
            </CardTitle>
            <CardDescription>
              Cliquez sur une tâche pour voir les détails
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Aucune tâche</p>
                <p className="text-sm text-muted-foreground">
                  Créez une tâche de remédiation pour commencer
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Assigné</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead>Finding</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map(task => {
                    const isOverdue = task.due_date && task.due_date < today && 
                      ['open', 'in_progress', 'blocked'].includes(task.status);
                    
                    return (
                      <TableRow 
                        key={task.id} 
                        className={`cursor-pointer ${isOverdue ? 'bg-destructive/5' : ''}`}
                        onClick={() => navigate(`/tasks/${task.id}`)}
                      >
                        <TableCell className="font-medium max-w-xs truncate">
                          {task.title}
                        </TableCell>
                        <TableCell>
                          <Badge className={PRIORITY_COLORS[task.priority]}>
                            {task.priority === 'critical' ? 'Critique' :
                             task.priority === 'high' ? 'Élevée' :
                             task.priority === 'medium' ? 'Moyenne' :
                             task.priority === 'low' ? 'Faible' : 'Info'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_CONFIG[task.status].color}>
                            {STATUS_CONFIG[task.status].icon}
                            <span className="ml-1">{STATUS_CONFIG[task.status].label}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {task.owner ? (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {task.owner.full_name || task.owner.email}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {task.due_date ? (
                            <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                              {format(new Date(task.due_date), 'dd/MM/yyyy', { locale: fr })}
                              {isOverdue && ' ⚠️'}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {task.findings ? (
                            <Badge variant="outline" className="max-w-[150px] truncate">
                              {task.findings.title}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateTaskDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
      />
    </AppLayout>
  );
}
