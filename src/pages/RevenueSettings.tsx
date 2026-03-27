import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useBootstrapState } from '@/hooks/useBootstrapState';
import { BootstrapBanner } from '@/components/ui/BootstrapBanner';
import {
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
  Server,
  Brain,
  Settings2,
  Rocket,
  ArrowRight,
  Activity,
  ShieldCheck,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface RuntimeConfigRow {
  id?: string;
  organization_id: string;
  core_api_url: string | null;
  ai_gateway_url: string | null;
  booking_url: string | null;
  starter_checkout_url: string | null;
  pro_checkout_url: string | null;
  enterprise_checkout_url: string | null;
  support_email: string | null;
  reports_mode: string;
  sales_mode: string;
  external_sovereign_confirmed_at?: string | null;
}


interface CommercialConfig {
  booking_url: string | null;
  starter_checkout_url: string | null;
  pro_checkout_url: string | null;
  enterprise_checkout_url: string | null;
  support_email: string | null;
  sales_enabled: boolean;
}

type ReportsMode = 'external_only' | 'internal_fallback' | 'internal_only';
type SalesMode   = 'lead_first' | 'checkout_first' | 'booking_first' | 'disabled';

interface FormState {
  // Backend
  core_api_url:            string;
  ai_gateway_url:          string;
  reports_mode:            ReportsMode;
  sales_mode:              SalesMode;
  // Commercial
  booking_url:             string;
  starter_checkout_url:    string;
  pro_checkout_url:        string;
  enterprise_checkout_url: string;
  support_email:           string;
  sales_enabled:           boolean;
}

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
  label, description, id, value, onChange, placeholder, icon, error, isUrl = true,
}: {
  label: string; description: string; id: string; value: string; onChange: (v: string) => void;
  placeholder: string; icon: React.ReactNode; error?: string; isUrl?: boolean;
}) {
  const isSet = !!value.trim();
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="flex items-center gap-2 text-sm font-medium">
          <span className="text-muted-foreground">{icon}</span>
          {label}
        </Label>
        <Badge variant="outline" className={`text-xs ${isSet ? 'bg-success/10 text-success border-success/30' : 'bg-muted/50 text-muted-foreground border-muted'}`}>
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
          <Button variant="ghost" size="icon" type="button" className="shrink-0"
            onClick={() => window.open(value, '_blank', 'noopener,noreferrer')}>
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ── Sovereign Activation Block ────────────────────────────────────────────────
// Shown in the Backend card. Save URL → Ping → Persist confirmation in DB.
// Once confirmed, shows permanent "100% SOUVERAIN EXTERNE" badge.
function SovereignActivationBlock({
  coreApiUrl,
  orgId,
  confirmedAt,
  onConfirmed,
}: {
  coreApiUrl: string;
  orgId: string;
  confirmedAt: string | null | undefined;
  onConfirmed: (ts: string) => void;
}) {
  const { toast } = useToast();
  const [pingState, setPingState] = useState<'idle' | 'running' | 'ok' | 'fail'>('idle');
  const [pingDetail, setPingDetail] = useState<string>('');

  const isAlreadyConfirmed = !!confirmedAt;
  const isUrlSet = !!coreApiUrl.trim();

  const handlePingAndActivate = async () => {
    if (!isUrlSet) return;
    setPingState('running'); setPingDetail('');
    const start = Date.now();
    try {
      const res = await fetch(`${coreApiUrl.trim()}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(8000),
      });
      const ms = Date.now() - start;
      if (res.ok) {
        const ts = new Date().toISOString();
        // Persist confirmation in DB
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: dbErr } = await (supabase as any)
          .from('app_runtime_config')
          .upsert({
            organization_id: orgId,
            core_api_url: coreApiUrl.trim(),
            external_sovereign_confirmed_at: ts,
          }, { onConflict: 'organization_id' });
        if (dbErr) throw dbErr;
        setPingState('ok');
        setPingDetail(`HTTP ${res.status} · ${ms}ms`);
        onConfirmed(ts);
        toast({
          title: '✅ EXTERNE CONFIRMÉ — activé',
          description: `Core API joignable en ${ms}ms — badge permanent sauvegardé en DB.`,
        });
      } else {
        setPingState('fail');
        setPingDetail(`HTTP ${res.status} · ${ms}ms — vérifiez l'URL`);
        toast({ title: 'Ping échoué', description: `HTTP ${res.status}`, variant: 'destructive' });
      }
    } catch (e: unknown) {
      setPingState('fail');
      setPingDetail((e as Error).message);
      toast({ title: 'Ping échoué', description: (e as Error).message, variant: 'destructive' });
    }
  };

  if (isAlreadyConfirmed) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/5 px-4 py-3">
        <ShieldCheck className="h-5 w-5 text-success shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-success">✓ 100% SOUVERAIN EXTERNE — Confirmé</p>
          <p className="text-xs text-muted-foreground font-mono">
            Ping validé le {new Date(confirmedAt).toLocaleString('fr-FR')} · Core API joignable
          </p>
        </div>
        <Badge variant="outline" className="border-success/40 text-success bg-success/5 text-xs font-bold shrink-0">
          EXTERNE ✓
        </Badge>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border px-4 py-3 space-y-3 ${
      pingState === 'ok' ? 'border-success/30 bg-success/5' :
      pingState === 'fail' ? 'border-destructive/20 bg-destructive/5' :
      'border-primary/20 bg-primary/5'
    }`}>
      <div className="flex items-center gap-2">
        <Rocket className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold">Activer la souveraineté externe</p>
      </div>
      <p className="text-xs text-muted-foreground">
        Sauvegardez d'abord l'URL Core API ci-dessus, puis cliquez pour pinguer et activer le badge permanent "100% SOUVERAIN EXTERNE".
      </p>
      {pingDetail && (
        <p className={`text-xs font-mono ${pingState === 'ok' ? 'text-success' : 'text-destructive'}`}>
          {pingState === 'ok' ? `✓ ${pingDetail}` : `✗ ${pingDetail}`}
        </p>
      )}
      <Button
        type="button"
        size="sm"
        disabled={!isUrlSet || pingState === 'running'}
        onClick={handlePingAndActivate}
        className={`gap-2 w-full ${pingState === 'ok' ? 'bg-success hover:bg-success/90' : ''}`}
      >
        {pingState === 'running'
          ? <><Loader2 className="h-4 w-4 animate-spin" />Ping en cours…</>
          : pingState === 'ok'
          ? <><ShieldCheck className="h-4 w-4" />100% SOUVERAIN EXTERNE ✓</>
          : <><Activity className="h-4 w-4" />Ping & Activer Souveraineté Externe<ArrowRight className="h-4 w-4" /></>
        }
      </Button>
      {!isUrlSet && (
        <p className="text-xs text-warning">⚠ Saisissez et sauvegardez la Core API URL d'abord</p>
      )}
    </div>
  );
}



// ── Quick Activation Block ────────────────────────────────────────────────────
// Shown only when bootstrap is in config_missing or tenant_ready state.
// Minimal single-field form: just booking_url to unblock the CTA pipeline.

function QuickActivationBlock({
  currentBookingUrl,
  currentStarterUrl,
  orgId,
  onActivated,
}: {
  currentBookingUrl: string;
  currentStarterUrl: string;
  orgId: string;
  onActivated: () => void;
}) {
  const { toast } = useToast();
  const [bookingUrl, setBookingUrl] = useState(currentBookingUrl);
  const [starterUrl, setStarterUrl] = useState(currentStarterUrl);
  const [saving, setSaving] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [starterError, setStarterError] = useState('');

  const hasAtLeastOne = bookingUrl.trim() || starterUrl.trim();

  const handleActivate = async () => {
    // Validate
    let valid = true;
    if (bookingUrl && !isValidUrl(bookingUrl)) {
      setUrlError('URL invalide (ex: https://calendly.com/...)');
      valid = false;
    } else {
      setUrlError('');
    }
    if (starterUrl && !isValidUrl(starterUrl)) {
      setStarterError('URL invalide (ex: https://buy.stripe.com/...)');
      valid = false;
    } else {
      setStarterError('');
    }
    if (!hasAtLeastOne) {
      setUrlError('Saisir au moins une URL pour activer les CTAs publics.');
      return;
    }
    if (!valid) return;

    setSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('app_runtime_config')
        .upsert({
          organization_id: orgId,
          booking_url: bookingUrl.trim() || null,
          starter_checkout_url: starterUrl.trim() || null,
          sales_mode: bookingUrl.trim() ? 'booking_first' : 'checkout_first',
          reports_mode: 'internal_fallback',
        }, { onConflict: 'organization_id' });

      if (error) throw error;

      toast({
        title: '✅ Mode nominal activé',
        description: 'Les CTAs publics utilisent désormais la config DB. Rechargez /pricing pour constater.',
      });
      onActivated();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-primary">
          <Rocket className="h-4 w-4" />
          Activation rapide — saisir au minimum une URL
        </CardTitle>
        <CardDescription>
          Renseignez au moins un lien commercial pour que les CTAs publics sortent du mode "lead capture".
          Un seul champ suffit. Vous pouvez compléter le reste ensuite.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="qa_booking_url" className="flex items-center gap-2 text-sm font-medium">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            URL de booking <span className="text-muted-foreground font-normal text-xs">(Calendly, Cal.com…)</span>
          </Label>
          <Input
            id="qa_booking_url"
            placeholder="https://calendly.com/votre-equipe/demo"
            value={bookingUrl}
            onChange={e => { setBookingUrl(e.target.value); setUrlError(''); }}
            className={urlError ? 'border-destructive' : ''}
            disabled={saving}
          />
          {urlError && <p className="text-xs text-destructive">{urlError}</p>}
        </div>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">ou</span>
          <Separator className="flex-1" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="qa_starter_url" className="flex items-center gap-2 text-sm font-medium">
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            URL checkout Starter <span className="text-muted-foreground font-normal text-xs">(Stripe, LemonSqueezy…)</span>
          </Label>
          <Input
            id="qa_starter_url"
            placeholder="https://buy.stripe.com/..."
            value={starterUrl}
            onChange={e => { setStarterUrl(e.target.value); setStarterError(''); }}
            className={starterError ? 'border-destructive' : ''}
            disabled={saving}
          />
          {starterError && <p className="text-xs text-destructive">{starterError}</p>}
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            Effet immédiat sur /pricing et /landing après sauvegarde.
          </p>
          <Button
            onClick={handleActivate}
            disabled={saving || !hasAtLeastOne}
            className="gap-2"
          >
            {saving
              ? <><Loader2 className="h-4 w-4 animate-spin" />Activation…</>
              : <><Rocket className="h-4 w-4" />Activer le mode nominal<ArrowRight className="h-4 w-4" /></>
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function RevenueSettings() {
  const { organization } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const bs = useBootstrapState();

  const defaultForm: FormState = {
    core_api_url: '', ai_gateway_url: '',
    reports_mode: 'internal_fallback', sales_mode: 'lead_first',
    booking_url: '', starter_checkout_url: '', pro_checkout_url: '',
    enterprise_checkout_url: '', support_email: '', sales_enabled: true,
  };

  const [form, setForm] = useState<FormState>(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [isDirty, setIsDirty] = useState(false);
  // Tracks the DB-persisted sovereign confirmation timestamp (survives reload)
  const [sovereignConfirmedAt, setSovereignConfirmedAt] = useState<string | null>(null);


  // ── Fetch app_runtime_config ───────────────────────────────────────────────
  const { data: rtRow, isLoading: rtLoading } = useQuery<RuntimeConfigRow | null>({
    queryKey: ['app-runtime-config', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('app_runtime_config')
        .select('*')
        .eq('organization_id', organization.id)
        .maybeSingle();
      return data ?? null;
    },
    enabled: !!organization?.id,
  });

  // ── Fetch commercial_config (legacy booking/checkout) ─────────────────────
  const { data: ccRow, isLoading: ccLoading } = useQuery<CommercialConfig | null>({
    queryKey: ['commercial-config', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('commercial_config')
        .select('booking_url, starter_checkout_url, pro_checkout_url, enterprise_checkout_url, support_email, sales_enabled')
        .eq('organization_id', organization.id)
        .maybeSingle();
      return data ?? null;
    },
    enabled: !!organization?.id,
  });

  // Hydrate form: runtime config takes precedence, then commercial_config
  useEffect(() => {
    if (rtRow) {
      setForm({
        core_api_url:            rtRow.core_api_url            ?? '',
        ai_gateway_url:          rtRow.ai_gateway_url          ?? '',
        reports_mode:            (rtRow.reports_mode as ReportsMode) ?? 'internal_fallback',
        sales_mode:              (rtRow.sales_mode   as SalesMode)   ?? 'lead_first',
        booking_url:             rtRow.booking_url             ?? ccRow?.booking_url             ?? '',
        starter_checkout_url:    rtRow.starter_checkout_url    ?? ccRow?.starter_checkout_url    ?? '',
        pro_checkout_url:        rtRow.pro_checkout_url         ?? ccRow?.pro_checkout_url         ?? '',
        enterprise_checkout_url: rtRow.enterprise_checkout_url ?? ccRow?.enterprise_checkout_url  ?? '',
        support_email:           rtRow.support_email           ?? ccRow?.support_email            ?? '',
        sales_enabled:           ccRow?.sales_enabled           ?? true,
      });
      // Restore persisted sovereign confirmation from DB
      setSovereignConfirmedAt(rtRow.external_sovereign_confirmed_at ?? null);
      setIsDirty(false);
    } else if (ccRow) {
      setForm(f => ({
        ...f,
        booking_url:             ccRow.booking_url             ?? '',
        starter_checkout_url:    ccRow.starter_checkout_url    ?? '',
        pro_checkout_url:        ccRow.pro_checkout_url         ?? '',
        enterprise_checkout_url: ccRow.enterprise_checkout_url ?? '',
        support_email:           ccRow.support_email           ?? '',
        sales_enabled:           ccRow.sales_enabled,
      }));
      setIsDirty(false);
    }
  }, [rtRow, ccRow]);


  // ── Save mutation: upsert both tables ─────────────────────────────────────
  const save = useMutation({
    mutationFn: async (data: FormState) => {
      if (!organization?.id) throw new Error('Organisation non trouvée');

      // 1. Upsert app_runtime_config
      const rtPayload: Omit<RuntimeConfigRow, 'id'> = {
        organization_id:         organization.id,
        core_api_url:            data.core_api_url             || null,
        ai_gateway_url:          data.ai_gateway_url           || null,
        booking_url:             data.booking_url              || null,
        starter_checkout_url:    data.starter_checkout_url     || null,
        pro_checkout_url:        data.pro_checkout_url          || null,
        enterprise_checkout_url: data.enterprise_checkout_url  || null,
        support_email:           data.support_email            || null,
        reports_mode:            data.reports_mode,
        sales_mode:              data.sales_mode,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: rtErr } = await (supabase as any)
        .from('app_runtime_config')
        .upsert(rtPayload, { onConflict: 'organization_id' });
      if (rtErr) throw rtErr;

      // 2. Keep commercial_config in sync (legacy consumers)
      const ccPayload = {
        organization_id:         organization.id,
        booking_url:             data.booking_url              || null,
        starter_checkout_url:    data.starter_checkout_url     || null,
        pro_checkout_url:        data.pro_checkout_url          || null,
        enterprise_checkout_url: data.enterprise_checkout_url  || null,
        support_email:           data.support_email            || null,
        sales_enabled:           data.sales_enabled,
        updated_at:              new Date().toISOString(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: ccErr } = await (supabase as any)
        .from('commercial_config')
        .upsert(ccPayload, { onConflict: 'organization_id' });
      if (ccErr) throw ccErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['app-runtime-config'] });
      qc.invalidateQueries({ queryKey: ['commercial-config'] });
      qc.invalidateQueries({ queryKey: ['public-tenant-config'] });
      setIsDirty(false);
      toast({ title: 'Configuration sauvegardée', description: 'Les paramètres runtime sont actifs immédiatement.' });
    },
    onError: (e) => {
      toast({ title: 'Erreur', description: (e as Error).message, variant: 'destructive' });
    },
  });

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    const urlFields: Array<keyof FormState> = [
      'core_api_url', 'ai_gateway_url',
      'booking_url', 'starter_checkout_url', 'pro_checkout_url', 'enterprise_checkout_url',
    ];
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

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm(f => ({ ...f, [key]: val }));
    setIsDirty(true);
    if (errors[key]) setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  };

  const configuredCount = [
    form.booking_url, form.starter_checkout_url,
    form.pro_checkout_url, form.enterprise_checkout_url,
  ].filter(Boolean).length;

  const isLoading = rtLoading || ccLoading;

  // Show quick-activation block when org exists but no commercial URLs yet
  const showQuickActivation =
    bs.phase === 'config_missing' || bs.phase === 'tenant_ready';

  const handleQuickActivated = () => {
    qc.invalidateQueries({ queryKey: ['app-runtime-config'] });
    qc.invalidateQueries({ queryKey: ['commercial-config'] });
    qc.invalidateQueries({ queryKey: ['public-tenant-config'] });
    // Give DB a moment then refetch
    setTimeout(() => {
      qc.invalidateQueries({ queryKey: ['app-runtime-config'] });
      qc.invalidateQueries({ queryKey: ['public-tenant-config'] });
    }, 1500);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Settings2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Revenue & Runtime Settings</h1>
              <p className="text-sm text-muted-foreground">
                Configuration pilotable en base — priorité absolue sur les variables d'env.
              </p>
            </div>
          </div>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        {/* Bootstrap state banner */}
        <BootstrapBanner />

        {/* ── Quick activation block — shown when config_missing or tenant_ready ── */}
        {showQuickActivation && organization?.id && (
          <QuickActivationBlock
            currentBookingUrl={form.booking_url}
            currentStarterUrl={form.starter_checkout_url}
            orgId={organization.id}
            onActivated={handleQuickActivated}
          />
        )}

        {/* Nominal mode proof panel — shown when public_config_ready */}
        {bs.phase === 'public_config_ready' && (
          <Card className="border-success/40 bg-success/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-success">Mode nominal actif</p>
                  <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono text-muted-foreground">
                    <span>tenant_resolved: <span className="text-foreground">true</span></span>
                    <span>source: <span className="text-foreground">{bs.publicConfigSource}</span></span>
                    <span>hasCommercialUrls: <span className="text-foreground">true</span></span>
                    <span>CTAs: <span className="text-foreground">DB-aware</span></span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Les CTAs publics consomment la config DB — pas les env vars.
                    Vérifiable sur <span className="font-mono">/pricing</span>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status bar */}
        <Card>
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
                    {configuredCount}/4 liens commerciaux · Mode rapport : {form.reports_mode} · Mode vente : {form.sales_mode}
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

          {/* ── Backend / Reporting ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Server className="h-4 w-4 text-primary" />
                Backend & Reporting
              </CardTitle>
              <CardDescription>
                URL du backend externe pour la génération de rapports IA.
                En l'absence de ces URLs, le moteur interne (Edge Functions) prend le relais.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <ConfigField
                label="Core API URL"
                description="Proxy backend principal (ex: https://api.votre-backend.fr). Optionnel."
                id="core_api_url"
                value={form.core_api_url}
                onChange={v => set('core_api_url', v)}
                placeholder="https://api.cyberserenity.fr"
                icon={<Server className="h-4 w-4" />}
                error={errors.core_api_url}
              />
              <Separator />
              <ConfigField
                label="AI Gateway URL"
                description="Endpoint IA dédié (optionnel, utilise Core API si absent)"
                id="ai_gateway_url"
                value={form.ai_gateway_url}
                onChange={v => set('ai_gateway_url', v)}
                placeholder="https://ai.cyberserenity.fr"
                icon={<Brain className="h-4 w-4" />}
                error={errors.ai_gateway_url}
              />
              <Separator />
              {/* ── Sovereign Activation Block ── */}
              {organization?.id && (
                <SovereignActivationBlock
                  coreApiUrl={form.core_api_url}
                  orgId={organization.id}
                  confirmedAt={sovereignConfirmedAt}
                  onConfirmed={(ts) => {
                    setSovereignConfirmedAt(ts);
                    qc.invalidateQueries({ queryKey: ['app-runtime-config'] });
                  }}
                />
              )}
              <Separator />

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Brain className="h-4 w-4 text-muted-foreground" />
                  Mode de génération des rapports
                </Label>
                <p className="text-xs text-muted-foreground">
                  Contrôle si les rapports Report Studio utilisent le backend externe, le moteur interne, ou les deux.
                </p>
                <Select
                  value={form.reports_mode}
                  onValueChange={v => set('reports_mode', v as ReportsMode)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal_only">
                      Moteur interne uniquement (Edge Functions Gemini)
                    </SelectItem>
                    <SelectItem value="internal_fallback">
                      Fallback interne — essaie externe, puis interne
                    </SelectItem>
                    <SelectItem value="external_only">
                      Backend externe uniquement (Core API URL requis)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  Mode de vente
                </Label>
                <p className="text-xs text-muted-foreground">
                  Contrôle le comportement des CTAs commerciaux.
                </p>
                <Select
                  value={form.sales_mode}
                  onValueChange={v => set('sales_mode', v as SalesMode)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead_first">Lead first — formulaire en priorité</SelectItem>
                    <SelectItem value="booking_first">Booking first — rendez-vous en priorité</SelectItem>
                    <SelectItem value="checkout_first">Checkout first — paiement direct en priorité</SelectItem>
                    <SelectItem value="disabled">Désactivé — aucun CTA commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* ── Booking ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                Prise de rendez-vous
              </CardTitle>
              <CardDescription>
                Lien Calendly, Cal.com, HubSpot ou tout outil de booking.
                Utilisé par les boutons "Demander une démo" et "Planifier".
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConfigField
                label="URL de booking"
                description="Ex : https://calendly.com/votre-equipe/demo-cyber-serenity"
                id="booking_url"
                value={form.booking_url}
                onChange={v => set('booking_url', v)}
                placeholder="https://calendly.com/..."
                icon={<CalendarDays className="h-4 w-4" />}
                error={errors.booking_url}
              />
            </CardContent>
          </Card>

          {/* ── Checkout ── */}
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
                value={form.starter_checkout_url}
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
                value={form.pro_checkout_url}
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
                value={form.enterprise_checkout_url}
                onChange={v => set('enterprise_checkout_url', v)}
                placeholder="https://buy.stripe.com/enterprise..."
                icon={<ShoppingCart className="h-4 w-4" />}
                error={errors.enterprise_checkout_url}
              />
            </CardContent>
          </Card>

          {/* ── Support ── */}
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
                value={form.support_email}
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
              onClick={() => qc.invalidateQueries({ queryKey: ['app-runtime-config', 'commercial-config'] })}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button type="submit" disabled={save.isPending || !isDirty} className="gap-2">
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
