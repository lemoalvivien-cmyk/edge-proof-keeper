import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  getSignals,
  getSignalEntities,
  runEntityCorrelation,
} from '@/lib/api-client';
import type { Signal, SignalEntityLink, EntityNode } from '@/types/engine';
import {
  AlertTriangle,
  ChevronRight,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  Zap,
  Network,
  ExternalLink,
  FileText,
  Eye,
  Globe,
  Server,
  Mail,
  Tag,
  GitBranch,
  Lock,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SEVERITY_COLOR: Record<string, string> = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  high:     'bg-orange-500/15 text-orange-400 border-orange-500/30',
  medium:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  low:      'bg-blue-500/15 text-blue-400 border-blue-500/30',
  info:     'bg-muted text-muted-foreground border-border',
};

const SEVERITY_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  high:     'bg-orange-500',
  medium:   'bg-yellow-500',
  low:      'bg-blue-500',
  info:     'bg-muted-foreground',
};

const STATUS_COLOR: Record<string, string> = {
  new:          'bg-primary/15 text-primary border-primary/30',
  open:         'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  acknowledged: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  correlated:   'bg-purple-500/15 text-purple-400 border-purple-500/30',
  ignored:      'bg-muted text-muted-foreground border-border',
  resolved:     'bg-green-500/15 text-green-400 border-green-500/30',
  closed:       'bg-muted text-muted-foreground border-border',
};

const ENTITY_ICON: Record<string, React.ReactNode> = {
  domain:              <Globe className="h-3 w-3" />,
  subdomain:           <Globe className="h-3 w-3 opacity-70" />,
  ip:                  <Server className="h-3 w-3" />,
  email:               <Mail className="h-3 w-3" />,
  brand:               <Tag className="h-3 w-3" />,
  repository:          <GitBranch className="h-3 w-3" />,
  certificate:         <Lock className="h-3 w-3" />,
  cloud_asset:         <Network className="h-3 w-3" />,
  organization_marker: <Shield className="h-3 w-3" />,
};

function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
      SEVERITY_COLOR[severity] ?? SEVERITY_COLOR.info,
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', SEVERITY_DOT[severity] ?? SEVERITY_DOT.info)} />
      {severity.toUpperCase()}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
      STATUS_COLOR[status] ?? STATUS_COLOR.new,
    )}>
      {status}
    </span>
  );
}

function EntityTypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground font-mono">
      {ENTITY_ICON[type] ?? <Shield className="h-3 w-3" />}
      {type}
    </span>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function confidence(score?: number | null) {
  if (score == null) return null;
  return `${Math.round(score * 100)}%`;
}

// ─── Signal Row ───────────────────────────────────────────────────────────────

