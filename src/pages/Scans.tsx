import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Scan as ScanIcon, Plus, Loader2, Play, ShieldAlert } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthorizationGate } from '@/components/auth/AuthorizationGate';
import { TrustBanner } from '@/components/ui/TrustBanner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { Scan, Asset } from '@/types/database';

const scanSchema = z.object({
  scan_type: z.enum(['vulnerability', 'asset_discovery', 'document_import', 'compliance_check']),
  asset_id: z.string().optional(),
  raw_data: z.string().optional(),
});

type ScanFormData = z.infer<typeof scanSchema>;

export default function Scans() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user, organization } = useAuth();
  const { authorizations, hasValidAuthorization } = useAuthorization();
  const queryClient = useQueryClient();

  const form = useForm<ScanFormData>({
    resolver: zodResolver(scanSchema),
    defaultValues: {
      scan_type: 'vulnerability',
      asset_id: '',
      raw_data: '',
    },
  });

  const { data: scans, isLoading } = useQuery({
    queryKey: ['scans', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Scan[];
    },
    enabled: !!organization?.id,
  });

  const { data: assets } = useQuery({
    queryKey: ['assets', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('organization_id', organization.id);
      if (error) throw error;
      return data as Asset[];
    },
    enabled: !!organization?.id,
  });

  const validAuth = authorizations.find(
    a => a.status === 'approved' && a.consent_checkbox && (!a.valid_until || new Date(a.valid_until) > new Date())
  );

  const createMutation = useMutation({
    mutationFn: async (data: ScanFormData) => {
      if (!organization?.id || !user?.id || !validAuth) throw new Error('Not authenticated or no authorization');

      // Parse raw data if provided
      let parsedData = null;
      let findings = { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
      
      if (data.raw_data) {
        try {
          parsedData = JSON.parse(data.raw_data);
          // Try to extract findings counts from common formats
          if (parsedData.vulnerabilities) {
            findings.total = parsedData.vulnerabilities.length;
            parsedData.vulnerabilities.forEach((v: { severity?: string }) => {
              switch (v.severity?.toLowerCase()) {
                case 'critical': findings.critical++; break;
                case 'high': findings.high++; break;
                case 'medium': findings.medium++; break;
                case 'low': findings.low++; break;
              }
            });
          }
        } catch {
          // Not valid JSON, store as-is
          parsedData = { raw: data.raw_data };
        }
      }

      const { data: scan, error } = await supabase
        .from('scans')
        .insert([{
          organization_id: organization.id,
          authorization_id: validAuth.id,
          created_by: user.id,
          scan_type: data.scan_type,
          asset_id: data.asset_id || null,
          status: 'completed',
          raw_data: parsedData,
          findings_count: findings.total,
          critical_count: findings.critical,
          high_count: findings.high,
          medium_count: findings.medium,
          low_count: findings.low,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;

      // Note: Evidence logging is now done server-side only
      return scan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans'] });
      queryClient.invalidateQueries({ queryKey: ['scan-stats'] });
      toast.success('Scan importé avec succès');
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'import', { description: error.message });
    },
  });

  const getScanTypeLabel = (type: string) => {
    switch (type) {
      case 'vulnerability': return 'Vulnérabilités';
      case 'asset_discovery': return 'Découverte d\'actifs';
      case 'document_import': return 'Import de documents';
      case 'compliance_check': return 'Vérification conformité';
      default: return type;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Trust Banner for authorization awareness */}
        {!hasValidAuthorization && (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-warning/30 bg-warning/10">
            <ShieldAlert className="h-5 w-5 text-warning" />
            <div className="flex-1">
              <p className="font-medium text-foreground">Autorisation requise</p>
              <p className="text-sm text-muted-foreground">
                Vous devez créer une autorisation pour importer des scans.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/scopeguard'}>
              Créer une autorisation
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Scans</h1>
            <p className="text-muted-foreground">
              Importez et consultez les résultats de vos analyses de sécurité.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Importer un scan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Importer un scan</DialogTitle>
                <DialogDescription>
                  Importez les résultats d'un scan externe au format JSON.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="scan_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de scan</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="vulnerability">Scan de vulnérabilités</SelectItem>
                            <SelectItem value="asset_discovery">Découverte d'actifs</SelectItem>
                            <SelectItem value="document_import">Import de documents</SelectItem>
                            <SelectItem value="compliance_check">Vérification conformité</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="asset_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Actif concerné (optionnel)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un actif" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {assets?.map(asset => (
                              <SelectItem key={asset.id} value={asset.id}>
                                {asset.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="raw_data"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Données du scan (JSON)</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={8}
                            placeholder='{"vulnerabilities": [{"id": "CVE-2024-1234", "severity": "high", "description": "..."}]}'
                            className="font-mono text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Collez les résultats au format JSON
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Play className="h-4 w-4 mr-2" />
                      Importer
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanIcon className="h-5 w-5" />
              Historique des scans
            </CardTitle>
            <CardDescription>
              {scans?.length ?? 0} scan(s) enregistré(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : scans?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ScanIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Aucun scan</p>
                <p className="text-sm text-muted-foreground">
                  Importez votre premier scan pour commencer l'analyse
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {scans?.map(scan => (
                    <div
                      key={scan.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{getScanTypeLabel(scan.scan_type)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(scan.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {scan.critical_count > 0 && (
                          <Badge variant="destructive">{scan.critical_count} critique(s)</Badge>
                        )}
                        {scan.high_count > 0 && (
                          <Badge variant="destructive">{scan.high_count} élevée(s)</Badge>
                        )}
                        {scan.medium_count > 0 && (
                          <Badge variant="secondary">{scan.medium_count} moyenne(s)</Badge>
                        )}
                        <Badge variant="outline">{scan.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
