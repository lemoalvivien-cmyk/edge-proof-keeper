import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Users,
  Search,
  RefreshCw,
  TrendingUp,
  Star,
  Mail,
  Building2,
  Briefcase,
  MessageSquare,
  Calendar,
  Globe,
  MousePointerClick,
  Copy,
  Check,
  ThumbsUp,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getBookingUrl } from '@/lib/revenue-links';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SalesLead {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  company: string;
  role: string | null;
  company_size: string | null;
  interest_type: string | null;
  message: string | null;
  source_page: string | null;
  cta_origin: string | null;
  status: string;
  lead_score: number;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  last_activity_at: string;
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  new:        { label: 'Nouveau',    className: 'bg-primary/10 text-primary border-primary/30' },
  contacted:  { label: 'Contacté',   className: 'bg-blue-500/10 text-blue-400 border-blue-400/30' },
  qualified:  { label: 'Qualifié',   className: 'bg-warning/10 text-warning border-warning/30' },
  won:        { label: 'Gagné ✓',    className: 'bg-success/10 text-success border-success/30' },
  lost:       { label: 'Perdu',      className: 'bg-muted/50 text-muted-foreground border-muted' },
};

const STATUSES = Object.keys(STATUS_CONFIG);

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.new;
  return (
    <Badge variant="outline" className={`text-xs ${cfg.className}`}>
      {cfg.label}
    </Badge>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 60 ? 'text-success' :
    score >= 35 ? 'text-warning' :
    'text-muted-foreground';
  return (
    <span className={`flex items-center gap-1 text-sm font-bold ${cls}`}>
      <Star className="h-3 w-3" />
      {score}
    </span>
  );
}

const INTEREST_LABELS: Record<string, string> = {
  demo_live:   'Démo live',
  pilot:       'Pilote / POC',
  pricing:     'Tarifs',
  integration: 'Intégration',
  other:       'Autre',
};

// ── Quick action button ───────────────────────────────────────────────────────

