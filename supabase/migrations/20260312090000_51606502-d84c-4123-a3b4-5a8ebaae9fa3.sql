
-- Unique constraints required by correlate-entities upsert operations
-- Use CREATE UNIQUE INDEX since ADD CONSTRAINT IF NOT EXISTS is not valid in PG

CREATE UNIQUE INDEX IF NOT EXISTS entity_nodes_org_type_canonical_idx
  ON public.entity_nodes (organization_id, entity_type, canonical_value);

CREATE UNIQUE INDEX IF NOT EXISTS entity_edges_org_from_to_type_idx
  ON public.entity_edges (organization_id, from_node_id, to_node_id, edge_type);

CREATE UNIQUE INDEX IF NOT EXISTS signal_entity_links_signal_entity_relation_idx
  ON public.signal_entity_links (signal_id, entity_node_id, relation_type);
