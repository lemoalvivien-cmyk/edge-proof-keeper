import { useState, useMemo } from 'react';
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
import { formatDistanceToNow, differenceInHours, format } from 'date-fns';
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
  AlertTriangle,
  Clock,
  UserCheck,
  Flag,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCommercialConfig } from '@/hooks/useCommercialConfig';

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
  owner: string | null;
  priority: string;
  next_action_at: string | null;
  last_contact_at: string | null;
}

// ── SLA logic ─────────────────────────────────────────────────────────────────

type SLALevel = 'ok' | 'warn' | 'critical';

function getSLA(lead: SalesLead): SLALevel {
  if (lead.status === 'won' || lead.status === 'lost') return 'ok';
  const hoursOld = differenceInHours(new Date(), new Date(lead.created_at));
  const hoursSinceActivity = differenceInHours(new Date(), new Date(lead.last_activity_at));
  if (hoursOld > 72 || hoursSinceActivity > 72) return 'critical';
  if (hoursOld > 24 || hoursSinceActivity > 24) return 'warn';
  return 'ok';
}

function SLABadge({ lead }: { lead: SalesLead }) {
  const sla = getSLA(lead);
  if (sla === 'ok') return null;
  return (
    <Badge
      variant="outline"
      className={`text-xs ml-1 ${sla === 'critical'
        ? 'bg-destructive/10 text-destructive border-destructive/30'
        : 'bg-warning/10 text-warning border-warning/30'}`}
    >
      {sla === 'critical' ? '⚠ +72h' : '⏰ +24h'}
    </Badge>
  );
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

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  high:   { label: 'Haute',   className: 'bg-destructive/10 text-destructive border-destructive/30' },
  normal: { label: 'Normale', className: 'bg-muted/50 text-muted-foreground border-muted' },
  low:    { label: 'Basse',   className: 'bg-muted/30 text-muted-foreground/70 border-muted/50' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.new;
  return <Badge variant="outline" className={`text-xs ${cfg.className}`}>{cfg.label}</Badge>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.normal;
  return <Badge variant="outline" className={`text-xs ${cfg.className}`}>{cfg.label}</Badge>;
}

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 60 ? 'text-success' : score >= 35 ? 'text-warning' : 'text-muted-foreground';
  return (
    <span className={`flex items-center gap-1 text-sm font-bold ${cls}`}>
      <Star className="h-3 w-3" />{score}
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
  icon, label, onClick, variant = 'outline',
}: {
  icon: React.ReactNode; label: string;
  onClick: (e: React.MouseEvent) => void;
  variant?: 'outline' | 'default' | 'ghost' | 'secondary';
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant} size="icon" className="h-7 w-7 shrink-0"
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

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AdminLeads() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCta, setFilterCta] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedLead, setSelectedLead] = useState<SalesLead | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Detail form local state
  const [detailOwner, setDetailOwner] = useState('');
  const [detailPriority, setDetailPriority] = useState('normal');
  const [detailNextAction, setDetailNextAction] = useState('');

  const { config: commercialConfig } = useCommercialConfig();

  // ── Fetch leads ──────────────────────────────────────────────────────────
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

  // ── Update status ────────────────────────────────────────────────────────
  const updateLead = useMutation({
    mutationFn: async (updates: { id: string } & Partial<SalesLead>) => {
      const { id, ...rest } = updates;
      const { error } = await supabase
        .from('sales_leads')
        .update({ ...rest, last_activity_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-leads'] });
      setSelectedLead(l => l && l.id === vars.id ? { ...l, ...vars } : l);
      toast({ title: 'Lead mis à jour' });
    },
    onError: () => toast({ title: 'Erreur', variant: 'destructive' }),
  });

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => ({
    total:     leads.length,
    new:       leads.filter(l => l.status === 'new').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    won:       leads.filter(l => l.status === 'won').length,
    critical:  leads.filter(l => getSLA(l) === 'critical').length,
  }), [leads]);

  const ctaOrigins = useMemo(() =>
    ['all', ...Array.from(new Set(leads.map(l => l.cta_origin ?? 'unknown').filter(Boolean)))],
    [leads],
  );

  // ── Filtered + sorted leads ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    return leads
      .filter(l => {
        const q = search.toLowerCase();
        const matchSearch = !q || [l.full_name, l.email, l.company, l.role].some(f => f?.toLowerCase().includes(q));
        const matchStatus = filterStatus === 'all' || l.status === filterStatus;
        const matchCta = filterCta === 'all' || (l.cta_origin ?? 'unknown') === filterCta;
        const matchPriority = filterPriority === 'all' || l.priority === filterPriority;
        return matchSearch && matchStatus && matchCta && matchPriority;
      })
      .sort((a, b) => {
        // Critical SLA first, then high priority, then date
        const slaA = getSLA(a) === 'critical' ? 0 : getSLA(a) === 'warn' ? 1 : 2;
        const slaB = getSLA(b) === 'critical' ? 0 : getSLA(b) === 'warn' ? 1 : 2;
        if (slaA !== slaB) return slaA - slaB;
        const prioOrder: Record<string, number> = { high: 0, normal: 1, low: 2 };
        if ((prioOrder[a.priority] ?? 1) !== (prioOrder[b.priority] ?? 1))
          return (prioOrder[a.priority] ?? 1) - (prioOrder[b.priority] ?? 1);
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [leads, search, filterStatus, filterCta, filterPriority]);

  // ── Helpers ───────────────────────────────────────────────────────────────
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
    const url = commercialConfig.bookingUrl;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.open(`mailto:${lead.email}?subject=Planifier une démonstration Cyber Serenity`, '_blank');
    }
  };

  const openDetail = (lead: SalesLead) => {
    setSelectedLead(lead);
    setDetailOwner(lead.owner ?? '');
    setDetailPriority(lead.priority ?? 'normal');
    setDetailNextAction(lead.next_action_at ? lead.next_action_at.slice(0, 10) : '');
  };

  const saveDetailMeta = () => {
    if (!selectedLead) return;
    updateLead.mutate({
      id: selectedLead.id,
      owner: detailOwner || null,
      priority: detailPriority,
      next_action_at: detailNextAction ? new Date(detailNextAction).toISOString() : null,
    });
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
            <RefreshCw className="h-4 w-4 mr-2" />Actualiser
          </Button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total leads', value: kpis.total,     icon: <Users className="h-5 w-5 text-primary" />,              cls: '' },
            { label: 'Nouveaux',    value: kpis.new,       icon: <Mail className="h-5 w-5 text-primary" />,               cls: 'text-primary' },
            { label: 'Qualifiés',   value: kpis.qualified, icon: <TrendingUp className="h-5 w-5 text-warning" />,          cls: 'text-warning' },
            { label: 'Gagnés',      value: kpis.won,       icon: <Star className="h-5 w-5 text-success" />,               cls: 'text-success' },
            { label: 'SLA critique',value: kpis.critical,  icon: <AlertTriangle className="h-5 w-5 text-destructive" />,   cls: 'text-destructive' },
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
            <SelectTrigger className="w-40"><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Priorité" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes priorités</SelectItem>
              {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCta} onValueChange={setFilterCta}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Origine CTA" /></SelectTrigger>
            <SelectContent>
              {ctaOrigins.map(c => <SelectItem key={c} value={c}>{c === 'all' ? 'Toutes origines' : c}</SelectItem>)}
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
                    <TableHead>Priorité</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Ancienneté</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(lead => (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => openDetail(lead)}
                    >
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-1">
                            <p className="font-medium text-sm">{lead.full_name}</p>
                            <SLABadge lead={lead} />
                          </div>
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
                      <TableCell><PriorityBadge priority={lead.priority} /></TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {lead.owner ?? <span className="italic opacity-50">—</span>}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(lead.created_at), { locale: fr, addSuffix: true })}
                          </span>
                          {lead.next_action_at && (
                            <p className={`text-xs flex items-center gap-1 mt-0.5 ${new Date(lead.next_action_at) < new Date() ? 'text-destructive' : 'text-muted-foreground'}`}>
                              <Clock className="h-3 w-3" />
                              {format(new Date(lead.next_action_at), 'dd/MM', { locale: fr })}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <Select
                          value={lead.status}
                          onValueChange={status => updateLead.mutate({ id: lead.id, status })}
                        >
                          <SelectTrigger className="h-7 text-xs w-36" onClick={e => e.stopPropagation()}>
                            <StatusBadge status={lead.status} />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map(s => <SelectItem key={s} value={s}><StatusBadge status={s} /></SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>

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
                            label={commercialConfig.bookingUrl ? 'Planifier démo (booking)' : 'Planifier démo (email)'}
                            onClick={() => openBooking(lead)}
                          />
                          <QuickAction
                            icon={<ThumbsUp className="h-3.5 w-3.5 text-warning" />}
                            label="Marquer qualifié"
                            onClick={() => updateLead.mutate({ id: lead.id, status: 'qualified' })}
                          />
                          <QuickAction
                            icon={<Trophy className="h-3.5 w-3.5 text-success" />}
                            label="Marquer gagné"
                            onClick={() => updateLead.mutate({ id: lead.id, status: 'won' })}
                          />
                          <QuickAction
                            icon={<XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                            label="Marquer perdu"
                            onClick={() => updateLead.mutate({ id: lead.id, status: 'lost' })}
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
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedLead && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  {selectedLead.full_name}
                  <SLABadge lead={selectedLead} />
                </DialogTitle>
                <DialogDescription>{selectedLead.email}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* Core info grid */}
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
                      <p className="text-xs text-muted-foreground">Date</p>
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

                {/* ── CRM meta ── */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">CRM</p>

                  {/* Owner */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground flex items-center gap-1">
                      <UserCheck className="h-3.5 w-3.5" />Owner
                    </label>
                    <Input
                      placeholder="ex: alice@cyberserenity.fr"
                      value={detailOwner}
                      onChange={e => setDetailOwner(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>

                  {/* Priority */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Flag className="h-3.5 w-3.5" />Priorité
                    </label>
                    <Select value={detailPriority} onValueChange={setDetailPriority}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                          <SelectItem key={k} value={k}><PriorityBadge priority={k} /></SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Next action */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />Prochaine action (date)
                    </label>
                    <Input
                      type="date"
                      value={detailNextAction}
                      onChange={e => setDetailNextAction(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>

                  <Button size="sm" className="w-full gap-2" onClick={saveDetailMeta} disabled={updateLead.isPending}>
                    <Check className="h-3.5 w-3.5" />
                    Enregistrer
                  </Button>
                </div>

                <Separator />

                {/* Status changer */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Changer le statut</p>
                  <Select
                    value={selectedLead.status}
                    onValueChange={status => {
                      updateLead.mutate({ id: selectedLead.id, status });
                      setSelectedLead(l => l ? { ...l, status } : null);
                    }}
                  >
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => openMail(selectedLead)}>
                    <Mail className="h-4 w-4" />Contacter
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => copyEmail(selectedLead)}>
                    {copiedId === selectedLead.id ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    Copier email
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => openBooking(selectedLead)}>
                    <Calendar className="h-4 w-4" />
                    {commercialConfig.bookingUrl ? 'Planifier démo' : 'Planifier (email)'}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2"
                    onClick={() => { updateLead.mutate({ id: selectedLead.id, status: 'qualified' }); setSelectedLead(l => l ? { ...l, status: 'qualified' } : null); }}
                  >
                    <ThumbsUp className="h-4 w-4 text-warning" />Marquer qualifié
                  </Button>
                  <Button size="sm" className="gap-2 bg-success/20 text-success hover:bg-success/30 border border-success/30"
                    onClick={() => { updateLead.mutate({ id: selectedLead.id, status: 'won' }); setSelectedLead(l => l ? { ...l, status: 'won' } : null); }}
                  >
                    <Trophy className="h-4 w-4" />Marquer gagné
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground"
                    onClick={() => { updateLead.mutate({ id: selectedLead.id, status: 'lost' }); setSelectedLead(l => l ? { ...l, status: 'lost' } : null); }}
                  >
                    <XCircle className="h-4 w-4" />Marquer perdu
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
