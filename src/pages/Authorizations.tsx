import { Link } from 'react-router-dom';
import { FileCheck, Plus, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuthorization } from '@/hooks/useAuthorization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

export default function Authorizations() {
  const { authorizations, isLoading } = useAuthorization();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approuvée
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
      case 'expired':
      case 'revoked':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            {status === 'expired' ? 'Expirée' : 'Révoquée'}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Autorisations</h1>
            <p className="text-muted-foreground">
              Gérez vos preuves d'autorisation légales pour les opérations de sécurité.
            </p>
          </div>
          <Button asChild>
            <Link to="/authorizations/new">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle autorisation
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Historique des autorisations
            </CardTitle>
            <CardDescription>
              Liste de toutes les autorisations créées pour votre organisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : authorizations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileCheck className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Aucune autorisation</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Créez votre première autorisation pour commencer
                </p>
                <Button asChild>
                  <Link to="/authorizations/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une autorisation
                  </Link>
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {authorizations.map(auth => (
                    <div
                      key={auth.id}
                      className="flex items-start justify-between rounded-lg border p-4"
                    >
                      <div className="space-y-1 flex-1 mr-4">
                        <p className="font-medium line-clamp-2">{auth.scope}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            Créée le {new Date(auth.created_at).toLocaleDateString('fr-FR')}
                          </span>
                          {auth.valid_until && (
                            <span>
                              Expire le {new Date(auth.valid_until).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {auth.consent_checkbox && (
                            <Badge variant="outline" className="text-xs">
                              Consentement validé
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs font-mono">
                            Hash: {auth.document_hash.slice(0, 12)}...
                          </Badge>
                        </div>
                      </div>
                      {getStatusBadge(auth.status)}
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
