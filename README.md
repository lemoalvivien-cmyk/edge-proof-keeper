# SECURIT-E — Plateforme de Gouvernance Cyber Assistée par IA

> **SECURIT-E — Centre de commandement cyber assisté par IA pour dirigeants et DSI exigeants.**
> **6 agents détectent, analysent et proposent des remédiations avec supervision humaine. Preuves SHA-256 Merkle Chain immuables. Souverain France.**

[![Version](https://img.shields.io/badge/version-2026.1.0-00ff9d?style=for-the-badge&logo=shield)](https://securit-e.com)
[![France Souveraine](https://img.shields.io/badge/France-Souveraine_🇫🇷-003189?style=for-the-badge)](https://securit-e.com)
[![Crypto](https://img.shields.io/badge/Crypto-SHA--256_Merkle_Chain-8b5cf6?style=for-the-badge)](https://securit-e.com)
[![NIS2 Ready](https://img.shields.io/badge/NIS2-Ready_2026-ef4444?style=for-the-badge)](https://securit-e.com)

---

## 🛡 Qu'est-ce que Securit-E ?

**Securit-E** est une **plateforme de gouvernance cyber assistée par IA** souveraine française. 6 agents IA collaborent pour détecter, analyser et orchestrer des remédiations supervisées — avec une preuve cryptographique SHA-256 Merkle Chain à chaque étape.

### Le cycle de 47 secondes (mesuré en conditions de laboratoire contrôlées)

```
T+0s    Scout détecte un port 8443 exposé (EASM scan)
T+12s   Analyst corrèle avec CVE-2025-1337, génère plan de remédiation
T+23s   DSI valide en 1 clic (Go/No-Go) — validation humaine requise
T+35s   Executor ferme le port via playbook supervisé (AWS SG / nftables)
T+47s   Vault signe la preuve SHA-256 Merkle Chain → NIS2 ✓
```

> **Note de transparence** : ce cycle est une démonstration de laboratoire sur périmètre contrôlé. En production, les délais réels dépendent de votre infrastructure, des validations humaines requises et de la complexité de l'incident.

---

## 🏗 Architecture

### Diagramme principal

```mermaid
graph TD
    subgraph "Sources externes"
        S1[EASM / OSINT]
        S2[CVE / NVD API]
        S3[Imports / Scans]
        S4[SIEM / CSPM]
    end

    subgraph "Securit-E — SaaS FR 🇫🇷"
        direction TB
        SCOUT["🔍 Agent Scout<br/>EASM · OSINT · CTIL"]
        ANALYST["🧠 Agent Analyst<br/>Analyse de risques<br/>Priorisation IA"]
        GONOGO["⚖️ RSSI IA<br/>Go/No-Go Arbitrage<br/>1-clic DSI — supervisé"]
        EXECUTOR["⚡ Agent Executor<br/>Remédiation supervisée<br/>6 Skills OpenClaw"]
        VERIFIER["✅ Agent Verifier<br/>QA + Audit trail"]
        VAULT["🔐 Evidence Vault<br/>SHA-256 Merkle Chain<br/>Immutable · NIS2"]
    end

    subgraph "Edge Agent Sidecar — Go <50MB"
        EA["securit-e-agent<br/>WireGuard + mTLS<br/>6 endpoints REST"]
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
    S3 --> SCOUT
    S4 --> SCOUT

    SCOUT --> ANALYST
    ANALYST --> GONOGO
    GONOGO --> EXECUTOR
    EXECUTOR --> VERIFIER
    VERIFIER --> VAULT

    EXECUTOR --> EA
    EA --> SK1 & SK2 & SK3 & SK4 & SK5 & SK6
    SK1 & SK2 & SK3 & SK4 --> INF1 & INF2 & INF3

    VAULT -.->|"NIS2 proof pack"| GONOGO

    style VAULT fill:#0a0e1a,color:#00ff9d,stroke:#00ff9d
    style EXECUTOR fill:#0a0e1a,color:#8b5cf6,stroke:#8b5cf6
```

### Séquence de remédiation supervisée

```mermaid
sequenceDiagram
    autonumber
    participant SC as 🔍 Scout
    participant AN as 🧠 Analyst
    participant DS as 👤 DSI (validation requise)
    participant EX as ⚡ Executor
    participant EA as 🖥 Edge Agent
    participant VL as 🔐 Vault

    SC->>SC: EASM scan — port 8443 detected (T+0s)
    SC->>AN: Signal: { host, port, cve_id, severity:CRITICAL }
    AN->>AN: Analyse de risque — priorisation (T+12s)
    AN->>DS: Plan remédiation généré — Go/No-Go requis
    DS-->>EX: Validé (T+23s) — supervision humaine
    EX->>EA: POST /api/v1/skill { skill: fix_port, ... } (mTLS)
    EA->>EA: Firewall / AWS SG — port closed (T+35s)
    EA->>EX: SkillResponse { success: true, proof_hash }
    EX->>VL: Log evidence (T+42s)
    VL->>VL: SHA-256 Merkle Chain entry sealed
    VL-->>DS: Proof pack — NIS2 compliant ✓ (T+47s)
```

### Stack technique

```mermaid
graph LR
    subgraph "Frontend — React 18 + Vite"
        UI["Landing Page<br/>Tunnel de vente"]
        DASH["Dashboard<br/>5 onglets live"]
    end

    subgraph "Backend — Lovable Cloud (FR)"
        DB[("PostgreSQL<br/>RLS + Evidence Chain")]
        EF["Edge Functions<br/>Deno runtime"]
        RT["Realtime<br/>Agent status"]
        ST["Storage<br/>Proof packs"]
    end

    subgraph "AI Layer — Lovable AI"
        G25["Gemini 2.5 Pro<br/>Analyst + Risk"]
        GPT5["GPT-5<br/>RSSI IA briefs"]
    end

    subgraph "Edge Agent — Go 1.22"
        AG["securit-e-agent<br/>< 50MB binary"]
        WG["WireGuard<br/>Tunnel"]
    end

    UI --> EF
    DASH --> RT
    EF --> DB
    EF --> G25 & GPT5
    EF --> AG
    AG --> WG
```

---

## 💰 Pricing

| Plan | Prix | Capacités | Cible |
|------|------|-----------|-------|
| **Sentinel** | 490 €/an | Détection OSINT · Scout Agent · Alertes · NIS2 docs | ETI 50-200 pers. |
| **Command** ⭐ | 6 900 €/an | 6 Agents IA supervisés · Remédiation assistée · OSINT/EASM · Evidence Vault SHA-256 | ETI/Grands comptes |
| **Sovereign** | 29 900 €/an | On-prem · Souveraineté totale · Account Manager | OIV / CAC40 |

---

## 🚀 Installation rapide (Client)

### Option 1 — SaaS (recommandé)

```bash
# 1. Créer un compte sur securit-e.com
# 2. Télécharger l'Edge Agent sidecar (disponible sur demande)

export SECURITE_TENANT_ID="votre-tenant-id"
export SECURITE_REGION="fr-paris"
./securit-e-agent
```

### Option 2 — Docker

```bash
docker run -d \
  --name securit-e-agent \
  -e SECURITE_TENANT_ID=votre-tenant-id \
  -e SECURITE_REGION=fr-paris \
  -v ./certs:/certs:ro \
  -p 8443:8443 \
  securit-e/edge-agent:2026.1.0
```

### Option 3 — Kubernetes (Helm)

```bash
helm repo add securit-e https://charts.securit-e.com
helm repo update

helm install securit-e-agent securit-e/edge-agent \
  --namespace securit-e-system --create-namespace \
  --set securite.tenantId="votre-tenant-id" \
  --set securite.region="fr-paris" \
  --set tls.existingSecret="securit-e-mtls-certs"
```

---

## 🔬 Skills OpenClaw (6 skills — orchestration supervisée)

| Skill | Description | Mode |
|-------|-------------|------|
| `fix_port` | Ferme un port exposé | Supervisé / Go-No-Go |
| `rotate_creds` | Rotation credentials | Supervisé / Go-No-Go |
| `close_domain` | Neutralise un domaine malveillant | Supervisé / Go-No-Go |
| `patch_vuln` | Patch CVE | Supervisé / Go-No-Go |
| `notify_rollback` | Alerte + rollback | Automatique |
| `swarm_collaborate` | Partage intel inter-clients | Anonymisé |

---

## 📅 Roadmap

### Q1 2026
- [ ] Certification ANSSI / CSPN — démarches en cours
- [ ] Intégration Microsoft Sentinel / Splunk
- [ ] SecNumCloud — objectif roadmap (non obtenu à ce jour)

### Q2 2026
- [ ] Enterprise on-prem (air-gapped)
- [ ] SOC-as-a-Service add-on

---

## 🛡 Sécurité & Souveraineté

- **Hébergement :** Cloud FR souverain — données en France 🇫🇷
- **Cryptographie :** SHA-256 Merkle Chain pour la chaîne de preuves (Evidence Vault)
- **Conformité :** NIS2 · RGPD · DORA · ISO 27001
- **Audit :** Chaque action prouvée par la chaîne SHA-256, non répudiable
- **SecNumCloud :** objectif roadmap Q2 2026 — certification non obtenue à ce jour

---

## 📄 Licence

Propriétaire — © 2026 Securit-E SAS. Tous droits réservés.

---

*Securit-E — Gouvernance cyber assistée par IA pour les dirigeants exigeants. 🛡️*
