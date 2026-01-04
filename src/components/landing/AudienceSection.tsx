import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Building2, Monitor, Scale } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const audiences = [
  {
    icon: Building2,
    title: "Direction Générale",
    benefit: "Pilotage sans jargon",
    description: "Tableaux de bord exécutifs, indicateurs clairs, preuves de diligence pour les régulateurs.",
  },
  {
    icon: Monitor,
    title: "DSI / RSSI",
    benefit: "Visibilité technique",
    description: "Rapports détaillés, suivi des vulnérabilités, intégration des outils existants.",
  },
  {
    icon: Scale,
    title: "Juridique / DPO",
    benefit: "Conformité documentée",
    description: "Evidence Vault, proof packs exportables, traçabilité pour audits RGPD/NIS2.",
  },
];

export function AudienceSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} className="relative py-24 overflow-hidden">
      <div className="container px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <span className="inline-block px-3 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full mb-4">
              Pour qui ?
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Une plateforme pour <span className="text-gradient">toute l'entreprise</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Chaque rôle trouve sa valeur dans SENTINEL EDGE.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {audiences.map((audience, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300 group">
                  <CardContent className="p-6 space-y-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <audience.icon className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {audience.title}
                      </h3>
                      <p className="text-sm font-medium text-primary">
                        {audience.benefit}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {audience.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
