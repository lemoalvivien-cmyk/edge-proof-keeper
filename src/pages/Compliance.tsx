import { useQuery } from '@tanstack/react-query';
import { ClipboardCheck, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ComplianceControl, ControlMapping } from '@/types/database';

export default function Compliance() {
  const { organization } = useAuth();

  const { data: controls } = useQuery({
    queryKey: ['compliance-controls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_controls')
        .select('*')
        .order('control_id');
      if (error) throw error;
      return data as ComplianceControl[];
    },
  });

  const { data: mappings } = useQuery({
    queryKey: ['control-mappings', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('control_mappings')
        .select('*')
        .eq('organization_id', organization.id);
      if (error) throw error;
      return data as ControlMapping[];
    },
    enabled: !!organization?.id,
  });

  const getMappingStatus = (controlId: string) => {
    return mappings?.find(m => m.control_id === controlId)?.status ?? 'not_started';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'implemented':
        return (
          <Badge className="bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Implémenté
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            En cours
          </Badge>
        );
      case 'not_applicable':
        return <Badge variant="outline">N/A</Badge>;
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="h-3 w-3 mr-1" />
            Non démarré
          </Badge>
        );
    }
  };

  const gdprControls = controls?.filter(c => c.framework === 'gdpr') ?? [];
  const nis2Controls = controls?.filter(c => c.framework === 'nis2') ?? [];

  const calculateProgress = (frameworkControls: ComplianceControl[]) => {
    if (frameworkControls.length === 0) return 0;
    const implemented = frameworkControls.filter(
      c => getMappingStatus(c.id) === 'implemented'
    ).length;
    return Math.round((implemented / frameworkControls.length) * 100);
  };

  const gdprProgress = calculateProgress(gdprControls);
  const nis2Progress = calculateProgress(nis2Controls);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conformité</h1>
          <p className="text-muted-foreground">
            Suivez votre progression sur les référentiels GDPR et NIS2.
          </p>
        </div>

        {/* Progress Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">GDPR</CardTitle>
              <CardDescription>Règlement Général sur la Protection des Données</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{gdprProgress}%</div>
              <Progress value={gdprProgress} className="mt-2" />
              <p className="text-sm text-muted-foreground mt-2">
                {gdprControls.filter(c => getMappingStatus(c.id) === 'implemented').length} / {gdprControls.length} contrôles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">NIS2</CardTitle>
              <CardDescription>Directive sur la sécurité des réseaux et systèmes d'information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{nis2Progress}%</div>
              <Progress value={nis2Progress} className="mt-2" />
              <p className="text-sm text-muted-foreground mt-2">
                {nis2Controls.filter(c => getMappingStatus(c.id) === 'implemented').length} / {nis2Controls.length} contrôles
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Controls List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Contrôles de conformité
            </CardTitle>
            <CardDescription>
              Liste des exigences par référentiel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="gdpr">
              <TabsList>
                <TabsTrigger value="gdpr">GDPR ({gdprControls.length})</TabsTrigger>
                <TabsTrigger value="nis2">NIS2 ({nis2Controls.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="gdpr">
                <ScrollArea className="h-[400px] mt-4">
                  <div className="space-y-3">
                    {gdprControls.map(control => (
                      <div
                        key={control.id}
                        className="flex items-start justify-between rounded-lg border p-4"
                      >
                        <div className="flex-1 mr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="font-mono text-xs">
                              {control.control_id}
                            </Badge>
                            {control.category && (
                              <span className="text-xs text-muted-foreground">
                                {control.category}
                              </span>
                            )}
                          </div>
                          <p className="font-medium">{control.title}</p>
                          {control.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {control.description}
                            </p>
                          )}
                        </div>
                        {getStatusBadge(getMappingStatus(control.id))}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="nis2">
                <ScrollArea className="h-[400px] mt-4">
                  <div className="space-y-3">
                    {nis2Controls.map(control => (
                      <div
                        key={control.id}
                        className="flex items-start justify-between rounded-lg border p-4"
                      >
                        <div className="flex-1 mr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="font-mono text-xs">
                              {control.control_id}
                            </Badge>
                            {control.category && (
                              <span className="text-xs text-muted-foreground">
                                {control.category}
                              </span>
                            )}
                          </div>
                          <p className="font-medium">{control.title}</p>
                          {control.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {control.description}
                            </p>
                          )}
                        </div>
                        {getStatusBadge(getMappingStatus(control.id))}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
