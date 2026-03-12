import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoRequestDialog } from "@/components/ui/DemoRequestDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const offresLinks = [
  { href: "/offres/imports-hub", label: "Imports Hub" },
  { href: "/offres/devsecops-pack", label: "DevSecOps Pack" },
  { href: "/offres/audit-pack-cabinets", label: "Audit Pack Cabinets" },
  { href: "/offres/remediation-patch-bridge", label: "Remediation Patch Bridge" },
  { href: "/offres/continuous-governance", label: "Continuous Governance" },
  { href: "/offres/easm-osint-signals", label: "EASM & OSINT Signals" },
];

const navLinks = [
  { id: "how-it-works", label: "Comment ça marche", scroll: true },
  { href: "/demo", label: "Démo", scroll: false },
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
      {/* Trust Banner */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="bg-primary/8 backdrop-blur-md border-b border-primary/10">
          <div className="container px-4">
            <div className="flex items-center justify-center gap-6 md:gap-10 py-2 text-xs text-primary/80">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                100% légal &amp; auditable
              </span>
              <span className="hidden sm:flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                Preuve d'autorisation obligatoire
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                Rapports Direction + Technique
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
            ? "bg-background/85 backdrop-blur-2xl border-b border-border/60 shadow-[0_4px_32px_hsl(220_20%_2%/0.4)]"
            : ""
        }`}
      >
        <div className="container px-4">
          <nav className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group" aria-label="SENTINEL EDGE">
              <div className="relative">
                <Shield className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 blur-md bg-primary/30 group-hover:bg-primary/50 transition-colors rounded-full scale-75" />
              </div>
              <span className="text-base font-bold tracking-tight text-foreground hidden sm:block"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                SENTINEL EDGE
              </span>
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
                Démo
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50">
                  Offres <ChevronDown className="w-3.5 h-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-60 glass-card border-glass-border">
                  {offresLinks.map((link) => (
                    <DropdownMenuItem key={link.href} asChild>
                      <Link to={link.href} className="cursor-pointer text-sm">{link.label}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

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
                className="text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
                onClick={() => setDemoDialogOpen(true)}
              >
                Demander une démo
              </Button>

              <Button
                size="sm"
                className="neon-glow btn-magnetic font-semibold"
                asChild
              >
                <Link to="/dashboard">
                  Accéder au cockpit
                  <Shield className="w-3.5 h-3.5 ml-1" />
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
                <Link
                  to="/demo"
                  className="block px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Démo interactive
                </Link>
                <div className="py-1">
                  <p className="px-3 text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest mb-1">Offres</p>
                  <div className="space-y-0.5">
                    {offresLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
                <Link
                  to="/pricing"
                  className="block px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Tarifs
                </Link>
                <div className="pt-2 space-y-2 border-t border-border">
                  <Button
                    variant="outline"
                    className="w-full border-primary/30 text-primary hover:bg-primary/5"
                    onClick={() => { setIsMobileMenuOpen(false); setDemoDialogOpen(true); }}
                  >
                    Demander une démo
                  </Button>
                  <Button className="w-full neon-glow font-semibold" asChild>
                    <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                      Accéder au cockpit
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <DemoRequestDialog
        open={demoDialogOpen}
        onOpenChange={setDemoDialogOpen}
        ctaOrigin="nav_cta"
        sourcePage="/"
      />
    </>
  );
}
