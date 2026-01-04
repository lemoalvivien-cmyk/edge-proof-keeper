import { Link } from "react-router-dom";
import { Shield, Mail, Linkedin, Twitter } from "lucide-react";

export function FooterSection() {
  return (
    <footer className="relative border-t border-border py-12">
      <div className="container px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-8 h-8 text-primary" />
                <span className="text-xl font-bold text-foreground">SENTINEL EDGE</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                Votre armure de gouvernance cyber. Pilotez votre conformité RGPD & NIS2 
                sans jargon technique. <span className="text-primary font-semibold">490€ TTC/an</span>.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="LinkedIn">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Twitter">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="mailto:contact@sentineledge.fr" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Email">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Links */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Produit</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/pricing" className="text-muted-foreground hover:text-primary transition-colors">
                    Tarifs — 490€ TTC/an
                  </Link>
                </li>
                <li>
                  <Link to="/scopeguard" className="text-muted-foreground hover:text-primary transition-colors">
                    Rapport choc gratuit
                  </Link>
                </li>
                <li>
                  <Link to="/auth" className="text-muted-foreground hover:text-primary transition-colors">
                    Connexion
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Légal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Mentions légales
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Politique de confidentialité
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    CGV
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2025 SENTINEL EDGE. Tous droits réservés.</p>
            <p>Hébergé en France 🇫🇷 • 100% conforme RGPD</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
