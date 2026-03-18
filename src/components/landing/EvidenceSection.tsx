import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Lock, FileCheck, Link2, Shield, Database, Hash, Cpu, Activity, CheckCircle2 } from "lucide-react";

const vaultFeatures = [
  {
    icon: Database,
    title: "Coffre-fort de preuves immuable",
    description: "Chaque action des agents est automatiquement horodatée et signée avec CRYSTALS-Dilithium — l'algorithme post-quantique standardisé par le NIST. Inviolable même par un ordinateur quantique.",
    highlight: "Post-Quantum Ready",
    color: "text-primary",
    glow: "hsl(185 100% 52%)",
    badge: "label-badge-cyan",
    proof: "Résiste aux attaques quantiques",
  },
  {
    icon: Hash,
    title: "Chaîne cryptographique SHA-3 Merkle",
    description: "Intégrité vérifiable par une chaîne de hashes enchaînés. Toute tentative de falsification — même d'un seul bit — est instantanément détectée et signalée.",
    highlight: "Inviolable",
    color: "text-accent",
    glow: "hsl(258 90% 66%)",
    badge: "label-badge-purple",
    proof: "Toute falsification détectée immédiatement",
  },
  {
    icon: FileCheck,
    title: "Proof Packs exportables NIS2/RGPD",
    description: "Exportez des packs de preuves signés numériquement en 10 minutes. Structurés pour être directement opposables aux régulateurs (ANSSI, CNIL), assureurs et auditeurs.",
    highlight: "Opposable réglementairement",
    color: "text-success",
    glow: "hsl(158 80% 46%)",
    badge: "label-badge-green",
    proof: "ANSSI · CNIL · Assureurs · Tribunaux",
  },
];

const liveProofs = [
  { id: "PK-2841", action: "Port 8443 — fermeture prouvée", algo: "CRYSTALS-Dilithium3", ts: "2026-03-13 14:22:47" },
  { id: "PK-2840", action: "CVE-2025-0041 — patch vérifié", algo: "SHA-256 Merkle Chain", ts: "2026-03-13 09:11:03" },
  { id: "PK-2839", action: "Rotation credentials — auditée", algo: "CRYSTALS-Dilithium3", ts: "2026-03-12 18:44:21" },
];

export function EvidenceSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.18 });

  return (
    <section ref={ref} className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-secondary/10" />
      <div className="absolute inset-0 grid-pattern-fine opacity-30" />

      <div className="container relative px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-14 space-y-4"
          >
            <div className="label-badge label-badge-cyan mx-auto w-fit">
              <Lock className="w-3 h-3" />
              Evidence Vault Post-Quantique
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Vos preuves de conformité,{" "}
              <span className="text-gradient">inviolables pour toujours</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Chaque action des agents est prouvée cryptographiquement et archivée de manière immuable.
              Votre dossier NIS2/RGPD est prêt à être présenté en 10 minutes.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">

            {/* Left: feature cards */}
            <div className="space-y-4">
              {vaultFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -24 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
                  className="group relative p-5 rounded-2xl glass-card border border-border hover:border-primary/20 transition-all duration-500"
                >
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle at 20% 50%, ${feature.glow}10 0%, transparent 60%)` }} />

                  <div className="relative flex items-start gap-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${feature.color} group-hover:scale-110 transition-transform duration-300`}
                      style={{ background: `${feature.glow}18`, border: `1px solid ${feature.glow}28` }}>
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-foreground">{feature.title}</h3>
                        <span className={`label-badge ${feature.badge} text-[9px]`}>{feature.highlight}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">{feature.description}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-success font-mono">
                        <CheckCircle2 className="w-3 h-3" />
                        {feature.proof}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Right: live vault preview */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              className="relative glass-card-premium p-5 rounded-2xl border border-primary/15 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-[10px] font-mono text-muted-foreground">EVIDENCE VAULT · LIVE</span>
                </div>
                <span className="label-badge label-badge-cyan text-[9px]">POST-QUANTUM SECURED</span>
              </div>

              <div className="p-3 rounded-xl bg-secondary/30 border border-border/50">
                <div className="text-[10px] font-mono text-muted-foreground mb-2 uppercase tracking-wider">Statistiques du vault</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold font-mono text-primary">2 841</div>
                    <div className="text-[9px] text-muted-foreground">Preuves archivées</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold font-mono text-success">100%</div>
                    <div className="text-[9px] text-muted-foreground">Intégrité vérifiée</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Dernières preuves archivées</div>
                {liveProofs.map((p, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ delay: 0.5 + i * 0.15 }}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 bg-secondary/20 hover:border-primary/20 transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-foreground truncate">{p.id} — {p.action}</div>
                      <div className="text-[9px] text-muted-foreground font-mono">{p.algo} · {p.ts}</div>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-success/10 flex-shrink-0">
                      <CheckCircle2 className="w-2.5 h-2.5 text-success" />
                      <span className="text-[8px] text-success font-mono">VERIFIED</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Compliance badges */}
              <div className="pt-3 border-t border-border/40">
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Opposable à</div>
                <div className="flex flex-wrap gap-2">
                  {["ANSSI", "CNIL", "NIS2", "RGPD", "ISO 27001", "Assureurs cyber"].map((b) => (
                    <span key={b} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/8 border border-primary/20 text-primary/80 font-mono">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
            className="mt-10 p-5 rounded-2xl glass-card-premium"
          >
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground">
              {[
                { icon: Lock, label: "CRYSTALS-Dilithium" },
                { icon: Shield, label: "Conforme RGPD" },
                { icon: Link2, label: "NIS2 Ready" },
                { icon: Cpu, label: "Self-Healing" },
                { icon: Activity, label: "Audit Trail complet" },
                { icon: () => <span className="text-base">🇫🇷</span>, label: "Hébergé en France" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 group">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                    <item.icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="group-hover:text-foreground transition-colors text-xs">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
