# SEQUENCE_47s — Securit-E Remediation Cycle

> La séquence complète de détection → remédiation → preuve en 47 secondes exactes.

## Vue d'ensemble

```
T+0s ────── T+12s ─────── T+23s ──────── T+35s ───────── T+47s
  │             │              │               │               │
Scout        Analyst        Go/No-Go        Executor        Vault
Détecte     Prédit 87%     1 clic DSI     Répare auto     Prouve NIS2
```

## Description détaillée

### T+0s — Agent Scout (OSINT/EASM)

**Déclencheur :** Scan EASM continu (toutes les 4h en Pro, toutes les 1h en Enterprise)

```
Scout EASM scan → host: api.client.fr
  → Port 8443 open (unexpected)
  → CVE-2025-1337 match (CVSS 9.1)
  → Signal créé: { severity: CRITICAL, confidence: 0.94 }
  → Evidence Vault pre-proof: sha3:a1b2c3...
```

**API calls :**
- Shodan API / ZoomEye / Censys pour EASM
- NVD API `GET /cves/2.0?cveId=CVE-2025-1337`
- `POST /functions/v1/ingest-signals`

---

### T+12s — Agent Analyst (Predictive Causality)

**Entrée :** Signal CVE-2025-1337 + contexte infrastructure

```
Analyst correlates:
  - Port 8443 → service: nginx 1.24.0 (vulnerable)
  - CVE-2025-1337 → RCE via HTTP/2 header overflow
  - Asset: api.client.fr → linked to auth service
  - MITRE ATT&CK: T1190 (Exploit Public-Facing Application)
  
Attack chain predicted:
  Port 8443 exposed → RCE → Privilege escalation → Domain Admin
  Probability: 87% within 72h
  
Remediation plan generated:
  [1] URGENT: Close port 8443 (skill: fix_port)
  [2] PATCH: nginx → 1.26.1 (skill: patch_vuln, method: apt)
  [3] MONITOR: Enable WAF rule for CVE-2025-1337
```

**AI model :** `google/gemini-2.5-pro` via Lovable AI

---

### T+23s — RSSI IA + DSI Go/No-Go

**Mode Auto (fully autonomous) :**
```
RSSI IA → confidence 94% + CVSS 9.1 → AUTO APPROVE
→ No human intervention required
→ Evidence: { decision: "auto_approved", confidence: 0.94, rule: "cvss >= 9.0" }
```

**Mode DSI oversight :**
```
DSI reçoit notification:
  📱 Slack: "[SECURIT-E] Action requise: fermer port 8443"
  📧 Email: brief RSSI IA avec plan de remédiation
  🖥 Dashboard: Go/No-Go button visible
  
DSI clique "GO →" → approved in 1 click (T+23s)
```

---

### T+35s — Agent Executor + Edge Agent (Self-healing)

**Dispatch vers Edge Agent (mTLS + WireGuard) :**

```
POST https://edge-agent.client-infra:8443/api/v1/skill
Headers:
  Authorization: Bearer <CRYSTALS-Dilithium3-signed-JWT>
  X-Agent-ID: executor-agent-001
  X-Dilithium-Signature: <dilithium3_hex_signature>
Body:
  {
    "skill": "fix_port",
    "payload": {
      "host": "api.client.fr",
      "port": 8443,
      "protocol": "tcp",
      "cloud_provider": "aws",
      "cloud_resource_id": "sg-0a1b2c3d"
    },
    "agent_id": "executor-001",
    "timestamp": 1710338435000
  }
```

**Edge Agent execution (T+35s) :**
```
securit-e-agent: fix_port — blocking 8443/tcp on api.client.fr
→ AWS: ec2:RevokeSecurityGroupIngress(GroupId=sg-0a1b2c3d, port=8443)
→ Pre-state saved for rollback (TTL: 4h)
→ Port 8443 confirmed CLOSED
→ SkillResponse: { success: true, proof_hash: "zksnark:..." }
```

---

### T+42s — Agent Verifier (QA)

```
Verifier validates:
  → Port scan confirmation: 8443 = CLOSED ✓
  → Patch applied: nginx 1.26.1 installed ✓  
  → No service disruption detected ✓
  → All pre-conditions met for vault proof ✓
```

---

### T+47s — Evidence Vault (Post-Quantum Proof)

**Proof generation :**
```
Vault signs proof pack #2841:
  payload: {
    action: "fix_port",
    host: "api.client.fr", 
    port: 8443,
    pre_state_hash: "sha3:a1b2c3...",
    post_state_hash: "sha3:d4e5f6...",
    verifier_ok: true,
    timestamp: "2026-03-13T14:22:47Z"
  }
  algorithm: CRYSTALS-Dilithium3 + zk-SNARK Groth16
  entry_hash: "0x7a4f...b2c1"
  chain_seq: 2841
  prev_hash: "0x3d9e...a7f2"
```

**NIS2 compliance output :**
```
Proof Pack PK-2841:
  ✓ Action documented
  ✓ Chain of custody verified
  ✓ Cryptographic integrity: CRYSTALS-Dilithium3
  ✓ Non-repudiable
  ✓ NIS2 Art. 21 compliant
  ✓ DORA compliant
  ✓ Exportable as PDF + JSON
```

**Total elapsed: 47 seconds. Zero human intervention required.**

---

## Rollback (si nécessaire)

```
POST /api/v1/rollback
  { action_id: "RE-0841", action_type: "fix_port", target: "api.client.fr" }

→ Edge Agent: restore AWS SG rule (from saved pre-state)
→ Port 8443 re-opened
→ Rollback evidence logged in Vault
→ DSI notified: "Rollback executed — investigation required"
```

Rollback timeout: **4 heures** (configurable)

---

## Métriques de performance

| Métrique | Valeur |
|----------|--------|
| Temps total | 47s |
| Scout → Signal | < 5s |
| Analyst → Plan | < 15s |
| Executor → Fix | < 25s |
| Vault → Proof | < 8s |
| Disponibilité | 99.9% SLA |
| Auto-remediations/h | 5 max (configurable) |
| Agents simultanés | 6 par tenant |
