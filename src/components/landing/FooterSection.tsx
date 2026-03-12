import { Link } from "react-router-dom";
import { Shield, Mail, Linkedin, Twitter, ArrowUpRight } from "lucide-react";

const productLinks = [
  { to: "/pricing", label: "Tarifs" },
  { to: "/demo", label: "Démo interactive" },
  { to: "/auth", label: "Connexion" },
  { to: "/dashboard", label: "Cockpit" },
];

const offresLinks = [
  { to: "/offres/imports-hub", label: "Imports Hub" },
  { to: "/offres/devsecops-pack", label: "DevSecOps Pack" },
  { to: "/offres/audit-pack-cabinets", label: "Audit Cabinets" },
  { to: "/offres/easm-osint-signals", label: "EASM & OSINT" },
];

const legalLinks = [
  { to: "/legal/terms", label: "CGU" },
  { to: "/legal/privacy", label: "Confidentialité" },
  { to: "/legal/authorized-use", label: "Usage autorisé" },
  { to: "/legal/disclaimer", label: "Responsabilité" },
];

export function FooterSection() {
  return (
    <footer className="relative border-t border-border/60 pt-16 pb-8 overflow-hidden">
      {/* Grid bg */}
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent 0%, hsl(185 100% 52% / 0.3) 30%, hsl(258 90% 66% / 0.3) 70%, transparent 100%)" }} />

      <div className="container relative px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-1 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Shield className="w-7 h-7 text-primary" />
                  <div className="absolute inset-0 blur-md bg-primary/20 rounded-full scale-75" />
                </div>
                <span className="text-base font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  SENTINEL EDGE
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Gouvernance cyber souveraine. Pilotez RGPD &amp; NIS2 sans jargon.{" "}
                <span className="text-primary font-semibold">490€ TTC/an</span>.
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-8 h-8 rounded-lg bg-secondary/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" aria-label="LinkedIn">
                  <Linkedin className="w-4 h-4" />
                </a>
                <a href="#" className="w-8 h-8 rounded-lg bg-secondary/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" aria-label="Twitter">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="mailto:contact@sentineledge.fr" className="w-8 h-8 rounded-lg bg-secondary/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" aria-label="Email">
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Produit */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Produit</h4>
              <ul className="space-y-2">
                {productLinks.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 group">
                      {link.label}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Offres */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Offres</h4>
              <ul className="space-y-2">
                {offresLinks.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 group">
                      {link.label}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Légal */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Légal</h4>
              <ul className="space-y-2">
                {legalLinks.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-6 border-t border-border/40 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted-foreground/60">
            <p>© 2026 SENTINEL EDGE. Tous droits réservés.</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success/60 inline-block" />
                Hébergé en France 🇫🇷
              </span>
              <span>100% conforme RGPD</span>
              <span className="label-badge label-badge-cyan text-[9px] py-0.5">GOD MODE 2026</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
