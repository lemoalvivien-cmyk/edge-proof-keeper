import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── HARDENED: Origin restriction preparation ───────────────────────────────
// TODO (external backend): restrict CORS to your proxy domain once deployed.
// Replace '*' with 'https://your-proxy.example.com' when VITE_CORE_API_URL is set.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── SHA-256 (from raw bytes) ────────────────────────────────────────────────
async function sha256(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── HARDENED: Magic-byte file validation ───────────────────────────────────
// Never trust Content-Type header alone — inspect actual bytes.
function detectMimeFromBytes(bytes: Uint8Array): 'json' | 'pdf' | 'csv' | 'unknown' {
  // PDF magic: %PDF
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return 'pdf';
  }
  // JSON: starts with '{' or '[' (after optional BOM / whitespace)
  const start = bytes.slice(0, 64);
  const text = new TextDecoder().decode(start).trimStart();
  if (text.startsWith('{') || text.startsWith('[')) {
    return 'json';
  }
  // CSV heuristic: printable ASCII, contains commas, no null bytes
  const sample = new TextDecoder().decode(bytes.slice(0, 512));
  const hasNullBytes = bytes.slice(0, 512).some(b => b === 0x00);
  if (!hasNullBytes && sample.includes(',')) {
    return 'csv';
  }
  return 'unknown';
}

// Validate declared mode matches detected real type
function validateFileType(
  detectedType: 'json' | 'pdf' | 'csv' | 'unknown',
  mode: string
): { ok: boolean; reason?: string } {
  const modeToExpected: Record<string, string> = {
    import_json: 'json',
    import_pdf: 'pdf',
    import_csv: 'csv',
  };
  const expected = modeToExpected[mode];
  if (!expected) return { ok: false, reason: `Unknown mode: ${mode}` };
  if (detectedType === 'unknown') {
    return { ok: false, reason: `File content does not match any supported type (expected ${expected})` };
  }
  if (detectedType !== expected) {
    return { ok: false, reason: `File content is ${detectedType} but mode requires ${expected}` };
  }
  return { ok: true };
}

// ─── HARDENED: Text sanitizer for finding fields ────────────────────────────
// Strips control characters and HTML-dangerous chars before storing.
function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') return String(input ?? '');
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // control chars
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim()
    .slice(0, 4096); // hard cap per field
}

// ─── Evidence logger ─────────────────────────────────────────────────────────
async function logEvidenceInternal(
  supabaseUrl: string,
  authHeader: string,
  internalToken: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/log-evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'x-internal-token': internalToken,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.warn('Failed to log evidence:', await response.text());
    }
  } catch (error) {
    console.warn('Failed to log evidence:', error);
  }
}

// ─── JSON findings normalizer ────────────────────────────────────────────────
function normalizeJsonFindings(rawData: unknown): {
  findings: Array<{
    title: string;
    severity: string;
    type: string;
    description: string;
    evidence: string;
    references: string[];
    raw: unknown;
  }>;
  counts: { critical: number; high: number; medium: number; low: number; info: number };
} {
  const findings: Array<{
    title: string;
    severity: string;
    type: string;
    description: string;
    evidence: string;
    references: string[];
    raw: unknown;
  }> = [];
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };

  const items: unknown[] = Array.isArray(rawData)
    ? rawData
    : (() => {
        if (typeof rawData !== 'object' || rawData === null) return [];
        const obj = rawData as Record<string, unknown>;
        const arr = obj.results ?? obj.findings ?? obj.vulnerabilities ?? obj.issues;
        return Array.isArray(arr) ? arr : [];
      })();

  for (const item of items) {
    const finding = normalizeSingleFinding(item);
    findings.push(finding);
    const sev = finding.severity.toLowerCase();
    if (sev in counts) counts[sev as keyof typeof counts]++;
  }

  return { findings, counts };
}

