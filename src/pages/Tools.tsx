import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Github, Book, Box, Search, Plus, Filter } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrustBanner } from '@/components/ui/TrustBanner';
import { useToolsCatalog } from '@/hooks/useTools';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/types/tools';
import { CreateToolRunDialog } from '@/components/tools/CreateToolRunDialog';

export default function Tools() {
  const navigate = useNavigate();
  const { data: tools, isLoading } = useToolsCatalog();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedToolSlug, setSelectedToolSlug] = useState<string | null>(null);

  const categories = [...new Set(tools?.map(t => t.category) || [])];

  const filteredTools = tools?.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(search.toLowerCase()) ||
      tool.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || tool.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }) || [];

  const handleCreateRun = (toolSlug: string) => {
    setSelectedToolSlug(toolSlug);
    setShowCreateDialog(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <TrustBanner />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Catalogue d'Outils</h1>
            <p className="text-muted-foreground">
              Outils open source pour l'import de résultats de sécurité
            </p>
          </div>
          <Button
            onClick={() => navigate('/runs')}
            variant="outline"
          >
            Voir les imports
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un outil..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {CATEGORY_LABELS[cat] || cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tools grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 w-32 bg-muted rounded" />
                  <div className="h-4 w-48 bg-muted rounded" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTools.map(tool => (
              <Card
                key={tool.id}
                className={`transition-all hover:border-primary/50 ${
                  tool.status === 'archived' ? 'opacity-60' : ''
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{tool.name}</CardTitle>
                    <Badge
                      variant="outline"
                      className={CATEGORY_COLORS[tool.category] || ''}
                    >
                      {CATEGORY_LABELS[tool.category] || tool.category}
                    </Badge>
                  </div>
                  <CardDescription className="flex flex-wrap gap-1">
                    {tool.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Links */}
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={tool.official_site_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Site
                    </a>
                    <a
                      href={tool.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                    >
                      <Github className="h-3 w-3" />
                      Repo
                    </a>
                    <a
                      href={tool.docs_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                    >
                      <Book className="h-3 w-3" />
                      Docs
                    </a>
                    {tool.docker_url && (
                      <a
                        href={tool.docker_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                      >
                        <Box className="h-3 w-3" />
                        Docker
                      </a>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/tools/${tool.slug}`)}
                    >
                      Détails
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleCreateRun(tool.slug)}
                      disabled={tool.status === 'archived'}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Importer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredTools.length === 0 && !isLoading && (
          <Card className="py-12 text-center">
            <CardContent>
              <p className="text-muted-foreground">
                Aucun outil trouvé pour cette recherche.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <CreateToolRunDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        toolSlug={selectedToolSlug}
      />
    </AppLayout>
  );
}