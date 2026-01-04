-- Tools Catalog table
CREATE TABLE public.tools_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  official_site_url TEXT NOT NULL,
  repo_url TEXT NOT NULL,
  docs_url TEXT NOT NULL,
  docker_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tool Presets table
CREATE TABLE public.tool_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_id UUID NOT NULL REFERENCES public.tools_catalog(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('import_json', 'import_pdf', 'import_csv', 'external_runner_disabled', 'api_connector_disabled')),
  requires_authorization BOOLEAN NOT NULL DEFAULT true,
  default_params JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tool Runs table
CREATE TABLE public.tool_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  authorization_id UUID NOT NULL REFERENCES public.authorizations(id),
  tool_id UUID NOT NULL REFERENCES public.tools_catalog(id),
  preset_id UUID REFERENCES public.tool_presets(id),
  mode TEXT NOT NULL CHECK (mode IN ('import_json', 'import_pdf', 'import_csv', 'external_runner_disabled', 'api_connector_disabled')),
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'awaiting_upload', 'processing', 'done', 'failed')),
  requested_by UUID NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  input_artifact_url TEXT,
  input_artifact_hash TEXT,
  normalized_output JSONB,
  summary JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tools_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_runs ENABLE ROW LEVEL SECURITY;

-- Tools Catalog RLS: Everyone authenticated can read
CREATE POLICY "Authenticated users can view tools catalog"
  ON public.tools_catalog FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Tool Presets RLS: Everyone authenticated can read
CREATE POLICY "Authenticated users can view tool presets"
  ON public.tool_presets FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Tool Runs RLS
CREATE POLICY "Org members can view tool runs"
  ON public.tool_runs FOR SELECT
  USING (public.has_org_access(auth.uid(), organization_id));

CREATE POLICY "Org members can create tool runs with valid authorization"
  ON public.tool_runs FOR INSERT
  WITH CHECK (
    public.has_org_access(auth.uid(), organization_id)
    AND requested_by = auth.uid()
    AND public.authorization_belongs_to_org(authorization_id, organization_id)
    AND public.is_authorization_valid(authorization_id)
  );

CREATE POLICY "Requesters and admins can update tool runs"
  ON public.tool_runs FOR UPDATE
  USING (
    public.has_org_access(auth.uid(), organization_id)
    AND (
      requested_by = auth.uid()
      OR public.has_role(auth.uid(), organization_id, 'admin')
    )
  );

-- Performance indexes
CREATE INDEX idx_tools_catalog_slug ON public.tools_catalog(slug);
CREATE INDEX idx_tools_catalog_category ON public.tools_catalog(category);
CREATE INDEX idx_tool_presets_tool_id ON public.tool_presets(tool_id);
CREATE INDEX idx_tool_runs_org_requested ON public.tool_runs(organization_id, requested_at DESC);
CREATE INDEX idx_tool_runs_org_tool ON public.tool_runs(organization_id, tool_id);
CREATE INDEX idx_tool_runs_status ON public.tool_runs(organization_id, status);

