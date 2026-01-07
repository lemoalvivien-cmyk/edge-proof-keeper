import { useState } from 'react';
import { Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SOLO_STORAGE_KEYS } from '@/config/app';

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
      // Try to sign in first (in case account already exists)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!signInError) {
        // Sign in successful, store credentials
        localStorage.setItem(SOLO_STORAGE_KEYS.ownerEmail, email);
        localStorage.setItem(SOLO_STORAGE_KEYS.ownerPassword, password);
        localStorage.setItem(SOLO_STORAGE_KEYS.ownerSetupComplete, 'true');
        onComplete();
        return;
      }

      // If sign in failed, try to sign up
      if (signInError.message.includes('Invalid login credentials')) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (signUpError) {
          throw signUpError;
        }

        // Store credentials
        localStorage.setItem(SOLO_STORAGE_KEYS.ownerEmail, email);
        localStorage.setItem(SOLO_STORAGE_KEYS.ownerPassword, password);
        localStorage.setItem(SOLO_STORAGE_KEYS.ownerSetupComplete, 'true');
        
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
          <p className="text-muted-foreground">Configuration initiale de votre accès</p>
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
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initialisation...
              </>
            ) : (
              'Initialiser mon accès'
            )}
          </Button>
        </form>

        <p className="text-xs text-center text-muted-foreground">
          Cet écran n'apparaîtra qu'une seule fois.
        </p>
      </div>
    </div>
  );
}
