/**
 * AccessCodeActivation
 * Self-contained component for redeeming a premium access code.
 * Can be embedded in UpgradeWall, Auth page, or /activate route.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Key, Loader2, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface AccessCodeActivationProps {
  onSuccess?: (accessUntil: string, plan: string) => void;
  compact?: boolean; // smaller variant for UpgradeWall inline use
}

type Status = "idle" | "loading" | "success" | "error" | "already_active";

interface SuccessData {
  plan: string;
  access_until: string;
  message: string;
}

export function AccessCodeActivation({
  onSuccess,
  compact = false,
}: AccessCodeActivationProps) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = code.trim();
    if (!trimmed) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const { data, error } = await supabase.functions.invoke(
        "redeem-access-code",
        { body: { code: trimmed } }
      );

      if (error) throw error;

      if (data?.error === "already_active") {
        setStatus("already_active");
        setSuccessData({
          plan: "pro",
          access_until: data.access_until,
          message: data.message,
        });
        return;
      }

      if (data?.error) {
        setStatus("error");
        setErrorMsg(data.error);
        return;
      }

      if (data?.success) {
        setStatus("success");
        setSuccessData(data);
        onSuccess?.(data.access_until, data.plan);
      }
    } catch (err: unknown) {
      setStatus("error");
      const msg =
        err instanceof Error ? err.message : "Erreur réseau. Réessayez.";
      setErrorMsg(msg);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  if (status === "success" && successData) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex flex-col items-center gap-3 text-center ${compact ? "p-4" : "p-6"}`}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle className="h-7 w-7 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Accès activé !</p>
          <p className="text-sm text-muted-foreground mt-1">
            Plan <span className="font-medium text-primary capitalize">{successData.plan}</span>{" "}
            actif jusqu'au{" "}
            <span className="font-medium text-foreground">
              {formatDate(successData.access_until)}
            </span>
          </p>
        </div>
      </motion.div>
    );
  }

  if (status === "already_active" && successData) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex flex-col items-center gap-3 text-center ${compact ? "p-4" : "p-6"}`}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle className="h-7 w-7 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Accès déjà actif</p>
          <p className="text-sm text-muted-foreground mt-1">
            Votre accès premium est valide jusqu'au{" "}
            <span className="font-medium text-foreground">
              {formatDate(successData.access_until)}
            </span>
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-2" : "space-y-3"}>
      <div className={`flex gap-2 ${compact ? "" : "flex-col sm:flex-row"}`}>
        <div className="relative flex-1">
          <Key
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="text"
            placeholder="Code d'accès premium"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="pl-9 font-mono tracking-wider uppercase"
            maxLength={64}
            disabled={status === "loading"}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <Button
          type="submit"
          disabled={status === "loading" || !code.trim()}
          className={compact ? "shrink-0" : "w-full sm:w-auto gap-2"}
          variant={compact ? "outline" : "default"}
        >
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : compact ? (
            <ArrowRight className="h-4 w-4" />
          ) : (
            <>
              <ArrowRight className="h-4 w-4" />
              Activer
            </>
          )}
        </Button>
      </div>

      <AnimatePresence>
        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg || "Code invalide ou expiré."}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
