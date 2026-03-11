import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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

export function LandingNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
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
      <div className="fixed top-0 left-0 right-0 z-50 bg-primary/10 backdrop-blur-sm border-b border-primary/20">
        <div className="container px-4">
          <div className="flex items-center justify-center gap-4 md:gap-8 py-2 text-xs md:text-sm text-primary">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              100% légal
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              Preuve autorisation obligatoire
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              Rapports Direction + Technique
            </span>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-8 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled ? "bg-background/80 backdrop-blur-xl border-b border-border" : ""
        }`}
      >
        <div className="container px-4">
          <nav className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <Shield className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-lg font-bold text-foreground hidden sm:block">SENTINEL EDGE</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-5">
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Comment ça marche
              </button>

              <Link
                to="/demo"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Démo
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Offres <ChevronDown className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56">
                  {offresLinks.map((link) => (
                    <DropdownMenuItem key={link.href} asChild>
                      <Link to={link.href} className="cursor-pointer">{link.label}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Link
                to="/pricing"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Tarifs
              </Link>

              <Button
                variant="outline"
                size="sm"
                className="border-primary/40 text-primary hover:bg-primary/10"
                onClick={() => setDemoDialogOpen(true)}
              >
                Demander une démo
              </Button>

              <Button size="sm" className="neon-glow" asChild>
                <Link to="/dashboard">Accéder au cockpit</Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-foreground"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </nav>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border"
          >
            <div className="container px-4 py-4 space-y-4">
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="block w-full text-left text-muted-foreground hover:text-foreground py-2"
              >
                Comment ça marche
              </button>

              <Link
                to="/demo"
                className="block text-muted-foreground hover:text-foreground py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Démo interactive
              </Link>

              <div className="py-2">
                <p className="text-sm font-medium text-foreground mb-2">Offres</p>
                <div className="pl-4 space-y-2">
                  {offresLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className="block text-sm text-muted-foreground hover:text-foreground py-1"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              <Link
                to="/pricing"
                className="block text-muted-foreground hover:text-foreground py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Tarifs
              </Link>

              <Button
                variant="outline"
                className="w-full border-primary/40 text-primary"
                onClick={() => { setIsMobileMenuOpen(false); setDemoDialogOpen(true); }}
              >
                Demander une démo
              </Button>

              <Button className="w-full neon-glow" asChild>
                <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                  Accéder au cockpit
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
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
