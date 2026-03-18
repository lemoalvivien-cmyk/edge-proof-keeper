/**
 * PlanValueTracker — Retention widget showing accumulated value.
 * Shows users what they'd lose if they cancelled.
 * Designed to increase perceived switching cost.
 */
import { motion } from "framer-motion";
import { Lock, TrendingUp, Shield, FileText, Zap, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PlanValueTrackerProps {
  findingsCount: number;
  runsCount: number;
  proofsCount?: number;
  compliancePercent?: number;
  /** Approximate days the account has been active */
  activeDays?: number;
  plan?: string | null;
  subscribed?: boolean;
}

export function PlanValueTracker({
  findingsCount,
  runsCount,
  proofsCount = 0,
  compliancePercent = 0,
  activeDays = 1,
  plan,
  subscribed,
}: PlanValueTrackerProps) {
  const navigate = useNavigate();

  // Compute capital humain estimé
  const hoursSaved = Math.round(runsCount * 3.5 + findingsCount * 0.8);
  const proofValue = (findingsCount + proofsCount) * 47; // €47 par preuve documentée manuellement
  const complianceHours = Math.round(compliancePercent * 0.6); // heures de travail

  const metrics = [
    {
      icon: Lock,
      label: "Preuves immuables générées",
      value: (findingsCount + proofsCount).toString(),
      sub: `≈ ${proofValue.toLocaleString("fr-FR")}€ de travail documentaire évité`,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: TrendingUp,
      label: "Heures d'analyse économisées",
      value: `${hoursSaved}h`,
      sub: `Sur ${runsCount} analyse${runsCount > 1 ? "s" : ""} effectuée${runsCount > 1 ? "s" : ""}`,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      icon: Shield,
      label: "Conformité RGPD / NIS2",
      value: `${compliancePercent}%`,
      sub: `≈ ${complianceHours}h de préparation documentée`,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      icon: FileText,
      label: "Jours de surveillance active",
      value: activeDays.toString(),
      sub: "Historique de posture de sécurité accumulé",
      color: "text-accent",
      bg: "bg-accent/10",
    },
  ];

  if (!subscribed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/8 to-primary/5 p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <p className="font-bold text-foreground">Activez l'accès complet</p>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Essai 14j</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Vous avez déjà généré <strong className="text-foreground">{findingsCount} findings</strong> et{" "}
          <strong className="text-foreground">{runsCount} analyses</strong>. Activez votre abonnement pour conserver
          ces données, déverrouiller le self-healing et accéder à votre Evidence Vault complet.
        </p>
        <div className="flex gap-2">
          <Button size="sm" className="gap-1.5 font-bold bg-accent hover:bg-accent/90 text-accent-foreground flex-1" onClick={() => navigate("/pricing")}>
            <Zap className="w-4 h-4" />
            Voir les plans
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card/60 p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <p className="font-bold text-foreground text-sm">Capital informationnel accumulé</p>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${
          plan === "pro" ? "bg-accent/15 text-accent" : plan === "enterprise" ? "bg-warning/15 text-warning" : "bg-primary/15 text-primary"
        }`}>
          Plan {plan === "pro" ? "Command" : plan === "starter" ? "Sentinel" : plan ?? "Actif"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m, i) => (
          <div key={i} className={`p-3 rounded-xl ${m.bg} border border-border/40 space-y-1`}>
            <div className="flex items-center gap-1.5">
              <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
              <span className="text-[10px] text-muted-foreground font-medium">{m.label}</span>
            </div>
            <p className={`text-2xl font-black font-mono ${m.color}`}>{m.value}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{m.sub}</p>
          </div>
        ))}
      </div>

      {plan === "starter" && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-accent/8 border border-accent/20">
          <div>
            <p className="text-xs font-bold text-foreground">Passez à Command pour 10× plus</p>
            <p className="text-[10px] text-muted-foreground">Self-healing · RSSI IA · Evidence SHA-256 Vault</p>
          </div>
          <Button size="sm" variant="outline" className="border-accent/50 text-accent hover:bg-accent/10 gap-1 flex-shrink-0" onClick={() => navigate("/pricing")}>
            Upgrade <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}
