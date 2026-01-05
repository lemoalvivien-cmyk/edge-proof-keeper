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

function hashIP(ip: string): string {
  // Truncate IP for privacy (keep first 2 octets for IPv4)
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }
  // For IPv6, keep first 4 blocks
  const ipv6Parts = ip.split(':');
  if (ipv6Parts.length > 4) {
    return `${ipv6Parts.slice(0, 4).join(':')}:xxxx:xxxx:xxxx:xxxx`;
  }
  return 'unknown';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
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
    const scope = formData.get('scope') as string;
    const consentCheckbox = formData.get('consent_checkbox') === 'true';
    const validUntil = formData.get('valid_until') as string | null;
    
    // New scope fields for V1 strict binding
    const scopeType = (formData.get('scope_type') as string) || 'domain';
    const scopeDomainsRaw = formData.get('scope_domains') as string | null;
    const scopeCidrsRaw = formData.get('scope_cidrs') as string | null;
    const scopeAssetsRaw = formData.get('scope_assets') as string | null;
    const consentTextVersion = (formData.get('consent_text_version') as string) || '1.0';
    const consentText = formData.get('consent_text') as string | null;

    if (!file || !organizationId || !scope) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: file, organization_id, scope' }),
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

    // Check if user is admin
    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id,
      _org_id: organizationId,
      _role: 'admin'
    });

    // Read file and compute hash
    const fileBuffer = await file.arrayBuffer();
    const fileHash = await hashSHA256(fileBuffer);

    // Generate unique filename with canonical path
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const fileName = `${organizationId}/authorizations/${timestamp}-${fileHash.substring(0, 8)}.${ext}`;

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('authorizations')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload file', details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get client IP and hash it for GDPR compliance
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';
    const hashedIP = hashIP(clientIP);

    // Compute consent text hash if provided
    let consentTextHash: string | null = null;
    if (consentText) {
      const encoder = new TextEncoder();
      const textBuffer = encoder.encode(consentText);
      const hashBuffer = await crypto.subtle.digest('SHA-256', textBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      consentTextHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Parse scope arrays
    const scopeDomains = scopeDomainsRaw ? scopeDomainsRaw.split(',').map(d => d.trim().toLowerCase()).filter(Boolean) : [];
    const scopeCidrs = scopeCidrsRaw ? scopeCidrsRaw.split(',').map(c => c.trim()).filter(Boolean) : [];
    const scopeAssets = scopeAssetsRaw ? scopeAssetsRaw.split(',').map(a => a.trim()).filter(Boolean) : [];

    // Extract domain from legacy scope format and add to scope_domains if not present
    const domainMatch = scope.match(/domain:([^;]+)/);
    if (domainMatch && !scopeDomains.includes(domainMatch[1].toLowerCase())) {
      scopeDomains.push(domainMatch[1].toLowerCase());
    }

    // Determine status: admin = auto-approved, others = pending
    const status = isAdmin ? 'approved' : 'pending';
    const approvedBy = isAdmin ? user.id : null;
    const approvedAt = isAdmin ? new Date().toISOString() : null;

    // Create authorization record with extended fields
    const { data: authRecord, error: insertError } = await supabaseAdmin
      .from('authorizations')
      .insert({
        organization_id: organizationId,
        created_by: user.id,
        document_url: uploadData.path,
        document_hash: fileHash,
        consent_checkbox: consentCheckbox,
        consent_ip_raw_deprecated: clientIP, // Keep raw for migration, deprecated
        consent_ip_hash: hashedIP,
        consent_timestamp: new Date().toISOString(),
        consent_text_version: consentTextVersion,
        consent_text_hash: consentTextHash,
        scope: scope,
        scope_type: scopeType,
        scope_domains: scopeDomains,
        scope_cidrs: scopeCidrs,
        scope_assets: scopeAssets,
        status: status,
        approved_by: approvedBy,
        approved_at: approvedAt,
        valid_from: new Date().toISOString(),
        valid_until: validUntil || null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create authorization record', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log to evidence
    await supabaseAdmin.from('evidence_log').insert({
      organization_id: organizationId,
      user_id: user.id,
      action: 'authorization_created',
      entity_type: 'authorization',
      entity_id: authRecord.id,
      artifact_hash: fileHash,
      ip_address: hashedIP,
      details: {
        scope: scope,
        status: status,
        file_type: file.type,
        file_size: file.size
      }
    });

    console.log(`Authorization created: ${authRecord.id} with status ${status}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        authorization: authRecord,
        status: status,
        message: status === 'approved' 
          ? 'Authorization approved automatically (admin)' 
          : 'Authorization pending admin approval'
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
