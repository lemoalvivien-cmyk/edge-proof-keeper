import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Que contient le rapport choc gratuit ?",
    answer: "Un diagnostic initial de votre exposition cyber basé sur les informations publiques de votre domaine. Vous recevez un score de risque, les principales vulnérabilités détectées et des recommandations prioritaires. Sans engagement.",
  },
  {
    question: "Pourquoi dois-je fournir une preuve d'autorisation avant le scan ?",
    answer: "C'est une obligation légale et éthique. Nous n'effectuons aucune action sur vos systèmes sans votre consentement explicite. Cette autorisation vous protège et nous protège. Elle est conservée dans notre coffre-fort de preuves.",
  },
  {
    question: "Qu'est-ce que la double vue Direction / Technique ?",
    answer: "Un même tableau de bord, deux lectures. La vue Direction présente les indicateurs clés en langage business (risques, conformité, tendances). La vue Technique offre le détail des CVE, les étapes de remédiation et les preuves pour votre équipe IT.",
  },
  {
    question: "Comment fonctionne l'Evidence Vault (coffre-fort de preuves) ?",
    answer: "Chaque action (scan, import, modification) est enregistrée dans un journal immuable avec horodatage et empreinte cryptographique SHA-256. En cas d'audit, vous pouvez exporter un rapport certifié de toutes les preuves.",
  },
  {
    question: "SENTINEL EDGE est-il adapté à NIS2 ?",
    answer: "Oui. La plateforme intègre le référentiel NIS2 et vous guide dans la mise en conformité. Vous pouvez suivre l'état de chaque exigence et générer les preuves demandées par les autorités compétentes.",
  },
  {
    question: "Que se passe-t-il si je n'ai pas d'équipe IT ?",
    answer: "SENTINEL EDGE est conçu pour les dirigeants non-techniques. La vue Direction vous suffit pour piloter votre conformité. Si vous avez besoin d'aide pour la remédiation, nous proposons un réseau de partenaires certifiés.",
  },
  {
    question: "Mes données sont-elles sécurisées ?",
    answer: "Absolument. Hébergement en France, chiffrement de bout en bout, conformité RGPD native. Nous ne revendons aucune donnée. Vous restez propriétaire de toutes vos informations.",
  },
  {
    question: "Comment fonctionne le paiement ?",
    answer: "Paiement sécurisé via Stripe. Vous pouvez également demander une démo personnalisée et nous vous contacterons sous 24h pour finaliser votre accès.",
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
              Tout ce que vous devez savoir avant de commencer.
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
        </div>
      </div>
    </section>
  );
}
