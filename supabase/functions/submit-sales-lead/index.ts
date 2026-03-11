/**
 * submit-sales-lead — Edge Function
 *
 * Validates, deduplicates and inserts a sales lead.
 * Calculates a simple lead_score based on completeness + company_size.
 * Uses service role key so it bypasses RLS safely server-side.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeadPayload {
  full_name: string;
  email: string;
  company: string;
  role?: string;
  company_size?: string;
  interest_type?: string;
  message?: string;
  source_page?: string;
  cta_origin?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
}

function sanitize(s: string): string {
  return s.trim().replace(/\s+/g, ' ').slice(0, 500);
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function calcLeadScore(payload: LeadPayload): number {
  let score = 10; // base
  if (payload.role?.trim()) score += 10;
  if (payload.message && payload.message.trim().length > 20) score += 15;
  if (payload.interest_type) score += 10;
  const sizeMap: Record<string, number> = {
    '500+': 30,
    '201-500': 25,
    '51-200': 20,
    '11-50': 10,
    '1-10': 5,
  };
  score += sizeMap[payload.company_size ?? ''] ?? 0;
  if (payload.utm_source) score += 5;
  return Math.min(score, 100);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: LeadPayload;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── Strict validation ────────────────────────────────────────────────────
  const errors: Record<string, string> = {};

  const full_name = sanitize(body.full_name ?? '');
  if (!full_name || full_name.length < 2) errors.full_name = 'Nom requis (min. 2 caractères)';
  if (full_name.length > 100) errors.full_name = 'Nom trop long';

  const email = (body.email ?? '').trim().toLowerCase();
  if (!email || !validateEmail(email)) errors.email = 'Email valide requis';
  if (email.length > 255) errors.email = 'Email trop long';

  const company = sanitize(body.company ?? '');
  if (!company || company.length < 2) errors.company = 'Entreprise requise';
  if (company.length > 150) errors.company = 'Nom entreprise trop long';

  if (Object.keys(errors).length > 0) {
    return new Response(JSON.stringify({ error: 'Validation failed', details: errors }), {
      status: 422,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── Supabase admin client ────────────────────────────────────────────────
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  // ── Dedup: same email submitted in last 24h with same cta_origin ─────────
  const { data: existing } = await supabase
    .from('sales_leads')
    .select('id, created_at')
    .eq('email', email)
    .eq('cta_origin', body.cta_origin ?? 'unknown')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .maybeSingle();

  if (existing) {
    // Return success silently to avoid leaking intel, but don't duplicate
    console.log(`[submit-sales-lead] dedup hit for ${email} / cta=${body.cta_origin}`);
    return new Response(
      JSON.stringify({ success: true, deduplicated: true, message: 'Demande déjà enregistrée.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const lead_score = calcLeadScore({ ...body, email });

  const { data: lead, error: insertError } = await supabase
    .from('sales_leads')
    .insert({
      full_name,
      email,
      company,
      role: sanitize(body.role ?? '').slice(0, 100) || null,
      company_size: body.company_size ?? null,
      interest_type: body.interest_type ?? null,
      message: sanitize(body.message ?? '').slice(0, 2000) || null,
      source_page: (body.source_page ?? '/').slice(0, 200),
      cta_origin: (body.cta_origin ?? 'unknown').slice(0, 100),
      utm_source: body.utm_source?.slice(0, 100) ?? null,
      utm_medium: body.utm_medium?.slice(0, 100) ?? null,
      utm_campaign: body.utm_campaign?.slice(0, 100) ?? null,
      utm_content: body.utm_content?.slice(0, 200) ?? null,
      status: 'new',
      lead_score,
      last_activity_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('[submit-sales-lead] insert error:', insertError.message);
    return new Response(
      JSON.stringify({ error: 'Impossible d\'enregistrer votre demande. Réessayez.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  console.log(`[submit-sales-lead] new lead ${lead?.id} score=${lead_score} cta=${body.cta_origin}`);

  return new Response(
    JSON.stringify({ success: true, lead_id: lead?.id, lead_score }),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
