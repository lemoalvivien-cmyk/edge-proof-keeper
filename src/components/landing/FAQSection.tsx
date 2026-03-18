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
    answer: "En moins de 15 minutes pour une première utilisation. Créez votre compte, importez un premier fichier de scan ou connectez une source, et le tableau de bord commence à fonctionner immédiatement. Pas de semaine d'intégration, pas de consultant requis.",
  },
  {
    question: "Comment les agents IA opèrent-ils ?",
    answer: "En mode assisté (Go/No-Go) : Scout détecte, Analyst priorise, l'équipe valide, Executor exécute, Vault archive la preuve. Le cycle complet démontrable en laboratoire est de 47 secondes. En mode production, les délais dépendent de votre infrastructure et des validations humaines requises.",
  },
  {
    question: "Qu'est-ce que l'Evidence Vault et pourquoi c'est important ?",
    answer: "Un coffre-fort de preuves basé sur une chaîne SHA-256 Merkle enchaînée. Chaque action est horodatée, hashée et liée à la précédente : toute modification invalide la chaîne. Concrètement : votre dossier NIS2/RGPD est prêt à être présenté à un auditeur. Note : la technologie utilisée est SHA-256, pas CRYSTALS-Dilithium.",
  },
  {
    question: "Est-ce vraiment compatible NIS2 et RGPD 2026 ?",
    answer: "La plateforme génère automatiquement des preuves de diligence documentées. Les Proof Packs exportables sont structurés pour être présentés aux autorités compétentes (ANSSI, CNIL). Votre responsabilité documentaire de dirigeant est couverte. Le caractère « opposable » en toute circonstance dépend de votre contexte juridique spécifique — consultez votre conseil.",
  },
  {
    question: "Combien d'équipe cyber faut-il pour opérer SECURIT-E ?",
    answer: "Le produit est conçu pour être piloté par une personne sans expertise cyber poussée. Les 6 agents autonomes gèrent la surveillance et les remédiatiosn avec supervision humaine. Le RSSI Virtuel IA vous envoie un brief mensuel en langage Direction. Pour les décisions critiques, le DSI reçoit une notification avec validation Go/No-Go.",
  },
  {
    question: "Que se passe-t-il si l'Executor fait une erreur de remédiation ?",
    answer: "L'Agent Verifier contrôle chaque action de l'Executor. En cas d'anomalie détectée, un rollback est déclenché. L'architecture est conçue pour la résilience. Les skills de remédiation (fix_port, rotate_creds, etc.) sont des orchestrateurs supervisés — toute action sensible passe par validation Go/No-Go en production.",
  },
  {
    question: "Y a-t-il des frais cachés ? Le prix est-il tout inclus ?",
    answer: "Non. Sentinel 490€/an : détection, Evidence Vault, rapports, conformité NIS2/RGPD, hébergement France. Command 6 900€/an ajoute les 6 agents complets, remédiation assistée, EASM/OSINT, RSSI Virtuel IA. Sovereign 29 900€/an pour la souveraineté totale on-premise. Essai 14j gratuit sans CB.",
  },
  {
    question: "Mes données restent-elles en France ?",
    answer: "Oui. L'hébergement est en France. Les données sont traitées sous juridiction française et conforme RGPD. Nous ne prétendons pas à une certification SecNumCloud à ce stade — c'est un objectif de roadmap.",
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
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="glass-card border border-border rounded-xl px-4 overflow-hidden"
                >
                  <AccordionTrigger className="text-sm font-semibold text-left py-4 hover:no-underline hover:text-primary transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
            className="mt-10 p-6 rounded-2xl glass-card-premium border border-primary/15 text-center space-y-4"
          >
            <h3 className="text-lg font-bold">Une autre question ?</h3>
            <p className="text-sm text-muted-foreground">
              Notre équipe répond en moins de 24h. Ou réservez une démo pour voir le produit en action.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/auth?tab=signup')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold neon-glow hover:scale-[1.02] transition-transform"
              >
                <Shield className="w-4 h-4" />
                Essai 14j gratuit <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <a
                href="mailto:contact@securit-e.com"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border hover:border-primary/40 text-sm font-medium transition-colors"
              >
                Nous écrire
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
