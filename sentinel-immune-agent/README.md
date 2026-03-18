# Securit-E Edge Agent

> Sidecar Go ultra-léger <50Mo — WireGuard + mTLS
> 
> Pilote les 6 skills OpenClaw supervisés (fix_port, rotate_creds, close_domain, patch_vuln, notify_rollback, swarm_collaborate)

## Démarrage rapide

```bash
export SENTINEL_TENANT_ID=your-org-id
go build -o securit-e-agent ./cmd/agent
./securit-e-agent --config config.yaml
```

## Structure

```
sentinel-immune-agent/
├── cmd/agent/main.go              # Point d'entrée — WireGuard + mTLS + skill dispatch
├── internal/
│   ├── wireguard/tunnel.go        # Tunnel chiffré WireGuard
│   ├── mtls/client.go             # Client mTLS bidirectionnel
│   ├── skills/
│   │   ├── fix_port.go            # Fermer port réseau exposé
│   │   ├── rotate_creds.go        # Rotation credentials multi-service
│   │   ├── close_domain.go        # Neutraliser domaine malveillant
│   │   ├── patch_vuln.go          # Patcher CVE automatiquement
│   │   ├── notify_rollback.go     # Notifier + rollback en cas d'échec
│   │   └── swarm_collaborate.go   # Intelligence anonymisée inter-clients
│   ├── crypto/signing.go          # Signature SHA-256 des preuves d'exécution
│   └── vault/local_cache.go       # Cache local Evidence Vault
├── config.example.yaml
└── README.md
```

## Architecture

```mermaid
graph LR
    A[Securit-E Platform] -->|Skill invocation mTLS| B[Securit-E Edge Agent<br/>Go sidecar]
    B -->|WireGuard| C[fix_port]
    B -->|WireGuard| D[rotate_creds]
    B -->|WireGuard| E[patch_vuln]
    B -->|WireGuard| F[close_domain]
    B -->|WireGuard| G[notify_rollback]
    B -->|WireGuard| H[swarm_collaborate]
    C --> I[Evidence Vault]
    D --> I
    E --> I
    F --> I
    G --> I
    H --> I
    I -->|SHA-256 Merkle entry| J[Proof Pack]
    J -->|NIS2 export| K[Régulateur / Assureur / Juge]
```

## Cycle complet (47 secondes — mesuré en conditions de laboratoire)

> **Note de transparence** : Ce cycle est une démonstration sur périmètre contrôlé.
> En production, les délais dépendent de votre infrastructure et des validations humaines requises.

```mermaid
sequenceDiagram
    participant Executor as Executor Agent
    participant Edge as Edge Agent (Go)
    participant Skill as Skill Handler
    participant Verifier as Verifier Agent
    participant Vault as Evidence Vault

    Executor->>Edge: Skill invocation (mTLS authenticated)
    Edge->>Edge: JWT verification + tenant validation
    Edge->>Skill: Execute skill(input) — après Go/No-Go DSI
    Skill->>Vault: Pre-action intent hash (SHA-256)
    Skill->>Skill: Execute remediation
    Skill->>Vault: Post-action proof hash (SHA-256 Merkle)
    Skill->>Edge: SkillResult{success, proof_hash}
    Edge->>Executor: Execution confirmed
    Edge->>Verifier: Trigger verification
    Verifier->>Verifier: Infrastructure health check
    Verifier->>Vault: Seal proof chain entry
```

## Configuration (config.example.yaml)

```yaml
tenant_id: "your-org-uuid"
region: "fr-paris"

agent:
  public_key: "YOUR_WIREGUARD_PUBLIC_KEY"
  endpoint: "edge-agent.securit-e.com:51820"
  skills_enabled:
    - fix_port
    - rotate_creds
    - close_domain
    - patch_vuln
    - notify_rollback
    - swarm_collaborate

remediation:
  require_dsi_approval: true    # Toujours true en production — mode supervisé
  rollback_timeout_hours: 4
  max_auto_remediation: 5
```

## Build & Deploy

```bash
# Build binaire statique Linux
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
  -ldflags="-w -s" \
  -o securit-e-agent \
  ./cmd/agent

# Vérifier taille < 50Mo
ls -lh securit-e-agent

# Docker (production)
docker build -t securit-e/edge-agent:latest .
docker run -d \
  -e SENTINEL_TENANT_ID=your-org-id \
  -v /etc/sentinel/config.yaml:/app/config.yaml:ro \
  securit-e/edge-agent:latest
```

## Sécurité

- **WireGuard** : tunnel chiffré Curve25519 pour tout le trafic agent
- **mTLS** : authentification mutuelle TLS 1.3 entre agent et platform
- **SHA-256 Merkle Chain** : chaque skill call signe une entrée immuable dans l'Evidence Vault
- **Rollback automatique** si vérification échoue (timeout 4h)
- Validation Go/No-Go DSI requise pour toute action sensible en production

## Skills disponibles (mode supervisé)

| Skill | Agent | Description |
|-------|-------|-------------|
| `fix_port` | Executor | Ferme un port réseau exposé via firewall rules |
| `rotate_creds` | Executor | Rotation AWS IAM, GitHub tokens, passwords DB |
| `close_domain` | Executor | Sinkhole/block domaine typosquat ou C2 |
| `patch_vuln` | Executor | Apply OS/application patch pour CVE ciblé |
| `notify_rollback` | Verifier | Rollback + notification stakeholders sur échec |
| `swarm_collaborate` | Swarm | Partage anonymisé de TTP avec le réseau inter-clients |

---

*Securit-E Edge Agent — Souveraineté Numérique France 🇫🇷*
