import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, Building2, Loader2, CheckCircle2, Zap 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export default function Onboarding() {
  const [orgName, setOrgName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const navigate = useNavigate();
  const { user, organization, refreshProfile } = useAuth();

  // If org already exists, immediately seed + redirect
  useEffect(() => {
    if (organization) {
      handleSeedAndRedirect(organization.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization?.id]);

  const handleSeedAndRedirect = async (orgId: string) => {
    setSeeding(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        // Fire-and-forget seed + analysis (non-blocking)
        fetch(`${SUPABASE_URL}/functions/v1/seed-demo-run`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ organization_id: orgId }),
        }).catch(() => {});
      }
    } catch { /* non-blocking */ }
    // Redirect immediately, dashboard handles seeding
    navigate('/dashboard', { replace: true });
  };

  const handleCreate = async () => {
    const name = orgName.trim() || `Mon Organisation`;
    if (!user) return;

    setIsLoading(true);
    try {
      const orgSlug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + `-${Date.now()}`;
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .insert({ name, slug: orgSlug })
        .select()
        .single();

      if (orgError) throw orgError;

      await supabase.from("profiles").update({ organization_id: orgData.id }).eq("id", user.id);
      await supabase.from("user_roles").insert({ user_id: user.id, organization_id: orgData.id, role: "admin" });
      await refreshProfile();

      toast.success("Espace de travail créé ! Injection des données démo…");
      await handleSeedAndRedirect(orgData.id);
    } catch (error) {
      console.error("Error creating org:", error);
      toast.error("Erreur lors de la création");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-8"
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
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Bienvenue sur SECURIT-E</h1>
          <p className="text-sm text-muted-foreground mt-1">Configuration optionnelle — vous pouvez passer cette étape</p>
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium">
            <Zap className="w-3 h-3" />
            Données démo injectées automatiquement en &lt; 12s
          </div>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Nommez votre organisation
              <Badge variant="outline" className="text-xs ml-auto text-muted-foreground">Optionnel</Badge>
            </CardTitle>
            <CardDescription>
              Vous pouvez personnaliser ce nom maintenant ou le faire plus tard depuis les paramètres.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Ma Société SAS (optionnel)"
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              disabled={isLoading || seeding}
              className="text-base"
            />
            <Button
              className="w-full gap-2"
              onClick={handleCreate}
              disabled={isLoading || seeding}
            >
              {isLoading || seeding
                ? <><Loader2 className="w-4 h-4 animate-spin" />Initialisation…</>
                : <><CheckCircle2 className="w-4 h-4" />Créer et accéder au dashboard</>}
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={handleSkip}
              disabled={isLoading || seeding}
            >
              Passer cette étape →
            </Button>
          </CardContent>
        </Card>

        {/* What happens next */}
        <div className="mt-6 rounded-xl border border-border bg-muted/20 p-4 space-y-2">
          <p className="text-xs font-medium text-foreground">Ce qui se passe ensuite :</p>
          {[
            { icon: "🔍", text: "12 assets démo injectés automatiquement" },
            { icon: "⚡", text: "7 findings réalistes analysés par l'IA" },
            { icon: "🛡️", text: "Evidence Vault initialisé avec preuves SHA-256" },
            { icon: "🤖", text: "Première analyse autonome lancée en background" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
