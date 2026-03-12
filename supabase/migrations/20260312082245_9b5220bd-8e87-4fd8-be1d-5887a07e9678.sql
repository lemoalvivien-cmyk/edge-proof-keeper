
-- ─── Entity Nodes ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.entity_nodes (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid        NOT NULL,
  entity_type      text        NOT NULL,
  canonical_value  text        NOT NULL,
  display_value    text        NOT NULL,
  metadata         jsonb       NOT NULL DEFAULT '{}'::jsonb,
  confidence_score numeric     NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_entity_nodes_type CHECK (
    entity_type IN (
      'domain','subdomain','ip','certificate',
      'email','brand','repository','cloud_asset','organization_marker'
    )
  ),
  CONSTRAINT uq_entity_nodes_org_type_canonical
    UNIQUE (organization_id, entity_type, canonical_value)
);

CREATE INDEX IF NOT EXISTS idx_entity_nodes_org       ON public.entity_nodes (organization_id);
CREATE INDEX IF NOT EXISTS idx_entity_nodes_type      ON public.entity_nodes (entity_type);
CREATE INDEX IF NOT EXISTS idx_entity_nodes_canonical ON public.entity_nodes (canonical_value);

ALTER TABLE public.entity_nodes ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_entity_nodes_updated_at
  BEFORE UPDATE ON public.entity_nodes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Org members can view entity nodes"
  ON public.entity_nodes FOR SELECT
  USING (public.has_org_access(auth.uid(), organization_id));

CREATE POLICY "Org members can create entity nodes"
  ON public.entity_nodes FOR INSERT
  WITH CHECK (public.has_org_access(auth.uid(), organization_id));

CREATE POLICY "Org members can update entity nodes"
  ON public.entity_nodes FOR UPDATE
  USING (public.has_org_access(auth.uid(), organization_id));

CREATE POLICY "Admins can delete entity nodes"
  ON public.entity_nodes FOR DELETE
  USING (public.has_role(auth.uid(), organization_id, 'admin'::app_role));


-- ─── Entity Edges ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.entity_edges (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL,
  from_node_id    uuid        NOT NULL REFERENCES public.entity_nodes(id) ON DELETE CASCADE,
  to_node_id      uuid        NOT NULL REFERENCES public.entity_nodes(id) ON DELETE CASCADE,
  edge_type       text        NOT NULL,
  evidence        jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_entity_edges_type CHECK (
    edge_type IN (
      'resolves_to','shares_certificate','belongs_to',
      'mentions_brand','linked_to_breach','hosted_on','reuses_identity_signal'
    )
  ),
  CONSTRAINT uq_entity_edges_org_from_to_type
    UNIQUE (organization_id, from_node_id, to_node_id, edge_type)
);

CREATE INDEX IF NOT EXISTS idx_entity_edges_org          ON public.entity_edges (organization_id);
CREATE INDEX IF NOT EXISTS idx_entity_edges_from_node    ON public.entity_edges (from_node_id);
CREATE INDEX IF NOT EXISTS idx_entity_edges_to_node      ON public.entity_edges (to_node_id);
CREATE INDEX IF NOT EXISTS idx_entity_edges_type         ON public.entity_edges (edge_type);

ALTER TABLE public.entity_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view entity edges"
  ON public.entity_edges FOR SELECT
  USING (public.has_org_access(auth.uid(), organization_id));

CREATE POLICY "Org members can create entity edges"
  ON public.entity_edges FOR INSERT
  WITH CHECK (public.has_org_access(auth.uid(), organization_id));

CREATE POLICY "Admins can delete entity edges"
  ON public.entity_edges FOR DELETE
  USING (public.has_role(auth.uid(), organization_id, 'admin'::app_role));


-- ─── Signal ↔ Entity Links ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.signal_entity_links (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL,
  signal_id       uuid        NOT NULL REFERENCES public.signals(id) ON DELETE CASCADE,
  entity_node_id  uuid        NOT NULL REFERENCES public.entity_nodes(id) ON DELETE CASCADE,
  relation_type   text        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_signal_entity_links_sig_node_rel
    UNIQUE (signal_id, entity_node_id, relation_type)
);

CREATE INDEX IF NOT EXISTS idx_signal_entity_links_org       ON public.signal_entity_links (organization_id);
CREATE INDEX IF NOT EXISTS idx_signal_entity_links_signal    ON public.signal_entity_links (signal_id);
CREATE INDEX IF NOT EXISTS idx_signal_entity_links_node      ON public.signal_entity_links (entity_node_id);

ALTER TABLE public.signal_entity_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view signal entity links"
  ON public.signal_entity_links FOR SELECT
  USING (public.has_org_access(auth.uid(), organization_id));

CREATE POLICY "Org members can create signal entity links"
  ON public.signal_entity_links FOR INSERT
  WITH CHECK (public.has_org_access(auth.uid(), organization_id));

CREATE POLICY "Admins can delete signal entity links"
  ON public.signal_entity_links FOR DELETE
  USING (public.has_role(auth.uid(), organization_id, 'admin'::app_role));
