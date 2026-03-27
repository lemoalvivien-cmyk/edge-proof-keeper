import { LandingNav } from "@/components/landing/LandingNav";
import { FooterSection } from "@/components/landing/FooterSection";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { HelpCircle, ShieldCheck, FileText, Euro, Globe, Cpu, Lock, Users, Zap, Server, ArrowRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const faqCategories = [
  {
    icon: ShieldCheck,
    label: "NIS2 & RGPD 2026",
    color: "text-primary",
    bg: "bg-primary/10",
    questions: [
      {
        q: "Securit-E couvre-t-il les exigences NIS2 2026 ?",
        a: "La directive NIS2 impose la gestion des risques, la notification d'incidents sous 24h, la chaîne d'approvisionnement sécurisée et la responsabilité des dirigeants. Securit-E couvre les obligations documentaires : cartographie des risques, Evidence Vault immuable SHA-256, génération de Proof Packs structurés pour l'ANSSI. Il appartient à votre conseil juridique de valider la couverture complète dans votre contexte spécifique.",
      },
      {
        q: "Comment Securit-E protège-t-il la responsabilité personnelle du DSI ?",
        a: "La directive NIS2 rend les dirigeants personnellement responsables des manquements cyber. Securit-E génère un Evidence Vault immuable avec chaîne SHA-256 Merkle à chaque action : détection, remédiation, validation Go/No-Go. En cas de mise en cause, votre chaîne de preuves est cryptographiquement vérifiable et inviolable — vérifiable cryptographiquement.",
      },
      {
        q: "Le RGPD 2026 exige-t-il des mesures spécifiques que Securit-E gère ?",
        a: "Securit-E couvre les Articles 25 (Privacy by Design), 32 (sécurité du traitement), 33 (notification de violation sous 72h) et 35 (DPIA). L'agent Scout détecte les fuites de données personnelles, l'Evidence Vault documente les incidents et les Proof Packs RGPD sont pré-formatés pour la CNIL. Votre DPO dispose d'un tableau de bord dédié.",
      },
    ],
  },
  {
    icon: Cpu,
    label: "Agents IA & Autonomie",
    color: "text-accent",
    bg: "bg-accent/10",
    questions: [
      {
        q: "Comment fonctionnent les 6 agents IA en mode supervisé ?",
        a: "Le Swarm opère en pipeline séquentiel : Scout (détection OSINT/EASM) → Analyst (priorisation par score de risque IA) → DSI Go/No-Go (validation 1 clic ou délégation supervisée) → Executor (remédiation via scripts bash/PowerShell) → Verifier (contrôle post-action) → Vault (preuve cryptographique SHA-256). En mode délégation supervisée, les patterns validés sont traités avec supervision sans validation manuelle supplémentaire. En mode DSI Validation, chaque action attend votre approbation via notification push.",
      },
      {
        q: "Que se passe-t-il si l'IA commet une erreur de remédiation ?",
        a: "Toute action est précédée d'une validation de scope (périmètre autorisé) et d'un rollback automatique en cas d'échec. Le Verifier contrôle l'état post-remédiation et génère une preuve cryptographique du résultat. Si une anomalie est détectée, notify_rollback est déclenché automatiquement et le DSI est alerté en temps réel. L'historique complet est immuable dans l'Evidence Vault.",
      },
      {
        q: "L'IA est-elle hébergée en France ?",
        a: "L'agent IA utilise des modèles hébergés via une gateway européenne avec un prompt système fixe orienté conformité NIS2/RGPD. Les données ne quittent pas l'UE. Le modèle n'est pas réentraîné sur vos données — votre infrastructure reste confidentielle.",
      },
    ],
  },
  {
    icon: Lock,
    label: "Sécurité & Souveraineté",
    color: "text-success",
    bg: "bg-success/10",
    questions: [
      {
        q: "Qu'est-ce que l'Evidence Vault ?",
        a: "L'Evidence Vault utilise une chaîne de hashes SHA-256 enchaînés (Merkle Chain). Chaque action est horodatée, hashée et liée à la précédente : toute modification invalide la chaîne. Le résultat est une piste d'audit immuable, vérifiable indépendamment, présentable à un auditeur NIS2/RGPD. Technologie actuelle : SHA-256 Merkle Chain. Résistance crypto renforcée : roadmap 2026.",
      },
      {
        q: "Où sont hébergées mes données ?",
        a: "Hébergé en France. Infrastructure en région EU-West (Paris), chiffrement AES-256 au repos et TLS 1.3 en transit. Aucune donnée traitée hors UE — ni analyse IA, ni stockage de logs. Conformité RGPD native. Vos données n'alimentent aucun modèle tiers.",
      },
    ],
  },
  {
    icon: Euro,
    label: "Tarifs & Facturation",
    color: "text-warning",
    bg: "bg-warning/10",
    questions: [
      {
        q: "Y a-t-il des frais cachés dans les plans ?",
        a: "Non. Sentinel 490€/an : Evidence Vault SHA-256, rapports Direction+Technique, conformité NIS2/RGPD, hébergement France. Command 6 900€/an ajoute EASM/OSINT continu, remédiation assistée < 4h (cible), API dédiée. Sovereign 29 900€/an : on-premise, agents personnalisés, Account Manager CISO dédié. Essai 14j gratuit — carte requise, annulation libre.",
      },
      {
        q: "Puis-je tester avant de payer ?",
        a: "Oui. L'essai 14 jours donne accès à la totalité des fonctionnalités. Une carte bancaire est requise pour activer l'essai Stripe — annulation libre à tout moment avant la fin des 14 jours. À la fin de l'essai, si vous ne souhaitez pas continuer, vous pouvez annuler et vos données sont conservées 30 jours supplémentaires.",
      },
    ],
  },
];

const allFaqs = faqCategories.flatMap(cat => cat.questions);

export default function FAQ() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.05 });
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <main ref={ref} className="pt-24 pb-20">
        <div className="container px-4 max-w-4xl mx-auto">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4 mb-16"
          >
            <div className="label-badge label-badge-cyan mx-auto w-fit">
              <HelpCircle className="w-3 h-3" />
              10 Questions Essentielles
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              FAQ — <span className="text-gradient">NIS2 & RGPD 2026</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tout ce que les DSI, RSSI et Directeurs Généraux doivent savoir avant de signer leur conformité 2026.
            </p>
            {/* Structured breadcrumb */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <button onClick={() => navigate('/')} className="hover:text-foreground transition-colors">Accueil</button>
              <span>/</span>
              <span className="text-foreground">FAQ</span>
            </div>
          </motion.div>

          {/* Categories */}
          {faqCategories.map((cat, catIdx) => (
            <motion.div
              key={catIdx}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + catIdx * 0.1 }}
              className="mb-10"
            >
              {/* Category header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-lg ${cat.bg} flex items-center justify-center`}>
                  <cat.icon className={`w-4 h-4 ${cat.color}`} />
                </div>
                <h2 className={`font-bold text-lg ${cat.color}`}>{cat.label}</h2>
              </div>

              <Accordion type="single" collapsible className="space-y-2">
                {cat.questions.map((faq, qIdx) => (
                  <AccordionItem
                    key={qIdx}
                    value={`cat${catIdx}-q${qIdx}`}
                    className="glass-card rounded-xl px-5 border border-border data-[state=open]:border-primary/30 data-[state=open]:bg-primary/3 transition-all duration-300"
                  >
                    <AccordionTrigger className="text-left hover:no-underline py-4 group">
                      <span className="font-medium text-foreground/85 group-hover:text-foreground transition-colors pr-4 text-sm leading-relaxed">
                        {faq.q}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-sm text-muted-foreground leading-relaxed">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          ))}

          {/* CTA Final */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-12 text-center p-8 rounded-2xl glass-card-premium border border-primary/20"
          >
            <ShieldCheck className="w-10 h-10 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Prêt pour la conformité NIS2 2026 ?</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Démarrez votre essai 14 jours — carte requise, annulation libre. Aide documentaire NIS2 dès le premier jour.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                className="gap-2 neon-glow font-bold"
                onClick={() => navigate('/auth?tab=signup')}
              >
                <Zap className="w-4 h-4" />
                Démarrer l'essai gratuit
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
                onClick={() => navigate('/demo')}
              >
                Voir la démo 47s
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              490€/an tout inclus · Hébergé en France 🇫🇷 · Essai 14j — carte requise
            </p>
          </motion.div>
        </div>
      </main>
      <FooterSection />
    </div>
  );
}
