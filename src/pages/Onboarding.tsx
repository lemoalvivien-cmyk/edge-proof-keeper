import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Building2, Loader2, CheckCircle2, Zap, ChevronRight, Users, Briefcase, ArrowRight
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

const SECTORS = [
  { value: "industrie", label: "Industrie", emoji: "🏭" },
  { value: "services", label: "Services", emoji: "💼" },
  { value: "tech", label: "Tech / IT", emoji: "💻" },
  { value: "sante", label: "Santé", emoji: "🏥" },
  { value: "finance", label: "Finance", emoji: "🏦" },
  { value: "autre", label: "Autre", emoji: "🏢" },
];

const SIZES = [
  { value: "1-10", label: "1 – 10" },
  { value: "11-50", label: "11 – 50" },
  { value: "51-200", label: "51 – 200" },
  { value: "201-500", label: "201 – 500" },
  { value: "500+", label: "500 +" },
];

type Step = 1 | 2 | 3;

export default function Onboarding() {
  const [step, setStep] = useState<Step>(1);
  const [orgName, setOrgName] = useState("");
  const [sector, setSector] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const navigate = useNavigate();
  const { user, organization, refreshProfile } = useAuth();

  // If org already exists, skip to step 2
  useEffect(() => {
    if (organization && !orgId) {
      setOrgId(organization.id);
      setStep(2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization?.id]);

  const handleSeedAndRedirect = async (id: string) => {
    setSeeding(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        fetch(`${SUPABASE_URL}/functions/v1/seed-demo-run`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ organization_id: id }),
        }).catch(() => {});
      }
    } catch { /* non-blocking */ }
    navigate("/dashboard", { replace: true });
  };

  // Step 1 — Create org
  const handleCreate = async () => {
    const name = orgName.trim() || "Mon Organisation";
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

      setOrgId(orgData.id);
      toast.success("Espace créé !");
      setStep(2);
    } catch (error) {
      console.error("Error creating org:", error);
      toast.error("Erreur lors de la création");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 — Save sector
  const handleSaveSector = async (value: string | null) => {
    if (value) setSector(value);
    if (orgId && value) {
      await supabase.from("organizations").update({ sector: value }).eq("id", orgId);
    }
    setStep(3);
  };

  const handleSkipSector = () => {
    setStep(3);
  };

  // Step 3 — Save size + Launch audit
  const handleSaveSize = async (value: string | null) => {
    if (value) setSize(value);
    if (orgId && value) {
      await supabase.from("organizations").update({ size: value }).eq("id", orgId);
    }
  };

  const handleLaunchAudit = async () => {
    const targetOrgId = orgId ?? organization?.id;
    if (!targetOrgId) {
      navigate("/dashboard", { replace: true });
      return;
    }
    // Save size if selected but not yet saved
    if (size && orgId) {
      await supabase.from("organizations").update({ size }).eq("id", orgId);
    }
    toast.success("Lancement de l'audit de démonstration…", { duration: 3000 });
    await handleSeedAndRedirect(targetOrgId);
  };

  const progressWidth = step === 1 ? "33%" : step === 2 ? "66%" : "100%";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 mb-3">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold">Bienvenue sur SECURIT-E</h1>
          <p className="text-xs text-muted-foreground mt-1">Configuration de votre espace — étape {step}/3</p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 rounded-full bg-muted mb-6 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: progressWidth }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <AnimatePresence mode="wait">

          {/* ── STEP 1 : Org name ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="h-4 w-4 text-primary" />
                    Nommez votre organisation
                    <Badge variant="outline" className="text-[10px] ml-auto text-muted-foreground">Optionnel</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Personnalisez le nom de votre espace de travail.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Ma Société SAS (optionnel)"
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCreate()}
                    disabled={isLoading}
                    className="text-base"
                  />
                  <Button className="w-full gap-2" onClick={handleCreate} disabled={isLoading}>
                    {isLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" />Création…</>
                      : <><ChevronRight className="w-4 h-4" />Continuer</>}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── STEP 2 : Sector ── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Briefcase className="h-4 w-4 text-primary" />
                    Secteur d'activité
                    <Badge variant="outline" className="text-[10px] ml-auto text-muted-foreground">Optionnel</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Aide à personnaliser vos recommandations NIS2/RGPD.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {SECTORS.map(s => (
                      <button
                        key={s.value}
                        onClick={() => handleSaveSector(s.value)}
                        className={`flex items-center gap-2 p-3 rounded-lg border text-sm text-left transition-all hover:border-primary/50 hover:bg-primary/5 ${
                          sector === s.value ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground"
                        }`}
                      >
                        <span>{s.emoji}</span>
                        <span className="font-medium">{s.label}</span>
                      </button>
                    ))}
                  </div>
                  <Button variant="ghost" className="w-full text-muted-foreground text-sm" onClick={handleSkipSector}>
                    Passer cette étape →
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── STEP 3 : Size + CTA ── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4 text-primary" />
                    Nombre d'employés
                    <Badge variant="outline" className="text-[10px] ml-auto text-muted-foreground">Optionnel</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Pour adapter les seuils de conformité NIS2.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-5 gap-1.5">
                    {SIZES.map(s => (
                      <button
                        key={s.value}
                        onClick={() => handleSaveSize(s.value)}
                        className={`flex items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all hover:border-primary/50 hover:bg-primary/5 ${
                          size === s.value ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {/* Main CTA */}
                  <Button
                    className="w-full gap-2 mt-2 h-12 font-semibold neon-glow"
                    onClick={handleLaunchAudit}
                    disabled={seeding}
                  >
                    {seeding
                      ? <><Loader2 className="w-4 h-4 animate-spin" />Injection en cours…</>
                      : <><Zap className="w-4 h-4" />Lancer mon audit de démonstration</>}
                  </Button>

                  <Button variant="ghost" className="w-full text-muted-foreground text-sm" onClick={handleLaunchAudit} disabled={seeding}>
                    Passer et accéder au dashboard →
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

        </AnimatePresence>

        {/* What happens next (only on step 3) */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 rounded-xl border border-border bg-muted/20 p-4 space-y-2"
          >
            <p className="text-xs font-medium text-foreground">Ce qui se passe ensuite :</p>
            {[
              { icon: "🔍", text: "12 assets démo injectés automatiquement" },
              { icon: "⚡", text: "7 findings réalistes analysés par l'IA" },
              { icon: "🛡️", text: "Evidence Vault initialisé avec preuves SHA-256" },
              { icon: "🤖", text: "Première analyse autonome lancée en background" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
