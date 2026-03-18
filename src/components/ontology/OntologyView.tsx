/**
 * SECURIT-E — OntologyView Component
 * Cartographie souveraine des risques : Assets → Risks → Remediations
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
  Network, RefreshCw, Loader2, Server, AlertTriangle, Wrench, Zap,
  ChevronRight, Activity, Brain, Shield
} from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

type OntologyNode = {
  id: string;
  node_type: string;
  entity_id: string;
  label: string;
  properties: Record<string, unknown>;
};

type OntologyEdge = {
  id: string;
  from_node_id: string;
  to_node_id: string;
  relation: string;
  weight: number;
};

const NODE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  asset: Server,
  risk: AlertTriangle,
  remediation: Wrench,
  signal: Zap,
  finding: Shield,
};

const NODE_COLORS: Record<string, string> = {
  asset: "border-primary/40 bg-primary/5",
  risk: "border-destructive/40 bg-destructive/5",
  remediation: "border-green-500/40 bg-green-500/5",
  signal: "border-yellow-500/40 bg-yellow-500/5",
  finding: "border-orange-500/40 bg-orange-500/5",
};

const LEVEL_VARIANT: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
  critical: "destructive",
  high: "default",
  medium: "secondary",
  low: "outline",
};

export function OntologyView() {
  const { organization } = useAuth();
  const qc = useQueryClient();
  const [building, setBuilding] = useState(false);
  const [expandedNode, setExpandedNode] = useState<string | null>(null);

  const { data: nodes = [], isLoading: nodesLoading } = useQuery({
    queryKey: ["ontology-nodes", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from("ontology_nodes")
        .select("*")
        .eq("organization_id", organization.id)
        .order("node_type")
        .limit(200);
      if (error) throw error;
      return (data ?? []) as OntologyNode[];
    },
    enabled: !!organization?.id,
  });

  const { data: edges = [], isLoading: edgesLoading } = useQuery({
    queryKey: ["ontology-edges", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from("ontology_edges")
        .select("*")
        .eq("organization_id", organization.id)
        .limit(500);
      if (error) throw error;
      return (data ?? []) as OntologyEdge[];
    },
    enabled: !!organization?.id,
  });

  const handleBuildOntology = async () => {
    if (!organization?.id) return;
    setBuilding(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Non authentifié");

      const res = await fetch(`${SUPABASE_URL}/functions/v1/build-ontology`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ organization_id: organization.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Erreur ${res.status}`);

      toast({
        title: "🧠 Ontologie construite",
        description: `${json.nodes_created} nœuds créés, ${json.edges_created} relations établies`,
      });
      qc.invalidateQueries({ queryKey: ["ontology-nodes"] });
      qc.invalidateQueries({ queryKey: ["ontology-edges"] });
    } catch (e: unknown) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBuilding(false);
    }
  };

  const isLoading = nodesLoading || edgesLoading;

  // Group nodes by type
  const nodesByType = nodes.reduce((acc, node) => {
    if (!acc[node.node_type]) acc[node.node_type] = [];
    acc[node.node_type].push(node);
    return acc;
  }, {} as Record<string, OntologyNode[]>);

  // Get connected nodes for a given node
  const getConnections = (nodeId: string) => {
    return edges
      .filter(e => e.from_node_id === nodeId || e.to_node_id === nodeId)
      .map(e => {
        const targetId = e.from_node_id === nodeId ? e.to_node_id : e.from_node_id;
        const target = nodes.find(n => n.id === targetId);
        return { edge: e, target, direction: e.from_node_id === nodeId ? "out" : "in" };
      })
      .filter(c => c.target);
  };

  const typeOrder = ["asset", "risk", "remediation", "signal", "finding"];
  const typeLabels: Record<string, string> = {
    asset: "Actifs",
    risk: "Risques",
    remediation: "Remédiations",
    signal: "Signaux",
    finding: "Findings",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Network className="h-5 w-5 text-primary" />
              Ontologie Souveraine
              <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                🧠 Palantir-style
              </Badge>
            </CardTitle>
            <CardDescription>
              Graphe de connaissances : {nodes.length} nœuds · {edges.length} relations
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={handleBuildOntology}
            disabled={building}
            className="gap-2"
          >
            {building ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Construction…</>
            ) : (
              <><RefreshCw className="h-4 w-4" />Construire l'ontologie</>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : nodes.length === 0 ? (
          <div className="text-center py-10">
            <Network className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium text-muted-foreground">Ontologie vide</p>
            <p className="text-sm text-muted-foreground mt-1">
              Cliquez sur "Construire l'ontologie" pour corréler vos données.
            </p>
            <Button size="sm" className="mt-4" onClick={handleBuildOntology} disabled={building}>
              <Brain className="h-4 w-4 mr-2" />
              Construire maintenant
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Ontology stats */}
            <div className="grid grid-cols-5 gap-2">
              {typeOrder.map(type => {
                const count = nodesByType[type]?.length ?? 0;
                const Icon = NODE_ICONS[type] ?? Activity;
                return (
                  <div key={type} className={`rounded-lg border p-3 text-center ${NODE_COLORS[type]}`}>
                    <Icon className="h-4 w-4 mx-auto mb-1 text-foreground/60" />
                    <div className="text-xl font-bold">{count}</div>
                    <div className="text-xs text-muted-foreground">{typeLabels[type]}</div>
                  </div>
                );
              })}
            </div>

            {/* Node list grouped by type */}
            <div className="space-y-3">
              {typeOrder.filter(t => (nodesByType[t]?.length ?? 0) > 0).map(type => {
                const Icon = NODE_ICONS[type] ?? Activity;
                const typeNodes = nodesByType[type] ?? [];
                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        {typeLabels[type]} ({typeNodes.length})
                      </span>
                    </div>
                    <div className="space-y-1 ml-6">
                      {typeNodes.slice(0, 5).map(node => {
                        const isExpanded = expandedNode === node.id;
                        const connections = isExpanded ? getConnections(node.id) : [];
                        const props = node.properties as Record<string, unknown>;
                        const level = (props.risk_level ?? props.priority ?? props.severity) as string | undefined;

                        return (
                          <div key={node.id}>
                            <button
                              className={`w-full flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm hover:bg-muted/30 transition-colors ${isExpanded ? "border-primary/30 bg-primary/5" : "border-border"}`}
                              onClick={() => setExpandedNode(isExpanded ? null : node.id)}
                            >
                              <ChevronRight className={`h-3 w-3 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                              <span className="truncate flex-1 font-medium">{node.label}</span>
                              {level && <Badge variant={LEVEL_VARIANT[level] ?? "outline"} className="text-[10px] shrink-0">{level}</Badge>}
                              <span className="text-xs text-muted-foreground shrink-0">
                                {edges.filter(e => e.from_node_id === node.id || e.to_node_id === node.id).length} liens
                              </span>
                            </button>
                            {isExpanded && connections.length > 0 && (
                              <div className="ml-6 mt-1 space-y-1 border-l-2 border-primary/20 pl-3">
                                {connections.map(({ edge, target, direction }) => {
                                  const TIcon = target ? (NODE_ICONS[target.node_type] ?? Activity) : Activity;
                                  return (
                                    <div key={edge.id} className="flex items-center gap-2 text-xs text-muted-foreground py-0.5">
                                      <TIcon className="h-3 w-3 shrink-0" />
                                      <span className="font-mono text-primary/60">
                                        {direction === "out" ? "→" : "←"}
                                      </span>
                                      <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-mono">
                                        {edge.relation}
                                      </span>
                                      <span className="truncate">{target?.label}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {typeNodes.length > 5 && (
                        <p className="text-xs text-muted-foreground ml-1">
                          +{typeNodes.length - 5} autres nœuds…
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Activity className="h-3 w-3" />
                Ontologie souveraine — {edges.length} relations cartographiées — 🇫🇷 20× moins cher que Palantir
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