function SignalRow({
  signal,
  selected,
  onClick,
}: {
  signal: Signal;
  selected: boolean;
  onClick: () => void;
}) {
  const source = signal.data_sources;
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors',
        selected && 'bg-muted/50 border-l-2 border-l-primary',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">
          <span className={cn('h-2 w-2 rounded-full mt-1.5 block', SEVERITY_DOT[signal.severity] ?? SEVERITY_DOT.info)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{signal.title}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <SeverityBadge severity={signal.severity} />
            <StatusBadge status={signal.status} />
            {source && (
              <span className="text-xs text-muted-foreground">{source.name}</span>
            )}
            {signal.confidence_score != null && (
              <span className="text-xs text-muted-foreground">
                confiance {confidence(signal.confidence_score)}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{formatDate(signal.detected_at)}</p>
        </div>
        <ChevronRight className={cn(
          'h-4 w-4 text-muted-foreground flex-shrink-0 mt-1 transition-transform',
          selected && 'rotate-90 text-primary',
        )} />
      </div>
    </button>
  );
}

// ─── Entity Link Item ─────────────────────────────────────────────────────────

function EntityLinkItem({ link }: { link: SignalEntityLink }) {
  const node = link.entity_node as EntityNode | undefined;
  if (!node) return null;
  return (
    <div className="flex items-center gap-2 py-1.5 px-3 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
      <EntityTypeBadge type={node.entity_type} />
      <span className="text-sm font-mono text-foreground truncate flex-1" title={node.display_value}>
        {node.display_value}
      </span>
      <span className="text-xs text-muted-foreground flex-shrink-0">via {link.relation_type.split('.')[0]}</span>
    </div>
  );
}

// ─── Signal Detail Panel ──────────────────────────────────────────────────────

function SignalDetail({
  signal,
  orgId,
  onRunCorrelation,
  correlating,
}: {
  signal: Signal;
  orgId: string;
  onRunCorrelation: () => void;
  correlating: boolean;
}) {
  const { data: links, isLoading: entitiesLoading } = useQuery({
    queryKey: ['signal-entities', signal.id, orgId],
    queryFn: () => getSignalEntities(signal.id, orgId),
    staleTime: 60_000,
  });

  const evidenceEntries = Object.entries(
    typeof signal.evidence === 'object' && signal.evidence !== null
      ? signal.evidence as Record<string, unknown>
      : {},
  );

  const refs = Array.isArray(signal.references)
    ? signal.references.filter(r => typeof r === 'string')
    : [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h2 className="text-sm font-semibold text-foreground leading-snug">{signal.title}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <SeverityBadge severity={signal.severity} />
          <StatusBadge status={signal.status} />
          {signal.confidence_score != null && (
            <span className="text-xs text-muted-foreground self-center">
              {confidence(signal.confidence_score)} confiance
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Détecté le {formatDate(signal.detected_at)}
          {signal.data_sources && ` · ${signal.data_sources.name}`}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">

          {/* Description */}
          {signal.description && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <FileText className="h-3 w-3" /> Description
              </h3>
              <p className="text-sm text-foreground/80 leading-relaxed">{signal.description}</p>
            </section>
          )}

          {/* Evidence */}
          {evidenceEntries.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Eye className="h-3 w-3" /> Evidence
              </h3>
              <div className="rounded-md border border-border bg-muted/20 divide-y divide-border/50">
                {evidenceEntries.map(([k, v]) => (
                  <div key={k} className="flex gap-3 px-3 py-2 text-xs">
                    <span className="font-mono text-muted-foreground w-32 flex-shrink-0 truncate">{k}</span>
                    <span className="text-foreground/80 break-all">
                      {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* References */}
          {refs.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <ExternalLink className="h-3 w-3" /> Références
              </h3>
              <ul className="space-y-1">
                {refs.map((r, i) => (
                  <li key={i}>
                    <a
                      href={r as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline break-all"
                    >
                      {r as string}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Separator />

          {/* Entity Pivots */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Network className="h-3 w-3" /> Entités liées
              </h3>
              {!entitiesLoading && (!links || links.length === 0) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-xs"
                  onClick={onRunCorrelation}
                  disabled={correlating}
                >
                  {correlating ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Zap className="h-3 w-3 mr-1" />
                  )}
                  Lancer corrélation
                </Button>
              )}
            </div>

            {entitiesLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                <Loader2 className="h-3 w-3 animate-spin" /> Chargement…
              </div>
            ) : links && links.length > 0 ? (
              <div className="space-y-1.5">
                {links.map(link => (
                  <EntityLinkItem key={link.id} link={link} />
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border px-4 py-4 text-center">
                <Network className="h-5 w-5 text-muted-foreground mx-auto mb-1.5" />
                <p className="text-xs text-muted-foreground">
                  Aucune entité corrélée pour ce signal.
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Lancez la corrélation pour extraire les IOEs.
                </p>
              </div>
            )}
          </section>

          {/* Pivot: signals sharing same entities */}
          {links && links.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Zap className="h-3 w-3" /> Pivots disponibles
              </h3>
              <div className="space-y-1">
                {links.map(link => {
                  const node = link.entity_node as EntityNode | undefined;
                  if (!node) return null;
                  return (
                    <div key={link.id} className="flex items-center gap-2 py-1 px-2 text-xs text-muted-foreground rounded hover:bg-muted/30">
                      {ENTITY_ICON[node.entity_type] ?? <Shield className="h-3 w-3" />}
                      <span className="font-mono truncate flex-1">{node.canonical_value}</span>
                      <span className="text-primary text-xs cursor-pointer hover:underline">→ autres signaux</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Raw context */}
          {signal.raw_payload && Object.keys(signal.raw_payload).length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <FileText className="h-3 w-3" /> Contexte brut
              </h3>
              <pre className="text-xs text-muted-foreground bg-muted/20 border border-border rounded-md p-3 overflow-auto max-h-32 whitespace-pre-wrap break-all">
                {JSON.stringify(signal.raw_payload, null, 2)}
              </pre>
            </section>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SignalsPage() {
  const { user, profile } = useAuth();
  const orgId = profile?.organization_id ?? '';
  const queryClient = useQueryClient();

  const [search, setSearch]       = useState('');
  const [filterSev, setFilterSev] = useState('all');
  const [filterCat, setFilterCat] = useState('all');
  const [filterSrc, setFilterSrc] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: signals = [], isLoading, refetch } = useQuery({
    queryKey: ['signals', orgId],
    queryFn: () => getSignals(orgId, { limit: 500 }),
    enabled: Boolean(orgId),
    staleTime: 30_000,
  });

  const correlationMutation = useMutation({
    mutationFn: (opts?: { signalId?: string }) =>
      runEntityCorrelation(orgId, opts?.signalId ? [opts.signalId] : undefined),
    onSuccess: (result) => {
      toast({
        title: 'Corrélation terminée',
        description: `${result.signals_processed} signaux · ${result.nodes_created} nœuds · ${result.links_created} liens`,
      });
      queryClient.invalidateQueries({ queryKey: ['signal-entities'] });
      queryClient.invalidateQueries({ queryKey: ['signals', orgId] });
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur corrélation', description: err.message, variant: 'destructive' });
    },
  });

  const selectedSignal = useMemo(
    () => signals.find(s => s.id === selectedId) ?? null,
    [signals, selectedId],
  );

  // Unique categories and sources for filters
  const categories = useMemo(() => [...new Set(signals.map(s => s.category).filter(Boolean))], [signals]);
  const sources = useMemo(
    () => [...new Set(signals.map(s => s.data_sources?.name).filter(Boolean))],
    [signals],
  );

  const filtered = useMemo(() => {
    return signals.filter(s => {
      if (filterSev !== 'all' && s.severity !== filterSev) return false;
      if (filterCat !== 'all' && s.category !== filterCat) return false;
      if (filterSrc !== 'all' && s.data_sources?.name !== filterSrc) return false;
      if (filterStatus !== 'all' && s.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !s.title.toLowerCase().includes(q) &&
          !s.description.toLowerCase().includes(q) &&
          !s.category.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [signals, filterSev, filterCat, filterSrc, filterStatus, search]);

  const counts = useMemo(() => ({
    critical: signals.filter(s => s.severity === 'critical').length,
    high:     signals.filter(s => s.severity === 'high').length,
    new:      signals.filter(s => s.status === 'new').length,
  }), [signals]);

  if (!user) return null;

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Page Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Signals
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {signals.length} signaux&nbsp;·&nbsp;
              {counts.critical > 0 && <span className="text-red-400">{counts.critical} critiques&nbsp;·&nbsp;</span>}
              {counts.high > 0 && <span className="text-orange-400">{counts.high} hauts&nbsp;·&nbsp;</span>}
              <span>{counts.new} nouveaux</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => correlationMutation.mutate({})}
              disabled={correlationMutation.isPending || !orgId}
            >
              {correlationMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Zap className="h-4 w-4 mr-1.5" />
              )}
              Corréler tout
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {/* Filters bar */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-border bg-muted/10 flex-shrink-0 flex-wrap">
          <div className="relative flex-1 min-w-48 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="pl-8 h-8 text-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          <Select value={filterSev} onValueChange={setFilterSev}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="Gravité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes gravités</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="new">new</SelectItem>
              <SelectItem value="open">open</SelectItem>
              <SelectItem value="acknowledged">acknowledged</SelectItem>
              <SelectItem value="correlated">correlated</SelectItem>
              <SelectItem value="ignored">ignored</SelectItem>
              <SelectItem value="resolved">resolved</SelectItem>
            </SelectContent>
          </Select>

          {categories.length > 0 && (
            <Select value={filterCat} onValueChange={setFilterCat}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c} value={c!}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {sources.length > 0 && (
            <Select value={filterSrc} onValueChange={setFilterSrc}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes sources</SelectItem>
                {sources.map(s => (
                  <SelectItem key={s} value={s!}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <span className="text-xs text-muted-foreground ml-auto">
            <Filter className="h-3 w-3 inline mr-1" />{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Body: list + detail */}
        <div className="flex flex-1 min-h-0">
          {/* Signal list */}
          <div className={cn(
            'border-r border-border overflow-y-auto flex-shrink-0 transition-all',
            selectedId ? 'w-1/2' : 'w-full',
          )}>
            {isLoading ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Chargement des signaux…</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center px-6">
                <AlertTriangle className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground">Aucun signal</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {signals.length === 0
                    ? "Configurez une source d'ingestion pour commencer."
                    : 'Aucun signal ne correspond aux filtres actifs.'}
                </p>
              </div>
            ) : (
              filtered.map(signal => (
                <SignalRow
                  key={signal.id}
                  signal={signal}
                  selected={signal.id === selectedId}
                  onClick={() => setSelectedId(prev => prev === signal.id ? null : signal.id)}
                />
              ))
            )}
          </div>

          {/* Detail panel */}
          {selectedSignal && (
            <div className="flex-1 min-w-0 flex flex-col">
              <SignalDetail
                signal={selectedSignal}
                orgId={orgId}
                onRunCorrelation={() =>
                  correlationMutation.mutate({ signalId: selectedSignal.id })
                }
                correlating={correlationMutation.isPending}
              />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