function QuickAction({
  icon,
  label,
  onClick,
  variant = 'outline',
}: {
  icon: React.ReactNode;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  variant?: 'outline' | 'default' | 'ghost' | 'secondary';
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={e => { e.stopPropagation(); onClick(e); }}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AdminLeads() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCta, setFilterCta] = useState('all');
  const [selectedLead, setSelectedLead] = useState<SalesLead | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const bookingUrl = getBookingUrl();

  // ── Fetch leads ────────────────────────────────────────────────────────────
  const { data: leads = [], isLoading } = useQuery<SalesLead[]>({
    queryKey: ['admin-leads', refreshKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as SalesLead[];
    },
  });

  // ── Update status mutation ─────────────────────────────────────────────────
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('sales_leads')
        .update({ status, last_activity_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-leads'] });
      setSelectedLead(l => l && l.id === vars.id ? { ...l, status: vars.status } : l);
      toast({ title: 'Statut mis à jour' });
    },
    onError: () => toast({ title: 'Erreur', variant: 'destructive' }),
  });

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const kpis = {
    total:     leads.length,
    new:       leads.filter(l => l.status === 'new').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    won:       leads.filter(l => l.status === 'won').length,
  };

  // ── CTA origins list ───────────────────────────────────────────────────────
  const ctaOrigins = ['all', ...Array.from(new Set(leads.map(l => l.cta_origin ?? 'unknown').filter(Boolean)))];

  // ── Filtered leads ─────────────────────────────────────────────────────────
  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q || [l.full_name, l.email, l.company, l.role].some(f => f?.toLowerCase().includes(q));
    const matchStatus = filterStatus === 'all' || l.status === filterStatus;
    const matchCta = filterCta === 'all' || (l.cta_origin ?? 'unknown') === filterCta;
    return matchSearch && matchStatus && matchCta;
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  const copyEmail = (lead: SalesLead) => {
    navigator.clipboard.writeText(lead.email).then(() => {
      setCopiedId(lead.id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({ title: `Email copié : ${lead.email}` });
    });
  };

  const openMail = (lead: SalesLead) => {
    window.open(
      `mailto:${lead.email}?subject=Cyber Serenity — Suite à votre demande de ${lead.company}`,
      '_blank',
    );
  };

  const openBooking = (lead: SalesLead) => {
    if (bookingUrl) {
      window.open(bookingUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.open(
        `mailto:${lead.email}?subject=Planifier une démonstration Cyber Serenity`,
        '_blank',
      );
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Pipeline Leads</h1>
              <p className="text-sm text-muted-foreground">Demandes de démonstration et prospects qualifiés</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setRefreshKey(k => k + 1)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total leads', value: kpis.total,     icon: <Users className="h-5 w-5 text-primary" />,            cls: '' },
            { label: 'Nouveaux',    value: kpis.new,       icon: <Mail className="h-5 w-5 text-primary" />,             cls: 'text-primary' },
            { label: 'Qualifiés',   value: kpis.qualified, icon: <TrendingUp className="h-5 w-5 text-warning" />,        cls: 'text-warning' },
            { label: 'Gagnés',      value: kpis.won,       icon: <Star className="h-5 w-5 text-success" />,             cls: 'text-success' },
          ].map(k => (
            <Card key={k.label}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{k.label}</p>
                    <p className={`text-3xl font-black mt-0.5 ${k.cls}`}>{k.value}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/30">
                    {k.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nom, email, entreprise…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {STATUSES.map(s => (
                <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCta} onValueChange={setFilterCta}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Origine CTA" />
            </SelectTrigger>
            <SelectContent>
              {ctaOrigins.map(c => (
                <SelectItem key={c} value={c}>{c === 'all' ? 'Toutes origines' : c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground ml-auto">
            {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-12 text-center text-muted-foreground text-sm">Chargement…</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Users className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                <p className="text-muted-foreground text-sm">Aucun lead trouvé</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prospect</TableHead>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Intérêt</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(lead => (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{lead.full_name}</p>
                          <p className="text-xs text-muted-foreground">{lead.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{lead.company}</p>
                          {lead.role && <p className="text-xs text-muted-foreground">{lead.role}</p>}
                        </div>
                      </TableCell>
                      <TableCell><ScoreBadge score={lead.lead_score} /></TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {INTEREST_LABELS[lead.interest_type ?? ''] ?? lead.interest_type ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(lead.created_at), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <Select
                          value={lead.status}
                          onValueChange={status => updateStatus.mutate({ id: lead.id, status })}
                        >
                          <SelectTrigger className="h-7 text-xs w-36" onClick={e => e.stopPropagation()}>
                            <StatusBadge status={lead.status} />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map(s => (
                              <SelectItem key={s} value={s}>
                                <StatusBadge status={s} />
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      {/* Quick actions */}
                      <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <QuickAction
                            icon={copiedId === lead.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            label="Copier email"
                            onClick={() => copyEmail(lead)}
                          />
                          <QuickAction
                            icon={<Mail className="h-3.5 w-3.5" />}
                            label="Contacter par email"
                            onClick={() => openMail(lead)}
                          />
                          <QuickAction
                            icon={<Calendar className="h-3.5 w-3.5" />}
                            label={bookingUrl ? 'Planifier démo (lien booking)' : 'Planifier démo (email)'}
                            onClick={() => openBooking(lead)}
                          />
                          <QuickAction
                            icon={<ThumbsUp className="h-3.5 w-3.5 text-warning" />}
                            label="Marquer qualifié"
                            onClick={() => updateStatus.mutate({ id: lead.id, status: 'qualified' })}
                          />
                          <QuickAction
                            icon={<Trophy className="h-3.5 w-3.5 text-success" />}
                            label="Marquer gagné"
                            onClick={() => updateStatus.mutate({ id: lead.id, status: 'won' })}
                          />
                          <QuickAction
                            icon={<XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                            label="Marquer perdu"
                            onClick={() => updateStatus.mutate({ id: lead.id, status: 'lost' })}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lead detail dialog */}
      <Dialog open={!!selectedLead} onOpenChange={v => !v && setSelectedLead(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedLead && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  {selectedLead.full_name}
                </DialogTitle>
                <DialogDescription>{selectedLead.email}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Entreprise</p>
                      <p className="text-sm font-medium">{selectedLead.company}</p>
                      {selectedLead.company_size && (
                        <p className="text-xs text-muted-foreground">{selectedLead.company_size} collaborateurs</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Fonction</p>
                      <p className="text-sm font-medium">{selectedLead.role ?? '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MousePointerClick className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Origine CTA</p>
                      <p className="text-sm font-mono">{selectedLead.cta_origin ?? '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Page source</p>
                      <p className="text-sm font-mono truncate">{selectedLead.source_page ?? '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Date de demande</p>
                      <p className="text-sm">
                        {format(new Date(selectedLead.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Star className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Score lead</p>
                      <ScoreBadge score={selectedLead.lead_score} />
                    </div>
                  </div>
                </div>

                {selectedLead.message && (
                  <>
                    <Separator />
                    <div className="flex gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Message</p>
                        <p className="text-sm text-foreground leading-relaxed">{selectedLead.message}</p>
                      </div>
                    </div>
                  </>
                )}

                {(selectedLead.utm_source || selectedLead.utm_medium || selectedLead.utm_campaign) && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Tracking UTM</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedLead.utm_source   && <Badge variant="outline" className="text-xs font-mono">source: {selectedLead.utm_source}</Badge>}
                        {selectedLead.utm_medium   && <Badge variant="outline" className="text-xs font-mono">medium: {selectedLead.utm_medium}</Badge>}
                        {selectedLead.utm_campaign && <Badge variant="outline" className="text-xs font-mono">campaign: {selectedLead.utm_campaign}</Badge>}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Status changer */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Changer le statut</p>
                  <Select
                    value={selectedLead.status}
                    onValueChange={status => {
                      updateStatus.mutate({ id: selectedLead.id, status });
                      setSelectedLead(l => l ? { ...l, status } : null);
                    }}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => (
                        <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => openMail(selectedLead)}
                  >
                    <Mail className="h-4 w-4" />
                    Contacter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => copyEmail(selectedLead)}
                  >
                    {copiedId === selectedLead.id ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    Copier email
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => openBooking(selectedLead)}
                  >
                    <Calendar className="h-4 w-4" />
                    {bookingUrl ? 'Planifier démo' : 'Planifier (email)'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      updateStatus.mutate({ id: selectedLead.id, status: 'qualified' });
                      setSelectedLead(l => l ? { ...l, status: 'qualified' } : null);
                    }}
                  >
                    <ThumbsUp className="h-4 w-4 text-warning" />
                    Marquer qualifié
                  </Button>
                  <Button
                    size="sm"
                    className="gap-2 bg-success/20 text-success hover:bg-success/30 border border-success/30"
                    onClick={() => {
                      updateStatus.mutate({ id: selectedLead.id, status: 'won' });
                      setSelectedLead(l => l ? { ...l, status: 'won' } : null);
                    }}
                  >
                    <Trophy className="h-4 w-4" />
                    Marquer gagné
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground"
                    onClick={() => {
                      updateStatus.mutate({ id: selectedLead.id, status: 'lost' });
                      setSelectedLead(l => l ? { ...l, status: 'lost' } : null);
                    }}
                  >
                    <XCircle className="h-4 w-4" />
                    Marquer perdu
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
