import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateToolRunRequest {
  organization_id: string;
  asset_id?: string;
  authorization_id: string;
  tool_slug: string;
  mode: 'import_json' | 'import_pdf' | 'import_csv';
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

    // Parse request body
    const body: CreateToolRunRequest = await req.json();
    const { organization_id, asset_id, authorization_id, tool_slug, mode } = body;

    console.log('Creating tool run:', { organization_id, tool_slug, mode });

    // Use service role client for operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user has org access
    const { data: orgAccess, error: orgError } = await supabase.rpc('has_org_access', {
      _user_id: user.id,
      _org_id: organization_id
    });

    if (orgError || !orgAccess) {
      console.error('Organization access denied:', orgError);
      return new Response(
        JSON.stringify({ error: 'Organization access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify authorization is valid
    const { data: authValid, error: authValidError } = await supabase.rpc('is_authorization_valid', {
      _auth_id: authorization_id
    });

    if (authValidError || !authValid) {
      console.error('Authorization not valid:', authValidError);
      return new Response(
        JSON.stringify({ error: 'Authorization is not valid or has expired' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify authorization belongs to org
    const { data: authBelongsToOrg, error: authOrgError } = await supabase.rpc('authorization_belongs_to_org', {
      _auth_id: authorization_id,
      _org_id: organization_id
    });

    if (authOrgError || !authBelongsToOrg) {
      console.error('Authorization does not belong to organization:', authOrgError);
      return new Response(
        JSON.stringify({ error: 'Authorization does not belong to this organization' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get tool by slug
    const { data: tool, error: toolError } = await supabase
      .from('tools_catalog')
      .select('id, name, category')
      .eq('slug', tool_slug)
      .single();

    if (toolError || !tool) {
      console.error('Tool not found:', toolError);
      return new Response(
        JSON.stringify({ error: 'Tool not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the tool run
    const { data: toolRun, error: runError } = await supabase
      .from('tool_runs')
      .insert({
        organization_id,
        asset_id: asset_id || null,
        authorization_id,
        tool_id: tool.id,
        mode,
        status: 'awaiting_upload',
        requested_by: user.id,
      })
      .select('id')
      .single();

    if (runError) {
      console.error('Failed to create tool run:', runError);
      return new Response(
        JSON.stringify({ error: 'Failed to create tool run', details: runError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Tool run created:', toolRun.id);

    // Log to evidence vault via internal endpoint
    await logEvidenceInternal(supabaseUrl, authHeader, internalEdgeToken, {
      organization_id,
      action: 'tool_run_requested',
      entity_type: 'tool_run',
      entity_id: toolRun.id,
      details: {
        tool_slug,
        tool_name: tool.name,
        tool_category: tool.category,
        mode,
        authorization_id,
      },
    });

    // Determine accepted formats
    const formatMap: Record<string, string[]> = {
      import_json: ['application/json'],
      import_pdf: ['application/pdf'],
      import_csv: ['text/csv', 'application/csv'],
    };

    return new Response(
      JSON.stringify({
        success: true,
        tool_run_id: toolRun.id,
        upload_instructions: {
          accepted_formats: formatMap[mode] || [],
          max_size_mb: 10,
          endpoint: '/functions/v1/upload-tool-run-artifact',
        },
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
