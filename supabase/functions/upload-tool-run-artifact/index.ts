import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SHA-256 hash function
async function sha256(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper to call log-evidence with internal token
async function logEvidenceInternal(
  supabaseUrl: string,
  authHeader: string,
  internalToken: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/log-evidence`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
        "x-internal-token": internalToken,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.text();
      console.warn("Failed to log evidence:", error);
    }
  } catch (error) {
    console.warn("Failed to log evidence:", error);
  }
}

// Normalize JSON findings to standard format
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

  // Handle array of findings
  if (Array.isArray(rawData)) {
    for (const item of rawData) {
      const finding = normalizeSingleFinding(item);
      findings.push(finding);
      const severity = finding.severity.toLowerCase();
      if (severity in counts) {
        counts[severity as keyof typeof counts]++;
      }
    }
  } 
  // Handle object with results/findings array
  else if (typeof rawData === 'object' && rawData !== null) {
    const obj = rawData as Record<string, unknown>;
    const resultsArray = obj.results || obj.findings || obj.vulnerabilities || obj.issues;
    if (Array.isArray(resultsArray)) {
      for (const item of resultsArray) {
        const finding = normalizeSingleFinding(item);
        findings.push(finding);
        const severity = finding.severity.toLowerCase();
        if (severity in counts) {
          counts[severity as keyof typeof counts]++;
        }
      }
    }
  }

  return { findings, counts };
}

function normalizeSingleFinding(item: unknown): {
  title: string;
  severity: string;
  type: string;
  description: string;
  evidence: string;
  references: string[];
  raw: unknown;
} {
  if (typeof item !== 'object' || item === null) {
    return {
      title: 'Unknown finding',
      severity: 'info',
      type: 'unknown',
      description: String(item),
      evidence: '',
      references: [],
      raw: item,
    };
  }

  const obj = item as Record<string, unknown>;
  
  return {
    title: String(obj.title || obj.name || obj.template_id || obj.check || 'Unnamed finding'),
    severity: String(obj.severity || obj.level || obj.risk || 'info').toLowerCase(),
    type: String(obj.type || obj.category || obj.matcher_name || 'generic'),
    description: String(obj.description || obj.message || obj.info || ''),
    evidence: String(obj.evidence || obj.matched || obj.output || ''),
    references: Array.isArray(obj.references) 
      ? obj.references.map(String) 
      : (typeof obj.reference === 'string' ? [obj.reference] : []),
    raw: item,
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const internalEdgeToken = Deno.env.get('INTERNAL_EDGE_TOKEN')!;
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to get user context
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error('User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    // Parse form data
    const formData = await req.formData();
    const toolRunId = formData.get('tool_run_id') as string;
    const file = formData.get('file') as File;

    if (!toolRunId || !file) {
      return new Response(
        JSON.stringify({ error: 'Missing tool_run_id or file' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing upload for tool run:', toolRunId, 'file:', file.name, 'size:', file.size);

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'File too large. Maximum size is 10MB.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client for operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get tool run and verify ownership
    const { data: toolRun, error: runError } = await supabase
      .from('tool_runs')
      .select(`
        id,
        organization_id,
        tool_id,
        mode,
        status,
        requested_by,
        asset_id,
        tools_catalog (
          slug,
          name,
          category
        )
      `)
      .eq('id', toolRunId)
      .single();

    if (runError || !toolRun) {
      console.error('Tool run not found:', runError);
      return new Response(
        JSON.stringify({ error: 'Tool run not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has access to the organization
    const { data: orgAccess, error: orgError } = await supabase.rpc('has_org_access', {
      _user_id: user.id,
      _org_id: toolRun.organization_id
    });

    if (orgError || !orgAccess) {
      console.error('Organization access denied:', orgError);
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify run is awaiting upload
    if (toolRun.status !== 'awaiting_upload') {
      return new Response(
        JSON.stringify({ error: 'Tool run is not awaiting upload', current_status: toolRun.status }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Read file and calculate hash
    const fileBuffer = await file.arrayBuffer();
    const fileHash = await sha256(fileBuffer);

    console.log('File hash calculated:', fileHash);

    // Determine file extension
    const ext = file.type === 'application/json' ? 'json' 
      : file.type === 'application/pdf' ? 'pdf' 
      : file.type.includes('csv') ? 'csv' 
      : 'bin';

    // Upload to artifacts bucket
    const filePath = `${toolRun.organization_id}/${toolRunId}/input.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('artifacts')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload failed:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload file', details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('File uploaded to:', filePath);

    // Get public URL (actually signed URL since bucket is private)
    const { data: urlData } = await supabase.storage
      .from('artifacts')
      .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

    const artifactUrl = urlData?.signedUrl || filePath;

    // Update run status to processing
    await supabase
      .from('tool_runs')
      .update({ 
        status: 'processing',
        input_artifact_url: artifactUrl,
        input_artifact_hash: fileHash,
      })
      .eq('id', toolRunId);

    // Extract tool info from joined data
    const toolInfo = toolRun.tools_catalog as unknown as { slug?: string; name?: string; category?: string } | null;
    
    // Normalize the output
    let normalizedOutput: Record<string, unknown> = {
      tool: {
        slug: toolInfo?.slug || '',
        name: toolInfo?.name || '',
        category: toolInfo?.category || '',
      },
      target: {
        asset_id: toolRun.asset_id,
      },
      timestamps: {
        requested_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      },
      findings: [],
      counts: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
      notes: 'Import V1 (no live execution).',
    };

    let summary: Record<string, unknown> = { 
      critical: 0, 
      high: 0, 
      medium: 0, 
      low: 0, 
      info: 0,
      total: 0,
    };

    // Try to parse and normalize JSON files
    if (toolRun.mode === 'import_json' && file.type === 'application/json') {
      try {
        const textContent = new TextDecoder().decode(fileBuffer);
        const jsonData = JSON.parse(textContent);
        const { findings, counts } = normalizeJsonFindings(jsonData);
        
        normalizedOutput.findings = findings;
        normalizedOutput.counts = counts;
        
        summary = {
          ...counts,
          total: findings.length,
        };

        console.log('JSON normalized with', findings.length, 'findings');
      } catch (parseError) {
        console.warn('Failed to parse JSON:', parseError);
        normalizedOutput.notes = 'Import V1 - JSON parsing failed, file stored as evidence.';
      }
    } else {
      // PDF or CSV - store as evidence
      normalizedOutput.notes = `Import V1 - ${ext.toUpperCase()} file stored as evidence. Manual review required.`;
    }

    // Update run to done
    const { error: updateError } = await supabase
      .from('tool_runs')
      .update({
        status: 'done',
        completed_at: new Date().toISOString(),
        normalized_output: normalizedOutput,
        summary,
      })
      .eq('id', toolRunId);

    if (updateError) {
      console.error('Failed to update tool run:', updateError);
    }

    // Log to evidence vault via internal endpoint
    await logEvidenceInternal(supabaseUrl, authHeader, internalEdgeToken, {
      organization_id: toolRun.organization_id,
      action: 'tool_run_imported',
      entity_type: 'tool_run',
      entity_id: toolRunId,
      artifact_hash: fileHash,
      details: {
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        findings_count: (summary as Record<string, number>).total || 0,
      },
    });

    console.log('Tool run completed:', toolRunId);

    return new Response(
      JSON.stringify({
        success: true,
        tool_run_id: toolRunId,
        status: 'done',
        artifact_hash: fileHash,
        summary,
      }),
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
