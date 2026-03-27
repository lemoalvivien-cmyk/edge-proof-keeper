import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard, Brain, Wrench, Network, Lock, Activity,
  AlertTriangle, CheckCircle2, Clock, TrendingUp, Eye, Cpu, ArrowRight, GitBranch
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

/* ── Dashboard Preview Tab ── */
function DashboardPreviewTab() {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {/* Score maturité */}
      <div className="md:col-span-1 p-5 rounded-xl glass-card border border-border space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">SCORE MATURITÉ</span>
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
        </div>
        <div className="text-center py-3">
          <div className="text-6xl font-bold font-mono text-gradient neon-text">87</div>
          <div className="text-xs text-muted-foreground mt-1">/ 100 — Niveau Avancé</div>
          <div className="mt-3 w-full bg-muted rounded-full h-1.5">
            <div className="h-full rounded-full w-[87%]" style={{ background: "linear-gradient(90deg, hsl(var(--neon-cyan)), hsl(var(--neon-blue)))" }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-secondary/40 text-center">
            <div className="font-bold text-destructive">3</div>
            <div className="text-muted-foreground">Critiques</div>
          </div>
          <div className="p-2 rounded-lg bg-secondary/40 text-center">
            <div className="font-bold text-success">41</div>
            <div className="text-muted-foreground">Résolus</div>
          </div>
        </div>
      </div>

      {/* Risques prédits 90j */}
      <div className="md:col-span-2 p-5 rounded-xl glass-card border border-border">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono text-muted-foreground">RISQUES PRÉDITS — 90 JOURS</span>
          <span className="label-badge label-badge-purple text-[10px]">PREDICTIVE ENGINE</span>
        </div>
        <div className="space-y-2.5">
          {[
            { risk: "Escalade de privilèges via CVE-2025-1337", prob: "87%", impact: "CRITIQUE", color: "text-destructive", w: "87%" },
            { risk: "Exfiltration S3 bucket misconfiguration", prob: "63%", impact: "HAUTE", color: "text-warning", w: "63%" },
            { risk: "Supply chain via dépendance npm compromise", prob: "41%", impact: "HAUTE", color: "text-warning", w: "41%" },
            { risk: "Credential stuffing sur portail RH", prob: "28%", impact: "MOYENNE", color: "text-accent", w: "28%" },
          ].map((r, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground/80 truncate max-w-[70%]">{r.risk}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`font-bold ${r.color}`}>{r.prob}</span>
                  <span className={`label-badge text-[9px] py-0.5 ${r.color === "text-destructive" ? "label-badge-red" : r.color === "text-warning" ? "label-badge-red" : "label-badge-purple"}`}>{r.impact}</span>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-0.5">
                <div className="h-0.5 rounded-full transition-all duration-1000" style={{ width: r.w, background: `hsl(var(--destructive) / ${parseInt(r.prob) / 100})` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6 Agent status bar */}
      <div className="md:col-span-3 grid grid-cols-3 md:grid-cols-6 gap-2">
        {["Scout", "Analyst", "Executor", "Verifier", "Vault", "RSSI IA"].map((a, i) => (
          <div key={i} className="p-2.5 rounded-xl bg-secondary/30 border border-border text-center">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse mx-auto mb-1.5" />
            <div className="text-[10px] font-mono text-foreground/70">{a}</div>
            <div className="text-[9px] text-success mt-0.5">ACTIF</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Agents IA Tab ── */
function AgentsIATab() {
  const agents6 = [
    { name: "Scout", status: "Scanning surface d'attaque EASM", progress: 73, color: "text-primary", icon: Eye },
    { name: "Analyst", status: "Corrélation signaux actifs", progress: 89, color: "text-accent", icon: Brain },
    { name: "Executor", status: "Remédiation en queue (supervisé)", progress: 45, color: "text-success", icon: Wrench },
    { name: "Verifier", status: "Validation patch — QA OK", progress: 91, color: "text-warning", icon: CheckCircle2 },
    { name: "Vault", status: "Signing SHA-256 Merkle proof", progress: 100, color: "text-primary", icon: Lock },
    { name: "RSSI IA", status: "Brief CODIR — génération en cours", progress: 60, color: "text-accent", icon: Cpu },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono text-muted-foreground">SWARM INTELLIGENCE — 6/6 AGENTS ACTIFS</span>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-[10px] text-success font-mono">SWARM SUPERVISÉ</span>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {agents6.map((a, i) => {
          const AgentIcon = a.icon;
          return (
            <div key={i} className="p-4 rounded-xl glass-card border border-border hover:border-primary/20 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <AgentIcon className={`w-4 h-4 ${a.color}`} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">Agent {a.name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{a.status}</div>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Charge système</span>
                  <span className={a.color}>{a.progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1">
                  <div className="h-1 rounded-full transition-all duration-1000" style={{ width: `${a.progress}%`, background: "linear-gradient(90deg, hsl(var(--neon-cyan)), hsl(var(--neon-blue)))" }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Auto-Remediation Tab ── */
function AutoRemediationTab() {
  const [plans, setPlans] = useState([
    { id: "#RE-0841", action: "Fermer port 8443 exposé (Scout détection)", agent: "Executor", severity: "CRITIQUE", status: "pending", eta: "< 4h", skill: "fix_port" },
    { id: "#RE-0840", action: "Rotation credentials AWS IAM Role dev-ci", agent: "Executor", severity: "HAUTE", status: "completed", eta: "Fait", skill: "rotate_creds" },
    { id: "#RE-0839", action: "Patch nginx CVE-2025-0123 (CVSS 9.1)", agent: "Executor", severity: "CRITIQUE", status: "approved", eta: "En cours", skill: "patch_vuln" },
    { id: "#RE-0838", action: "Désactiver domaine typosquat détecté", agent: "Executor", severity: "HAUTE", status: "completed", eta: "Fait", skill: "close_domain" },
  ]);

  const handleGo = (id: string) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, status: "approved", eta: "En cours" } : p));
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono text-muted-foreground">QUEUE DE REMÉDIATION — SELF-HEALING &lt; 4H</span>
        <span className="label-badge label-badge-cyan text-[10px]">EXECUTOR AGENT</span>
      </div>
      {plans.map((p, i) => (
        <div key={i} className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
          p.status === "pending" ? "border-warning/30 bg-warning/5" :
          p.status === "completed" ? "border-success/20 bg-success/5" :
          "border-primary/20 bg-primary/5"
        }`}>
          <div className="flex-shrink-0">
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
              p.status === "completed" ? "bg-success/20 text-success" :
              p.status === "pending" ? "bg-warning/20 text-warning" : "bg-primary/20 text-primary"
            }`}>
              {p.status === "completed" ? "✓ DONE" : p.status === "pending" ? "⏳ QUEUE" : "▶ RUNNING"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-foreground truncate">{p.action}</div>
            <div className="text-[10px] text-muted-foreground font-mono">{p.id} · {p.agent} · {p.skill} · ETA: {p.eta}</div>
          </div>
          <div className={`label-badge text-[9px] py-0.5 flex-shrink-0 ${p.severity === "CRITIQUE" ? "label-badge-red" : "label-badge-red"}`}>{p.severity}</div>
          {p.status === "pending" && (
            <button
              onClick={() => handleGo(p.id)}
              className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold hover:bg-primary/80 transition-colors"
            >
              GO →
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Predictive Causality Tab ── */
function PredictiveCausalityTab() {
  const attackChains = [
    {
      id: "AC-001", title: "Lateral Movement via Exposed Service",
      steps: ["Port 8443 exposed (Scout)", "→ RCE CVE-2025-1337", "→ Privilege Escalation", "→ Domain Admin"],
      probability: 87, impact: "Compromission totale", color: "text-destructive", deadline: "72h"
    },
    {
      id: "AC-002", title: "Supply Chain Compromise",
      steps: ["npm dependency backdoor", "→ CI/CD injection", "→ Prod deployment", "→ Data exfil"],
      probability: 63, impact: "Fuite de données PII", color: "text-warning", deadline: "7j"
    },
    {
      id: "AC-003", title: "Credential Stuffing + Account Takeover",
      steps: ["Leaked credentials (OSINT)", "→ RH portal login", "→ HR data access", "→ Extortion"],
      probability: 41, impact: "Données RH exposées", color: "text-accent", deadline: "14j"
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-muted-foreground">CHAÎNES D'ATTAQUE PRÉDITES — ANALYST AGENT</span>
        <span className="label-badge label-badge-purple text-[10px]">90J HORIZON</span>
      </div>
      {attackChains.map((chain, i) => (
        <div key={i} className="p-4 rounded-xl glass-card border border-border hover:border-primary/20 transition-colors space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-muted-foreground/60">{chain.id}</span>
              <span className={`text-sm font-bold ${chain.color}`}>{chain.title}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs font-bold font-mono ${chain.color}`}>{chain.probability}%</span>
              <span className="label-badge label-badge-red text-[9px] py-0.5">{chain.deadline}</span>
            </div>
          </div>
          {/* Attack chain flow */}
          <div className="flex items-center gap-1 flex-wrap">
            {chain.steps.map((step, si) => (
              <span key={si} className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                si === 0 ? "bg-primary/10 text-primary border border-primary/20" :
                si === chain.steps.length - 1 ? "bg-destructive/10 text-destructive border border-destructive/20" :
                "bg-secondary/50 text-muted-foreground"
              }`}>{step}</span>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Impact : <span className={`font-semibold ${chain.color}`}>{chain.impact}</span></span>
            <div className="w-32 bg-muted rounded-full h-1">
              <div className="h-1 rounded-full" style={{ width: `${chain.probability}%`, background: "linear-gradient(90deg, hsl(var(--destructive) / 0.6), hsl(var(--destructive)))" }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Evidence Vault Tab ── */
function EvidenceVaultTab() {
  const proofs = [
    { id: "PK-2841", action: "Port 8443 closure proof", hash: "0x7a4f...b2c1", algo: "SHA-256 Merkle Chain", ts: "2026-03-13 14:22:47", status: "verified" },
    { id: "PK-2840", action: "CVE-2025-0041 patch verification", hash: "0x3d9e...a7f2", algo: "SHA-256 Merkle Chain", ts: "2026-03-13 09:11:03", status: "verified" },
    { id: "PK-2839", action: "Credential rotation audit trail", hash: "0xb1c4...2e8d", algo: "SHA-256 Merkle Chain", ts: "2026-03-12 18:44:21", status: "verified" },
    { id: "PK-2838", action: "NIS2 compliance snapshot Q1 2026", hash: "0x6f2a...c0d4", algo: "SHA-256 Merkle Chain", ts: "2026-03-10 08:00:00", status: "verified" },
    { id: "PK-2837", action: "Domain typosquat neutralization", hash: "0xd4c1...8e3a", algo: "SHA-256 Merkle Chain", ts: "2026-03-09 15:33:12", status: "verified" },
  ];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground font-mono">2 841 preuves archivées — chaîne immuable SHA-256</span>
        <span className="label-badge label-badge-cyan text-[10px]">SHA-256 MERKLE CHAIN</span>
      </div>
      {proofs.map((p, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/20 transition-colors bg-secondary/20">
          <Lock className="w-4 h-4 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-foreground">{p.id} — {p.action}</div>
            <div className="text-[10px] text-muted-foreground font-mono">{p.hash} · {p.algo}</div>
            <div className="text-[10px] text-muted-foreground/60 font-mono">{p.ts}</div>
          </div>
          <div className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-success/10">
            <CheckCircle2 className="w-3 h-3 text-success" />
            <span className="text-[9px] text-success font-mono">VERIFIED</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function GodModePreviewSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.08 });

  return (
    <section ref={ref} className="relative py-28 overflow-hidden" id="preview">
      <div className="absolute inset-0 grid-pattern-fine opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/2 to-transparent" />

      <div className="container relative px-4">
        <div className="max-w-6xl mx-auto">

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-12 space-y-4"
          >
            <div className="label-badge label-badge-purple mx-auto w-fit">
              <Activity className="w-3 h-3" />
              God Mode Preview
            </div>
             <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Le cockpit <span className="text-gradient">Securit-E</span>
              <br />en simulation
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Dashboard · 6 Agents IA supervisés · Remédiation assistée · Predictive Causality · Evidence Vault SHA-256.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          >
            {/* Mockup OS frame */}
            <div className="relative rounded-2xl overflow-hidden glass-card-premium border border-primary/20">
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50 bg-secondary/30">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
                </div>
                <div className="flex-1 mx-4 px-3 py-0.5 rounded bg-background/50 text-[10px] font-mono text-muted-foreground">
                  securit-e.com/dashboard — Armure Cyber · SIMULATION
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                  <span className="text-[10px] font-mono text-muted-foreground">6 AGENTS · SUPERVISÉ</span>
                </div>
              </div>

              {/* Dashboard tabs — 5 onglets complets */}
              <div className="p-5">
                <Tabs defaultValue="dashboard" className="w-full">
                  <TabsList className="grid grid-cols-5 mb-5 bg-secondary/50">
                    <TabsTrigger value="dashboard" className="text-xs gap-1.5">
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Dashboard</span>
                    </TabsTrigger>
                    <TabsTrigger value="agents" className="text-xs gap-1.5">
                      <Brain className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Agents IA</span>
                    </TabsTrigger>
                    <TabsTrigger value="remediation" className="text-xs gap-1.5">
                      <Wrench className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Remédiation</span>
                    </TabsTrigger>
                    <TabsTrigger value="causality" className="text-xs gap-1.5">
                      <GitBranch className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Causality</span>
                    </TabsTrigger>
                    <TabsTrigger value="vault" className="text-xs gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Vault</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="dashboard"><DashboardPreviewTab /></TabsContent>
                  <TabsContent value="agents"><AgentsIATab /></TabsContent>
                  <TabsContent value="remediation"><AutoRemediationTab /></TabsContent>
                  <TabsContent value="causality"><PredictiveCausalityTab /></TabsContent>
                  <TabsContent value="vault"><EvidenceVaultTab /></TabsContent>
                </Tabs>
              </div>
            </div>
          </motion.div>

          {/* CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button size="lg" className="neon-glow font-bold gap-2 group hover:scale-[1.02] transition-transform" asChild>
              <Link to="/dashboard">
                <Cpu className="w-4 h-4" />
                Accéder au cockpit complet
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-border hover:border-primary/30 gap-2" asChild>
              <Link to="/demo">
                Voir la simulation (47s)
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
