// ─── Cyber Serenity — Demo Mode Data ────────────────────────────────────────
// These fixtures simulate a realistic audit result for prospect demonstrations.
// All data is entirely fictitious and clearly labelled as demo content.

export const DEMO_TOOL_RUN_ID = 'demo-00000000-0000-0000-0000-000000000001';

export interface DemoFinding {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  asset: string;
  evidence: string;
  remediation: string;
  finding_type: string;
  status: 'open' | 'in_progress' | 'resolved';
}

export interface DemoAsset {
  name: string;
  type: string;
  identifier: string;
  risk_level: 'critical' | 'high' | 'medium' | 'low';
}

export interface DemoExecutiveReport {
  summary: string;
  risk_level: 'critical' | 'high' | 'medium' | 'low' | 'info';
  business_impact: string;
  top_priorities: string[];
  recommendations: string[];
}

export interface DemoTechnicalReport {
  summary: string;
  findings: DemoFinding[];
}

// ── Assets ───────────────────────────────────────────────────────────────────
export const DEMO_ASSETS: DemoAsset[] = [
  {
    name: 'Portail Web Principal',
    type: 'web_application',
    identifier: 'https://app.acme-corp.fr',
    risk_level: 'critical',
  },
  {
    name: 'API Gateway Production',
    type: 'api',
    identifier: 'api.acme-corp.fr',
    risk_level: 'high',
  },
  {
    name: 'Serveur Mail Exchange',
    type: 'mail_server',
    identifier: 'mail.acme-corp.fr',
    risk_level: 'medium',
  },
  {
    name: 'Infrastructure Cloud AWS',
    type: 'cloud',
    identifier: 'aws-eu-west-1.acme-corp',
    risk_level: 'high',
  },
  {
    name: 'VPN Collaborateurs',
    type: 'network',
    identifier: '185.42.x.x/24',
    risk_level: 'medium',
  },
];

