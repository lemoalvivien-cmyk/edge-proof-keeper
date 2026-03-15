import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Menu, X, ChevronDown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoRequestDialog } from "@/components/ui/DemoRequestDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { id: "how-it-works", label: "Comment ça marche", scroll: true },
  { href: "/demo", label: "Démo live", scroll: false },
  { href: "/pricing", label: "Tarifs", scroll: false },
];

export function LandingNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Top trust strip */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="bg-primary/10 backdrop-blur-md border-b border-primary/15">
          <div className="container px-4">
            <div className="flex items-center justify-center gap-6 md:gap-10 py-2 text-xs text-primary/90">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success inline-block animate-pulse" />
                5 Agents IA actifs 24/7
              </span>
              <span className="hidden sm:flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success inline-block animate-pulse" />
                Evidence Vault post-quantique
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success inline-block animate-pulse" />
                🇫🇷 100% Souverain France
              </span>
              <span className="hidden lg:flex items-center gap-1.5 font-semibold">
                🏆 Palantir-Killer : Ontology + Self-Healing + Preuve Post-Quantique
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className={`fixed top-8 left-0 right-0 z-40 transition-all duration-500 ${
          isScrolled
            ? "bg-background/85 backdrop-blur-2xl border-b border-border/60 shadow-[0_4px_32px_hsl(220_20%_2%/0.5)]"
            : ""
        }`}
      >
        <div className="container px-4">
          <nav className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group" aria-label="SECURIT-E">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center group-hover:bg-primary/25 transition-all">
                  <Cpu className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <div className="absolute inset-0 blur-md bg-primary/20 group-hover:bg-primary/40 transition-colors rounded-lg scale-75" />
              </div>
              <div className="hidden sm:flex flex-col leading-none">
                <span className="text-sm font-bold tracking-tight text-foreground"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  SECURIT-E
                </span>
                <span className="text-[9px] font-mono text-primary/60 tracking-widest">ARMURE CYBER AUTONOME</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50"
              >
                Comment ça marche
              </button>
              <Link
                to="/demo"
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50"
              >
                Démo live
              </Link>
              <Link
                to="/pricing"
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50"
              >
                Tarifs
              </Link>
            </div>

            {/* CTA group */}
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground border border-transparent hover:border-border text-xs gap-1.5"
                onClick={() => setDemoDialogOpen(true)}
              >
                <Zap className="w-3 h-3" />
                Réserver démo 15 min
              </Button>
              <Button
                size="sm"
                className="neon-glow btn-magnetic font-semibold text-xs gap-1.5"
                asChild
              >
                <Link to="/demo">
                  Voir démo agents live
                  <span className="text-primary-foreground/60 font-mono">(47s)</span>
                </Link>
              </Button>
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-foreground rounded-lg hover:bg-secondary/50 transition-colors"
              aria-label="Menu"
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <X className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Menu className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </nav>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="md:hidden bg-background/95 backdrop-blur-2xl border-b border-border overflow-hidden"
            >
              <div className="container px-4 py-4 space-y-1">
                <button
                  onClick={() => scrollToSection("how-it-works")}
                  className="block w-full text-left px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
                >
                  Comment ça marche
                </button>
                <Link to="/demo" className="block px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  Démo live (47s)
                </Link>
                <Link to="/pricing" className="block px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  Tarifs
                </Link>
                <div className="pt-2 space-y-2 border-t border-border">
                  <Button variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/5" onClick={() => { setIsMobileMenuOpen(false); setDemoDialogOpen(true); }}>
                    Réserver démo 15 min
                  </Button>
                  <Button className="w-full neon-glow font-semibold" asChild>
                    <Link to="/demo" onClick={() => setIsMobileMenuOpen(false)}>Voir démo agents live</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <DemoRequestDialog open={demoDialogOpen} onOpenChange={setDemoDialogOpen} ctaOrigin="nav_cta" sourcePage="/" />
    </>
  );
}
