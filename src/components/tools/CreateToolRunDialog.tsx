import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import { useToolBySlug, useCreateToolRun } from '@/hooks/useTools';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ToolRunMode } from '@/types/tools';

interface Asset {
  id: string;
  name: string;
}

interface CreateToolRunDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolSlug: string | null | undefined;
}

export function CreateToolRunDialog({
  open,
  onOpenChange,
  toolSlug,
}: CreateToolRunDialogProps) {
  const navigate = useNavigate();
  const { organization } = useAuth();
  const { authorizations, hasValidAuthorization } = useAuthorization();
  const { data: tool } = useToolBySlug(toolSlug || '');
  const createMutation = useCreateToolRun();

  const [selectedAuthId, setSelectedAuthId] = useState<string>('');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [mode, setMode] = useState<ToolRunMode>('import_json');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);

  // Get valid authorizations
  const validAuthorizations = authorizations.filter(
    (auth) =>
      auth.status === 'approved' &&
      auth.consent_checkbox &&
      (!auth.valid_until || new Date(auth.valid_until) > new Date())
  );

  // Load assets
  useEffect(() => {
    if (organization?.id) {
      supabase
        .from('assets')
        .select('id, name')
        .eq('organization_id', organization.id)
        .order('name')
        .then(({ data }) => {
          setAssets(data || []);
        });
    }
  }, [organization?.id]);

  // Set default authorization
  useEffect(() => {
    if (validAuthorizations.length > 0 && !selectedAuthId) {
      setSelectedAuthId(validAuthorizations[0].id);
    }
  }, [validAuthorizations, selectedAuthId]);

  const handleSubmit = async () => {
    if (!organization?.id || !toolSlug || !selectedAuthId) {
      toast.error('Veuillez sélectionner une autorisation');
      return;
    }

    setLoading(true);
    try {
      const result = await createMutation.mutateAsync({
        organization_id: organization.id,
        asset_id: selectedAssetId || undefined,
        authorization_id: selectedAuthId,
        tool_slug: toolSlug,
        mode,
      });

      toast.success('Demande d\'import créée');
      onOpenChange(false);
      navigate(`/runs/${result.tool_run_id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  if (!hasValidAuthorization) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Autorisation requise</DialogTitle>
            <DialogDescription>
              Vous devez avoir une autorisation valide pour créer un import.
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Aucune autorisation valide trouvée. Veuillez créer une autorisation
              dans ScopeGuard avant de continuer.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={() => navigate('/scopeguard')}>
              Créer une autorisation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nouvel import - {tool?.name}</DialogTitle>
          <DialogDescription>
            Importer des résultats de scan externe
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Authorization select */}
          <div className="space-y-2">
            <Label htmlFor="authorization">
              <Shield className="h-4 w-4 inline mr-2" />
              Autorisation légale *
            </Label>
            <Select value={selectedAuthId} onValueChange={setSelectedAuthId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une autorisation" />
              </SelectTrigger>
              <SelectContent>
                {validAuthorizations.map((auth) => (
                  <SelectItem key={auth.id} value={auth.id}>
                    {auth.scope.substring(0, 50)}
                    {auth.scope.length > 50 ? '...' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Asset select (optional) */}
          <div className="space-y-2">
            <Label htmlFor="asset">Actif (optionnel)</Label>
            <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
              <SelectTrigger>
                <SelectValue placeholder="Aucun actif spécifique" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucun</SelectItem>
                {assets.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mode select */}
          <div className="space-y-3">
            <Label>Format d'import *</Label>
            <RadioGroup
              value={mode}
              onValueChange={(v) => setMode(v as ToolRunMode)}
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem
                  value="import_json"
                  id="json"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="json"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="font-semibold">JSON</span>
                  <span className="text-xs text-muted-foreground">
                    Données structurées
                  </span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="import_pdf"
                  id="pdf"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="pdf"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="font-semibold">PDF</span>
                  <span className="text-xs text-muted-foreground">
                    Rapport complet
                  </span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="import_csv"
                  id="csv"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="csv"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="font-semibold">CSV</span>
                  <span className="text-xs text-muted-foreground">
                    Export tabulaire
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              L'import sera tracé dans l'Evidence Vault avec un hash SHA-256.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !selectedAuthId}>
            {loading ? 'Création...' : 'Créer l\'import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
