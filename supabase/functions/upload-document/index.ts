import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function hashSHA256(data: ArrayBuffer): Promise<string> {
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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const internalEdgeToken = Deno.env.get('INTERNAL_EDGE_TOKEN')!;
    
    // Get user's auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client for elevated operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Create user client to verify auth
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const organizationId = formData.get('organization_id') as string;
    const title = formData.get('title') as string;
    const documentType = formData.get('document_type') as string;
    const framework = formData.get('framework') as string | null;
    const authorizationId = formData.get('authorization_id') as string | null;

    if (!file || !organizationId || !title || !documentType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: file, organization_id, title, document_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Only PDF, PNG, and JPG are allowed.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'File too large. Maximum size is 10MB.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has access to organization
    const { data: hasAccess } = await supabaseAdmin.rpc('has_org_access', {
      _user_id: user.id,
      _org_id: organizationId
    });

    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: 'Access denied to this organization' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If authorization_id is provided, verify it's valid
    if (authorizationId) {
      const { data: isValidAuth } = await supabaseAdmin.rpc('is_authorization_valid', {
        _auth_id: authorizationId
      });

      const { data: authBelongsToOrg } = await supabaseAdmin.rpc('authorization_belongs_to_org', {
        _auth_id: authorizationId,
        _org_id: organizationId
      });

      if (!isValidAuth || !authBelongsToOrg) {
        return new Response(
          JSON.stringify({ error: 'Invalid or unauthorized authorization' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Read file and compute hash
    const fileBuffer = await file.arrayBuffer();
    const fileHash = await hashSHA256(fileBuffer);

    // Generate unique filename
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const fileName = `${organizationId}/${timestamp}-${fileHash.substring(0, 8)}.${ext}`;

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create document record
    const { data: docRecord, error: insertError } = await supabaseAdmin
      .from('documents')
      .insert({
        organization_id: organizationId,
        created_by: user.id,
        title: title,
        document_type: documentType,
        file_url: uploadData.path,
        file_hash: fileHash,
        framework: framework || null,
        authorization_id: authorizationId || null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create document record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log to evidence using internal endpoint (consistent with other edge functions)
    await logEvidenceInternal(supabaseUrl, authHeader, internalEdgeToken, {
      organization_id: organizationId,
      action: 'document_uploaded',
      entity_type: 'document',
      entity_id: docRecord.id,
      artifact_hash: fileHash,
      details: {
        title: title,
        document_type: documentType,
        framework: framework,
        file_type: file.type,
        file_size: file.size
      }
    });

    console.log(`Document created: ${docRecord.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        document: docRecord
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
