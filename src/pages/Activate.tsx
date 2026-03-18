/**
 * /activate — Standalone page for redeeming a premium access code.
 * Accessible after login: /activate
 * Also linked from Auth page for authenticated users.
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccessCodeActivation } from "@/components/auth/AccessCodeActivation";
import { useAuth } from "@/contexts/AuthContext";
import { useEntitlement } from "@/hooks/useEntitlement";

export default function Activate() {
  const { user, isLoading: authLoading } = useAuth();
  const { refresh } = useEntitlement();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { state: { from: { pathname: "/activate" } }, replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSuccess = async (accessUntil: string, plan: string) => {
    await refresh();
    setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, 2000);
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 gap-2 text-muted-foreground"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Activer un code d'accès
          </h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Entrez votre code d'accès premium pour déverrouiller SECURIT-E
            pendant 365 jours.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 shadow-xl">
          {/* Feature highlights */}
          <div className="flex items-start gap-3 mb-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground mb-1">
                Accès Pro complet inclus
              </p>
              <ul className="text-muted-foreground space-y-0.5">
                <li>• Sovereign AI agent</li>
                <li>• Proof Packs certifiés</li>
                <li>• Tous les modules actifs</li>
                <li>• Valable 365 jours</li>
              </ul>
            </div>
          </div>

          <AccessCodeActivation onSuccess={handleSuccess} />
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Connecté en tant que{" "}
          <span className="font-medium text-foreground">{user.email}</span>
        </p>
      </motion.div>
    </div>
  );
}
