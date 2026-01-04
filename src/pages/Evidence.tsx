import { BookOpen, User, Shield, FileCheck, Server, Scan } from 'lucide-react';
import { useEvidenceLog } from '@/hooks/useEvidenceLog';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

export default function Evidence() {
  const { logs, isLoading } = useEvidenceLog();

  const getActionIcon = (action: string) => {
    if (action.includes('authorization')) return <FileCheck className="h-4 w-4" />;
    if (action.includes('asset')) return <Server className="h-4 w-4" />;
    if (action.includes('scan')) return <Scan className="h-4 w-4" />;
    if (action.includes('login') || action.includes('user')) return <User className="h-4 w-4" />;
    return <Shield className="h-4 w-4" />;
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'authorization_created': return 'Autorisation créée';
      case 'asset_created': return 'Actif ajouté';
      case 'scan_created': return 'Scan importé';
      case 'login': return 'Connexion';
      case 'logout': return 'Déconnexion';
      default: return action.replace(/_/g, ' ');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Journal de Preuves</h1>
          <p className="text-muted-foreground">
            Historique immuable de toutes les actions effectuées dans la plateforme.
          </p>
        </div>

        {/* Info Banner */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-start gap-4 pt-6">
            <Shield className="h-6 w-6 text-primary shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Journal append-only</p>
              <p className="text-muted-foreground mt-1">
                Ce journal est immuable : aucune entrée ne peut être modifiée ou supprimée. 
                Chaque action est horodatée et associée à une adresse IP pour garantir la traçabilité.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Historique des événements
            </CardTitle>
            <CardDescription>
              {logs.length} événement(s) enregistré(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Aucun événement</p>
                <p className="text-sm text-muted-foreground">
                  Les actions seront enregistrées ici
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {logs.map(log => (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 rounded-lg border p-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                        {getActionIcon(log.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{getActionLabel(log.action)}</p>
                          <Badge variant="outline" className="text-xs">
                            {log.entity_type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(log.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {log.ip_address && (
                            <span className="font-mono">IP: {log.ip_address}</span>
                          )}
                          {log.artifact_hash && (
                            <span className="font-mono truncate max-w-[200px]">
                              Hash: {log.artifact_hash.slice(0, 16)}...
                            </span>
                          )}
                        </div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="mt-2 p-2 rounded bg-muted text-xs font-mono">
                            {JSON.stringify(log.details, null, 2)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
