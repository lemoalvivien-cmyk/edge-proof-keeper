import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield, Loader2, Mail, Eye, EyeOff, ArrowRight, Zap, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';

// ── Schemas ───────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Minimum 6 caractères'),
});

const signupSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Minimum 6 caractères'),
});

const forgotSchema = z.object({
  email: z.string().email('Email invalide'),
});

type LoginData = z.infer<typeof loginSchema>;
type SignupData = z.infer<typeof signupSchema>;
type ForgotData = z.infer<typeof forgotSchema>;

type Tab = 'login' | 'signup' | 'forgot';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

// ── Auto-seed after signup ────────────────────────────────────────────────────
async function triggerAutoSeed(orgId: string, accessToken: string) {
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/seed-demo-run`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ organization_id: orgId }),
    });
  } catch {
    // Non-blocking
  }
}

async function triggerAutoAnalysis(orgId: string, accessToken: string) {
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/correlate-risks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ organization_id: orgId }),
    });
  } catch {
    // Non-blocking
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Auth() {
  const [tab, setTab] = useState<Tab>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const { user, organization } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (user) {
      navigate(organization ? from : '/onboarding', { replace: true });
    }
  }, [user, organization, navigate, from]);

  // Forms
  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });
  const signupForm = useForm<SignupData>({ resolver: zodResolver(signupSchema), defaultValues: { email: '', password: '' } });
  const forgotForm = useForm<ForgotData>({ resolver: zodResolver(forgotSchema), defaultValues: { email: '' } });

  const onLogin = async (data: LoginData) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
    setIsLoading(false);
    if (error) {
      toast.error(error.message === 'Invalid login credentials' ? 'Email ou mot de passe incorrect' : error.message);
      return;
    }
    toast.success('Connexion réussie');
  };

  const onSignup = async (data: SignupData) => {
    setIsLoading(true);
    const { data: signupData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setIsLoading(false);

    if (error) {
      toast.error(error.message.includes('already registered') ? 'Cet email est déjà utilisé' : error.message);
      return;
    }

    toast.success('Compte créé — initialisation de votre espace cyber…', { duration: 4000 });

    // Background: wait for session then auto-seed
    if (signupData.session?.access_token) {
      // Fetch org from profile (may take a few seconds post-bootstrap)
      setTimeout(async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.access_token) return;
          const { data: prof } = await supabase.from('profiles').select('organization_id').eq('id', signupData.user!.id).maybeSingle();
          if (prof?.organization_id) {
            await triggerAutoSeed(prof.organization_id, session.access_token);
            await triggerAutoAnalysis(prof.organization_id, session.access_token);
          }
        } catch { /* non-blocking */ }
      }, 4000);
    }

    navigate('/onboarding', { replace: true });
  };

  const onForgot = async (data: ForgotData) => {
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsLoading(false);
    if (error) { toast.error(error.message); return; }
    setForgotSent(true);
    toast.success('Email de réinitialisation envoyé');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4"
          >
            <Shield className="w-7 h-7 text-primary" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground">SECURIT-E</h1>
          <p className="text-sm text-muted-foreground mt-1">Cockpit de gouvernance cyber autonome</p>
          {tab === 'signup' && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium"
            >
              <Zap className="w-3 h-3" />
              Analyse autonome lancée en &lt; 12s après inscription
            </motion.div>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex rounded-xl bg-muted/50 border border-border p-1 mb-6 gap-1">
          {(['login', 'signup'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                tab === t
                  ? 'bg-background text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'login' ? 'Connexion' : 'Inscription'}
            </button>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 shadow-xl">
          <AnimatePresence mode="wait">
            {/* ── LOGIN ── */}
            {tab === 'login' && (
              <motion.div key="login" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }}>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField control={loginForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input type="email" placeholder="email@entreprise.com" className="pl-9" autoComplete="email" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={loginForm.control} name="password" render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Mot de passe</FormLabel>
                          <button type="button" onClick={() => setTab('forgot')} className="text-xs text-primary hover:underline">
                            Mot de passe oublié ?
                          </button>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input type={showPass ? 'text' : 'password'} placeholder="••••••••" className="pl-9 pr-10" autoComplete="current-password" {...field} />
                            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                      {isLoading ? 'Connexion…' : 'Se connecter'}
                    </Button>
                  </form>
                </Form>
              </motion.div>
            )}

            {/* ── SIGNUP ── */}
            {tab === 'signup' && (
              <motion.div key="signup" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
                <Form {...signupForm}>
                  <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                    <FormField control={signupForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email professionnel</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input type="email" placeholder="vous@entreprise.com" className="pl-9" autoComplete="email" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={signupForm.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mot de passe</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input type={showPass ? 'text' : 'password'} placeholder="Min. 6 caractères" className="pl-9 pr-10" autoComplete="new-password" {...field} />
                            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full gap-2 bg-primary hover:bg-primary/90" disabled={isLoading}>
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      {isLoading ? 'Création du compte…' : 'Créer mon compte gratuit'}
                    </Button>
                    <p className="text-[11px] text-muted-foreground text-center">
                      Données démo injectées automatiquement · Analyse IA lancée en &lt; 12s
                    </p>
                  </form>
                </Form>
              </motion.div>
            )}

            {/* ── FORGOT PASSWORD ── */}
            {tab === 'forgot' && (
              <motion.div key="forgot" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                {forgotSent ? (
                  <div className="text-center py-4 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <p className="font-medium text-foreground">Email envoyé !</p>
                    <p className="text-sm text-muted-foreground">Vérifiez votre boîte mail et cliquez sur le lien de réinitialisation.</p>
                    <button onClick={() => { setTab('login'); setForgotSent(false); }} className="text-sm text-primary hover:underline">
                      ← Retour à la connexion
                    </button>
                  </div>
                ) : (
                  <Form {...forgotForm}>
                    <form onSubmit={forgotForm.handleSubmit(onForgot)} className="space-y-4">
                      <div className="mb-2">
                        <p className="text-sm font-medium text-foreground">Réinitialiser le mot de passe</p>
                        <p className="text-xs text-muted-foreground mt-1">Entrez votre email pour recevoir un lien de réinitialisation.</p>
                      </div>
                      <FormField control={forgotForm.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input type="email" placeholder="email@entreprise.com" className="pl-9" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Envoyer le lien
                      </Button>
                      <button type="button" onClick={() => setTab('login')} className="w-full text-xs text-muted-foreground hover:text-foreground text-center">
                        ← Retour à la connexion
                      </button>
                    </form>
                  </Form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Trust footer */}
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          En vous inscrivant, vous acceptez nos{' '}
          <a href="/legal/terms" className="text-primary hover:underline">CGU</a>
          {' '}et notre{' '}
          <a href="/legal/privacy" className="text-primary hover:underline">politique de confidentialité</a>.
          {' '}VLM Consulting — 100% souverain 🇫🇷
        </p>
      </motion.div>
    </div>
  );
}
