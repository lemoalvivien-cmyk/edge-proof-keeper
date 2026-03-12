/**
 * seed-demo-run — Edge Function
 *
 * Injecte un scénario de démonstration complet et explicitement marqué DEMO :
 *   1. Crée un tool_run avec normalized_output contenant des findings structurés
 *   2. Insère les findings normalisés directement en DB (bypass upload)
 *   3. Logue dans evidence_log (chaîne SHA-256)
 *   4. Retourne l'ID du run créé pour permettre la génération de synthèse
 *
 * IMPORTANT : toutes les données sont explicitement marquées [DEMO] dans les titres
 * et dans les champs evidence. Aucune donnée n'est présentée comme production réelle.
 *
 * Multi-tenant strict : chaque seed est scoped à organization_id de l'appelant.
 * RLS : utilise le service role uniquement pour les opérations internes légitimes.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buf = encoder.encode(data);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function logEvidenceInternal(
  supabaseUrl: string,
  authHeader: string,
  internalToken: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/log-evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'x-internal-token': internalToken,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) console.warn('log-evidence failed:', await res.text());
  } catch (err) {
    console.warn('log-evidence error:', err);
  }
}

// Jeu de données de démonstration — explicitement marqué [DEMO]
// Simule un import nuclei/nmap réaliste sans aucune donnée réelle
const DEMO_FINDINGS = [
  {
    title: '[DEMO] Exposition TLS 1.0 — chiffrement obsolète',
    finding_type: 'tls_issue',
    severity: 'high',
    confidence: 'high',
    evidence: {
      host: 'demo-app.example.com',
      protocol: 'tls',
      matched: 'TLS 1.0 accepté par le serveur cible',
      demo: true,
      note: 'Donnée de démonstration — non représentative d\'une infrastructure réelle',
    },
    references: ['CVE: CVE-2011-3389', 'https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2011-3389'],
  },
  {
    title: '[DEMO] Port 8080 exposé publiquement — service non authentifié',
    finding_type: 'open_port',
    severity: 'medium',
    confidence: 'medium',
    evidence: {
      host: 'demo-api.example.com',
      port: 8080,
      protocol: 'tcp',
      demo: true,
      note: 'Donnée de démonstration',
    },
    references: [],
  },
  {
    title: '[DEMO] Clé API exposée dans dépôt Git public',
    finding_type: 'secret_leak',
    severity: 'critical',
    confidence: 'high',
    evidence: {
      host: 'github.com/demo-org/demo-repo',
      matched: 'API_KEY=sk-demo-XXXX... (tronqué)',
      path: 'config/settings.yml',
      demo: true,
      note: 'Donnée de démonstration — aucune clé réelle exposée',
    },
    references: ['https://cwe.mitre.org/data/definitions/798.html'],
  },
  {
    title: '[DEMO] Dépendance critique vulnérable — Log4Shell simulé',
    finding_type: 'dependency',
    severity: 'critical',
    confidence: 'high',
    evidence: {
      template: 'CVE-2021-44228',
      matched: 'log4j-core:2.14.0 détectée dans le classpath',
      demo: true,
      note: 'Donnée de démonstration — version fictive',
    },
    references: ['CVE: CVE-2021-44228', 'https://nvd.nist.gov/vuln/detail/CVE-2021-44228'],
  },
  {
    title: '[DEMO] Sous-domaine dangling — DNS non résolu',
    finding_type: 'subdomain',
    severity: 'low',
    confidence: 'medium',
    evidence: {
      host: 'staging-demo.example.com',
      demo: true,
      note: 'Donnée de démonstration',
    },
    references: [],
  },
  {
    title: '[DEMO] Mauvaise configuration IAC — bucket S3 public',
    finding_type: 'iac_misconfig',
    severity: 'high',
    confidence: 'high',
    evidence: {
      path: 'terraform/s3.tf',
      matched: 'acl = "public-read" sur ressource sensible',
      demo: true,
      note: 'Donnée de démonstration',
    },
    references: ['CWE: CWE-732'],
  },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl       = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey   = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey        = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const internalToken     = Deno.env.get('INTERNAL_EDGE_TOKEN')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Auth user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse input
    const body = await req.json().catch(() => ({}));
    const orgId: string = body.organization_id;
    if (!orgId) {
      return new Response(JSON.stringify({ error: 'organization_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sb = createClient(supabaseUrl, serviceKey);

    // Verify org access
    const { data: hasAccess } = await sb.rpc('has_org_access', { _user_id: user.id, _org_id: orgId });
    if (!hasAccess) {
      return new Response(JSON.stringify({ error: 'Access denied to organization' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Étape 1 : Récupérer ou créer un outil de démo dans tools_catalog ──────
    let toolId: string;
    const { data: existingTool } = await sb
      .from('tools_catalog')
      .select('id')
      .eq('slug', 'nuclei')
      .maybeSingle();

    if (existingTool) {
      toolId = existingTool.id;
    } else {
      // Chercher n'importe quel outil
      const { data: anyTool } = await sb
        .from('tools_catalog')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      if (!anyTool) {
        return new Response(JSON.stringify({ error: 'Aucun outil dans tools_catalog — veuillez peupler le catalogue' }), {
          status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      toolId = anyTool.id;
    }

    // ── Étape 2 : Créer le tool_run de démo avec normalized_output ────────────
    const demoNormalizedOutput = {
      demo: true,
      findings: DEMO_FINDINGS,
      notes: '[DEMO] Scénario de démonstration injecté manuellement. Données fictives — non représentatives d\'une infrastructure réelle.',
      seeded_at: new Date().toISOString(),
      seeded_by: user.id,
    };

    const counts = {
      critical: DEMO_FINDINGS.filter(f => f.severity === 'critical').length,
      high:     DEMO_FINDINGS.filter(f => f.severity === 'high').length,
      medium:   DEMO_FINDINGS.filter(f => f.severity === 'medium').length,
      low:      DEMO_FINDINGS.filter(f => f.severity === 'low').length,
      info:     DEMO_FINDINGS.filter(f => f.severity === 'info').length,
      total:    DEMO_FINDINGS.length,
    };

    const { data: toolRun, error: runErr } = await sb
      .from('tool_runs')
      .insert({
        organization_id: orgId,
        tool_id: toolId,
        mode: 'import_json',
        status: 'done',
        requested_by: user.id,
        authorization_id: null,
        normalized_output: demoNormalizedOutput,
        completed_at: new Date().toISOString(),
        summary: {
          counts,
          confidence: 'high',
          limitations: ['[DEMO] Données fictives'],
          normalized_at: new Date().toISOString(),
          demo: true,
        },
      })
      .select('id')
      .single();

    if (runErr || !toolRun) {
      console.error('tool_run insert error:', runErr);
      return new Response(JSON.stringify({ error: 'Échec création tool_run', detail: runErr?.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const toolRunId = toolRun.id;

    // ── Étape 3 : Insérer les findings normalisés directement en DB ────────────
    const canonicalFindings = DEMO_FINDINGS.map(f => ({
      organization_id: orgId,
      tool_run_id: toolRunId,
      asset_id: null,
      title: f.title,
      finding_type: f.finding_type,
      severity: f.severity,
      confidence: f.confidence,
      evidence: f.evidence,
      references: f.references,
      status: 'open',
    }));

    const { data: insertedFindings, error: findingsErr } = await sb
      .from('findings')
      .insert(canonicalFindings)
      .select('id, severity, finding_type');

    if (findingsErr) {
      console.error('findings insert error:', findingsErr);
      // Non bloquant — le run est créé, on continue
    }

    const findingsInserted = insertedFindings?.length ?? 0;

    // ── Étape 4 : Mapper les findings aux contrôles GDPR/NIS2 si disponibles ──
    if (insertedFindings && insertedFindings.length > 0) {
      const { data: controls } = await sb
        .from('compliance_controls')
        .select('id, control_id, framework');

      if (controls && controls.length > 0) {
        const links = [];
        for (const f of insertedFindings) {
          if (['secret_leak', 'tls_issue'].includes(f.finding_type)) {
            const ctrl = controls.find(c => c.framework === 'gdpr' && c.control_id.includes('32'));
            if (ctrl) links.push({ finding_id: f.id, framework: 'gdpr', control_id: ctrl.id, reason: '[DEMO] Contrôle GDPR Art.32 — sécurité traitement' });
          }
          if (['vuln_template', 'dependency', 'iac_misconfig', 'open_port'].includes(f.finding_type)) {
            const ctrl = controls.find(c => c.framework === 'nis2' && c.control_id.includes('21'));
            if (ctrl) links.push({ finding_id: f.id, framework: 'nis2', control_id: ctrl.id, reason: '[DEMO] Contrôle NIS2 Art.21 — gestion risques' });
          }
        }
        if (links.length > 0) {
          await sb.from('finding_control_links').insert(links);
        }
      }
    }

    // ── Étape 5 : Logger dans evidence_log ─────────────────────────────────────
    const evidencePayload = {
      tool_run_id: toolRunId,
      findings_count: findingsInserted,
      counts,
      demo: true,
    };
    const artifactHash = await sha256(JSON.stringify(evidencePayload));

    await logEvidenceInternal(supabaseUrl, authHeader, internalToken, {
      organization_id: orgId,
      action: 'demo_seed_run_created',
      entity_type: 'tool_run',
      entity_id: toolRunId,
      artifact_hash: artifactHash,
      details: evidencePayload,
    });

    console.log(`[seed-demo-run] Seeded org=${orgId} run=${toolRunId} findings=${findingsInserted}`);

    return new Response(JSON.stringify({
      success: true,
      tool_run_id: toolRunId,
      findings_inserted: findingsInserted,
      counts,
      demo: true,
      message: `Run de démonstration créé — ${findingsInserted} findings insérés — ${counts.critical} critique(s), ${counts.high} élevé(s)`,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('seed-demo-run error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