function normalizeSingleFinding(item: unknown): {
  title: string; severity: string; type: string;
  description: string; evidence: string; references: string[]; raw: unknown;
} {
  if (typeof item !== 'object' || item === null) {
    return {
      title: 'Unknown finding',
      severity: 'info',
      type: 'unknown',
      description: sanitizeText(String(item)),
      evidence: '',
      references: [],
      raw: item,
    };
  }
  const obj = item as Record<string, unknown>;
  return {
    // HARDENED: sanitize all text fields coming from raw imports
    title: sanitizeText(obj.title ?? obj.name ?? obj.template_id ?? obj.check ?? 'Unnamed finding'),
    severity: sanitizeText(obj.severity ?? obj.level ?? obj.risk ?? 'info').toLowerCase(),
    type: sanitizeText(obj.type ?? obj.category ?? obj.matcher_name ?? 'generic'),
    description: sanitizeText(obj.description ?? obj.message ?? obj.info ?? ''),
    evidence: sanitizeText(obj.evidence ?? obj.matched ?? obj.output ?? ''),
    references: Array.isArray(obj.references)
      ? obj.references.map(r => sanitizeText(r)).slice(0, 20)
      : (typeof obj.reference === 'string' ? [sanitizeText(obj.reference)] : []),
    raw: item,
  };
}

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const internalEdgeToken = Deno.env.get('INTERNAL_EDGE_TOKEN')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user identity
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    // Parse multipart form
    const formData = await req.formData();
    const toolRunId = formData.get('tool_run_id') as string;
    const file = formData.get('file') as File;

    if (!toolRunId || !file) {
      return new Response(
        JSON.stringify({ error: 'Missing tool_run_id or file' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // HARDENED: 10 MB hard cap
    if (file.size > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'File too large. Maximum size is 10MB.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch tool run + verify ownership
    const { data: toolRun, error: runError } = await supabase
      .from('tool_runs')
      .select(`
        id, organization_id, tool_id, mode, status, requested_by, asset_id, authorization_id,
        tools_catalog ( slug, name, category )
      `)
      .eq('id', toolRunId)
      .single();

    if (runError || !toolRun) {
      return new Response(
        JSON.stringify({ error: 'Tool run not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: orgAccess } = await supabase.rpc('has_org_access', {
      _user_id: user.id,
      _org_id: toolRun.organization_id,
    });
    if (!orgAccess) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Status guard
    if (toolRun.status !== 'awaiting_upload') {
      return new Response(
        JSON.stringify({ error: 'Tool run is not awaiting upload', current_status: toolRun.status }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Read bytes + hash
    const fileBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(fileBuffer);
    const fileHash = await sha256(fileBuffer);

    // HARDENED: magic-byte validation — reject mismatched files
    const detectedType = detectMimeFromBytes(fileBytes);
    const typeCheck = validateFileType(detectedType, toolRun.mode);
    if (!typeCheck.ok) {
      console.warn('File type mismatch:', typeCheck.reason);
      return new Response(
        JSON.stringify({ error: `File validation failed: ${typeCheck.reason}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const extMap: Record<string, string> = { json: 'json', pdf: 'pdf', csv: 'csv' };
    const ext = extMap[detectedType] ?? 'bin';
    const contentType = detectedType === 'pdf' ? 'application/pdf'
      : detectedType === 'json' ? 'application/json'
      : 'text/csv';

    // Upload to artifacts bucket
    const filePath = `${toolRun.organization_id}/${toolRunId}/input.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('artifacts')
      .upload(filePath, fileBuffer, { contentType, upsert: true });

    if (uploadError) {
      console.error('Upload failed:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // HARDENED: signed URL capped at 24h (previously 1 year)
    // TODO (external backend): replace with a proxy URL that streams from storage,
    // so the signed URL is never exposed directly to the client.
    const { data: urlData } = await supabase.storage
      .from('artifacts')
      .createSignedUrl(filePath, 60 * 60 * 24); // 24h max

    const artifactUrl = urlData?.signedUrl ?? filePath;

    // Mark as processing
    await supabase
      .from('tool_runs')
      .update({ status: 'processing', input_artifact_url: artifactUrl, input_artifact_hash: fileHash })
      .eq('id', toolRunId);

    const toolInfo = toolRun.tools_catalog as { slug?: string; name?: string; category?: string } | null;

    // Build normalized output
    let normalizedOutput: Record<string, unknown> = {
      tool: { slug: toolInfo?.slug ?? '', name: toolInfo?.name ?? '', category: toolInfo?.category ?? '' },
      target: { asset_id: toolRun.asset_id },
      // HARDENED: use server-side timestamp from DB, not front-end clock
      timestamps: { completed_at: new Date().toISOString() },
      findings: [],
      counts: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
      notes: 'Import V1 (no live execution).',
    };

    let summary: Record<string, unknown> = { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 };

    // JSON parsing + normalization
    if (toolRun.mode === 'import_json' && detectedType === 'json') {
      try {
        const textContent = new TextDecoder().decode(fileBuffer);
        const jsonData = JSON.parse(textContent);
        const { findings, counts } = normalizeJsonFindings(jsonData);
        normalizedOutput.findings = findings;
        normalizedOutput.counts = counts;
        summary = { ...counts, total: findings.length };
        console.log('JSON normalized with', findings.length, 'findings');
      } catch (parseError) {
        console.warn('Failed to parse JSON:', parseError);
        normalizedOutput.notes = 'Import V1 - JSON parsing failed, file stored as evidence.';
      }
    } else {
      normalizedOutput.notes = `Import V1 - ${ext.toUpperCase()} file stored as evidence. Manual review required.`;
    }

    // Finalize tool run
    await supabase
      .from('tool_runs')
      .update({ status: 'done', completed_at: new Date().toISOString(), normalized_output: normalizedOutput, summary })
      .eq('id', toolRunId);

    // Log to evidence vault
    await logEvidenceInternal(supabaseUrl, authHeader, internalEdgeToken, {
      organization_id: toolRun.organization_id,
      action: 'tool_run_imported',
      entity_type: 'tool_run',
      entity_id: toolRunId,
      artifact_hash: fileHash,
      details: {
        file_name: sanitizeText(file.name),
        detected_type: detectedType,
        file_size: file.size,
        findings_count: (summary as Record<string, number>).total ?? 0,
      },
    });

    console.log('Tool run completed:', toolRunId);

    return new Response(
      JSON.stringify({ success: true, tool_run_id: toolRunId, status: 'done', artifact_hash: fileHash, summary }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
