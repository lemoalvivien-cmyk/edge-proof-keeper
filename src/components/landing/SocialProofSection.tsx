import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    quote: "Enfin un outil qui me parle en français ! J'ai compris mes risques en 10 minutes.",
    author: "Marie D.",
    role: "Dirigeante PME",
    company: "Industrie",
    rating: 5,
  },
  {
    quote: "Le double tableau de bord est génial : je fais le point avec mon DSI sans me perdre dans le jargon.",
    author: "Thomas R.",
    role: "CEO",
    company: "SaaS B2B",
    rating: 5,
  },
  {
    quote: "Lors de notre audit NIS2, les preuves générées par SENTINEL EDGE nous ont fait gagner 3 semaines.",
    author: "Sophie L.",
    role: "RSSI",
    company: "ETI Services",
    rating: 5,
  },
];

const stats = [
  { value: "50+", label: "Entreprises protégées" },
  { value: "98%", label: "Taux de satisfaction" },
  { value: "24h", label: "Temps moyen de diagnostic" },
  { value: "100%", label: "Conformité RGPD" },
];

export function SocialProofSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/30 to-transparent" />

      <div className="container relative px-4">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ils nous font <span className="text-gradient">confiance</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Rejoignez les dirigeants qui ont repris le contrôle de leur cybersécurité.
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {stats.map((stat, index) => (
              <div key={index} className="text-center glass-card p-6 rounded-xl">
                <div className="text-3xl md:text-4xl font-bold text-primary neon-text">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Testimonials grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="glass-card hover:border-primary/30 transition-colors">
                <CardContent className="p-6 space-y-4">
                  {/* Rating */}
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                    ))}
                  </div>

                  {/* Quote */}
                  <div className="relative">
                    <Quote className="absolute -top-2 -left-2 w-8 h-8 text-primary/20" />
                    <p className="text-foreground italic pl-4">
                      "{testimonial.quote}"
                    </p>
                  </div>

                  {/* Author */}
                  <div className="pt-4 border-t border-border">
                    <div className="font-semibold text-foreground">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role} • {testimonial.company}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
