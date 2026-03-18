/**
 * SECURIT-E — ingest-signals Edge Function
 * Rate limiting RÉEL via DB (stateless-safe).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders, handleCors } from "../_shared/cors.ts";

interface SignalInput {
  signal_type: string;
  category: string;
  title: string;
  description?: string;
  severity?: string;
  confidence_score?: number;
  evidence?: Record<string, unknown>;
  signal_refs?: unknown[];
  detected_at?: string;
  dedupe_key?: string;
  raw_payload?: Record<string, unknown>;
  asset_id?: string;
}

function normalizeSeverity(s: string | undefined): string {
  const map: Record<string, string> = { critical: "critical", crit: "critical", high: "high", medium: "medium", med: "medium", moderate: "medium", low: "low", info: "info", informational: "info", none: "info" };
  return map[s?.toLowerCase().trim() ?? ""] ?? "info";
}

function computeDedupeKey(orgId: string, sourceId: string, signal: SignalInput): string {
  const base = signal.dedupe_key ?? `${signal.signal_type}::${signal.category}::${signal.title}`;
  return `${orgId}::${sourceId}::${base}`;
}

Deno.serve(async (req) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  const corsHeaders = buildCorsHeaders(req);
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub;

    let body: { organization_id?: string; source_id?: string; signals?: SignalInput[] };
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { organization_id, source_id, signals } = body;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!organization_id || !uuidRegex.test(organization_id)) return new Response(JSON.stringify({ error: "Invalid or missing organization_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!source_id || !uuidRegex.test(source_id)) return new Response(JSON.stringify({ error: "Invalid or missing source_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!Array.isArray(signals) || signals.length === 0) return new Response(JSON.stringify({ error: "signals must be a non-empty array" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (signals.length > 500) return new Response(JSON.stringify({ error: "Maximum 500 signals per batch" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const db = createClient(supabaseUrl, serviceKey);

    // ── Rate limit RÉEL via DB ────────────────────────────────────────────────
    const { data: allowed, error: rlErr } = await db.rpc("check_rate_limit", {
      p_user_id: userId,
      p_function_name: "ingest-signals",
      p_max_per_minute: 20,
    });
    if (rlErr) console.error("ingest-signals rate limit error:", rlErr.message);
    if (allowed === false) {
      return new Response(JSON.stringify({ error: "Limite de 20 ingestions/min atteinte" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" }
      });
    }

    const { data: hasAccess, error: accessError } = await db.rpc("has_org_access", { _user_id: userId, _org_id: organization_id });
    if (accessError || !hasAccess) return new Response(JSON.stringify({ error: "Access denied to organization" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: sourceRow, error: sourceError } = await db.from("data_sources").select("id, organization_id").eq("id", source_id).eq("organization_id", organization_id).single();
    if (sourceError || !sourceRow) return new Response(JSON.stringify({ error: "Source not found in organization" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: syncRun, error: syncError } = await db.from("source_sync_runs").insert({ organization_id, source_id, status: "running", items_received: signals.length }).select("id").single();
    if (syncError || !syncRun) return new Response(JSON.stringify({ error: "Failed to create sync run" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const computedDedupeKeys = signals.map((s) => computeDedupeKey(organization_id, source_id, s));
    const { data: existingSignals } = await db.from("signals").select("dedupe_key").eq("organization_id", organization_id).in("dedupe_key", computedDedupeKeys);
    const existingKeys = new Set((existingSignals ?? []).map((s) => s.dedupe_key));

    const toInsert = [];
    let skippedCount = 0;

    for (const sig of signals) {
      if (!sig.signal_type || !sig.category || !sig.title) { skippedCount++; continue; }
      const dedupeKey = computeDedupeKey(organization_id, source_id, sig);
      if (existingKeys.has(dedupeKey)) { skippedCount++; continue; }
      if (sig.asset_id && !uuidRegex.test(sig.asset_id)) { sig.asset_id = undefined; }
      toInsert.push({ organization_id, source_id, asset_id: sig.asset_id ?? null, signal_type: sig.signal_type.slice(0, 100), category: sig.category.slice(0, 100), title: sig.title.slice(0, 500), description: (sig.description ?? "").slice(0, 5000), severity: normalizeSeverity(sig.severity), confidence_score: sig.confidence_score != null ? Math.min(Math.max(Number(sig.confidence_score), 0), 1) : null, evidence: sig.evidence ?? {}, signal_refs: sig.signal_refs ?? [], detected_at: sig.detected_at ?? new Date().toISOString(), dedupe_key: dedupeKey, raw_payload: sig.raw_payload ?? {}, status: "new" });
      existingKeys.add(dedupeKey);
    }

    let insertedCount = 0;
    let insertError: string | null = null;
    if (toInsert.length > 0) {
      const { data: inserted, error: insErr } = await db.from("signals").insert(toInsert).select("id");
      if (insErr) { insertError = insErr.message; console.error("Signal insert error:", insErr); }
      else { insertedCount = inserted?.length ?? 0; }
    }

    await db.from("source_sync_runs").update({ status: insertError ? "failed" : "completed", completed_at: new Date().toISOString(), items_normalized: insertedCount, error_message: insertError, raw_summary: { received: signals.length, inserted: insertedCount, skipped: skippedCount } }).eq("id", syncRun.id);
    await db.from("data_sources").update({ last_sync_at: new Date().toISOString(), status: "active" }).eq("id", source_id);

    console.log(`ingest-signals: org=${organization_id} received=${signals.length} inserted=${insertedCount} skipped=${skippedCount}`);
    return new Response(JSON.stringify({ success: !insertError, sync_run_id: syncRun.id, received: signals.length, inserted: insertedCount, skipped: skippedCount, error: insertError }), { status: insertError ? 207 : 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("ingest-signals fatal error:", message);
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
