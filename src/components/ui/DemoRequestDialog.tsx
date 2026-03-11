import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Loader2, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/tracking';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

interface DemoRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ctaOrigin?: string;
  sourcePage?: string;
}

const COMPANY_SIZES = [
  { value: '1-10',    label: '1 – 10 collaborateurs' },
  { value: '11-50',   label: '11 – 50 collaborateurs' },
  { value: '51-200',  label: '51 – 200 collaborateurs' },
  { value: '201-500', label: '201 – 500 collaborateurs' },
  { value: '500+',    label: '500+ collaborateurs' },
];

const INTEREST_TYPES = [
  { value: 'demo_live',   label: 'Démonstration live' },
  { value: 'pilot',       label: 'Pilote / POC' },
  { value: 'pricing',     label: 'Information tarifaire' },
  { value: 'integration', label: 'Intégration technique' },
  { value: 'other',       label: 'Autre' },
];

/** Read UTM params from current URL */
function getUtmParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const p = new URLSearchParams(window.location.search);
  return {
    utm_source:   p.get('utm_source')   ?? '',
    utm_medium:   p.get('utm_medium')   ?? '',
    utm_campaign: p.get('utm_campaign') ?? '',
    utm_content:  p.get('utm_content')  ?? '',
  };
}

export function DemoRequestDialog({
  open,
  onOpenChange,
  ctaOrigin = 'unknown',
  sourcePage = '/',
}: DemoRequestDialogProps) {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    company: '',
    role: '',
    company_size: '',
    interest_type: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Track dialog open
  useEffect(() => {
    if (open) {
      trackEvent('demo_dialog_open', { source_page: sourcePage, cta_origin: ctaOrigin });
    }
  }, [open, sourcePage, ctaOrigin]);

  const validate = () => {
    const e: Record<string, string> = {};
    const name = form.full_name.trim();
    if (!name || name.length < 2)  e.full_name = 'Nom requis (min. 2 caractères)';
    if (name.length > 100)          e.full_name = 'Nom trop long (max. 100 caractères)';
    const email = form.email.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) e.email = 'Email valide requis';
    if (email.length > 255)         e.email = 'Email trop long';
    const company = form.company.trim();
    if (!company || company.length < 2) e.company = 'Entreprise requise (min. 2 caractères)';
    if (company.length > 150)       e.company = "Nom d'entreprise trop long";
    if (form.role.length > 100)     e.role = 'Fonction trop longue';
    if (form.message.length > 2000) e.message = 'Message trop long (max. 2000 caractères)';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    try {
      const utm = getUtmParams();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/submit-sales-lead`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          full_name:    form.full_name.trim(),
          email:        form.email.trim().toLowerCase(),
          company:      form.company.trim(),
          role:         form.role.trim() || undefined,
          company_size: form.company_size || undefined,
          interest_type:form.interest_type || undefined,
          message:      form.message.trim() || undefined,
          source_page:  sourcePage,
          cta_origin:   ctaOrigin,
          ...utm,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok && res.status !== 201) {
        throw new Error(json?.error ?? `Erreur ${res.status}`);
      }

      await trackEvent('demo_dialog_submit', {
        source_page: sourcePage,
        cta_origin: ctaOrigin,
        metadata: { lead_score: json?.lead_score },
      });

      setSubmitted(true);
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : "Impossible d'envoyer votre demande. Réessayez.",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string, val: string) => {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      setSubmitted(false);
      setForm({ full_name: '', email: '', company: '', role: '', company_size: '', interest_type: '', message: '' });
      setErrors({});
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        {!submitted ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-lg">Demander une démonstration</DialogTitle>
                  <DialogDescription className="text-sm">
                    Notre équipe vous contacte sous 24h.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="lead-name">Nom complet *</Label>
                  <Input
                    id="lead-name"
                    placeholder="Marie Dupont"
                    value={form.full_name}
                    onChange={e => set('full_name', e.target.value)}
                    className={errors.full_name ? 'border-destructive' : ''}
                  />
                  {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lead-email">Email professionnel *</Label>
                  <Input
                    id="lead-email"
                    type="email"
                    placeholder="marie@entreprise.fr"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="lead-company">Entreprise *</Label>
                  <Input
                    id="lead-company"
                    placeholder="ACME Corp SA"
                    value={form.company}
                    onChange={e => set('company', e.target.value)}
                    className={errors.company ? 'border-destructive' : ''}
                  />
                  {errors.company && <p className="text-xs text-destructive">{errors.company}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lead-role">Fonction</Label>
                  <Input
                    id="lead-role"
                    placeholder="DSI, RSSI, DG..."
                    value={form.role}
                    onChange={e => set('role', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Taille de l'entreprise</Label>
                  <Select value={form.company_size} onValueChange={v => set('company_size', v)}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      {COMPANY_SIZES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Je souhaite…</Label>
                  <Select value={form.interest_type} onValueChange={v => set('interest_type', v)}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      {INTEREST_TYPES.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lead-message">Message (optionnel)</Label>
                <Textarea
                  id="lead-message"
                  placeholder="Décrivez votre contexte, vos contraintes, vos questions..."
                  value={form.message}
                  onChange={e => set('message', e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Envoi en cours…</>
                  : 'Envoyer ma demande'}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Vos données sont confidentielles et ne seront jamais revendues.
              </p>
            </form>
          </>
        ) : (
          <div className="py-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Demande envoyée !</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                Notre équipe vous contactera sous{' '}
                <strong>24 heures ouvrées</strong> à l'adresse{' '}
                <strong>{form.email}</strong>.
              </p>
            </div>
            <Button variant="outline" onClick={() => handleClose(false)}>
              Fermer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
