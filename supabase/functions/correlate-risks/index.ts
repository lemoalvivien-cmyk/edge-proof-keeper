/**
 * CYBER SERENITY — correlate-risks Edge Function
 *
 * Reads 'new'/'acknowledged' signals, groups them by asset+category+severity,
 * creates or updates risk_register entries with computed scores.
 *
 * POST /functions/v1/correlate-risks
 * Body: { organization_id }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function normalizeSeverity(s: string): string {
  const map: Record<string, string> = {
    critical: "critical", high: "high", medium: "medium", low: "low",
  };
  return map[s?.toLowerCase()] ?? "low";
}

function severityToRiskLevel(maxSeverity: string): string {
  return normalizeSeverity(maxSeverity);
}

function calculateScore(severity: string, count: number, avgConfidence: number): number {
  const base: Record<string, number> = {
    critical: 90, high: 70, medium: 45, low: 20, info: 5,
  };
  const baseScore = base[normalizeSeverity(severity)] ?? 20;
  // Increase score slightly with signal count (logarithmic), capped at 100
  const countBonus = Math.min(Math.log(count + 1) * 5, 10);
  return Math.min(Math.round((baseScore + countBonus) * Math.max(avgConfidence, 0.3)), 100);
}

function buildGroupKey(signal: {
  asset_id: string | null;
  category: string;
  severity: string;
}): string {
  return `${signal.asset_id ?? "no_asset"}::${signal.category}::${normalizeSeverity(signal.severity)}`;
}

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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // ── Parse body ────────────────────────────────────────────
    let body: { organization_id?: string };
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { organization_id } = body;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!organization_id || !uuidRegex.test(organization_id)) {
      return new Response(JSON.stringify({ error: "Invalid or missing organization_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const db = createClient(supabaseUrl, serviceKey);

    // ── Check org access ──────────────────────────────────────
    const { data: hasAccess } = await db.rpc("has_org_access", {
      _user_id: userId, _org_id: organization_id,
    });
    if (!hasAccess) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Load open signals ─────────────────────────────────────
    const { data: signals, error: sigError } = await db
      .from("signals")
      .select("id, asset_id, category, severity, confidence_score, title, description")
      .eq("organization_id", organization_id)
      .in("status", ["new", "acknowledged"])
      .limit(1000);

    if (sigError) {
      return new Response(JSON.stringify({ error: "Failed to load signals" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!signals || signals.length === 0) {
      return new Response(
        JSON.stringify({ success: true, risks_created: 0, risks_updated: 0, message: "No open signals to correlate" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Group signals ─────────────────────────────────────────
    const groups = new Map<string, typeof signals>();
    for (const sig of signals) {
      const key = buildGroupKey(sig);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(sig);
    }

    // ── Load existing risks ───────────────────────────────────
    const { data: existingRisks } = await db
      .from("risk_register")
      .select("id, title, source_signal_ids, status")
      .eq("organization_id", organization_id)
      .in("status", ["open", "in_treatment"]);

    const existingByTitle = new Map(
      (existingRisks ?? []).map((r) => [r.title, r])
    );

    let risksCreated = 0;
    let risksUpdated = 0;

    // ── Upsert risks ──────────────────────────────────────────
    for (const [_key, groupSignals] of groups) {
      const maxSeverity = groupSignals.reduce((max, s) => {
        const order = ["critical", "high", "medium", "low", "info"];
        return order.indexOf(s.severity) < order.indexOf(max) ? s.severity : max;
      }, "info");

      const avgConfidence = groupSignals.reduce(
        (sum, s) => sum + (s.confidence_score ?? 0.5), 0
      ) / groupSignals.length;

      const score = calculateScore(maxSeverity, groupSignals.length, avgConfidence);
      const signalIds = groupSignals.map((s) => s.id);
      const representative = groupSignals[0];

      // Build a stable title for this risk group
      const riskTitle = `[${maxSeverity.toUpperCase()}] ${representative.category} — ${
        groupSignals.length === 1
          ? representative.title
          : `${groupSignals.length} signals in ${representative.category}`
      }`.slice(0, 500);

      const existing = existingByTitle.get(riskTitle);

      if (existing) {
        // Merge new signal IDs
        const existingIds: string[] = Array.isArray(existing.source_signal_ids)
          ? existing.source_signal_ids
          : [];
        const mergedIds = [...new Set([...existingIds, ...signalIds])];

        await db
          .from("risk_register")
          .update({
            score,
            risk_level: severityToRiskLevel(maxSeverity),
            source_signal_ids: mergedIds,
          })
          .eq("id", existing.id);
        risksUpdated++;
      } else {
        await db.from("risk_register").insert({
          organization_id,
          asset_id: representative.asset_id ?? null,
          title: riskTitle,
          description: `Correlated from ${groupSignals.length} signal(s) in category: ${representative.category}`,
          risk_level: severityToRiskLevel(maxSeverity),
          score,
          source_signal_ids: signalIds,
          status: "open",
        });
        risksCreated++;
      }
    }

    console.log(`correlate-risks: org=${organization_id} signals=${signals.length} created=${risksCreated} updated=${risksUpdated}`);

    return new Response(
      JSON.stringify({
        success: true,
        signals_processed: signals.length,
        risks_created: risksCreated,
        risks_updated: risksUpdated,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("correlate-risks fatal error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
