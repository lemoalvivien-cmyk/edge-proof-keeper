import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Database,
  Plus,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  WifiOff,
  Loader2,
  ArrowLeft,
  Activity,
  Shield,
  Globe,
  Upload,
  Settings2,
} from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getSources, getSourceSyncRuns, syncPublicIntelSource, syncCustomerAuthorizedSource } from '@/lib/api-client';
import type { DataSource, SourceSyncRun } from '@/types/engine';

// ─── Schema ───────────────────────────────────────────────────────────────────

const sourceSchema = z.object({
  name: z.string().min(2, 'Nom requis'),
  source_type: z.enum(['upload', 'api', 'manual', 'import', 'public_intel', 'customer_authorized']),
  category: z.enum(['vulnerability', 'asset', 'compliance', 'threat', 'exposure', 'brand']),
  provider_type: z.string().optional(),
  domain: z.string().optional(),
});

type SourceFormData = z.infer<typeof sourceSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusConfig(status: string) {
  switch (status) {
    case 'active':
      return { label: 'Actif', icon: CheckCircle2, className: 'text-green-600 dark:text-green-400', badgeVariant: 'default' as const };
    case 'error':
      return { label: 'Erreur', icon: AlertCircle, className: 'text-destructive', badgeVariant: 'destructive' as const };
    case 'disabled':
      return { label: 'Désactivé', icon: WifiOff, className: 'text-muted-foreground', badgeVariant: 'secondary' as const };
    default:
      return { label: 'Non configuré', icon: Clock, className: 'text-yellow-600 dark:text-yellow-400', badgeVariant: 'outline' as const };
  }
}

function syncRunStatusBadge(status: string) {
  switch (status) {
    case 'completed': return <Badge variant="default" className="text-xs">Terminé</Badge>;
    case 'running':   return <Badge variant="secondary" className="text-xs animate-pulse">En cours</Badge>;
    case 'failed':    return <Badge variant="destructive" className="text-xs">Échec</Badge>;
    default:          return <Badge variant="outline" className="text-xs">En attente</Badge>;
  }
}

function sourceTypeIcon(type: string) {
  switch (type) {
    case 'public_intel': return <Globe className="h-4 w-4" />;
    case 'customer_authorized': return <Shield className="h-4 w-4" />;
    case 'upload': return <Upload className="h-4 w-4" />;
    default: return <Database className="h-4 w-4" />;
  }
}

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    vulnerability: 'Vulnérabilité',
    asset: 'Actif',
    compliance: 'Conformité',
    threat: 'Menace',
    exposure: 'Exposition',
    brand: 'Marque',
  };
  return map[cat] ?? cat;
}

function providerTypeLabel(type: string): string {
  const map: Record<string, string> = {
    ct_logs: 'CT Logs (crt.sh)',
    cert_transparency: 'Transparence Certificats',
    cve_nvd: 'CVE / CISA KEV',
    cisa_kev: 'CISA KEV',
    dns_recon: 'DNS (non configuré)',
    brand_monitoring: 'Brand Monitoring (non configuré)',
    repo_exposure: 'Repo Exposure (non configuré)',
  };
  return map[type] ?? type;
}

// ─── Source Detail View ───────────────────────────────────────────────────────