-- Trigger for updated_at on tools_catalog
CREATE TRIGGER update_tools_catalog_updated_at
  BEFORE UPDATE ON public.tools_catalog
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the tools catalog with official open source tools
INSERT INTO public.tools_catalog (slug, name, category, official_site_url, repo_url, docs_url, docker_url, status, tags) VALUES
  ('owasp-amass', 'OWASP Amass', 'osint', 'https://owasp.org/www-project-amass/', 'https://github.com/owasp-amass/amass', 'https://owasp.org/www-project-amass/', 'https://hub.docker.com/r/owaspamass/amass', 'active', ARRAY['subdomains', 'osint', 'recon']),
  ('subfinder', 'subfinder', 'osint', 'https://projectdiscovery.io/tools/subfinder', 'https://github.com/projectdiscovery/subfinder', 'https://projectdiscovery.io/docs/subfinder', 'https://hub.docker.com/r/projectdiscovery/subfinder', 'active', ARRAY['subdomains', 'osint']),
  ('assetfinder', 'assetfinder', 'osint', 'https://github.com/tomnomnom/assetfinder', 'https://github.com/tomnomnom/assetfinder', 'https://github.com/tomnomnom/assetfinder', NULL, 'active', ARRAY['subdomains', 'osint']),
  ('theharvester', 'theHarvester', 'osint', 'https://www.edge-security.com/theharvester.php', 'https://github.com/laramies/theHarvester', 'https://github.com/laramies/theHarvester', NULL, 'active', ARRAY['osint', 'emails', 'recon']),
  ('recon-ng', 'recon-ng', 'osint', 'https://www.kali.org/tools/recon-ng/', 'https://github.com/lanmaster53/recon-ng', 'https://www.kali.org/tools/recon-ng/', NULL, 'active', ARRAY['osint', 'framework']),
  ('spiderfoot', 'SpiderFoot', 'osint', 'https://www.spiderfoot.net/', 'https://github.com/smicallef/spiderfoot', 'https://www.spiderfoot.net/documentation/', NULL, 'active', ARRAY['osint', 'automation']),
  ('nmap', 'Nmap', 'network', 'https://nmap.org/', 'https://github.com/nmap/nmap', 'https://nmap.org/book/man.html', NULL, 'active', ARRAY['network', 'discovery']),
  ('masscan', 'Masscan', 'network', 'https://github.com/robertdavidgraham/masscan', 'https://github.com/robertdavidgraham/masscan', 'https://github.com/robertdavidgraham/masscan', NULL, 'active', ARRAY['network', 'discovery']),
  ('zmap', 'ZMap', 'network', 'https://zmap.io/', 'https://github.com/zmap/zmap', 'https://zmap.io/documentation/', NULL, 'active', ARRAY['network', 'measurement']),
  ('rustscan', 'RustScan', 'network', 'https://rustscan.github.io/', 'https://github.com/RustScan/RustScan', 'https://rustscan.github.io/', 'https://hub.docker.com/r/rustscan/rustscan', 'active', ARRAY['network', 'discovery']),
  ('naabu', 'Naabu', 'network', 'https://projectdiscovery.io/tools/naabu', 'https://github.com/projectdiscovery/naabu', 'https://projectdiscovery.io/docs/naabu', 'https://hub.docker.com/r/projectdiscovery/naabu', 'active', ARRAY['ports', 'discovery']),
  ('nikto', 'Nikto', 'web', 'https://cirt.net/Nikto2', 'https://github.com/sullo/nikto', 'https://cirt.net/Nikto2', NULL, 'active', ARRAY['web', 'scanner']),
  ('owasp-zap', 'OWASP ZAP', 'web', 'https://www.zaproxy.org/', 'https://github.com/zaproxy/zaproxy', 'https://www.zaproxy.org/docs/', 'https://hub.docker.com/r/owasp/zap2docker-stable', 'active', ARRAY['web', 'dast']),
  ('nuclei', 'Nuclei', 'vuln', 'https://nuclei.projectdiscovery.io/', 'https://github.com/projectdiscovery/nuclei', 'https://nuclei.projectdiscovery.io/', 'https://hub.docker.com/r/projectdiscovery/nuclei', 'active', ARRAY['vuln', 'templates']),
  ('openvas', 'OpenVAS (Greenbone)', 'vuln', 'https://www.greenbone.net/en/product/openvas/', 'https://github.com/greenbone/openvas-scanner', 'https://docs.greenbone.net/', 'https://hub.docker.com/r/greenbone/vulnerability-test-feed', 'active', ARRAY['vuln', 'scanner']),
  ('gitleaks', 'Gitleaks', 'secrets', 'https://gitleaks.io/', 'https://github.com/gitleaks/gitleaks', 'https://gitleaks.io/', 'https://hub.docker.com/r/gitleaks/gitleaks', 'active', ARRAY['secrets', 'git']),
  ('trufflehog', 'TruffleHog', 'secrets', 'https://trufflesecurity.com/', 'https://github.com/trufflesecurity/trufflehog', 'https://trufflesecurity.com/docs/', 'https://hub.docker.com/r/trufflesecurity/trufflehog', 'active', ARRAY['secrets', 'git']),
  ('semgrep', 'Semgrep', 'sast', 'https://semgrep.dev/', 'https://github.com/semgrep/semgrep', 'https://semgrep.dev/docs/', 'https://hub.docker.com/r/returntocorp/semgrep', 'active', ARRAY['sast', 'code']),
  ('bandit', 'Bandit', 'sast', 'https://bandit.readthedocs.io/en/latest/', 'https://github.com/PyCQA/bandit', 'https://bandit.readthedocs.io/en/latest/', NULL, 'active', ARRAY['python', 'sast']),
  ('dependency-check', 'OWASP Dependency-Check', 'sca', 'https://owasp.org/www-project-dependency-check/', 'https://github.com/jeremylong/DependencyCheck', 'https://jeremylong.github.io/DependencyCheck/', 'https://hub.docker.com/r/owasp/dependency-check', 'active', ARRAY['sca', 'dependencies']),
  ('trivy', 'Trivy', 'sca', 'https://trivy.dev/', 'https://github.com/aquasecurity/trivy', 'https://aquasecurity.github.io/trivy/', 'https://hub.docker.com/r/aquasec/trivy', 'active', ARRAY['containers', 'sca']),
  ('osv-scanner', 'OSV-Scanner', 'sca', 'https://osv.dev/', 'https://github.com/google/osv-scanner', 'https://osv.dev/docs/', NULL, 'active', ARRAY['sca', 'oss']),
  ('tfsec', 'tfsec', 'iac', 'https://aquasecurity.github.io/tfsec/', 'https://github.com/aquasecurity/tfsec', 'https://aquasecurity.github.io/tfsec/', 'https://hub.docker.com/r/aquasec/tfsec', 'active', ARRAY['iac', 'terraform']),
  ('terrascan', 'Terrascan (archived)', 'iac', 'https://runterrascan.io/', 'https://github.com/tenable/terrascan', 'https://runterrascan.io/docs/', 'https://hub.docker.com/r/tenable/terrascan', 'archived', ARRAY['iac', 'archived']),
  ('checkov', 'Checkov', 'iac', 'https://www.checkov.io/', 'https://github.com/bridgecrewio/checkov', 'https://www.checkov.io/', 'https://hub.docker.com/r/bridgecrew/checkov', 'active', ARRAY['iac', 'policy']);

-- Create presets for each tool
INSERT INTO public.tool_presets (tool_id, name, mode, requires_authorization, default_params)
SELECT 
  id,
  'Import JSON',
  'import_json',
  true,
  '{"format": "json", "description": "Import JSON results from external scan"}'::jsonb
FROM public.tools_catalog;

INSERT INTO public.tool_presets (tool_id, name, mode, requires_authorization, default_params)
SELECT 
  id,
  'Import PDF',
  'import_pdf',
  true,
  '{"format": "pdf", "description": "Import PDF report from external scan"}'::jsonb
FROM public.tools_catalog;

INSERT INTO public.tool_presets (tool_id, name, mode, requires_authorization, default_params)
SELECT 
  id,
  'External Runner (disabled)',
  'external_runner_disabled',
  true,
  '{"disabled": true, "description": "External runner not available in V1"}'::jsonb
FROM public.tools_catalog;