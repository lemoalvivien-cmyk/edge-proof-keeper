import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Server, Plus, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEvidenceLog } from '@/hooks/useEvidenceLog';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthorizationGate } from '@/components/auth/AuthorizationGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { Asset } from '@/types/database';

const assetSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  asset_type: z.string().min(1, 'Sélectionnez un type'),
  identifier: z.string().optional(),
  description: z.string().optional(),
  risk_level: z.enum(['critical', 'high', 'medium', 'low', 'info']),
});

type AssetFormData = z.infer<typeof assetSchema>;

export default function Assets() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user, organization } = useAuth();
  const { logEvent } = useEvidenceLog();
  const queryClient = useQueryClient();

  const form = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: '',
      asset_type: '',
      identifier: '',
      description: '',
      risk_level: 'medium',
    },
  });

  const { data: assets, isLoading } = useQuery({
    queryKey: ['assets', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Asset[];
    },
    enabled: !!organization?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: AssetFormData) => {
      if (!organization?.id || !user?.id) throw new Error('Not authenticated');

      const { data: asset, error } = await supabase
        .from('assets')
        .insert([{
          organization_id: organization.id,
          created_by: user.id,
          name: data.name,
          asset_type: data.asset_type,
          identifier: data.identifier || null,
          description: data.description || null,
          risk_level: data.risk_level,
        }])
        .select()
        .single();

      if (error) throw error;

      await logEvent({
        action: 'asset_created',
        entity_type: 'asset',
        entity_id: asset.id,
        details: { name: data.name, type: data.asset_type },
      });

      return asset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Actif créé avec succès');
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast.error('Erreur lors de la création', { description: error.message });
    },
  });

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const assetTypes = [
    'Serveur',
    'Application Web',
    'Base de données',
    'Réseau',
    'Endpoint',
    'Cloud',
    'API',
    'Autre',
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Actifs</h1>
            <p className="text-muted-foreground">
              Inventaire des systèmes et réseaux sous surveillance.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AuthorizationGate actionDescription="l'ajout d'actifs">
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvel actif
                </Button>
              </DialogTrigger>
            </AuthorizationGate>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un actif</DialogTitle>
                <DialogDescription>
                  Enregistrez un nouveau système ou réseau à surveiller.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom de l'actif</FormLabel>
                        <FormControl>
                          <Input placeholder="Serveur Production" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="asset_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {assetTypes.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="identifier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Identifiant (optionnel)</FormLabel>
                        <FormControl>
                          <Input placeholder="IP, hostname, URL..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="risk_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Niveau de risque</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="critical">Critique</SelectItem>
                            <SelectItem value="high">Élevé</SelectItem>
                            <SelectItem value="medium">Moyen</SelectItem>
                            <SelectItem value="low">Faible</SelectItem>
                            <SelectItem value="info">Info</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (optionnel)</FormLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} />
                        </FormControl>
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
                      Créer
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
              <Server className="h-5 w-5" />
              Inventaire des actifs
            </CardTitle>
            <CardDescription>
              {assets?.length ?? 0} actif(s) enregistré(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : assets?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Server className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Aucun actif</p>
                <p className="text-sm text-muted-foreground">
                  Commencez par ajouter vos systèmes et réseaux
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {assets?.map(asset => (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{asset.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{asset.asset_type}</span>
                          {asset.identifier && (
                            <>
                              <span>•</span>
                              <span className="font-mono">{asset.identifier}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge variant={getRiskBadgeVariant(asset.risk_level)}>
                        {asset.risk_level}
                      </Badge>
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
