import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, FileCheck, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthorization } from '@/hooks/useAuthorization';

interface AuthorizationGateProps {
  children: React.ReactNode;
}

// Routes that don't require a valid authorization
const EXEMPT_ROUTES = [
  '/authorization/new',
  '/authorizations',
  '/scopeguard',
  '/settings',
  '/onboarding',
  '/legal',
];

function isRouteExempt(pathname: string): boolean {
  return EXEMPT_ROUTES.some(route => pathname.startsWith(route));
}

export function AuthorizationGate({ children }: AuthorizationGateProps) {
  const { hasValidAuthorization, isLoading } = useAuthorization();
  const navigate = useNavigate();
  const location = useLocation();

  // Allow exempt routes without checking authorization
  if (isRouteExempt(location.pathname)) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hasValidAuthorization) {
    return <>{children}</>;
  }

  // Blocking screen for unauthorized access
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
        
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Autorisation requise
        </h1>
        
        <p className="mb-6 text-muted-foreground">
          Pour utiliser Sentinel Edge, vous devez d'abord fournir une preuve d'autorisation légale.
          Cette étape est obligatoire pour garantir la conformité et protéger votre organisation.
        </p>

        <div className="mb-8 rounded-lg border bg-muted/50 p-4 text-left">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Pourquoi cette étape ?</p>
              <p className="text-muted-foreground mt-1">
                Toute opération de scan ou d'import nécessite une autorisation légale documentée.
                Cela vous protège et assure la traçabilité pour les audits de conformité.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            size="lg" 
            onClick={() => navigate('/authorization/new')}
            className="w-full"
          >
            <FileCheck className="h-4 w-4 mr-2" />
            Créer une autorisation
          </Button>
          
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => navigate('/authorizations')}
            className="w-full"
          >
            Voir mes autorisations
          </Button>
        </div>
      </div>
    </div>
  );
}