// ── Findings ─────────────────────────────────────────────────────────────────
export const DEMO_FINDINGS: DemoFinding[] = [
  {
    id: 'demo-f1',
    title: 'Injection SQL non authentifiée sur /api/search',
    severity: 'critical',
    asset: 'API Gateway Production — api.acme-corp.fr',
    evidence:
      "Paramètre `q` non sanitisé : payload `' OR 1=1--` retourne 2 847 enregistrements clients. Reproductible en boîte noire via curl. Timestamp : 2024-11-03T14:22:11Z.",
    remediation:
      "Utiliser des requêtes paramétrées (PreparedStatement). Déployer un WAF règle SQLi. Auditer l'ensemble des endpoints d'entrée. Délai cible : 48 h.",
    finding_type: 'injection',
    status: 'open',
  },
  {
    id: 'demo-f2',
    title: 'Certificat TLS expiré — exposition données en transit',
    severity: 'critical',
    asset: 'Portail Web Principal — app.acme-corp.fr',
    evidence:
      "Certificat Let's Encrypt expiré depuis 12 jours (exp. 2024-10-22). Les navigateurs modernes affichent une alerte de sécurité. Connexions non chiffrées possibles sur les clients qui ignorent l'alerte.",
    remediation:
      "Renouveler le certificat immédiatement via certbot renew. Activer le renouvellement automatique (cron ou systemd timer). Vérifier la chaîne de confiance complète.",
    finding_type: 'configuration',
    status: 'open',
  },
  {
    id: 'demo-f3',
    title: 'Credential stuffing actif — 3 420 tentatives en 24h',
    severity: 'high',
    asset: 'Portail Web Principal — app.acme-corp.fr',
    evidence:
      "Analyse des logs Nginx : 3 420 requêtes POST /auth/login issues de 87 IPs distinctes en 24h. Taux d'échec 99,3%. 4 comptes compromis identifiés par corrélation avec HIBP.",
    remediation:
      "Implémenter rate-limiting sur /auth/login (max 5 req/min/IP). Activer MFA obligatoire. Forcer le reset des 4 comptes compromis. Intégrer un service de breach detection.",
    finding_type: 'authentication',
    status: 'in_progress',
  },
  {
    id: 'demo-f4',
    title: 'Headers de sécurité HTTP absents (CSP, HSTS, X-Frame)',
    severity: 'high',
    asset: 'Portail Web Principal — app.acme-corp.fr',
    evidence:
      "Absence de Content-Security-Policy, Strict-Transport-Security, X-Frame-Options et X-Content-Type-Options. Exposition aux attaques XSS, clickjacking et MIME sniffing. Scanné avec securityheaders.com : grade F.",
    remediation:
      "Configurer les headers via middleware Express/Nginx. Utiliser helmet.js (Node) ou équivalent. Score cible : A+. Délai : 1 semaine.",
    finding_type: 'configuration',
    status: 'open',
  },
  {
    id: 'demo-f5',
    title: 'Clés AWS IAM avec accès AdministratorAccess exposées',
    severity: 'critical',
    asset: 'Infrastructure Cloud AWS',
    evidence:
      "Clés AWS (AKIAXXXXXXXXXXXXXXXX) détectées dans le dépôt Git public github.com/acme-corp/infra-scripts (commit 3f7a2d1, 2024-09-18). AWS CloudTrail confirme 2 appels EC2 RunInstances suspects depuis ces clés.",
    remediation:
      "Révoquer les clés immédiatement dans AWS IAM. Auditer CloudTrail pour les 30 derniers jours. Activer AWS GuardDuty. Utiliser AWS Secrets Manager pour toutes les credentials. Former les équipes dev.",
    finding_type: 'secrets_exposure',
    status: 'open',
  },
  {
    id: 'demo-f6',
    title: 'SPF/DKIM/DMARC non configurés — usurpation email possible',
    severity: 'medium',
    asset: 'Serveur Mail Exchange — mail.acme-corp.fr',
    evidence:
      "Aucun enregistrement DMARC sur acme-corp.fr. SPF permissif (+all). DKIM absent. Test de spoofing réussi : email envoyé depuis IP externe avec From: contact@acme-corp.fr livré sans avertissement.",
    remediation:
      "Configurer SPF strict (-all). Générer et publier les clés DKIM. Déployer DMARC avec policy=reject. Surveiller les rapports DMARC agrégés. Délai : 2 semaines.",
    finding_type: 'email_security',
    status: 'open',
  },
  {
    id: 'demo-f7',
    title: 'Dépendances npm critiques (log4j pattern) — 14 CVE actives',
    severity: 'high',
    asset: 'Portail Web Principal — app.acme-corp.fr',
    evidence:
      "npm audit révèle 14 vulnérabilités dont 3 critiques (CVE-2024-21538, CVE-2023-45857, CVE-2024-4067). Packages affectés : axios@0.21.1, lodash@4.17.20, follow-redirects@1.14.9.",
    remediation:
      "Exécuter npm audit fix --force. Mettre à jour axios ≥1.7.0, lodash ≥4.17.21. Intégrer Dependabot ou Snyk dans la CI/CD. Politique de mise à jour mensuelle des dépendances.",
    finding_type: 'dependency',
    status: 'open',
  },
  {
    id: 'demo-f8',
    title: 'Port RDP 3389 exposé publiquement sans MFA',
    severity: 'medium',
    asset: 'Infrastructure Cloud AWS',
    evidence:
      "Scan Nmap confirme port 3389/tcp ouvert sur 3 instances EC2 (i-0a1b2c3d, i-0e5f6g7h, i-0i9j0k1l). Security Group trop permissif (0.0.0.0/0). Aucun MFA configuré sur les comptes Windows.",
    remediation:
      "Restreindre le Security Group aux IPs de confiance uniquement. Migrer vers AWS Systems Manager Session Manager (sans port ouvert). Activer Windows Hello for Business.",
    finding_type: 'network_exposure',
    status: 'in_progress',
  },
  {
    id: 'demo-f9',
    title: 'Politique de mots de passe insuffisante (min. 6 caractères)',
    severity: 'low',
    asset: 'Portail Web Principal — app.acme-corp.fr',
    evidence:
      "La politique actuelle autorise des mots de passe de 6 caractères sans complexité requise. 23% des comptes utilisent des mots de passe inférieurs à 8 caractères selon l'analyse de la base hachée (bcrypt).",
    remediation:
      "Imposer minimum 12 caractères avec complexité (majuscule, chiffre, symbole). Intégrer HaveIBeenPwned API pour bloquer les mots de passe compromis. Migration progressive avec notification utilisateurs.",
    finding_type: 'authentication',
    status: 'open',
  },
];

