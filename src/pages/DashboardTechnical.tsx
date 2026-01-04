import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FindingsTable } from '@/components/findings/FindingsTable';
import { useFindings, useFindingCounts } from '@/hooks/useFindings';
import type { RiskLevel, FindingStatus } from '@/types/findings';

export default function DashboardTechnical() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<{
    severity?: RiskLevel;
    status?: FindingStatus;
    finding_type?: string;
  }>({});
  
  const { data: findings = [], isLoading } = useFindings(filters);
  const { data: counts } = useFindingCounts();

  const severityCards = [
    { label: 'Critique', severity: 'critical' as const, color: 'bg-red-500', count: counts?.critical ?? 0 },
    { label: 'Élevé', severity: 'high' as const, color: 'bg-orange-500', count: counts?.high ?? 0 },
    { label: 'Moyen', severity: 'medium' as const, color: 'bg-yellow-500', count: counts?.medium ?? 0 },
    { label: 'Faible', severity: 'low' as const, color: 'bg-blue-500', count: counts?.low ?? 0 },
    { label: 'Info', severity: 'info' as const, color: 'bg-gray-500', count: counts?.info ?? 0 },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour Vue Direction
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Vue Technique</h1>
            <p className="text-muted-foreground">
              Gérez et triez les findings de sécurité
            </p>
          </div>
        </div>

        {/* Summary counts */}
        <div className="grid gap-4 md:grid-cols-5">
          {severityCards.map((item) => (
            <Card 
              key={item.severity} 
              className={`cursor-pointer hover:border-primary transition-colors ${
                filters.severity === item.severity ? 'border-primary ring-1 ring-primary' : ''
              }`}
              onClick={() => setFilters(prev => ({ 
                ...prev, 
                severity: prev.severity === item.severity ? undefined : item.severity 
              }))}
            >
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded ${item.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{item.count}</p>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick filter badges */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground mr-2">Filtres rapides:</span>
          <Badge 
            variant={filters.status === 'open' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setFilters(prev => ({
              ...prev,
              status: prev.status === 'open' ? undefined : 'open'
            }))}
          >
            Ouverts uniquement
          </Badge>
          <Badge 
            variant={filters.status === 'triaged' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setFilters(prev => ({
              ...prev,
              status: prev.status === 'triaged' ? undefined : 'triaged'
            }))}
          >
            Triés
          </Badge>
          <Badge 
            variant={filters.status === 'resolved' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setFilters(prev => ({
              ...prev,
              status: prev.status === 'resolved' ? undefined : 'resolved'
            }))}
          >
            Résolus
          </Badge>
          {(filters.severity || filters.status || filters.finding_type) && (
            <Badge 
              variant="destructive"
              className="cursor-pointer"
              onClick={() => setFilters({})}
            >
              Réinitialiser
            </Badge>
          )}
        </div>

        {/* Findings table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Tous les Findings ({findings.length})
            </CardTitle>
            <CardDescription>
              Cliquez sur un finding pour voir les détails et changer son statut
            </CardDescription>
          </CardHeader>
          <CardContent>
            {findings.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-lg font-medium">
                  {Object.keys(filters).length > 0 
                    ? 'Aucun finding correspondant aux filtres'
                    : 'Aucun finding détecté'
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  {Object.keys(filters).length > 0 
                    ? 'Essayez de modifier vos filtres'
                    : 'Importez des résultats de scan pour voir les findings'
                  }
                </p>
              </div>
            ) : (
              <FindingsTable 
                findings={findings} 
                isLoading={isLoading}
                showFilters={true}
                onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
