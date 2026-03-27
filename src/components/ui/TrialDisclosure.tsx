/**
 * TrialDisclosure — mandatory disclosure shown before any Stripe redirect.
 * Consumes billingPolicy.ts as single source of truth.
 */
import { CreditCard, Clock, ShieldCheck } from "lucide-react";
import { DISPLAY_COPY, TRIAL_DAYS, CANCELLATION_POLICY, REFUND_POLICY } from "@/config/billingPolicy";

interface TrialDisclosureProps {
  className?: string;
  /** Compact = single line; full = multi-line with icons */
  variant?: "compact" | "full";
}

export function TrialDisclosure({ className = "", variant = "compact" }: TrialDisclosureProps) {
  if (variant === "compact") {
    return (
      <p className={`text-[10px] text-center text-muted-foreground ${className}`}>
        {DISPLAY_COPY.stripeTrust}
      </p>
    );
  }

  return (
    <div className={`rounded-xl border border-border bg-muted/30 p-4 space-y-2 ${className}`}>
      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <CreditCard className="w-3.5 h-3.5 text-primary" />
        Conditions de l'essai gratuit
      </div>
      <ul className="space-y-1.5 text-[11px] text-muted-foreground">
        <li className="flex items-center gap-2">
          <Clock className="w-3 h-3 text-success flex-shrink-0" />
          {TRIAL_DAYS} jours gratuits — carte bancaire requise à l'inscription
        </li>
        <li className="flex items-center gap-2">
          <ShieldCheck className="w-3 h-3 text-success flex-shrink-0" />
          Vous ne serez débité qu'à J+{TRIAL_DAYS + 1}. {CANCELLATION_POLICY}.
        </li>
        <li className="flex items-center gap-2">
          <ShieldCheck className="w-3 h-3 text-success flex-shrink-0" />
          {REFUND_POLICY}. Paiement sécurisé Stripe.
        </li>
      </ul>
    </div>
  );
}
