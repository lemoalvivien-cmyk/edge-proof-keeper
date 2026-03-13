FROM golang:1.22-alpine AS builder

LABEL maintainer="securit-e.com"
LABEL version="2026.1.0"
LABEL description="Securit-E Edge Agent — Post-Quantum Digital Immune System"

# Build dependencies
RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /build

# Copy source
COPY sentinel-immune-agent/cmd/agent/main.go ./cmd/agent/main.go

# Init module (production: use real go.mod)
RUN go mod init securit-e-agent 2>/dev/null || true

# Build — ultra-compact binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w -X main.AgentVersion=2026.1.0" \
    -o /dist/securit-e-agent ./cmd/agent/

# ── Final image ──────────────────────────────────────────────────────────────
FROM scratch

LABEL org.opencontainers.image.title="securit-e-edge-agent"
LABEL org.opencontainers.image.version="2026.1.0"
LABEL org.opencontainers.image.vendor="Securit-E — France Souveraine"

# Copy binary + certs
COPY --from=builder /dist/securit-e-agent /securit-e-agent
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# Non-root user
USER 65534:65534

# API port (mTLS)
EXPOSE 8443

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["/securit-e-agent", "--health"]

ENTRYPOINT ["/securit-e-agent"]
