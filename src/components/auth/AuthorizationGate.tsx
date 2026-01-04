import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, FileCheck, Shield } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useAuthorization } from '@/hooks/useAuthorization';

interface AuthorizationGateProps {
  children: React.ReactNode;
  actionDescription?: string;
}

export function AuthorizationGate({ children, actionDescription = 'cette action' }: AuthorizationGateProps) {
  const { hasValidAuthorization, isLoading } = useAuthorization();
  const [showDialog, setShowDialog] = useState(false);
  const navigate = useNavigate();

  if (isLoading) {
    return <>{children}</>;
  }

  if (hasValidAuthorization) {
    return <>{children}</>;
  }

  return (
    <>
      <div 
        onClick={() => setShowDialog(true)} 
        className="cursor-pointer"
      >
        {children}
      </div>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <AlertDialogTitle className="text-xl">
                Autorisation requise
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base">
              Pour effectuer {actionDescription}, vous devez d'abord fournir une preuve d'autorisation légale.
              <br /><br />
              <strong>Ceci est obligatoire</strong> pour garantir la conformité et protéger votre organisation.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4 rounded-lg border bg-muted/50 p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Pourquoi cette étape ?</p>
                <p className="text-muted-foreground mt-1">
                  Toute action de scan ou d'import actif nécessite une autorisation légale documentée. 
                  Cela vous protège et assure la traçabilité pour les audits.
                </p>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={() => navigate('/authorizations/new')}>
                <FileCheck className="h-4 w-4 mr-2" />
                Créer une autorisation
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
