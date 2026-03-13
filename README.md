# SENTINEL IMMUNE — Digital Immune System

> **"Votre système immunitaire cyber autonome. Détecte · Prédit · Répare seul · Prouve post-quantique. 20 ans d'avance. Zéro équipe cyber."**

[![Version](https://img.shields.io/badge/version-2026.1.0-00ff9d?style=for-the-badge&logo=shield)](https://sentinel-immune.fr)
[![France Souveraine](https://img.shields.io/badge/France-Souveraine_🇫🇷-003189?style=for-the-badge)](https://sentinel-immune.fr)
[![Post-Quantum](https://img.shields.io/badge/Post--Quantum-CRYSTALS--Dilithium3-8b5cf6?style=for-the-badge)](https://sentinel-immune.fr)
[![NIS2 Ready](https://img.shields.io/badge/NIS2-Compliant_2026-ef4444?style=for-the-badge)](https://sentinel-immune.fr)

---

## 🧬 Qu'est-ce que Sentinel Immune ?

**Sentinel Immune** est le premier **Digital Immune System** souverain français. Là où Tenable, Snyk et CrowdStrike détectent et alertent, Sentinel Immune **détecte, prédit, répare seul et prouve cryptographiquement** — en **47 secondes** de bout en bout.

### Le cycle de 47 secondes

```
T+0s    Scout détecte un port 8443 exposé (EASM scan)
T+12s   Analyst corrèle avec CVE-2025-1337, génère plan de remédiation
T+23s   DSI valide en 1 clic (Go/No-Go) OU mode fully autonomous
T+35s   Executor ferme le port via nftables/AWS SG (Edge Agent mTLS)
T+47s   Vault signe la preuve zk-SNARK (CRYSTALS-Dilithium3) → NIS2 ✓
```

---

## 🏗 Architecture

### Diagramme principal

```mermaid
graph TD
    subgraph "Sources externes"
        S1[EASM / OSINT]
        S2[CVE / NVD API]
        S3[Swarm Intel Feed]
        S4[SIEM / CSPM]
    end

    subgraph "Sentinel Immune — SaaS FR 🇫🇷"
        direction TB
        SCOUT["🔍 Agent Scout<br/>EASM · OSINT · CTIL"]
        ANALYST["🧠 Agent Analyst<br/>Predictive Causality<br/>90j horizon"]
        GONOGO["⚖️ RSSI IA<br/>Go/No-Go Arbitrage<br/>1-clic DSI"]
        EXECUTOR["⚡ Agent Executor<br/>Self-healing < 4h<br/>6 Skills OpenClaw"]
        VERIFIER["✅ Agent Verifier<br/>QA + Audit trail"]
        VAULT["🔐 Evidence Vault<br/>zk-SNARK · Dilithium3<br/>Post-quantum proof"]
        SWARM["🌊 Swarm Intelligence<br/>500+ tenants<br/>Kyber-1024 encrypted"]
    end

    subgraph "Edge Agent Sidecar — Go <50MB"
        EA["sentinel-immune-agent<br/>WireGuard + mTLS<br/>6 endpoints REST"]
        SK1["fix_port"]
        SK2["rotate_creds"]
        SK3["close_domain"]
        SK4["patch_vuln"]
        SK5["notify_rollback"]
        SK6["swarm_collaborate"]
    end

    subgraph "Infrastructure client"
        INF1["AWS / GCP / Azure"]
        INF2["On-prem / Bare metal"]
        INF3["K8s / Docker"]
    end

    S1 --> SCOUT
    S2 --> SCOUT
    S3 --> SWARM
    S4 --> SCOUT

    SCOUT --> ANALYST
    ANALYST --> GONOGO
    GONOGO --> EXECUTOR
    EXECUTOR --> VERIFIER
    VERIFIER --> VAULT

    EXECUTOR --> EA
    EA --> SK1 & SK2 & SK3 & SK4 & SK5 & SK6
    SK1 & SK2 & SK3 & SK4 --> INF1 & INF2 & INF3

    SWARM -.->|"anonymized intel"| ANALYST
    VAULT -.->|"NIS2 proof pack"| GONOGO

    style VAULT fill:#0a0e1a,color:#00ff9d,stroke:#00ff9d
    style SWARM fill:#0a0e1a,color:#00cfff,stroke:#00cfff
    style EXECUTOR fill:#0a0e1a,color:#8b5cf6,stroke:#8b5cf6
```

### Séquence de remédiation 47s

```mermaid
sequenceDiagram
    autonumber
    participant SC as 🔍 Scout
    participant AN as 🧠 Analyst
    participant DS as 👤 DSI (optional)
    participant EX as ⚡ Executor
    participant EA as 🖥 Edge Agent
    participant VL as 🔐 Vault

    SC->>SC: EASM scan — port 8443 detected (T+0s)
    SC->>AN: Signal: { host, port, cve_id, severity:CRITICAL }
    AN->>AN: Predictive causality — P(exploit)=87% (T+12s)
    AN->>DS: Go/No-Go plan generated
    DS-->>EX: Approved in 1 click (T+23s) [or autonomous]
    EX->>EA: POST /api/v1/skill { skill: fix_port, ... } (mTLS + WireGuard)
    EA->>EA: nftables / AWS SG — port closed (T+35s)
    EA->>EX: SkillResponse { success: true, proof_hash }
    EX->>VL: Log evidence (T+42s)
    VL->>VL: zk-SNARK Groth16 + CRYSTALS-Dilithium3 sign
    VL-->>DS: Proof pack #2841 — NIS2 compliant ✓ (T+47s)
```

### Stack technique

```mermaid
graph LR
    subgraph "Frontend — React 18 + Vite"
        UI["Landing Page<br/>Tunnel de vente"]
        DASH["God Mode Dashboard<br/>5 onglets live"]
    end

    subgraph "Backend — Supabase (Cloud FR)"
        DB[("PostgreSQL<br/>RLS + Evidence Chain")]
        EF["Edge Functions<br/>Deno runtime"]
        RT["Realtime<br/>Agent status"]
        ST["Storage<br/>Proof packs"]
    end

    subgraph "AI Layer — Lovable AI"
        G25["Gemini 2.5 Pro<br/>Analyst + Predictive"]
        GPT5["GPT-5<br/>RSSI IA briefs"]
    end

    subgraph "Edge Agent — Go 1.22"
        AG["sentinel-immune-agent<br/>< 50MB binary"]
        WG["WireGuard<br/>Tunnel"]
        PQ["CRYSTALS-Dilithium3<br/>Post-quantum"]
    end

    UI --> EF
    DASH --> RT
    EF --> DB
    EF --> G25 & GPT5
    EF --> AG
    AG --> WG --> PQ
```

---

## 💰 Pricing — Machine de Guerre Commerciale

| Plan | Prix | Capacités | Cible |
|------|------|-----------|-------|
| **Starter** | 490 €/an | Détection OSINT seule · Scout Agent · Alertes | ETI 50-200 pers. |
| **Pro** ⭐ | 6 900 €/an | 6 Agents IA · Self-healing 4h · OSINT/EASM · Evidence Vault | ETI/Grands comptes |
| **Enterprise** | 29 900 €/an | Swarm Mode · Fully autonomous · On-prem · Account Manager | CAC40 / OIV |

**ARR potentiel estimé :** 100 clients Pro = **690 000 €/an**

---

## 🚀 Installation rapide (Client)

### Option 1 — SaaS (recommandé)

```bash
# 1. Créer un compte sur sentinel-immune.fr
# 2. Télécharger l'Edge Agent sidecar

curl -L https://releases.sentinel-immune.fr/agent/latest/sentinel-agent-linux-amd64.tar.gz | tar xz
chmod +x sentinel-agent

# 3. Configurer et lancer
export SENTINEL_TENANT_ID="votre-tenant-id"
export SENTINEL_REGION="fr-paris"
./sentinel-agent
```

### Option 2 — Docker

```bash
docker run -d \
  --name sentinel-agent \
  -e SENTINEL_TENANT_ID=votre-tenant-id \
  -e SENTINEL_REGION=fr-paris \
  -v ./certs:/certs:ro \
  -p 8443:8443 \
  sentinel-immune/edge-agent:2026.1.0
```

### Option 3 — Kubernetes (Helm)

```bash
helm repo add sentinel-immune https://charts.sentinel-immune.fr
helm repo update

helm install sentinel-agent sentinel-immune/edge-agent \
  --namespace sentinel-system --create-namespace \
  --set sentinel.tenantId="votre-tenant-id" \
  --set sentinel.region="fr-paris" \
  --set tls.existingSecret="sentinel-mtls-certs"
```

---

## 🔬 Skills OpenClaw (6 skills)

| Skill | Description | API Production |
|-------|-------------|----------------|
| `fix_port` | Ferme un port exposé | AWS SG / nftables / GCP Firewall |
| `rotate_creds` | Rotation credentials | AWS IAM / Azure AD / GitHub / Vault |
| `close_domain` | Neutralise un domaine malveillant | Cloudflare API / Infoblox / pfSense |
| `patch_vuln` | Patch CVE automatique | Ansible AWX / apt / dnf / kubectl |
| `notify_rollback` | Alerte + rollback | Slack / Teams / PagerDuty / Resend |
| `swarm_collaborate` | Partage intel anonymisé | Kyber-1024 encrypted Swarm bus |

---

## 📅 Roadmap

### Semaine 1 — Premier client
- [ ] Publier sur sentinel-immune.fr (domaine custom)
- [ ] Beta tester avec 3 DSI ETI
- [ ] Premier contrat Pro 6 900€

### Q1 2026
- [ ] Fork OpenClaw privé + intégration complète
- [ ] Certification ANSSI / CSPN en cours
- [ ] Swarm live avec 10 premiers tenants
- [ ] Intégration Microsoft Sentinel / Splunk

### Q2 2026
- [ ] 50 clients Pro → 345k€ ARR
- [ ] Enterprise on-prem (air-gapped)
- [ ] SOC-as-a-Service add-on

---

## 🛡 Sécurité & Souveraineté

- **Hébergement :** Cloud FR souverain (Scaleway / OVH) — données en France 🇫🇷
- **Cryptographie post-quantique :** CRYSTALS-Dilithium3 (signatures) + Kyber-1024 (KEM)
- **Evidence Vault :** Chaîne SHA-256 immuable + zk-SNARK Groth16
- **Conformité :** NIS2 · RGPD · DORA · ISO 27001
- **Audit :** Chaque action prouvée cryptographiquement, non répudiable

---

## 📄 Licence

Propriétaire — © 2026 Sentinel Immune SAS. Tous droits réservés.

---

*Sentinel Immune — 20 ans d'avance sur Tenable, Snyk et CrowdStrike. 🦞🚀*
