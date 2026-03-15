
-- ── Ontology Nodes: Palantir-style knowledge graph ─────────────────────────
CREATE TABLE IF NOT EXISTS public.ontology_nodes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  node_type       text NOT NULL,
  entity_id       uuid NOT NULL,
  label           text NOT NULL,
  properties      jsonb NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ontology_edges (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  from_node_id    uuid NOT NULL REFERENCES public.ontology_nodes(id) ON DELETE CASCADE,
  to_node_id      uuid NOT NULL REFERENCES public.ontology_nodes(id) ON DELETE CASCADE,
  relation        text NOT NULL,
  weight          numeric NOT NULL DEFAULT 1.0,
  evidence        jsonb NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Self-healing scripts table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.healing_scripts (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  remediation_action_id uuid NOT NULL REFERENCES public.remediation_actions(id) ON DELETE CASCADE,
  script_type           text NOT NULL DEFAULT 'bash',
  script_content        text NOT NULL,
  execution_log         text,
  execution_status      text NOT NULL DEFAULT 'pending',
  applied_at            timestamptz,
  proof_hash            text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ontology_nodes_org ON public.ontology_nodes(organization_id);
CREATE INDEX IF NOT EXISTS idx_ontology_nodes_entity ON public.ontology_nodes(entity_id);
CREATE INDEX IF NOT EXISTS idx_ontology_edges_org ON public.ontology_edges(organization_id);
CREATE INDEX IF NOT EXISTS idx_ontology_edges_from ON public.ontology_edges(from_node_id);
CREATE INDEX IF NOT EXISTS idx_ontology_edges_to ON public.ontology_edges(to_node_id);
CREATE INDEX IF NOT EXISTS idx_healing_scripts_org ON public.healing_scripts(organization_id);
CREATE INDEX IF NOT EXISTS idx_healing_scripts_action ON public.healing_scripts(remediation_action_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ontology_nodes_entity_unique 
  ON public.ontology_nodes(organization_id, entity_id, node_type);

ALTER TABLE public.ontology_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ontology_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.healing_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view ontology nodes" ON public.ontology_nodes FOR SELECT USING (has_org_access(auth.uid(), organization_id));
CREATE POLICY "Org members can create ontology nodes" ON public.ontology_nodes FOR INSERT WITH CHECK (has_org_access(auth.uid(), organization_id));
CREATE POLICY "Admins can delete ontology nodes" ON public.ontology_nodes FOR DELETE USING (has_role(auth.uid(), organization_id, 'admin'::app_role));
CREATE POLICY "Org members can update ontology nodes" ON public.ontology_nodes FOR UPDATE USING (has_org_access(auth.uid(), organization_id));

CREATE POLICY "Org members can view ontology edges" ON public.ontology_edges FOR SELECT USING (has_org_access(auth.uid(), organization_id));
CREATE POLICY "Org members can create ontology edges" ON public.ontology_edges FOR INSERT WITH CHECK (has_org_access(auth.uid(), organization_id));

CREATE POLICY "Org members can view healing scripts" ON public.healing_scripts FOR SELECT USING (has_org_access(auth.uid(), organization_id));
CREATE POLICY "Org members can create healing scripts" ON public.healing_scripts FOR INSERT WITH CHECK (has_org_access(auth.uid(), organization_id));
CREATE POLICY "Org members can update healing scripts" ON public.healing_scripts FOR UPDATE USING (has_org_access(auth.uid(), organization_id));
