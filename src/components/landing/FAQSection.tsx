import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { HelpCircle, Cpu } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Comment les agents IA opèrent-ils sans intervention humaine ?",
    answer: "Le Swarm opère en mode 'Fully Autonomous' : Scout détecte, Analyst priorise, Executor remédie, Vault prouve — le tout en 47 secondes. Le DSI peut choisir le mode 'DSI Validation' pour approuver chaque action en 1 clic avant exécution.",
  },
  {
    question: "Qu'est-ce que l'Evidence Vault post-quantique ?",
    answer: "Notre coffre-fort utilise CRYSTALS-Dilithium, l'algorithme post-quantique standardisé par le NIST. Chaque preuve est signée, enchaînée et horodatée. Aucun ordinateur quantique ne peut falsifier les preuves générées par Sentinel Immune.",
  },
  {
    question: "Est-ce compatible NIS2 et RGPD 2026 ?",
    answer: "Oui. La plateforme couvre 100% des exigences documentaires NIS2 et RGPD. Les Proof Packs exportables sont acceptés par les autorités compétentes (ANSSI, CNIL). Votre responsabilité personnelle est couverte.",
  },
  {
    question: "Que se passe-t-il si ma Core API externe est indisponible ?",
    answer: "En mode production, Sentinel Immune requiert la souveraineté externe. Si votre Core API est indisponible, les agents passent en mode dégradé avec alerte immédiate. Les preuves déjà générées restent dans le Vault immuable.",
  },
  {
    question: "Combien d'équipe cyber faut-il pour opérer la plateforme ?",
    answer: "Zéro. Les 5 agents opèrent en autonomie complète. Le RSSI Virtuel IA vous envoie un brief mensuel en langage Direction. Pour les décisions critiques, le DSI reçoit une notification push avec un seul bouton : Go ou No-Go.",
  },
  {
    question: "Comment fonctionne le pricing ? Y a-t-il des frais cachés ?",
    answer: "Non. Starter 490€/an tout inclus : 6 agents, Evidence Vault, rapports Direction+Technique, conformité NIS2/RGPD, hébergement souverain France. Pro 6 900€/an ajoute EASM/OSINT continu, self-healing autonome < 4h, API dédiée. Enterprise 29 900€/an pour la souveraineté totale on-premise.",
  },
  {
    question: "Mes données restent-elles en France ?",
    answer: "100% souverain France. Hébergement certifié SecNumCloud, chiffrement bout-en-bout, aucune donnée traitée hors UE. Votre infrastructure reste sous juridiction française — exigence DSI, RSSI et CISO respectée.",
  },
  {
    question: "Puis-je voir une vraie démo du swarm en action ?",
    answer: "Oui. Cliquez sur 'Voir la démo agents en live (47s)' pour voir les 5 agents opérer en temps réel sur un environnement de démonstration. Ou bookez un slot 15 minutes pour une démo personnalisée avec votre propre infrastructure.",
  },
];

export function FAQSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

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
              FAQ
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Questions <span className="text-gradient">fréquentes</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Tout ce que vous devez savoir sur Sentinel Immune.
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

          {/* Final CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-12 text-center p-6 rounded-2xl glass-card-premium border border-primary/20"
          >
            <Cpu className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-2">Prêt à activer votre système immunitaire cyber ?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Commencez avec le plan Starter — <span className="text-foreground font-semibold">490€/an</span>, tout inclus, sans engagement.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <a href="#pricing" className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold neon-glow hover:scale-[1.02] transition-transform">
                Commencer gratuit Starter →
              </a>
              <a href="#pricing" className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
                Voir tous les plans
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
