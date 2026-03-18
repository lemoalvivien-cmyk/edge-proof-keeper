/**
 * AdminAccessCodes — Admin page for managing premium access codes.
 * Route: /admin/access-codes (admin only)
 *
 * Features:
 * - List all codes (label, plan, days, active status, redemptions)
 * - Toggle code active/inactive
 * - View redemption details
 * - View audit events log
 * - Generate new codes (admin creates, system hashes)
 *
 * Security: codes are stored as SHA-256 hashes only.
 * The raw code is generated here client-side, shown ONCE, then discarded.
 */
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Key,
  Plus,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Calendar,
  Users,
  Shield,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";

// ── Types ─────────────────────────────────────────────────────────────────────
interface AccessCode {
  id: string;
  code_label: string | null;
  grant_plan: string;
  grant_days: number;
  max_redemptions: number;
  redemptions_count: number;
  is_active: boolean;
  redeemed_by: string | null;
  redeemed_at: string | null;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
}

interface AccessCodeEvent {
  id: string;
  user_id: string | null;
  code_label: string | null;
  event_type: string;
  plan_granted: string | null;
  access_until: string | null;
  created_at: string;
}

// ── SHA-256 helper (browser crypto) ──────────────────────────────────────────
async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Generate a random access code (alphanumeric, grouped) ────────────────────
function generateRandomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I, O, 0, 1
  const groups = Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("")
  );
  return groups.join("-");
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminAccessCodes() {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [events, setEvents] = useState<AccessCodeEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEvents, setShowEvents] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCodePlain, setNewCodePlain] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // New code form
  const [form, setForm] = useState({
    label: "",
    plan: "pro",
    days: 365,
    maxRedemptions: 1,
    validUntil: "",
  });
  const [creating, setCreating] = useState(false);

  const loadCodes = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("access_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erreur lors du chargement des codes");
    } else {
      setCodes(data ?? []);
    }
    setIsLoading(false);
  }, []);

  const loadEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from("access_code_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error) setEvents(data ?? []);
  }, []);

  useEffect(() => {
    loadCodes();
    loadEvents();
  }, [loadCodes, loadEvents]);

  const handleToggleActive = async (code: AccessCode) => {
    const { error } = await supabase
      .from("access_codes")
      .update({ is_active: !code.is_active })
      .eq("id", code.id);

    if (error) {
      toast.error("Erreur lors de la mise à jour");
    } else {
      toast.success(
        code.is_active ? "Code désactivé" : "Code réactivé"
      );
      loadCodes();
    }
  };

  const handleCreateCode = async () => {
    if (!form.label.trim()) {
      toast.error("Le libellé est obligatoire");
      return;
    }
    setCreating(true);

    const plainCode = generateRandomCode();
    const normalized = plainCode.toUpperCase();
    const codeHash = await sha256Hex(normalized);

    const { error } = await supabase.from("access_codes").insert({
      code_hash: codeHash,
      code_label: form.label.trim(),
      grant_plan: form.plan,
      grant_days: form.days,
      max_redemptions: form.maxRedemptions,
      valid_until: form.validUntil ? new Date(form.validUntil).toISOString() : null,
    });

    setCreating(false);

    if (error) {
      toast.error("Erreur lors de la création : " + error.message);
    } else {
      setNewCodePlain(plainCode);
      loadCodes();
    }
  };

  const copyCode = async () => {
    if (!newCodePlain) return;
    await navigator.clipboard.writeText(newCodePlain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—";

  const planBadge = (plan: string) => {
    const colors: Record<string, string> = {
      pro: "bg-primary/10 text-primary border-primary/20",
      starter: "bg-secondary/50 text-secondary-foreground border-border",
      enterprise: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    };
    return colors[plan] ?? colors.starter;
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Codes d'accès premium
              </h1>
              <p className="text-sm text-muted-foreground">
                Gérez les codes d'accès hors-Stripe
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadCodes();
                loadEvents();
              }}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setNewCodePlain(null);
                setForm({
                  label: "",
                  plan: "pro",
                  days: 365,
                  maxRedemptions: 1,
                  validUntil: "",
                });
                setShowCreateDialog(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Nouveau code
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Total codes",
              value: codes.length,
              icon: Key,
            },
            {
              label: "Codes actifs",
              value: codes.filter((c) => c.is_active).length,
              icon: Shield,
            },
            {
              label: "Utilisations",
              value: codes.reduce((s, c) => s + c.redemptions_count, 0),
              icon: Users,
            },
            {
              label: "Événements",
              value: events.length,
              icon: Activity,
            },
          ].map((stat) => (
            <Card key={stat.label} className="border-border bg-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Codes table */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Codes enregistrés</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                Chargement…
              </div>
            ) : codes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground text-sm">
                <Key className="h-8 w-8 opacity-30" />
                <p>Aucun code créé. Créez le premier ci-dessus.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {[
                        "Libellé",
                        "Plan",
                        "Durée",
                        "Utilisations",
                        "Statut",
                        "Utilisation par",
                        "Expiration",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-medium text-muted-foreground"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {codes.map((code, i) => (
                      <motion.tr
                        key={code.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {code.code_label ?? (
                            <span className="text-muted-foreground italic">
                              Sans libellé
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${planBadge(code.grant_plan)}`}
                          >
                            {code.grant_plan}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {code.grant_days}j
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {code.redemptions_count}/{code.max_redemptions}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={code.is_active ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {code.is_active ? "Actif" : "Inactif"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                          {code.redeemed_by
                            ? code.redeemed_by.slice(0, 8) + "…"
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {code.valid_until ? formatDate(code.valid_until) : "Permanente"}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(code)}
                            className="h-7 gap-1.5 text-xs"
                          >
                            {code.is_active ? (
                              <>
                                <ToggleRight className="h-3.5 w-3.5 text-primary" />
                                Désactiver
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="h-3.5 w-3.5" />
                                Réactiver
                              </>
                            )}
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audit events */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <button
              onClick={() => setShowEvents(!showEvents)}
              className="flex items-center justify-between w-full text-left"
            >
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Journal d'audit ({events.length} événements)
              </CardTitle>
              {showEvents ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </CardHeader>
          {showEvents && (
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {["Date", "Utilisateur", "Code", "Type", "Plan", "Accès jusqu'au"].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left px-4 py-3 text-xs font-medium text-muted-foreground"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev) => (
                      <tr
                        key={ev.id}
                        className="border-b border-border/50 hover:bg-muted/20"
                      >
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {formatDate(ev.created_at)}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {ev.user_id ? ev.user_id.slice(0, 8) + "…" : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {ev.code_label ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              ev.event_type === "redeemed"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {ev.event_type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs capitalize">
                          {ev.plan_granted ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {formatDate(ev.access_until)}
                        </td>
                      </tr>
                    ))}
                    {events.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-sm text-muted-foreground"
                        >
                          Aucun événement enregistré
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Create Code Dialog */}
      <Dialog
        open={showCreateDialog}
        onOpenChange={(o) => {
          if (!o) setNewCodePlain(null);
          setShowCreateDialog(o);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Créer un code d'accès
            </DialogTitle>
          </DialogHeader>

          {newCodePlain ? (
            /* Show generated code — ONE TIME ONLY */
            <div className="space-y-4">
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-5 text-center">
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">
                  Code généré — copiez-le maintenant
                </p>
                <p className="font-mono text-2xl font-bold tracking-widest text-primary">
                  {newCodePlain}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  ⚠️ Ce code ne sera plus affiché après fermeture.
                </p>
              </div>
              <Button onClick={copyCode} className="w-full gap-2" variant="outline">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    Copié !
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copier le code
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewCodePlain(null);
                }}
                className="w-full"
              >
                Fermer
              </Button>
            </div>
          ) : (
            /* Form */
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Libellé <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="ex: Partenaire ACME 2026"
                  value={form.label}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, label: e.target.value }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Plan
                  </label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={form.plan}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, plan: e.target.value }))
                    }
                  >
                    <option value="pro">Pro</option>
                    <option value="starter">Starter</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Durée (jours)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={3650}
                    value={form.days}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, days: parseInt(e.target.value) || 365 }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Utilisations max
                </label>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={form.maxRedemptions}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      maxRedemptions: parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Expiration du code (optionnel)
                </label>
                <Input
                  type="date"
                  value={form.validUntil}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, validUntil: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Laisser vide pour un code sans expiration.
                </p>
              </div>

              <Button
                onClick={handleCreateCode}
                disabled={creating || !form.label.trim()}
                className="w-full gap-2"
              >
                {creating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Génération…
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Générer le code
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
