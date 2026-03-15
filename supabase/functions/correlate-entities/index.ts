/**
 * correlate-entities — Entity Extraction & Graph Builder
 *
 * Reads new/open signals for an organisation, extracts structured entities
 * (domains, IPs, emails, repos, certificates) from signal fields, then
 * upserts entity_nodes, entity_edges and signal_entity_links.
 *
 * Completely defensive — no outbound requests, no offensive capability.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// ─── Regex patterns ────────────────────────────────────────────────────────────
const DOMAIN_RE    = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}\b/gi;
const IP_RE        = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const EMAIL_RE     = /\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/g;
const CERT_HASH_RE = /\b[0-9a-f]{40,64}\b/gi;
const REPO_RE      = /(?:https?:\/\/)?(?:github\.com|gitlab\.com|bitbucket\.org)\/[\w.\-]+\/[\w.\-]+/gi;

// Common TLDs to filter noise
const NOISE_DOMAINS = new Set([
  'example.com', 'localhost', 'test.com', 'invalid',
  'schema.org', 'w3.org', 'xml.org',
]);

type EntityType =
  | 'domain' | 'subdomain' | 'ip' | 'certificate'
  | 'email' | 'brand' | 'repository' | 'cloud_asset' | 'organization_marker';

interface ExtractedEntity {
  entity_type: EntityType;
  canonical_value: string;
  display_value: string;
  metadata: Record<string, unknown>;
  source_field: string;
}

// ─── Normalizers ──────────────────────────────────────────────────────────────
function normalizeDomain(raw: string): string {
  return raw.toLowerCase().replace(/^https?:\/\//i, '').replace(/\/.*$/, '').replace(/\.$/, '');
}

function normalizeIp(raw: string): string {
  return raw.split('.').map(o => String(parseInt(o, 10))).join('.');
}

function normalizeEmail(raw: string): string {
  return raw.toLowerCase().trim();
}

function normalizeRepo(raw: string): string {
  return raw.toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/\.git$/, '')
    .trim();
}

function normalizeCert(raw: string): string {
  return raw.toLowerCase().replace(/[^0-9a-f]/g, '');
}

function isValidIp(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every(p => {
    const n = parseInt(p, 10);
    return n >= 0 && n <= 255 && String(n) === p;
  });
}

// ─── Entity extractor ─────────────────────────────────────────────────────────
function extractEntities(
  text: string,
  sourceField: string,
  brandHint?: string | null,
): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  if (!text || typeof text !== 'string') return entities;

  // Emails (must come before domain to avoid "@domain" being caught by domain regex)
  const emails = text.match(EMAIL_RE) ?? [];
  for (const e of emails) {
    const canonical = normalizeEmail(e);
    entities.push({
      entity_type: 'email',
      canonical_value: canonical,
      display_value: canonical,
      metadata: { extracted_from: sourceField },
      source_field: sourceField,
    });
  }

  // Repositories
  const repos = text.match(REPO_RE) ?? [];
  for (const r of repos) {
    const canonical = normalizeRepo(r);
    entities.push({
      entity_type: 'repository',
      canonical_value: canonical,
      display_value: canonical,
      metadata: { extracted_from: sourceField, raw: r },
      source_field: sourceField,
    });
  }

  // IPs
  const ips = text.match(IP_RE) ?? [];
  for (const ip of ips) {
    if (!isValidIp(ip)) continue;
    // Skip private ranges for public intel (still store, but mark)
    const canonical = normalizeIp(ip);
    const isPrivate =
      ip.startsWith('10.') ||
      ip.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
      ip.startsWith('127.');
    entities.push({
      entity_type: 'ip',
      canonical_value: canonical,
      display_value: canonical,
      metadata: { extracted_from: sourceField, is_private: isPrivate },
      source_field: sourceField,
    });
  }

  // Domains / subdomains (after stripping email addresses from text)
  const textWithoutEmails = text.replace(EMAIL_RE, ' ');
  const domains = textWithoutEmails.match(DOMAIN_RE) ?? [];
  for (const d of domains) {
    const canonical = normalizeDomain(d);
    if (NOISE_DOMAINS.has(canonical)) continue;
    if (canonical.length > 253) continue;
    const parts = canonical.split('.');
    if (parts.length < 2) continue;
    const entityType: EntityType = parts.length > 2 ? 'subdomain' : 'domain';
    entities.push({
      entity_type: entityType,
      canonical_value: canonical,
      display_value: canonical,
      metadata: { extracted_from: sourceField },
      source_field: sourceField,
    });
  }

  // Certificate hashes
  const hashes = text.match(CERT_HASH_RE) ?? [];
  for (const h of hashes) {
    const canonical = normalizeCert(h);
    entities.push({
      entity_type: 'certificate',
      canonical_value: canonical,
      display_value: `cert:${canonical.slice(0, 16)}...`,
      metadata: { extracted_from: sourceField, hash_length: canonical.length },
      source_field: sourceField,
    });
  }

  // Brand hint from signal metadata
  if (brandHint && typeof brandHint === 'string' && brandHint.trim().length > 1) {
    const canonical = brandHint.trim().toLowerCase();
    entities.push({
      entity_type: 'brand',
      canonical_value: canonical,
      display_value: brandHint.trim(),
      metadata: { extracted_from: 'brand_hint' },
      source_field: 'brand_hint',
    });
  }

  return entities;
}

function extractFromSignal(signal: Record<string, unknown>): ExtractedEntity[] {
  const all: ExtractedEntity[] = [];

  // title
  if (typeof signal.title === 'string') {
    all.push(...extractEntities(signal.title, 'title'));
  }

  // description
  if (typeof signal.description === 'string') {
    all.push(...extractEntities(signal.description, 'description'));
  }

  // evidence (flatten one level)
  if (signal.evidence && typeof signal.evidence === 'object') {
    const ev = signal.evidence as Record<string, unknown>;
    for (const [k, v] of Object.entries(ev)) {
      if (typeof v === 'string') {
        all.push(...extractEntities(v, `evidence.${k}`));
      }
    }
    // Brand hint from evidence.brand or evidence.brand_name
    const brand = (ev.brand ?? ev.brand_name ?? ev.organization) as string | undefined;
    if (brand) all.push(...extractEntities(brand, 'evidence.brand', brand));
  }

  // references (array of strings/urls)
  if (Array.isArray(signal.signal_refs)) {
    for (const ref of signal.signal_refs) {
      if (typeof ref === 'string') {
        all.push(...extractEntities(ref, 'references'));
      } else if (typeof ref === 'object' && ref !== null) {
        const url = (ref as Record<string, unknown>).url as string | undefined;
        if (url) all.push(...extractEntities(url, 'references'));
      }
    }
  }

  // raw_payload (flatten one level, conservative)
  if (signal.raw_payload && typeof signal.raw_payload === 'object') {
    const rp = signal.raw_payload as Record<string, unknown>;
    for (const [k, v] of Object.entries(rp)) {
      if (typeof v === 'string' && v.length < 500) {
        all.push(...extractEntities(v, `raw_payload.${k}`));
      }
    }
  }

  // Deduplicate by entity_type + canonical_value
  const seen = new Set<string>();
  return all.filter(e => {
    const key = `${e.entity_type}:${e.canonical_value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Edge detection ───────────────────────────────────────────────────────────
type EdgeType =
  | 'resolves_to' | 'shares_certificate' | 'belongs_to'
  | 'mentions_brand' | 'linked_to_breach' | 'hosted_on' | 'reuses_identity_signal';

function inferEdges(
  entities: ExtractedEntity[],
): Array<{ from_type: EntityType; from_val: string; to_type: EntityType; to_val: string; edge_type: EdgeType }> {
  const edges: Array<{
    from_type: EntityType; from_val: string;
    to_type: EntityType; to_val: string;
    edge_type: EdgeType;
  }> = [];

  const domains  = entities.filter(e => e.entity_type === 'domain');
  const subs     = entities.filter(e => e.entity_type === 'subdomain');
  const ips      = entities.filter(e => e.entity_type === 'ip');
  const certs    = entities.filter(e => e.entity_type === 'certificate');
  const brands   = entities.filter(e => e.entity_type === 'brand');

  // subdomain belongs_to its parent domain
  for (const sub of subs) {
    const parts = sub.canonical_value.split('.');
    // e.g. vpn.example.com → example.com
    const parentDomain = parts.slice(parts.length - 2).join('.');
    const parent = domains.find(d => d.canonical_value === parentDomain);
    if (parent) {
      edges.push({
        from_type: 'subdomain', from_val: sub.canonical_value,
        to_type: 'domain', to_val: parent.canonical_value,
        edge_type: 'belongs_to',
      });
    }
  }

  // domain / subdomain resolves_to ip (if both present in same signal)
  for (const d of [...domains, ...subs]) {
    for (const ip of ips) {
      edges.push({
        from_type: d.entity_type as EntityType, from_val: d.canonical_value,
        to_type: 'ip', to_val: ip.canonical_value,
        edge_type: 'resolves_to',
      });
    }
  }

  // domain / subdomain shares_certificate (if cert present)
  for (const d of [...domains, ...subs]) {
    for (const cert of certs) {
      edges.push({
        from_type: d.entity_type as EntityType, from_val: d.canonical_value,
        to_type: 'certificate', to_val: cert.canonical_value,
        edge_type: 'shares_certificate',
      });
    }
  }

  // brand mentions
  for (const brand of brands) {
    for (const d of [...domains, ...subs]) {
      if (d.canonical_value.includes(brand.canonical_value)) {
        edges.push({
          from_type: d.entity_type as EntityType, from_val: d.canonical_value,
          to_type: 'brand', to_val: brand.canonical_value,
          edge_type: 'mentions_brand',
        });
      }
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  return edges.filter(e => {
    const key = `${e.from_type}:${e.from_val}→${e.to_type}:${e.to_val}:${e.edge_type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Handler ──────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey     = Deno.env.get('SUPABASE_ANON_KEY')!;

    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claimsData.claims.sub;

    const adminClient  = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const { organization_id, signal_ids, limit = 200 } = body as {
      organization_id?: string;
      signal_ids?: string[];
      limit?: number;
    };

    if (!organization_id) {
      return new Response(
        JSON.stringify({ error: 'organization_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Check org access ──────────────────────────────────────────────────────
    const { data: hasAccess } = await adminClient.rpc('has_org_access', {
      _user_id: userId,
      _org_id: organization_id,
    });
    if (!hasAccess) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch signals
    let q = adminClient
      .from('signals')
      .select('id, title, description, evidence, signal_refs, raw_payload, signal_type, severity')
      .eq('organization_id', organization_id)
      .in('status', ['new', 'open', 'acknowledged', 'correlated'])
      .limit(limit);

    if (signal_ids?.length) {
      q = q.in('id', signal_ids);
    }

    const { data: signals, error: sigErr } = await q;
    if (sigErr) throw new Error(`Fetch signals: ${sigErr.message}`);

    const stats = {
      signals_processed: 0,
      nodes_created: 0,
      edges_created: 0,
      links_created: 0,
      errors: [] as string[],
    };

    for (const signal of signals ?? []) {
      try {
        const extracted = extractFromSignal(signal as Record<string, unknown>);
        if (!extracted.length) { stats.signals_processed++; continue; }

        // Map canonical_value → node id
        const nodeIdMap = new Map<string, string>(); // key → uuid

        // Upsert entity nodes
        for (const ent of extracted) {
          const { data: upserted, error: upsertErr } = await adminClient
            .from('entity_nodes')
            .upsert(
              {
                organization_id,
                entity_type: ent.entity_type,
                canonical_value: ent.canonical_value,
                display_value: ent.display_value,
                metadata: ent.metadata,
              },
              { onConflict: 'organization_id,entity_type,canonical_value', ignoreDuplicates: false },
            )
            .select('id')
            .single();

          if (upsertErr) {
            stats.errors.push(`node upsert ${ent.canonical_value}: ${upsertErr.message}`);
            continue;
          }
          const key = `${ent.entity_type}:${ent.canonical_value}`;
          nodeIdMap.set(key, upserted.id);
          stats.nodes_created++;
        }

        // Infer and upsert edges
        const inferredEdges = inferEdges(extracted);
        for (const edge of inferredEdges) {
          const fromKey = `${edge.from_type}:${edge.from_val}`;
          const toKey   = `${edge.to_type}:${edge.to_val}`;
          const fromId  = nodeIdMap.get(fromKey);
          const toId    = nodeIdMap.get(toKey);
          if (!fromId || !toId) continue;

          const { error: edgeErr } = await adminClient
            .from('entity_edges')
            .upsert(
              {
                organization_id,
                from_node_id: fromId,
                to_node_id: toId,
                edge_type: edge.edge_type,
                evidence: { inferred_from_signal: signal.id },
              },
              { onConflict: 'organization_id,from_node_id,to_node_id,edge_type', ignoreDuplicates: true },
            );

          if (edgeErr) {
            stats.errors.push(`edge ${edge.edge_type}: ${edgeErr.message}`);
          } else {
            stats.edges_created++;
          }
        }

        // Create signal ↔ entity links
        for (const ent of extracted) {
          const key    = `${ent.entity_type}:${ent.canonical_value}`;
          const nodeId = nodeIdMap.get(key);
          if (!nodeId) continue;

          const { error: linkErr } = await adminClient
            .from('signal_entity_links')
            .upsert(
              {
                organization_id,
                signal_id: signal.id,
                entity_node_id: nodeId,
                relation_type: ent.source_field,
              },
              { onConflict: 'signal_id,entity_node_id,relation_type', ignoreDuplicates: true },
            );

          if (linkErr) {
            stats.errors.push(`link ${signal.id}→${nodeId}: ${linkErr.message}`);
          } else {
            stats.links_created++;
          }
        }

        stats.signals_processed++;
      } catch (err) {
        stats.errors.push(`signal ${signal.id}: ${(err as Error).message}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, organization_id, ...stats }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
