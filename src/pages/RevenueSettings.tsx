import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  DollarSign,
  CalendarDays,
  ShoppingCart,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Save,
  RefreshCw,
  Zap,
  ExternalLink,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CommercialConfig {
  id: string;
  organization_id: string;
  booking_url: string | null;
  starter_checkout_url: string | null;
  pro_checkout_url: string | null;
  enterprise_checkout_url: string | null;
  support_email: string | null;
  sales_enabled: boolean;
  created_at: string;
  updated_at: string;
}

type ConfigForm = Omit<CommercialConfig, 'id' | 'organization_id' | 'created_at' | 'updated_at'>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function isValidUrl(val: string): boolean {
  if (!val) return true; // optional
  try { new URL(val); return true; } catch { return false; }
}

function isValidEmail(val: string): boolean {
  if (!val) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val);
}

function ConfigField({
  label,
  description,
  id,
  value,
  onChange,
  placeholder,
  icon,
  error,
  isUrl = true,
}: {
  label: string;
  description: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  error?: string;
  isUrl?: boolean;
}) {
  const isSet = !!value.trim();
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="flex items-center gap-2 text-sm font-medium">
          <span className="text-muted-foreground">{icon}</span>
          {label}
        </Label>
        <Badge
          variant="outline"
          className={`text-xs ${isSet ? 'bg-success/10 text-success border-success/30' : 'bg-muted/50 text-muted-foreground border-muted'}`}
        >
          {isSet ? '✓ Configuré' : 'Non défini'}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="flex gap-2">
        <Input
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`flex-1 ${error ? 'border-destructive' : ''}`}
        />
        {isSet && isUrl && (
          <Button
            variant="ghost"
            size="icon"
            type="button"
            className="shrink-0"
            onClick={() => window.open(value, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function RevenueSettings() {
  const { organization } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [form, setForm] = useState<ConfigForm>({
    booking_url: '',
    starter_checkout_url: '',
    pro_checkout_url: '',
    enterprise_checkout_url: '',
    support_email: '',
    sales_enabled: true,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ConfigForm, string>>>({});
  const [isDirty, setIsDirty] = useState(false);

  // ── Fetch existing config ──────────────────────────────────────────────────
  const { data: config, isLoading } = useQuery<CommercialConfig | null>({
    queryKey: ['commercial-config', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('commercial_config')
        .select('*')
        .eq('organization_id', organization.id)
        .maybeSingle();
      if (error) throw error;
      return data as CommercialConfig | null;
    },
    enabled: !!organization?.id,
  });

  // Hydrate form from DB
  useEffect(() => {
    if (config) {
      setForm({
        booking_url:             config.booking_url             ?? '',
        starter_checkout_url:   config.starter_checkout_url   ?? '',
        pro_checkout_url:        config.pro_checkout_url        ?? '',
        enterprise_checkout_url: config.enterprise_checkout_url ?? '',
        support_email:           config.support_email           ?? '',
        sales_enabled:           config.sales_enabled,
      });
      setIsDirty(false);
    }
  }, [config]);

  // ── Upsert mutation ────────────────────────────────────────────────────────
  const save = useMutation({
    mutationFn: async (data: ConfigForm) => {
      if (!organization?.id) throw new Error('Organisation non trouvée');
      const payload = {
        organization_id:         organization.id,
        booking_url:             data.booking_url             || null,
        starter_checkout_url:   data.starter_checkout_url   || null,
        pro_checkout_url:        data.pro_checkout_url        || null,
        enterprise_checkout_url: data.enterprise_checkout_url || null,
        support_email:           data.support_email           || null,
        sales_enabled:           data.sales_enabled,
        updated_at:              new Date().toISOString(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('commercial_config')
        .upsert(payload, { onConflict: 'organization_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['commercial-config'] });
      setIsDirty(false);
      toast({ title: 'Configuration sauvegardée', description: 'Vos liens commerciaux sont actifs.' });
    },
    onError: (e) => {
      toast({ title: 'Erreur', description: (e as Error).message, variant: 'destructive' });
    },
  });

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: Partial<Record<keyof ConfigForm, string>> = {};
    const urlFields: Array<keyof ConfigForm> = ['booking_url', 'starter_checkout_url', 'pro_checkout_url', 'enterprise_checkout_url'];
    urlFields.forEach(k => {
      const v = (form[k] as string) ?? '';
      if (v && !isValidUrl(v)) errs[k] = 'URL invalide (ex: https://...)';
    });
    if (form.support_email && !isValidEmail(form.support_email)) {
      errs.support_email = 'Email invalide';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) save.mutate(form);
  };

  const set = <K extends keyof ConfigForm>(key: K, val: ConfigForm[K]) => {
    setForm(f => ({ ...f, [key]: val }));
    setIsDirty(true);
    if (errors[key]) setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  };

  // ── Compute live readiness ─────────────────────────────────────────────────
  const configuredCount = [
    form.booking_url,
    form.starter_checkout_url,
    form.pro_checkout_url,
    form.enterprise_checkout_url,
  ].filter(Boolean).length;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Revenue Settings</h1>
              <p className="text-sm text-muted-foreground">Configuration commerciale pilotable — priorité sur les variables d'env.</p>
            </div>
          </div>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        {/* Status bar */}
        <Card className={`border-${configuredCount >= 3 ? 'success' : configuredCount >= 1 ? 'warning' : 'destructive'}/30`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {configuredCount >= 3
                  ? <CheckCircle2 className="h-5 w-5 text-success" />
                  : <AlertTriangle className="h-5 w-5 text-warning" />
                }
                <div>
                  <p className="text-sm font-medium">
                    {configuredCount === 0 && 'Aucun lien commercial configuré — fallback formulaire démo actif'}
                    {configuredCount === 1 && '1 lien configuré — tunnel partiel'}
                    {configuredCount === 2 && '2 liens configurés — tunnel presque complet'}
                    {configuredCount >= 3 && 'Tunnel commercial complet'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {configuredCount}/4 liens actifs · Mode vente : {form.sales_enabled ? 'Activé' : 'Désactivé'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Zap className={`h-4 w-4 ${form.sales_enabled ? 'text-success' : 'text-muted-foreground'}`} />
                <Switch
                  checked={form.sales_enabled}
                  onCheckedChange={v => set('sales_enabled', v)}
                />
                <span className="text-xs text-muted-foreground">Mode vente</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Booking */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                Prise de rendez-vous
              </CardTitle>
              <CardDescription>
                Lien Calendly, Cal.com, HubSpot ou tout autre outil de booking.
                Utilisé par les boutons "Demander une démo" et "Planifier".
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConfigField
                label="URL de booking"
                description="Ex : https://calendly.com/votre-equipe/demo-cyber-serenity"
                id="booking_url"
                value={form.booking_url ?? ''}
                onChange={v => set('booking_url', v)}
                placeholder="https://calendly.com/..."
                icon={<CalendarDays className="h-4 w-4" />}
                error={errors.booking_url}
              />
            </CardContent>
          </Card>

          {/* Checkout */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" />
                Liens de checkout
              </CardTitle>
              <CardDescription>
                URLs Stripe, LemonSqueezy ou tout SaaS de paiement.
                Les CTA pricing les utilisent en priorité, fallback formulaire démo si absents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <ConfigField
                label="Starter — 490 €/an"
                description="Lien d'achat direct pour le plan Starter"
                id="starter_checkout_url"
                value={form.starter_checkout_url ?? ''}
                onChange={v => set('starter_checkout_url', v)}
                placeholder="https://buy.stripe.com/starter..."
                icon={<ShoppingCart className="h-4 w-4" />}
                error={errors.starter_checkout_url}
              />
              <Separator />
              <ConfigField
                label="Pro"
                description="Lien d'achat direct pour le plan Pro"
                id="pro_checkout_url"
                value={form.pro_checkout_url ?? ''}
                onChange={v => set('pro_checkout_url', v)}
                placeholder="https://buy.stripe.com/pro..."
                icon={<ShoppingCart className="h-4 w-4" />}
                error={errors.pro_checkout_url}
              />
              <Separator />
              <ConfigField
                label="Enterprise"
                description="Lien d'achat ou devis pour le plan Enterprise"
                id="enterprise_checkout_url"
                value={form.enterprise_checkout_url ?? ''}
                onChange={v => set('enterprise_checkout_url', v)}
                placeholder="https://buy.stripe.com/enterprise..."
                icon={<ShoppingCart className="h-4 w-4" />}
                error={errors.enterprise_checkout_url}
              />
            </CardContent>
          </Card>

          {/* Support */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                Contact commercial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ConfigField
                label="Email de support / vente"
                description="Utilisé dans les emails automatiques et le footer"
                id="support_email"
                value={form.support_email ?? ''}
                onChange={v => set('support_email', v)}
                placeholder="sales@cyberserenity.fr"
                icon={<Mail className="h-4 w-4" />}
                error={errors.support_email}
                isUrl={false}
              />
            </CardContent>
          </Card>

          {/* Save */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => qc.invalidateQueries({ queryKey: ['commercial-config'] })}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={save.isPending || !isDirty}
              className="gap-2"
            >
              {save.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin" />Sauvegarde…</>
                : <><Save className="h-4 w-4" />Sauvegarder la configuration</>
              }
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
