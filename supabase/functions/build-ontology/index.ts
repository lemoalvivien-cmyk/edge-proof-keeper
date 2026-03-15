/**
 * SECURIT-E — build-ontology Edge Function
 *
 * Construit l'ontologie Palantir-style (assets → risks → remediations)
 * à partir des données réelles de l'organisation.
 *
 * POST /functions/v1/build-ontology
 * Body: { organization_id }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  try {
    // ── Auth ──────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    let body: { organization_id?: string };
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Corps JSON invalide" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { organization_id } = body;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!organization_id || !uuidRegex.test(organization_id)) {
      return new Response(JSON.stringify({ error: "organization_id invalide" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const db = createClient(supabaseUrl, serviceKey);

    const { data: hasAccess } = await db.rpc("has_org_access", {
      _user_id: userId, _org_id: organization_id,
    });
    if (!hasAccess) {
      return new Response(JSON.stringify({ error: "Accès refusé" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Load all entities in parallel ─────────────────────────
    const [assetsRes, risksRes, actionsRes, signalsRes, findingsRes] = await Promise.all([
      db.from("assets").select("id, name, asset_type, risk_level, identifier").eq("organization_id", organization_id).limit(500),
      db.from("risk_register").select("id, title, risk_level, score, status, asset_id, source_signal_ids").eq("organization_id", organization_id).limit(500),
      db.from("remediation_actions").select("id, title, priority, status, action_type, risk_id").eq("organization_id", organization_id).limit(500),
      db.from("signals").select("id, title, severity, category, status, asset_id").eq("organization_id", organization_id).in("status", ["new", "acknowledged"]).limit(200),
      db.from("findings").select("id, title, severity, status, asset_id").eq("organization_id", organization_id).limit(200),
    ]);

    const assets = assetsRes.data ?? [];
    const risks = risksRes.data ?? [];
    const actions = actionsRes.data ?? [];
    const signals = signalsRes.data ?? [];
    const findings = findingsRes.data ?? [];

    let nodesCreated = 0;
    let edgesCreated = 0;

    // ── Helper: upsert a node ─────────────────────────────────
    async function upsertNode(
      nodeType: string,
      entityId: string,
      label: string,
      properties: Record<string, unknown>
    ): Promise<string> {
      const { data: existing } = await db
        .from("ontology_nodes")
        .select("id")
        .eq("organization_id", organization_id)
        .eq("entity_id", entityId)
        .eq("node_type", nodeType)
        .maybeSingle();

      if (existing) {
        await db
          .from("ontology_nodes")
          .update({ label, properties, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        return existing.id;
      } else {
        const { data: created } = await db
          .from("ontology_nodes")
          .insert({ organization_id, node_type: nodeType, entity_id: entityId, label, properties })
          .select("id")
          .single();
        nodesCreated++;
        return created!.id;
      }
    }

    // ── Helper: create edge (skip duplicates) ─────────────────
    async function createEdge(
      fromNodeId: string,
      toNodeId: string,
      relation: string,
      evidence: Record<string, unknown> = {}
    ) {
      const { data: existing } = await db
        .from("ontology_edges")
        .select("id")
        .eq("from_node_id", fromNodeId)
        .eq("to_node_id", toNodeId)
        .eq("relation", relation)
        .maybeSingle();

      if (!existing) {
        await db.from("ontology_edges").insert({
          organization_id,
          from_node_id: fromNodeId,
          to_node_id: toNodeId,
          relation,
          evidence,
        });
        edgesCreated++;
      }
    }

    // ── Build asset nodes ─────────────────────────────────────
    const assetNodeMap = new Map<string, string>();
    for (const asset of assets) {
      const nodeId = await upsertNode("asset", asset.id, asset.name, {
        asset_type: asset.asset_type,
        risk_level: asset.risk_level,
        identifier: asset.identifier,
      });
      assetNodeMap.set(asset.id, nodeId);
    }

    // ── Build signal nodes + link to assets ───────────────────
    const signalNodeMap = new Map<string, string>();
    for (const signal of signals) {
      const nodeId = await upsertNode("signal", signal.id, signal.title, {
        severity: signal.severity,
        category: signal.category,
        status: signal.status,
      });
      signalNodeMap.set(signal.id, nodeId);

      if (signal.asset_id && assetNodeMap.has(signal.asset_id)) {
        await createEdge(
          assetNodeMap.get(signal.asset_id)!,
          nodeId,
          "triggered_signal",
          { severity: signal.severity }
        );
      }
    }

    // ── Build finding nodes + link to assets ──────────────────
    for (const finding of findings) {
      const nodeId = await upsertNode("finding", finding.id, finding.title, {
        severity: finding.severity,
        status: finding.status,
      });

      if (finding.asset_id && assetNodeMap.has(finding.asset_id)) {
        await createEdge(
          assetNodeMap.get(finding.asset_id)!,
          nodeId,
          "has_finding",
          { severity: finding.severity }
        );
      }
    }

    // ── Build risk nodes + link to assets + signals ───────────
    const riskNodeMap = new Map<string, string>();
    for (const risk of risks) {
      const nodeId = await upsertNode("risk", risk.id, risk.title, {
        risk_level: risk.risk_level,
        score: risk.score,
        status: risk.status,
      });
      riskNodeMap.set(risk.id, nodeId);

      if (risk.asset_id && assetNodeMap.has(risk.asset_id)) {
        await createEdge(
          assetNodeMap.get(risk.asset_id)!,
          nodeId,
          "has_risk",
          { score: risk.score, risk_level: risk.risk_level }
        );
      }

      // Link signals to risk
      const signalIds: string[] = Array.isArray(risk.source_signal_ids)
        ? risk.source_signal_ids
        : [];
      for (const sigId of signalIds.slice(0, 5)) {
        if (signalNodeMap.has(sigId)) {
          await createEdge(
            signalNodeMap.get(sigId)!,
            nodeId,
            "contributes_to_risk",
            {}
          );
        }
      }
    }

    // ── Build remediation action nodes + link to risks ────────
    for (const action of actions) {
      const nodeId = await upsertNode("remediation", action.id, action.title, {
        priority: action.priority,
        status: action.status,
        action_type: action.action_type,
      });

      if (action.risk_id && riskNodeMap.has(action.risk_id)) {
        await createEdge(
          riskNodeMap.get(action.risk_id)!,
          nodeId,
          "requires_remediation",
          { priority: action.priority }
        );
      }
    }

    // ── Build summary stats ───────────────────────────────────
    const totalNodes =
      assets.length + risks.length + actions.length + signals.length + findings.length;

    console.log(`build-ontology: org=${organization_id} nodes_created=${nodesCreated} edges_created=${edgesCreated}`);

    return new Response(
      JSON.stringify({
        success: true,
        nodes_upserted: totalNodes,
        nodes_created: nodesCreated,
        edges_created: edgesCreated,
        breakdown: {
          assets: assets.length,
          risks: risks.length,
          remediations: actions.length,
          signals: signals.length,
          findings: findings.length,
        },
        sovereign_badge: "🧠 Ontologie souveraine construite — Palantir-style à 1/20e du prix",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("build-ontology fatal:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