// ── Global Summary ────────────────────────────────────────────────────────────
export const DEMO_SUMMARY = {
  total_findings: 9,
  critical: 3,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
  assets_scanned: 5,
  scan_duration_minutes: 47,
  scan_date: '2024-11-03',
  organization: 'ACME Corp SA',
  risk_score: 28,
};

// ── Executive Report (DG / PDG) ───────────────────────────────────────────────
export const DEMO_EXECUTIVE_REPORT: DemoExecutiveReport = {
  risk_level: 'critical',
  summary:
    "L'audit de sécurité réalisé le 3 novembre 2024 sur les 5 périmètres d'ACME Corp SA révèle un niveau de risque CRITIQUE nécessitant une action immédiate de la Direction. Trois vulnérabilités de niveau critique ont été identifiées, dont une exposition de clés d'accès cloud sur un dépôt public, potentiellement exploitée. Le système d'information présente des lacunes fondamentales dans sa posture de sécurité qui exposent l'entreprise à des risques de violation de données, de sanctions réglementaires et d'atteinte à la réputation.",
  business_impact:
    "Les vulnérabilités identifiées exposent ACME Corp à plusieurs risques métier immédiats : (1) violation RGPD potentielle avec amende jusqu'à 4% du CA annuel (CNIL) suite à la possible compromission de données clients via l'injection SQL ; (2) continuité d'activité menacée par la compromission partielle de l'infrastructure AWS ; (3) atteinte à la réputation client via les tentatives de credential stuffing en cours ; (4) risque de conformité NIS2 avec obligation de notification sous 24h en cas d'incident avéré. L'exposition estimée dépasse 2,3M€ en cas de matérialisation cumulée des risques critiques.",
  top_priorities: [
    "URGENT — 48h : Révoquer les clés AWS compromises et auditer CloudTrail pour détecter toute activité malveillante",
    "URGENT — 48h : Patcher la vulnérabilité d'injection SQL sur /api/search (risque violation RGPD)",
    "URGENT — 48h : Renouveler le certificat TLS expiré sur app.acme-corp.fr",
    "7 jours : Déployer un MFA obligatoire et bloquer les IPs malveillantes (credential stuffing actif)",
    "14 jours : Corriger les 14 dépendances vulnérables et les headers HTTP manquants",
  ],
  recommendations: [
    "Nommer un RSSI (ou externaliser la fonction) pour piloter le plan de remédiation et assurer le reporting Direction",
    "Mettre en place un programme de revue mensuelle des vulnérabilités et une politique de patch management",
    "Déployer un SOC managé ou des outils de détection (AWS GuardDuty, SIEM) pour monitoring temps réel",
    "Former les équipes développement aux bonnes pratiques OWASP Top 10 et Secret Management",
    "Préparer le dossier de conformité NIS2 : cartographie des actifs, plan de réponse aux incidents, exercices de crise",
    "Souscrire à une cyber-assurance adaptée au profil de risque actuel",
  ],
};

// ── Technical Report (DSI) ────────────────────────────────────────────────────
export const DEMO_TECHNICAL_REPORT: DemoTechnicalReport = {
  summary:
    "Audit de sécurité externe et interne réalisé du 03/11/2024 au 03/11/2024 sur 5 périmètres d'ACME Corp SA. Méthodologie : OWASP Testing Guide v4.2, reconnaissance passive (OSINT), scan de ports (Nmap 7.94), analyse de vulnérabilités (Nuclei 3.2.1), revue de configuration cloud (AWS CLI, Prowler). Total : 9 findings identifiés dont 3 critiques, 3 élevés, 2 moyens, 1 faible. 2 findings en cours de correction active au moment du rapport.",
  findings: DEMO_FINDINGS,
};
