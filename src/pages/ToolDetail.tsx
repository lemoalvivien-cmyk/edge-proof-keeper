import { useParams, useNavigate } from 'react-router-dom';
import { ExternalLink, Github, Book, Box, ArrowLeft, Shield, Plus } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TrustBanner } from '@/components/ui/TrustBanner';
import { useToolBySlug, useToolPresets } from '@/hooks/useTools';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/types/tools';
import { CreateToolRunDialog } from '@/components/tools/CreateToolRunDialog';
import { useState } from 'react';

export default function ToolDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: tool, isLoading } = useToolBySlug(slug || '');
  const { data: presets } = useToolPresets(tool?.id);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-4 w-96 bg-muted rounded" />
        </div>
      </AppLayout>
    );
  }

  if (!tool) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Outil non trouvé.</p>
          <Button variant="link" onClick={() => navigate('/tools')}>
            Retour au catalogue
          </Button>
        </div>
      </AppLayout>
    );
  }

  const handleImport = () => {
    setShowCreateDialog(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <TrustBanner />

        <Button
          variant="ghost"
          onClick={() => navigate('/tools')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au catalogue
        </Button>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{tool.name}</h1>
              <Badge
                variant="outline"
                className={CATEGORY_COLORS[tool.category] || ''}
              >
                {CATEGORY_LABELS[tool.category] || tool.category}
              </Badge>
              {tool.status === 'archived' && (
                <Badge variant="secondary">Archivé</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {tool.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <Button
            size="lg"
            onClick={handleImport}
            disabled={tool.status === 'archived'}
          >
            <Plus className="h-4 w-4 mr-2" />
            Importer un résultat
          </Button>
        </div>

        {/* Legal warning */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Usage autorisé uniquement</AlertTitle>
          <AlertDescription>
            L'utilisation de cet outil doit être effectuée sur vos propres systèmes.
            SENTINEL EDGE permet uniquement l'import de résultats, pas l'exécution directe de scans.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Links */}
          <Card>
            <CardHeader>
              <CardTitle>Liens officiels</CardTitle>
              <CardDescription>
                Documentation et ressources pour {tool.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <a
                href={tool.official_site_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <ExternalLink className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Site officiel</p>
                  <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                    {tool.official_site_url}
                  </p>
                </div>
              </a>
              <a
                href={tool.repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <Github className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Repository</p>
                  <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                    {tool.repo_url}
                  </p>
                </div>
              </a>
              <a
                href={tool.docs_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <Book className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Documentation</p>
                  <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                    {tool.docs_url}
                  </p>
                </div>
              </a>
              {tool.docker_url && (
                <a
                  href={tool.docker_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <Box className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Image Docker</p>
                    <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                      {tool.docker_url}
                    </p>
                  </div>
                </a>
              )}
            </CardContent>
          </Card>

          {/* Import modes */}
          <Card>
            <CardHeader>
              <CardTitle>Modes d'import</CardTitle>
              <CardDescription>
                Formats de résultats supportés
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {presets?.filter(p => p.mode !== 'external_runner_disabled').map(preset => (
                <div
                  key={preset.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{preset.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {preset.mode === 'import_json' && 'Fichier JSON exporté par l\'outil'}
                      {preset.mode === 'import_pdf' && 'Rapport PDF généré par l\'outil'}
                      {preset.mode === 'import_csv' && 'Export CSV des résultats'}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {preset.mode.replace('import_', '').toUpperCase()}
                  </Badge>
                </div>
              ))}
              {presets?.find(p => p.mode === 'external_runner_disabled') && (
                <div className="flex items-center justify-between p-3 rounded-lg border opacity-50">
                  <div>
                    <p className="font-medium">Exécution externe</p>
                    <p className="text-sm text-muted-foreground">
                      Non disponible en V1
                    </p>
                  </div>
                  <Badge variant="secondary">Bientôt</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateToolRunDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        toolSlug={slug}
      />
    </AppLayout>
  );
}