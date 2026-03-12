
-- ─────────────────────────────────────────────────────────────────────────────
-- SEED IDEMPOTENT : tools_catalog — outil nuclei + subfinder
-- Garantit qu'un environnement neuf peut exécuter le pipeline réel de démo
-- sans 404 silencieux sur create-tool-run.
-- INSERT ON CONFLICT DO NOTHING → parfaitement idempotent
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.tools_catalog (slug, name, category, official_site_url, repo_url, docs_url, docker_url, status, tags)
VALUES
  (
    'nuclei',
    'Nuclei',
    'vuln',
    'https://nuclei.projectdiscovery.io',
    'https://github.com/projectdiscovery/nuclei',
    'https://docs.projectdiscovery.io/tools/nuclei',
    'docker.io/projectdiscovery/nuclei:latest',
    'active',
    ARRAY['vuln', 'template', 'cve', 'osint', 'pdteam', 'open-source']
  ),
  (
    'subfinder',
    'Subfinder',
    'osint',
    'https://github.com/projectdiscovery/subfinder',
    'https://github.com/projectdiscovery/subfinder',
    'https://docs.projectdiscovery.io/tools/subfinder',
    'docker.io/projectdiscovery/subfinder:latest',
    'active',
    ARRAY['osint', 'subdomain', 'enumeration', 'pdteam', 'open-source']
  )
ON CONFLICT (slug) DO NOTHING;