function SourceDetail({
  source,
  orgId,
  onBack,
}: {
  source: DataSource;
  orgId: string;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();

  const { data: syncRuns, isLoading: runsLoading } = useQuery({
    queryKey: ['source-sync-runs', orgId, source.id],
    queryFn: () => getSourceSyncRuns(orgId, source.id, 20),
    enabled: !!orgId && !!source.id,
  });

  const { data: signalCount } = useQuery({
    queryKey: ['source-signal-count', orgId, source.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('signals')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('source_id', source.id);
      return count ?? 0;
    },
    enabled: !!orgId && !!source.id,
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const type = source.source_type;
      if (type === 'public_intel') return syncPublicIntelSource(source.id);
      if (type === 'customer_authorized') return syncCustomerAuthorizedSource(source.id, []);
      throw new Error('Synchronisation manuelle non disponible pour ce type de source');
    },
    onSuccess: (result) => {
      const r = result as { signals_ingested?: number; inserted?: number; provider_status?: string; message?: string };
      const count = r.signals_ingested ?? r.inserted ?? 0;
      if (r.provider_status && r.provider_status !== 'ok') {
        toast.warning(`Sync: ${r.message ?? r.provider_status}`);
      } else {
        toast.success(`Synchronisation terminée — ${count} signaux ingérés`);
      }
      queryClient.invalidateQueries({ queryKey: ['source-sync-runs', orgId, source.id] });
      queryClient.invalidateQueries({ queryKey: ['sources', orgId] });
      queryClient.invalidateQueries({ queryKey: ['source-signal-count', orgId, source.id] });
    },
    onError: (err) => toast.error('Erreur de synchronisation', { description: (err as Error).message }),
  });

  const cfg = statusConfig(source.status);
  const StatusIcon = cfg.icon;
  const providerType = (source.config as Record<string, unknown>)?.provider_type as string | undefined;
  const domain = (source.config as Record<string, unknown>)?.domain as string | undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Sources
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <h2 className="font-semibold text-lg">{source.name}</h2>
        <Badge variant={cfg.badgeVariant} className="gap-1">
          <StatusIcon className="h-3 w-3" />
          {cfg.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground mb-1">Signaux ingérés</p>
            <p className="text-3xl font-bold">{signalCount ?? '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground mb-1">Dernière synchro</p>
            <p className="text-sm font-medium">
              {source.last_sync_at
                ? formatDistanceToNow(new Date(source.last_sync_at), { addSuffix: true, locale: fr })
                : 'Jamais'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground mb-1">Confiance</p>
            <p className="text-2xl font-bold">
              {source.confidence_score !== null && source.confidence_score !== undefined
                ? `${Math.round((source.confidence_score as number) * 100)}%`
                : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings2 className="h-4 w-4" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="font-mono">{source.source_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Catégorie</span>
              <span>{categoryLabel(source.category)}</span>
            </div>
            {providerType && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Provider</span>
                <span>{providerTypeLabel(providerType)}</span>
              </div>
            )}
            {domain && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Domaine</span>
                <span className="font-mono text-xs">{domain}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID</span>
              <span className="font-mono text-xs truncate max-w-[200px]">{source.id}</span>
            </div>
          </CardContent>
        </Card>

        {/* Sync action */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(source.source_type === 'public_intel' || source.source_type === 'customer_authorized') ? (
              <Button
                className="w-full"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
              >
                {syncMutation.isPending
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Synchronisation...</>
                  : <><RefreshCw className="h-4 w-4 mr-2" />Synchroniser maintenant</>
                }
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Synchronisation manuelle non disponible pour ce type de source.
                Utilisez l'import ou l'API.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sync runs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique des synchronisations</CardTitle>
          <CardDescription>20 dernières exécutions</CardDescription>
        </CardHeader>
        <CardContent>
          {runsLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : !syncRuns?.length ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Aucune synchronisation effectuée
            </div>
          ) : (
            <ScrollArea className="h-[280px]">
              <div className="space-y-2">
                {(syncRuns as SourceSyncRun[]).map(run => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      {syncRunStatusBadge(run.status)}
                      <span className="text-muted-foreground">
                        {format(new Date(run.started_at), 'dd/MM HH:mm')}
                      </span>
                      {run.error_message && (
                        <span className="text-destructive text-xs truncate max-w-[200px]" title={run.error_message}>
                          {run.error_message}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground text-xs">
                      <span>{run.items_received} reçus</span>
                      <span className="text-foreground font-medium">{run.items_normalized} ingérés</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Sources Page ────────────────────────────────────────────────────────

export default function Sources() {
  const { organization, user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<SourceFormData>({
    resolver: zodResolver(sourceSchema),
    defaultValues: {
      name: '',
      source_type: 'public_intel',
      category: 'exposure',
      provider_type: '',
      domain: '',
    },
  });

  const { data: sources, isLoading } = useQuery({
    queryKey: ['sources', organization?.id],
    queryFn: () => getSources(organization!.id),
    enabled: !!organization?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: SourceFormData) => {
      if (!organization?.id || !user?.id) throw new Error('Non authentifié');

      const config: Record<string, unknown> = {};
      if (data.provider_type) config.provider_type = data.provider_type;
      if (data.domain) config.domain = data.domain;

      const { error } = await supabase
        .from('data_sources')
        .insert([{
          organization_id: organization.id,
          name: data.name,
          source_type: data.source_type,
          category: data.category,
          status: 'not_configured',
          config: config as Record<string, unknown>,
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources', organization?.id] });
      toast.success('Source créée');
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (err) => toast.error('Erreur', { description: (err as Error).message }),
  });

  const syncMutation = useMutation({
    mutationFn: async (source: DataSource) => {
      if (source.source_type === 'public_intel') return syncPublicIntelSource(source.id);
      if (source.source_type === 'customer_authorized') return syncCustomerAuthorizedSource(source.id, []);
      throw new Error('Sync manuelle non disponible pour ce type');
    },
    onSuccess: (result, source) => {
      const r = result as { signals_ingested?: number; inserted?: number; provider_status?: string; message?: string };
      const count = r.signals_ingested ?? r.inserted ?? 0;
      if (r.provider_status && r.provider_status !== 'ok') {
        toast.warning(`${source.name}: ${r.message ?? r.provider_status}`);
      } else {
        toast.success(`${source.name} — ${count} signaux ingérés`);
      }
      queryClient.invalidateQueries({ queryKey: ['sources', organization?.id] });
    },
    onError: (err, source) => toast.error(`Erreur sync ${source.name}`, { description: (err as Error).message }),
  });

  const watchedType = form.watch('source_type');

  if (selectedSource) {
    return (
      <AppLayout>
        <SourceDetail
          source={selectedSource}
          orgId={organization!.id}
          onBack={() => setSelectedSource(null)}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sources de données</h1>
            <p className="text-muted-foreground">
              Hub d'ingestion défensive — intelligence publique et sources autorisées client.
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle source
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter une source</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl><Input placeholder="CT Logs — domaine.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="source_type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de source</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="public_intel">Intelligence publique / licenciée</SelectItem>
                          <SelectItem value="customer_authorized">Source autorisée client</SelectItem>
                          <SelectItem value="upload">Import fichier</SelectItem>
                          <SelectItem value="api">API externe</SelectItem>
                          <SelectItem value="manual">Manuel</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="exposure">Exposition</SelectItem>
                          <SelectItem value="vulnerability">Vulnérabilité</SelectItem>
                          <SelectItem value="threat">Menace</SelectItem>
                          <SelectItem value="asset">Actif</SelectItem>
                          <SelectItem value="compliance">Conformité</SelectItem>
                          <SelectItem value="brand">Marque</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {watchedType === 'public_intel' && (
                    <>
                      <FormField control={form.control} name="provider_type" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Provider</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner un provider" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="ct_logs">CT Logs (crt.sh — gratuit)</SelectItem>
                              <SelectItem value="cve_nvd">CVE / CISA KEV (gratuit)</SelectItem>
                              <SelectItem value="dns_recon">DNS Recon (config requise)</SelectItem>
                              <SelectItem value="brand_monitoring">Brand Monitoring (config requise)</SelectItem>
                              <SelectItem value="repo_exposure">Repo Exposure (config requise)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="domain" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Domaine cible (si applicable)</FormLabel>
                          <FormControl><Input placeholder="exemple.com" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </>
                  )}

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Créer
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats bar */}
        {sources && sources.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['active', 'not_configured', 'error', 'disabled'] as const).map(status => {
              const count = sources.filter(s => s.status === status).length;
              const cfg = statusConfig(status);
              const Icon = cfg.icon;
              return (
                <Card key={status}>
                  <CardContent className="pt-4 pb-4 flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${cfg.className}`} />
                    <div>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground">{cfg.label}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Sources list */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Toutes les sources
            </CardTitle>
            <CardDescription>{sources?.length ?? 0} source(s) configurée(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : !sources?.length ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Database className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Aucune source configurée</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Ajoutez une source pour commencer l'ingestion défensive.
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une source
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {(sources as DataSource[]).map(source => {
                  const cfg = statusConfig(source.status);
                  const StatusIcon = cfg.icon;
                  const providerType = (source.config as Record<string, unknown>)?.provider_type as string | undefined;
                  const canSync = source.source_type === 'public_intel' || source.source_type === 'customer_authorized';

                  return (
                    <div
                      key={source.id}
                      className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-muted/40 transition-colors"
                    >
                      <div
                        className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                        onClick={() => setSelectedSource(source)}
                      >
                        <div className="text-muted-foreground">{sourceTypeIcon(source.source_type)}</div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{source.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{categoryLabel(source.category)}</span>
                            {providerType && (
                              <>
                                <span>·</span>
                                <span>{providerTypeLabel(providerType)}</span>
                              </>
                            )}
                            {source.last_sync_at && (
                              <>
                                <span>·</span>
                                <span>
                                  {formatDistanceToNow(new Date(source.last_sync_at), { addSuffix: true, locale: fr })}
                                </span>
                              </>
                            )}
                            {source.confidence_score !== null && source.confidence_score !== undefined && (
                              <>
                                <span>·</span>
                                <span>confiance {Math.round((source.confidence_score as number) * 100)}%</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4 shrink-0">
                        <Badge variant={cfg.badgeVariant} className="gap-1 text-xs">
                          <StatusIcon className="h-3 w-3" />
                          {cfg.label}
                        </Badge>

                        {canSync && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); syncMutation.mutate(source); }}
                            disabled={syncMutation.isPending && syncMutation.variables?.id === source.id}
                          >
                            {syncMutation.isPending && syncMutation.variables?.id === source.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <RefreshCw className="h-3.5 w-3.5" />
                            }
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSource(source)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
