import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { HelpCircle, Shield, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "En combien de temps SECURIT-E est-il opérationnel ?",
    answer: "15 minutes. Créez votre compte, connectez votre infrastructure (ou importez votre premier fichier de scan), et les 6 agents commencent à opérer immédiatement. Pas de semaine d'intégration, pas de consultant requis.",
  },
  {
    question: "Comment les agents IA opèrent-ils sans intervention humaine ?",
    answer: "Le Swarm opère en mode 'Fully Autonomous' : Scout détecte, Analyst priorise et prédit, Executor remédie, Verifier valide, Vault prouve — en 47 secondes. Le DSI peut aussi choisir le mode 'Go/No-Go' pour approuver chaque action en 1 clic avant exécution.",
  },
  {
    question: "Qu'est-ce que l'Evidence Vault post-quantique et pourquoi c'est important ?",
    answer: "Notre coffre-fort utilise CRYSTALS-Dilithium (algorithme post-quantique standardisé NIST). Chaque preuve est signée, enchaînée et horodatée. Aucun ordinateur quantique ne peut falsifier ces preuves. Concrètement : votre dossier NIS2/RGPD est prêt en 10 minutes, opposable aux régulateurs, assureurs et juges.",
  },
  {
    question: "Est-ce vraiment compatible NIS2 et RGPD 2026 ?",
    answer: "Oui. La plateforme génère automatiquement les preuves de diligence requises par NIS2 et RGPD. Les Proof Packs exportables sont structurés pour les autorités compétentes (ANSSI, CNIL). Votre responsabilité personnelle de dirigeant est couverte documentairement.",
  },
  {
    question: "Combien d'équipe cyber faut-il pour opérer SECURIT-E ?",
    answer: "Zéro. Les 6 agents opèrent en autonomie complète 24/7. Le RSSI Virtuel IA vous envoie un brief mensuel en langage Direction. Pour les décisions critiques, le DSI reçoit une notification avec un seul bouton : Go ou No-Go.",
  },
  {
    question: "Que se passe-t-il si l'Executor fait une erreur de remédiation ?",
    answer: "L'Agent Verifier contrôle systématiquement chaque action de l'Executor. En cas d'anomalie détectée, un rollback automatique est déclenché immédiatement. L'architecture est conçue pour la résilience, pas seulement pour la rapidité.",
  },
  {
    question: "Y a-t-il des frais cachés ? Le prix est-il tout inclus ?",
    answer: "Non, aucun frais caché. Starter 490€/an tout inclus : détection, Evidence Vault, rapports, conformité NIS2/RGPD, hébergement souverain France. Pro 6 900€/an ajoute les 6 agents complets, self-healing < 4h, EASM/OSINT continu, RSSI Virtuel IA. Enterprise 29 900€/an pour la souveraineté totale on-premise.",
  },
  {
    question: "Mes données restent-elles en France ?",
    answer: "100% souverain France. Hébergement certifié SecNumCloud, chiffrement bout-en-bout, aucune donnée traitée hors UE. Votre infrastructure reste sous juridiction française — exigence DSI, RSSI et CISO respectée.",
  },
];

export function FAQSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const navigate = useNavigate();

  return (
    <section ref={ref} id="faq" className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-40" />

      <div className="container relative px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center space-y-4 mb-12"
          >
            <div className="label-badge label-badge-cyan mx-auto w-fit">
              <HelpCircle className="w-3 h-3" />
              Questions fréquentes
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Tout ce que vous devez{" "}
              <span className="text-gradient">savoir avant de démarrer</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Réponses directes, sans jargon.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="glass-card rounded-xl px-5 border border-border data-[state=open]:border-primary/30 data-[state=open]:bg-primary/3 transition-all duration-300"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-5 group">
                    <span className="font-medium text-foreground/85 group-hover:text-foreground transition-colors pr-4 text-sm leading-relaxed">
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          {/* Final conversion CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-14 text-center p-8 rounded-2xl glass-card-premium border border-primary/25"
            style={{ background: "linear-gradient(135deg, hsl(185 100% 52% / 0.06) 0%, hsl(var(--glass) / 0.8) 100%)" }}
          >
            <Shield className="w-10 h-10 text-primary mx-auto mb-4" style={{ filter: "drop-shadow(0 0 20px hsl(185 100% 52% / 0.4))" }} />
            <h3 className="text-2xl font-bold mb-2">Prêt à activer votre centre de commandement cyber ?</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-lg mx-auto">
              Opérationnel en 15 minutes. 14 jours gratuits. Annulation libre.{" "}
              <span className="text-foreground font-semibold">Starter dès 490€/an</span> — le prix d'un scan ponctuel en consulting.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/auth?tab=signup')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold neon-glow hover:scale-[1.02] transition-transform"
              >
                <Shield className="w-4 h-4" />
                Activer mon armure — 14j gratuit
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <a
                href="#pricing"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
              >
                Voir tous les plans
              </a>
            </div>
            <p className="text-[11px] text-muted-foreground/60 mt-4">
              🔒 Paiement sécurisé Stripe · Satisfait ou remboursé 30j · Support inclus
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
