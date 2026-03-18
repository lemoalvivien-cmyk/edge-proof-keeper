import { motion, useInView } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import {
  Shield, Check, ArrowRight, ArrowLeft, Zap, Lock, Crown,
  CalendarDays, TrendingUp, Clock, CreditCard, Sparkles, X,
  Star, Building2, AlertTriangle, ChevronDown, ChevronUp, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LandingNav } from "@/components/landing/LandingNav";
import { FooterSection } from "@/components/landing/FooterSection";
import { DemoRequestDialog } from "@/components/ui/DemoRequestDialog";
import { useAuth } from "@/contexts/AuthContext";
import { openCheckout, PAYMENT_LINKS } from "@/hooks/useSubscription";
import { trackEvent } from "@/lib/tracking";
import { toast } from "sonner";

/* ─── Plan definitions ───────────────────────────────────────────── */
const plans = [
  {
    id: "starter",
    name: "Sentinel",
    price: "490",
    period: "€ TTC / an",
    monthly: "40,83€ / mois",
    tagline: "Première ligne de défense souveraine",
    badge: "DÉMARRAGE",
    highlight: false,
    icon: Shield,
    color: "primary",
    roiLabel: "Retour dès la 1ère vulnérabilité corrigée",
    tension: "Passez à Command pour l'IA autonome →",
    perks: [
      { text: "Scout Agent — détection surface d'attaque", available: true },
      { text: "Dashboard Direction + Technique", available: true },
      { text: "Conformité RGPD & NIS2 documentée", available: true },
      { text: "Evidence Vault — preuves SHA-256", available: true },
      { text: "Rapports d'audit exportables PDF", available: true },
      { text: "Inventaire actifs + gestion autorisations", available: true },
      { text: "Hébergement souverain 🇫🇷", available: true },
      { text: "Support email prioritaire", available: true },
      { text: "Agents IA Swarm Intelligence", available: false },
      { text: "Self-healing autonome < 4h", available: false },
      { text: "RSSI Virtuel IA — brief CODIR", available: false },
    ],
    cta: "Activer Sentinel",
    ctaSecondary: "Démarrer l'essai 14j gratuit",
  },
  {
    id: "pro",
    name: "Command",
    price: "6 900",
    period: "€ TTC / an",
    monthly: "575€ / mois",
    tagline: "Centre de commandement cyber autonome",
    badge: "★ CHOIX DSI / RSSI",
    highlight: true,
    icon: Zap,
    color: "accent",
    roiLabel: "Équivaut à 5,75% d'un RSSI interne — sans les congés",
    tension: "Passez à Sovereign pour l'on-premise complet →",
    perks: [
      { text: "Tout Sentinel inclus", available: true },
      { text: "6 Agents IA Swarm Intelligence complets", available: true },
      { text: "Self-healing autonome · SLA < 4h", available: true },
      { text: "OSINT & EASM Signals — surveillance continue", available: true },
      { text: "Evidence Vault cryptographique (SHA-256 Merkle Chain)", available: true },
      { text: "Predictive Causality Engine · 90j d'horizon", available: true },
      { text: "RSSI Virtuel IA — brief CODIR mensuel", available: true },
      { text: "DSI Go/No-Go · validation en 1 clic", available: true },
      { text: "SLA 99.9% garanti contractuellement", available: true },
      { text: "Déploiement on-premise dédié", available: false },
      { text: "Account Manager dédié", available: false },
    ],
    cta: "Activer Command",
    ctaSecondary: "Démarrer l'essai 14j gratuit",
  },
  {
    id: "sovereign",
    name: "Sovereign",
    price: "29 900",
    period: "€ TTC / an",
    monthly: "2 491€ / mois",
    tagline: "Autonomie totale · On-prem · Swarm complet",
    badge: "SOUVERAINETÉ TOTALE",
    highlight: false,
    icon: Crown,
    color: "primary",
    roiLabel: "Inclut déploiement on-premise certifié SecNumCloud",
    tension: null,
    perks: [
      { text: "Tout Command inclus", available: true },
      { text: "Swarm Mode — autonomie totale 24/7", available: true },
      { text: "Déploiement on-premise certifié", available: true },
      { text: "Agents IA personnalisés sur vos process", available: true },
      { text: "SLA 99.99% garanti contractuellement", available: true },
      { text: "Account Manager dédié CISO-level", available: true },
      { text: "CISO Board-level reports personnalisés", available: true },
      { text: "Intégration SIEM / SOC existant", available: true },
      { text: "Formation équipe technique incluse", available: true },
    ],
    cta: "Parler à l'équipe",
    ctaSecondary: null,
  },
];

