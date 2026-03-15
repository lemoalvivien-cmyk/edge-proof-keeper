/**
 * SECURIT-E — test-unauthorized-call Edge Function
 *
 * Security smoke test: attempts to call ingest-signals without a JWT.
 * Expected result: 401 Unauthorized
 * Logs the result in evidence_log for audit purposes.
 *
 * GET /functions/v1/test-unauthorized-call
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
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey     = Deno.env.get("SUPABASE_ANON_KEY")!;

  // ── Caller must be authenticated (internal-only endpoint) ─────────────────
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

  const db = createClient(supabaseUrl, serviceKey);

  // ── Run security test: call ingest-signals WITHOUT JWT ────────────────────
  const testResults: Array<{
    function: string;
    expected_status: number;
    actual_status: number;
    passed: boolean;
    tested_at: string;
  }> = [];

  const functionsBaseUrl = `${supabaseUrl.replace(".supabase.co", ".functions.supabase.co")}/v1`;

  // Test 1: ingest-signals without Authorization header
  try {
    const res = await fetch(`${functionsBaseUrl}/ingest-signals`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": anonKey },
      body: JSON.stringify({ organization_id: "00000000-0000-0000-0000-000000000000", source_id: "00000000-0000-0000-0000-000000000000", signals: [] }),
    });
    await res.text(); // consume body
    testResults.push({
      function: "ingest-signals",
      expected_status: 401,
      actual_status: res.status,
      passed: res.status === 401,
      tested_at: new Date().toISOString(),
    });
  } catch (err) {
    testResults.push({
      function: "ingest-signals",
      expected_status: 401,
      actual_status: 0,
      passed: false,
      tested_at: new Date().toISOString(),
    });
  }

  // Test 2: correlate-risks without Authorization header
  try {
    const res = await fetch(`${functionsBaseUrl}/correlate-risks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": anonKey },
      body: JSON.stringify({ organization_id: "00000000-0000-0000-0000-000000000000" }),
    });
    await res.text();
    testResults.push({
      function: "correlate-risks",
      expected_status: 401,
      actual_status: res.status,
      passed: res.status === 401,
      tested_at: new Date().toISOString(),
    });
  } catch {
    testResults.push({ function: "correlate-risks", expected_status: 401, actual_status: 0, passed: false, tested_at: new Date().toISOString() });
  }

  // Test 3: correlate-entities without Authorization header
  try {
    const res = await fetch(`${functionsBaseUrl}/correlate-entities`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": anonKey },
      body: JSON.stringify({ organization_id: "00000000-0000-0000-0000-000000000000" }),
    });
    await res.text();
    testResults.push({
      function: "correlate-entities",
      expected_status: 401,
      actual_status: res.status,
      passed: res.status === 401,
      tested_at: new Date().toISOString(),
    });
  } catch {
    testResults.push({ function: "correlate-entities", expected_status: 401, actual_status: 0, passed: false, tested_at: new Date().toISOString() });
  }

  const allPassed = testResults.every(r => r.passed);
  const passCount = testResults.filter(r => r.passed).length;

  // ── Log result in evidence_log ─────────────────────────────────────────────
  const orgId = claimsData.claims.sub; // use caller's user_id as a proxy (no org_id for test function)
  try {
    // Try to get the caller's org
    const { data: profile } = await db.from("profiles").select("organization_id").eq("id", claimsData.claims.sub).single();
    if (profile?.organization_id) {
      await db.from("evidence_log").insert({
        organization_id: profile.organization_id,
        user_id: claimsData.claims.sub,
        action: "security_test_unauthorized_call",
        entity_type: "security_test",
        source: "test-unauthorized-call",
        details: {
          test_results: testResults,
          all_passed: allPassed,
          pass_count: passCount,
          total: testResults.length,
          tested_at: new Date().toISOString(),
        },
      });
    }
  } catch {
    // Non-blocking — evidence log failure should not fail the test
    console.warn("Could not write to evidence_log");
  }

  console.log(`security-test: ${passCount}/${testResults.length} passed`);

  return new Response(
    JSON.stringify({
      status: allPassed ? "PASS" : "FAIL",
      summary: `${passCount}/${testResults.length} tests passed`,
      all_functions_block_unauthenticated: allPassed,
      results: testResults,
      tested_at: new Date().toISOString(),
    }),
    {
      status: allPassed ? 200 : 422,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
