import { Link } from "react-router-dom";
import { Shield, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function LandingNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            <span className="text-lg font-bold text-foreground hidden sm:inline">
              SENTINEL EDGE
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Tarifs
            </a>
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Connexion
            </Link>
            <Button asChild size="sm" className="neon-glow">
              <Link to="/auth">
                Démarrer gratuitement
              </Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile nav */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-border">
            <a 
              href="#pricing" 
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Tarifs
            </a>
            <Link 
              to="/auth" 
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Connexion
            </Link>
            <Button asChild size="sm" className="w-full neon-glow">
              <Link to="/auth">
                Démarrer gratuitement
              </Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