/* ─── Competitor table ───────────────────────────────────────────── */
const competitors = [
  { name: "SECURIT-E Command", price: "6 900€ / an", self: true, trial: true, auto: true, sovereign: true, support: "Inclus" },
  { name: "RSSI interne", price: "≥ 120 000€ / an", self: false, trial: false, auto: false, sovereign: false, support: "1 personne" },
  { name: "Splunk / Tanium", price: "≥ 50 000€ / an", self: false, trial: false, auto: false, sovereign: false, support: "Payant" },
  { name: "Consulting cyber", price: "≥ 15 000€ / mission", self: false, trial: false, auto: false, sovereign: false, support: "Non continu" },
];

/* ─── ROI Calculator ─────────────────────────────────────────────── */
function RoiBlock() {
  const [employees, setEmployees] = useState(100);
  const attackCost = Math.round(employees * 1200);
  const investPro = 6900;
  const roi = Math.round((attackCost / investPro) * 10) / 10;

  return (
    <div className="rounded-2xl border border-primary/20 bg-card/60 backdrop-blur p-6 space-y-5">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        <p className="font-bold text-sm text-foreground">Calculateur ROI — quelle est votre exposition ?</p>
      </div>
      <div>
        <label className="text-xs text-muted-foreground block mb-2">
          Votre effectif : <span className="text-foreground font-bold">{employees} collaborateurs</span>
        </label>
        <input type="range" min="20" max="500" step="10" value={employees}
          onChange={e => setEmployees(Number(e.target.value))}
          className="w-full accent-primary h-1.5 rounded-full cursor-pointer" />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>20</span><span>500</span></div>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-3 rounded-xl bg-destructive/8 border border-destructive/20">
          <p className="text-lg font-black font-mono text-destructive">{attackCost.toLocaleString("fr-FR")}€</p>
          <p className="text-[10px] text-muted-foreground">Coût moyen d'une cyberattaque</p>
        </div>
        <div className="p-3 rounded-xl bg-primary/8 border border-primary/20">
          <p className="text-lg font-black font-mono text-primary">6 900€</p>
          <p className="text-[10px] text-muted-foreground">Investissement Command / an</p>
        </div>
        <div className="p-3 rounded-xl bg-success/8 border border-success/20">
          <p className="text-lg font-black font-mono text-success">×{roi}</p>
          <p className="text-[10px] text-muted-foreground">ROI estimé an 1</p>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground text-center">
        Estimation ANSSI / Wavestone 2024 · à titre indicatif
      </p>
    </div>
  );
}

