import { useState } from 'react';
import { Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SOLO_STORAGE_KEYS } from '@/config/app';
import { bootstrapOwner } from '@/lib/bootstrap';

interface OwnerSetupProps {
  onComplete: () => void;
}

/**
 * One-time owner setup screen for Solo Mode.
 *
 * SECURITY NOTES:
 * - We do NOT store passwords in localStorage
 * - We only store email for display purposes
 * - Supabase handles session persistence securely
 * - If session expires, user re-authenticates here
 *
 * POST-AUTH:
 * - Calls bootstrapOwner() to ensure org + profile + admin role + runtime config stub
 *   are created, making tenant_resolved: true for public CTAs immediately.
 */
export function OwnerSetup({ onComplete }: OwnerSetupProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const runBootstrap = async (userId: string, userEmail: string) => {
    try {
      const result = await bootstrapOwner(userId, userEmail);
      if (result.isFirstRun) {
        toast({
          title: 'Espace de travail créé',
          description: 'Organisation initialisée. Configurez vos URLs dans Revenue Settings.',
        });
      }
    } catch (err) {
      // Non-fatal: user can still access the app, but tenant_resolved may be false until fixed
      console.warn('Bootstrap warning (non-fatal):', err);
      toast({
        title: 'Setup partiel',
        description: 'Authentifié. Allez dans Paramètres → Revenue pour finaliser la configuration.',
        variant: 'destructive',
      });
    }
  };

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
      // Try to sign in first (in case account already exists)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!signInError && signInData.user) {
        localStorage.setItem(SOLO_STORAGE_KEYS.ownerEmail, email);
        localStorage.setItem(SOLO_STORAGE_KEYS.ownerSetupComplete, 'true');
        // Ensure org + runtime config exist
        await runBootstrap(signInData.user.id, email);
        onComplete();
        return;
      }

      // If sign in failed with invalid credentials, try to sign up
      if (signInError?.message.includes('Invalid login credentials')) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (signUpError) {
          throw signUpError;
        }

        if (signUpData.user) {
          localStorage.setItem(SOLO_STORAGE_KEYS.ownerEmail, email);
          localStorage.setItem(SOLO_STORAGE_KEYS.ownerSetupComplete, 'true');
          // Bootstrap: create org, profile, admin role, runtime config stub
          await runBootstrap(signUpData.user.id, email);
        }

        toast({
          title: 'Accès initialisé',
          description: 'Votre accès a été configuré avec succès.',
        });

        onComplete();
      } else {
        throw signInError;
      }
    } catch (error) {
      console.error('Owner setup error:', error);
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
