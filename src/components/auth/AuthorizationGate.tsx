import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthorization } from '@/hooks/useAuthorization';
import { usePermanentAuthorization } from '@/hooks/usePermanentAuthorization';
import { useAuth } from '@/contexts/AuthContext';

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
  const { hasValidAuthorization, isLoading, refetch } = useAuthorization();
  const { ensurePermanentAuthorization, isCreating } = usePermanentAuthorization();
  const { user, organization } = useAuth();
  const location = useLocation();
  const [isEnsuring, setIsEnsuring] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);

  // Allow exempt routes without checking authorization
  if (isRouteExempt(location.pathname)) {
    return <>{children}</>;
  }

  // Auto-create permanent authorization if none exists
  useEffect(() => {
    const autoEnsure = async () => {
      if (
        !isLoading &&
        !hasValidAuthorization &&
        !isEnsuring &&
        !hasAttempted &&
        user?.id &&
        organization?.id
      ) {
        setIsEnsuring(true);
        setHasAttempted(true);
        
        const authId = await ensurePermanentAuthorization();
        
        if (authId) {
          // Refetch authorizations to update state
          await refetch();
        }
        
        setIsEnsuring(false);
      }
    };

    autoEnsure();
  }, [isLoading, hasValidAuthorization, isEnsuring, hasAttempted, user?.id, organization?.id, ensurePermanentAuthorization, refetch]);

  // Show loader while checking or creating authorization
  if (isLoading || isCreating || isEnsuring) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {isCreating || isEnsuring 
              ? 'Configuration de votre autorisation...' 
              : 'Chargement...'}
          </p>
        </div>
      </div>
    );
  }

  // If we've attempted and still no authorization, show a simple error
  // This should rarely happen in solo mode
  if (!hasValidAuthorization && hasAttempted) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive">Erreur lors de la création de l'autorisation.</p>
          <p className="text-sm text-muted-foreground mt-2">Veuillez rafraîchir la page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