/* ─── FAQ ────────────────────────────────────────────────────────── */
const faqs = [
  { q: "L'essai gratuit demande-t-il une carte bancaire ?", a: "Oui. L'essai de 14 jours est piloté par Stripe avec saisie de carte. Vous n'êtes débité qu'à J+15, avec annulation libre à tout moment depuis votre espace." },
  { q: "Puis-je passer d'une offre à l'autre ?", a: "Oui, upgrade ou downgrade en quelques clics depuis les paramètres. Les données restent intégralement conservées." },
  { q: "Où sont hébergées mes données ?", a: "En France uniquement, sur infrastructure souveraine. Conformité RGPD native. Chiffrement AES-256 au repos, TLS 1.3 en transit." },
  { q: "Le self-healing est-il vraiment autonome ?", a: "L'automatisation des corrections est déployée en Q2 2026. En attendant, les scripts sont générés et vérifiés par les agents — l'approbation humaine reste requise pour l'exécution." },
  { q: "Comment fonctionne le support Enterprise ?", a: "Account Manager dédié + accès prioritaire à l'équipe engineering + SLA contractuels 99.99% + canaux privés Slack/Teams." },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/20 transition-colors">
        <span className="font-medium text-sm text-foreground">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </button>
      {open && <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{a}</p>}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────── */
const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.05 });
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);

  async function handleCheckout(planId: "starter" | "pro") {
    setCheckoutLoading(planId);
    trackEvent("cta_stripe_checkout", { source_page: "/pricing", cta_origin: `pricing_${planId}` });
    try {
      if (user) {
        await openCheckout(planId);
      } else {
        window.open(PAYMENT_LINKS[planId], "_blank", "noopener,noreferrer");
      }
    } catch {
      toast.error("Erreur checkout. Lien direct ouvert.");
      window.open(PAYMENT_LINKS[planId], "_blank", "noopener,noreferrer");
    } finally {
      setCheckoutLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      <main className="pt-28 pb-20" ref={ref}>
        <div className="container px-4 max-w-7xl mx-auto">

          {/* Back */}
          <Button variant="ghost" size="sm" className="mb-8 text-muted-foreground" asChild>
            <Link to="/"><ArrowLeft className="w-4 h-4 mr-1.5" />Retour</Link>
          </Button>

          {/* ── Hero ─────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center space-y-5 mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest">
              <Sparkles className="w-3 h-3" /> Tarification claire · Sans surprise
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight">
              Un RSSI interne coûte <span className="line-through text-destructive/70">120 000€ / an.</span>
              <br />
              <span className="text-gradient">SECURIT-E Command : 6 900€.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Même niveau de pilotage. Disponible 24/7. Sans recrutement. Sans congés.
              Avec des preuves cryptographiques que votre RSSI ne peut pas générer seul.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5 text-sm text-success font-medium"><Check className="w-4 h-4" />14j gratuits</span>
              <span className="flex items-center gap-1.5 text-sm text-success font-medium"><Check className="w-4 h-4" />Paiement Stripe sécurisé</span>
              <span className="flex items-center gap-1.5 text-sm text-success font-medium"><Check className="w-4 h-4" />Satisfait ou remboursé 30j</span>
              <span className="flex items-center gap-1.5 text-sm text-success font-medium"><Check className="w-4 h-4" />Données 🇫🇷</span>
            </div>
          </motion.div>

          {/* ── ROI Calculator ───────────────── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.1 }} className="mb-14 max-w-3xl mx-auto">
            <RoiBlock />
          </motion.div>

          {/* ── Plans Grid ───────────────────── */}
          <div className="grid md:grid-cols-3 gap-5 items-stretch mb-16">
            {plans.map((plan, idx) => {
              const PlanIcon = plan.icon;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.15 + idx * 0.1 }}
                  className={`relative rounded-2xl flex flex-col p-6 transition-all duration-300 ${
                    plan.highlight
                      ? "bg-gradient-to-b from-accent/10 to-card border-2 border-accent/60 shadow-[0_0_40px_hsl(258_90%_66%_/_0.15)]"
                      : "bg-card border border-border hover:border-primary/30"
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-black uppercase tracking-widest shadow-lg whitespace-nowrap">
                      ★ Le choix des DSI exigeants
                    </div>
                  )}

                  {/* Plan header */}
                  <div className="flex items-start gap-3 mb-5 mt-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${plan.highlight ? "bg-accent/20" : "bg-primary/10"}`}>
                      <PlanIcon className={`w-5 h-5 ${plan.highlight ? "text-accent" : "text-primary"}`} />
                    </div>
                    <div>
                      <div className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${plan.highlight ? "text-accent" : "text-primary"}`}>{plan.badge}</div>
                      <h3 className="text-xl font-black text-foreground">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground">{plan.tagline}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-5 p-4 rounded-xl bg-secondary/40">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-black font-mono ${plan.highlight ? "text-accent" : "text-foreground"}`}>{plan.price}</span>
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">soit {plan.monthly}</p>
                    <p className="text-xs text-success font-semibold mt-1.5">{plan.roiLabel}</p>
                    {plan.id !== "sovereign" && (
                      <p className="text-xs text-success/80 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" />14 jours gratuits inclus</p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-2 flex-1 mb-6">
                    {plan.perks.map((perk, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        {perk.available
                          ? <div className="mt-0.5 w-4 h-4 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0"><Check className="w-2.5 h-2.5 text-success" /></div>
                          : <div className="mt-0.5 w-4 h-4 rounded-full bg-muted/30 flex items-center justify-center flex-shrink-0"><X className="w-2.5 h-2.5 text-muted-foreground/40" /></div>
                        }
                        <span className={`text-sm leading-snug ${perk.available ? "text-foreground/85" : "text-muted-foreground/40 line-through"}`}>{perk.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tension upsell */}
                  {plan.tension && (
                    <p className="text-[10px] text-muted-foreground italic mb-3 text-center">{plan.tension}</p>
                  )}

                  {/* CTA */}
                  <div className="space-y-2 mt-auto">
                    {plan.id === "sovereign" ? (
                      <Button size="lg" variant="outline" className="w-full font-bold gap-2" onClick={() => setDemoDialogOpen(true)}>
                        <CalendarDays className="w-4 h-4" />{plan.cta}<ArrowRight className="w-4 h-4" />
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="lg"
                          className={`w-full font-bold gap-2 ${plan.highlight ? "bg-accent hover:bg-accent/90 text-accent-foreground shadow-[0_0_20px_hsl(258_90%_66%_/_0.3)]" : ""}`}
                          variant={plan.highlight ? "default" : "outline"}
                          disabled={checkoutLoading === plan.id}
                          onClick={() => handleCheckout(plan.id as "starter" | "pro")}
                        >
                          {checkoutLoading === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                          {plan.cta} — {plan.price}€
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                        <p className="text-[10px] text-center text-muted-foreground">🔒 Stripe · Satisfait remboursé 30j · Annulation libre</p>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ── Competitor Comparison ────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.5 }} className="mb-16">
            <h2 className="text-2xl font-bold text-center mb-8">Pourquoi choisir SECURIT-E ?</h2>
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-left p-4 font-semibold text-muted-foreground">Solution</th>
                    <th className="text-center p-4 font-semibold text-muted-foreground">Coût annuel</th>
                    <th className="text-center p-4 font-semibold text-muted-foreground">Essai gratuit</th>
                    <th className="text-center p-4 font-semibold text-muted-foreground">Remédiation auto</th>
                    <th className="text-center p-4 font-semibold text-muted-foreground">Souverain 🇫🇷</th>
                    <th className="text-center p-4 font-semibold text-muted-foreground">Support</th>
                  </tr>
                </thead>
                <tbody>
                  {competitors.map((c, i) => (
                    <tr key={i} className={`border-b border-border last:border-0 ${c.self ? "bg-primary/5" : "hover:bg-muted/10"}`}>
                      <td className="p-4 font-semibold text-foreground">{c.self && <span className="inline-block w-2 h-2 rounded-full bg-primary mr-2 align-middle" />}{c.name}</td>
                      <td className={`p-4 text-center font-mono font-bold ${c.self ? "text-primary" : "text-muted-foreground"}`}>{c.price}</td>
                      <td className="p-4 text-center">{c.trial ? <Check className="w-4 h-4 text-success mx-auto" /> : <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />}</td>
                      <td className="p-4 text-center">{c.auto ? <Check className="w-4 h-4 text-success mx-auto" /> : <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />}</td>
                      <td className="p-4 text-center">{c.sovereign ? <Check className="w-4 h-4 text-success mx-auto" /> : <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />}</td>
                      <td className={`p-4 text-center text-xs ${c.self ? "text-success font-semibold" : "text-muted-foreground"}`}>{c.support}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* ── Retention Value ──────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.6 }} className="mb-16">
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-8">
              <h2 className="text-2xl font-bold text-center mb-2">Plus vous l'utilisez, plus vous gagnez</h2>
              <p className="text-center text-muted-foreground text-sm mb-8">La valeur de SECURIT-E croît avec le temps — et vous protège de plus en plus</p>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Lock, title: "Capital de preuves", desc: "Chaque analyse génère une preuve immuable SHA-256. Votre Evidence Vault devient un actif juridique.", color: "text-primary" },
                  { icon: TrendingUp, title: "Score de risque historique", desc: "Votre trajectoire de réduction des risques sur 12+ mois — prouvable devant votre conseil d'administration.", color: "text-success" },
                  { icon: Star, title: "Conformité cumulative", desc: "Chaque contrôle NIS2/RGPD documenté s'ajoute à votre dossier de conformité. Aucun audit ne vous prend de court.", color: "text-warning" },
                  { icon: Building2, title: "Intelligence souveraine", desc: "Vos signaux OSINT, ontologie d'entités et baseline de surface d'attaque — unique à votre organisation.", color: "text-accent" },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-card/60 border border-border/60 space-y-2">
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                    <p className="font-bold text-sm text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── FAQ ──────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.65 }} className="mb-16 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Questions fréquentes</h2>
            <div className="space-y-3">
              {faqs.map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} />)}
            </div>
          </motion.div>

          {/* ── Bottom CTA ───────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.7 }} className="text-center rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 to-primary/5 p-10 space-y-5">
            <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
            <h2 className="text-3xl font-black">Chaque jour sans SECURIT-E est un jour d'exposition.</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Les cyberattaques n'attendent pas que vous soyez prêt. Votre surface d'attaque existe déjà. La question est : est-ce que quelqu'un la surveille ?</p>
            <div className="flex justify-center gap-3 flex-wrap">
              <Button size="lg" className="font-bold gap-2 px-8" onClick={() => handleCheckout("pro")}>
                <Zap className="w-5 h-5" />Activer Command — 14j gratuits
              </Button>
              <Button size="lg" variant="outline" className="font-bold gap-2" onClick={() => setDemoDialogOpen(true)}>
                <CalendarDays className="w-5 h-5" />Parler à un expert
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Paiement Stripe · Annulation libre · Données souveraines 🇫🇷</p>
          </motion.div>
        </div>
      </main>

      <FooterSection />
      <DemoRequestDialog open={demoDialogOpen} onOpenChange={setDemoDialogOpen} ctaOrigin="pricing_page_cta" sourcePage="/pricing" />
    </div>
  );
};

export default Pricing;
