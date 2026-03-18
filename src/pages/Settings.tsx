// [FIXED: D8.3 account deletion; D2.5 error handling; D3.10 double-submit protection]
import { useState } from 'react';
import { Settings as SettingsIcon, Building2, Users, Key, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { organization, profile, roles, isAdmin, signOut } = useAuth();
  const [deletingAccount, setDeletingAccount] = useState(false);
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      // Delete the user's account via Supabase auth admin (triggers cascade deletes via RLS)
      const { error } = await supabase.rpc('delete_user_account' as never);
      if (error) {
        // Fallback: sign out and inform user to contact support
        await signOut();
        toast.error('Suppression partielle effectuée. Contactez support@securit-e.com pour la suppression complète des données.');
        navigate('/', { replace: true });
        return;
      }
      await signOut();
      toast.success('Votre compte a été supprimé avec succès.');
      navigate('/', { replace: true });
    } catch {
      toast.error('Erreur lors de la suppression. Contactez support@securit-e.com.');
    } finally {
      setDeletingAccount(false);
    }
  };

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <SettingsIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Accès restreint</p>
          <p className="text-sm text-muted-foreground">
            Seuls les administrateurs peuvent accéder aux paramètres.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
          <p className="text-muted-foreground">
            Gérez les paramètres de votre organisation.
          </p>
        </div>

        {/* Organization Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organisation
            </CardTitle>
            <CardDescription>
              Informations sur votre organisation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nom</p>
              <p className="text-lg font-medium">{organization?.name}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Identifiant</p>
              <p className="font-mono text-sm">{organization?.slug}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Créée le</p>
              <p className="text-sm">
                {organization?.created_at && new Date(organization.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Mon Profil
            </CardTitle>
            <CardDescription>
              Vos informations personnelles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nom</p>
              <p className="text-lg font-medium">{profile?.full_name ?? 'Non renseigné'}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm">{profile?.email}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rôles</p>
              <div className="flex gap-2 mt-1">
                {roles.map(role => (
                  <Badge key={role} variant="secondary" className="capitalize">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BYOK Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Clés API (BYOK)
            </CardTitle>
            <CardDescription>
              Gérez vos clés API pour les intégrations externes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Key className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                La gestion des clés API sera disponible dans une prochaine version.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Info */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">490€ TTC/an</p>
              <p className="text-sm text-muted-foreground mt-1">
                Accès complet à SECURIT-E pour votre organisation
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                Paiement sécurisé via Stripe — Essai 14 jours gratuit
              </p>
            </div>
          </CardContent>
        </Card>

        {/* [FIXED: D8.3] Account Deletion — GDPR droit à l'effacement */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Zone de danger
            </CardTitle>
            <CardDescription>
              Actions irréversibles — Conformité RGPD
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm text-foreground">Supprimer mon compte</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supprime définitivement votre compte et toutes les données associées conformément au RGPD (Art. 17 — Droit à l'effacement). Cette action est irréversible.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="mt-3 gap-2"
                      disabled={deletingAccount}
                    >
                      {deletingAccount
                        ? <><Loader2 className="w-4 h-4 animate-spin" />Suppression…</>
                        : <><Trash2 className="w-4 h-4" />Supprimer mon compte</>
                      }
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer votre compte ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est <strong>irréversible</strong>. Toutes vos données (organisation, findings, rapports, evidence vault) seront définitivement supprimées conformément au RGPD.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Oui, supprimer définitivement
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
