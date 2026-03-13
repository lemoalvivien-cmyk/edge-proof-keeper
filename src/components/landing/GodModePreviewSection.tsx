import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard, Brain, Wrench, Network, Lock, Activity,
  AlertTriangle, CheckCircle2, Clock, TrendingUp, Eye, Cpu, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

/* ── Dashboard Live Tab ── */
function DashboardLiveTab() {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {/* Score */}
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
                <div className={`h-0.5 rounded-full transition-all duration-1000`} style={{ width: r.w, background: `hsl(var(--destructive) / ${parseInt(r.prob) / 100})` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent status */}
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
    { name: "Scout", status: "Scanning 847 endpoints", progress: 73, color: "text-primary", icon: Eye },
    { name: "Analyst", status: "Corrélation 12 signaux actifs", progress: 89, color: "text-accent", icon: Brain },
    { name: "Executor", status: "3 remédiation en queue", progress: 45, color: "text-success", icon: Wrench },
    { name: "Verifier", status: "Validation patch #47", progress: 91, color: "text-warning", icon: CheckCircle2 },
    { name: "Vault", status: "Signing proof #2841", progress: 100, color: "text-primary", icon: Lock },
    { name: "RSSI IA", status: "Brief CODIR — 3j", progress: 60, color: "text-accent", icon: Cpu },
  ];

  return (
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
                <span>Charge</span>
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
  );
}

/* ── Auto-Remediation Tab ── */
function AutoRemediationTab() {
  const plans = [
    { id: "#RE-0841", action: "Fermer port 8443 exposé (Scout détection)", agent: "Executor", severity: "CRITIQUE", status: "pending", eta: "< 4h" },
    { id: "#RE-0840", action: "Rotation credentials AWS IAM Role dev-ci", agent: "Executor", severity: "HAUTE", status: "completed", eta: "Fait" },
    { id: "#RE-0839", action: "Patch nginx CVE-2025-0123 (CVSS 9.1)", agent: "Executor", severity: "CRITIQUE", status: "approved", eta: "En cours" },
    { id: "#RE-0838", action: "Désactiver domaine typosquat détecté", agent: "Executor", severity: "HAUTE", status: "completed", eta: "Fait" },
  ];

  return (
    <div className="space-y-2.5">
      {plans.map((p, i) => (
        <div key={i} className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
          p.status === "pending" ? "border-warning/30 bg-warning/5" :
          p.status === "completed" ? "border-success/20 bg-success/3" :
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
            <div className="text-[10px] text-muted-foreground font-mono">{p.id} · {p.agent} · ETA: {p.eta}</div>
          </div>
          <div className={`label-badge text-[9px] py-0.5 flex-shrink-0 ${p.severity === "CRITIQUE" ? "label-badge-red" : "label-badge-red"}`}>{p.severity}</div>
          {p.status === "pending" && (
            <button className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold hover:bg-primary/80 transition-colors">
              GO →
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Evidence Vault Tab ── */
function EvidenceVaultTab() {
  const proofs = [
    { id: "PK-2841", action: "Port 8443 closure proof", hash: "0x7a4f...b2c1", algo: "CRYSTALS-Dilithium", ts: "2026-03-13 14:22:47", status: "verified" },
    { id: "PK-2840", action: "CVE-2025-0041 patch verification", hash: "0x3d9e...a7f2", algo: "zk-SNARK Groth16", ts: "2026-03-13 09:11:03", status: "verified" },
    { id: "PK-2839", action: "Credential rotation audit trail", hash: "0xb1c4...2e8d", algo: "CRYSTALS-Dilithium", ts: "2026-03-12 18:44:21", status: "verified" },
    { id: "PK-2838", action: "NIS2 compliance snapshot Q1 2026", hash: "0x6f2a...c0d4", algo: "Lattice + SHA-3", ts: "2026-03-10 08:00:00", status: "verified" },
  ];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground font-mono">2 841 preuves archivées</span>
        <span className="label-badge label-badge-cyan text-[10px]">POST-QUANTUM SECURED</span>
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
              Le cockpit <span className="text-gradient">Sentinel Immune</span>
              <br />en action réelle
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Dashboard Live · Agents IA · Auto-Remédiation · Evidence Vault — en temps réel.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          >
            {/* Mockup frame */}
            <div className="relative rounded-2xl overflow-hidden glass-card-premium border border-primary/20">
              {/* Window bar */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50 bg-secondary/30">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
                </div>
                <div className="flex-1 mx-4 px-3 py-0.5 rounded bg-background/50 text-[10px] font-mono text-muted-foreground">
                  sentinel-immune.fr/dashboard — Immune System · LIVE
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-[10px] font-mono text-muted-foreground">6 AGENTS</span>
                </div>
              </div>

              {/* Dashboard content */}
              <div className="p-5">
                <Tabs defaultValue="dashboard" className="w-full">
                  <TabsList className="grid grid-cols-4 mb-5 bg-secondary/50">
                    <TabsTrigger value="dashboard" className="text-xs gap-1.5">
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Dashboard Live</span>
                    </TabsTrigger>
                    <TabsTrigger value="agents" className="text-xs gap-1.5">
                      <Brain className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Agents IA</span>
                    </TabsTrigger>
                    <TabsTrigger value="remediation" className="text-xs gap-1.5">
                      <Wrench className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Auto-Remédiation</span>
                    </TabsTrigger>
                    <TabsTrigger value="vault" className="text-xs gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Evidence Vault</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="dashboard"><DashboardLiveTab /></TabsContent>
                  <TabsContent value="agents"><AgentsIATab /></TabsContent>
                  <TabsContent value="remediation"><AutoRemediationTab /></TabsContent>
                  <TabsContent value="vault"><EvidenceVaultTab /></TabsContent>
                </Tabs>
              </div>
            </div>
          </motion.div>

          {/* CTA below */}
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
                Voir démo live (47s)
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
