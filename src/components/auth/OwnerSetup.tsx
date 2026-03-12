import { useState } from 'react';
import { Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SOLO_STORAGE_KEYS } from '@/config/app';

/**
 * OwnerSetup — authentification uniquement.
 *
 * RESPONSABILITÉ UNIQUE : gérer le signup / signin Supabase.
 * bootstrapOwner() est EXCLUSIVEMENT déclenché par AuthContext.fetchUserData
 * lorsqu'aucun profil n'existe pour l'utilisateur connecté.
 *
 * Ce composant NE doit PAS appeler bootstrapOwner() : cela crée
 * un double appel (OwnerSetup + AuthContext) qui génère un conflit
 * RLS sur organizations (l'org est déjà créée, le rôle existe,
 * la policy "Bootstrap: no-role user" bloque le second INSERT).
 *
 * SÉCURITÉ : seul l'email est stocké en localStorage à des fins
 * d'affichage. Le mot de passe n'est jamais persisté.
 */
interface OwnerSetupProps {
  onComplete: () => void;
}

export function OwnerSetup({ onComplete }: OwnerSetupProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: 'Champs requis',
        description: 'Veuillez remplir tous les champs.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Mot de passe trop court',
        description: 'Le mot de passe doit contenir au moins 6 caractères.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // ── 1. Tenter une connexion (compte existant) ──────────────────────────
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!signInError && signInData.user) {
        // Connexion réussie — AuthContext prend le relai via onAuthStateChange
        localStorage.setItem(SOLO_STORAGE_KEYS.ownerEmail, email);
        localStorage.setItem(SOLO_STORAGE_KEYS.ownerSetupComplete, 'true');
        onComplete();
        return;
      }

      // ── 2. Compte inexistant → signup ──────────────────────────────────────
      if (signInError?.message.includes('Invalid login credentials')) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // bootstrap → /settings/revenue après confirmation du premier run
            emailRedirectTo: `${window.location.origin}/settings/revenue`,
          },
        });

        if (signUpError) throw signUpError;

        if (signUpData.user) {
          localStorage.setItem(SOLO_STORAGE_KEYS.ownerEmail, email);
          localStorage.setItem(SOLO_STORAGE_KEYS.ownerSetupComplete, 'true');
        }

        toast({
          title: 'Accès initialisé',
          description: 'Compte créé. Initialisation de votre espace de travail en cours…',
        });

        // AuthContext va recevoir SIGNED_IN et déclencher fetchUserData → bootstrapOwner
        onComplete();
        return;
      }

      throw signInError;
    } catch (error) {
      console.error('[OwnerSetup] auth error:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Shield className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">SENTINEL EDGE</h1>
          <p className="text-muted-foreground">Configuration de votre accès</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initialisation...
              </>
            ) : (
              'Se connecter'
            )}
          </Button>
        </form>

        <p className="text-xs text-center text-muted-foreground">
          Mode solo — Vos identifiants ne sont pas stockés localement.
        </p>
      </div>
    </div>
  );
}
