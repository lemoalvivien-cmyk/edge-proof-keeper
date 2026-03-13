import { useQuery } from '@tanstack/react-query';
import { Scan as ScanIcon, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Scan } from '@/types/database';

export default function Scans() {
  const { organization } = useAuth();

  const { data: scans } = useQuery({
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Scans</h1>
            <p className="text-muted-foreground">
              Module de scan de sécurité
            </p>
          </div>
        </div>

        {/* V1 Import-first message */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanIcon className="h-5 w-5 text-primary" />
              V1 = Mode Import-first
            </CardTitle>
            <CardDescription className="text-base">
              Dans cette version V1 de Securit-E, seul l'import de résultats de scans externes est supporté.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground mb-3">
                <strong className="text-foreground">Exécution active désactivée.</strong> Le lancement de scans automatisés (Nuclei, Nmap, etc.) directement depuis la plateforme sera disponible en V2.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <Play className="h-4 w-4 mt-0.5 text-primary" />
                  <span>V1 : Importez vos résultats de scans externes via <strong>Imports → Importer un artefact</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <ScanIcon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <span>V2 : Exécution automatisée de scans avec orchestration et scheduling</span>
                </li>
              </ul>
            </div>
            <Button variant="default" onClick={() => window.location.href = '/runs'}>
              <Play className="h-4 w-4 mr-2" />
              Aller aux Imports
            </Button>
          </CardContent>
        </Card>

        {/* Historical data if any */}
        {scans && scans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanIcon className="h-5 w-5" />
                Historique des scans importés
              </CardTitle>
              <CardDescription>
                {scans.length} scan(s) enregistré(s) précédemment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {scans.map(scan => (
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
                        {scan.critical_count && scan.critical_count > 0 && (
                          <Badge variant="destructive">{scan.critical_count} critique(s)</Badge>
                        )}
                        {scan.high_count && scan.high_count > 0 && (
                          <Badge variant="destructive">{scan.high_count} élevée(s)</Badge>
                        )}
                        {scan.medium_count && scan.medium_count > 0 && (
                          <Badge variant="secondary">{scan.medium_count} moyenne(s)</Badge>
                        )}
                        <Badge variant="outline">{scan.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
