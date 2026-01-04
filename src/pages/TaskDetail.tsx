import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  MessageSquare, 
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Pause,
  XCircle,
  Link2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRemediationTask, useTaskComments, useUpdateTask, useAddComment } from '@/hooks/useRemediation';
import { toast } from 'sonner';
import type { TaskStatus, RiskLevel } from '@/types/remediation';

const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: React.ReactNode; color: string }> = {
  open: { label: 'Ouvert', icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-blue-500/10 text-blue-600' },
  in_progress: { label: 'En cours', icon: <Clock className="h-4 w-4" />, color: 'bg-yellow-500/10 text-yellow-600' },
  blocked: { label: 'Bloqué', icon: <Pause className="h-4 w-4" />, color: 'bg-orange-500/10 text-orange-600' },
  done: { label: 'Terminé', icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-green-500/10 text-green-600' },
  cancelled: { label: 'Annulé', icon: <XCircle className="h-4 w-4" />, color: 'bg-muted text-muted-foreground' },
};

const PRIORITY_LABELS: Record<RiskLevel, string> = {
  critical: 'Critique',
  high: 'Élevée',
  medium: 'Moyenne',
  low: 'Faible',
  info: 'Info',
};

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: task, isLoading } = useRemediationTask(id);
  const { data: comments = [], isLoading: commentsLoading } = useTaskComments(id);
  const updateMutation = useUpdateTask();
  const addCommentMutation = useAddComment();
  const [newComment, setNewComment] = useState('');

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!id) return;
    try {
      await updateMutation.mutateAsync({ id, status: newStatus });
      toast.success('Statut mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleAddComment = async () => {
    if (!id || !newComment.trim()) return;
    try {
      await addCommentMutation.mutateAsync({ task_id: id, body: newComment.trim() });
      setNewComment('');
      toast.success('Commentaire ajouté');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du commentaire');
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!task) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Tâche non trouvée.</p>
          <Button variant="link" onClick={() => navigate('/tasks')}>
            Retour aux tâches
          </Button>
        </div>
      </AppLayout>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const isOverdue = task.due_date && task.due_date < today && 
    ['open', 'in_progress', 'blocked'].includes(task.status);

  return (
    <AppLayout>
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/tasks')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux tâches
        </Button>

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{task.title}</h1>
            <p className="text-muted-foreground mt-1">
              Créée le {format(new Date(task.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
              {task.creator && ` par ${task.creator.full_name || task.creator.email}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={task.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Ouvert</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="blocked">Bloqué</SelectItem>
                <SelectItem value="done">Terminé</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Overdue warning */}
        {isOverdue && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Tâche en retard</p>
                <p className="text-sm text-muted-foreground">
                  L'échéance était fixée au {format(new Date(task.due_date!), 'dd/MM/yyyy', { locale: fr })}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                {task.description ? (
                  <p className="whitespace-pre-wrap">{task.description}</p>
                ) : (
                  <p className="text-muted-foreground">Aucune description</p>
                )}
              </CardContent>
            </Card>

            {/* Comments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Commentaires ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {commentsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Aucun commentaire
                  </p>
                ) : (
                  <div className="space-y-4">
                    {comments.map(comment => (
                      <div key={comment.id} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {comment.author?.full_name || comment.author?.email || 'Utilisateur'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(comment.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add comment */}
                <div className="flex gap-2 pt-4 border-t">
                  <Textarea
                    placeholder="Ajouter un commentaire..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <Button 
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || addCommentMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Status & Priority */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Détails</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Statut</span>
                  <Badge className={STATUS_CONFIG[task.status].color}>
                    {STATUS_CONFIG[task.status].icon}
                    <span className="ml-1">{STATUS_CONFIG[task.status].label}</span>
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Priorité</span>
                  <Badge variant="outline">
                    {PRIORITY_LABELS[task.priority]}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Assigné</span>
                  <span className="text-sm">
                    {task.owner ? (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {task.owner.full_name || task.owner.email}
                      </div>
                    ) : (
                      '—'
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Échéance</span>
                  <span className={`text-sm ${isOverdue ? 'text-destructive font-medium' : ''}`}>
                    {task.due_date ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(task.due_date), 'dd/MM/yyyy', { locale: fr })}
                      </div>
                    ) : (
                      '—'
                    )}
                  </span>
                </div>
                {task.closed_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Clôturée</span>
                    <span className="text-sm">
                      {format(new Date(task.closed_at), 'dd/MM/yyyy', { locale: fr })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Linked Finding */}
            {task.findings && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Finding associé
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      const finding = task.findings as { tool_run_id?: string };
                      if (finding?.tool_run_id) {
                        navigate(`/runs/${finding.tool_run_id}`);
                      }
                    }}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    <span className="truncate">{task.findings.title}</span>
                  </Button>
                  <Badge 
                    variant="outline" 
                    className="mt-2"
                  >
                    {task.findings.severity}
                  </Badge>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
