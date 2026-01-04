import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, ArrowRight, FileSignature, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LandingNav } from "@/components/landing/LandingNav";
import { FooterSection } from "@/components/landing/FooterSection";

const ScopeGuard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [domain, setDomain] = useState("");
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Get domain from localStorage (set by landing hero)
    const storedDomain = localStorage.getItem("sentinel_domain");
    if (storedDomain) {
      setDomain(storedDomain);
    }
  }, []);

  const isValidDomain = (d: string) => {
    const regex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return regex.test(d.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!domain.trim() || !isValidDomain(domain)) {
      toast({
        title: "Domaine invalide",
        description: "Veuillez entrer un domaine valide (ex: entreprise.fr)",
        variant: "destructive",
      });
      return;
    }

    if (!consent) {
      toast({
        title: "Consentement requis",
        description: "Vous devez confirmer que vous êtes autorisé à scanner ce domaine.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Store the domain and consent for the authorization flow
    localStorage.setItem("sentinel_domain", domain.trim());
    localStorage.setItem("sentinel_consent_timestamp", new Date().toISOString());

    // Small delay for UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    toast({
      title: "Domaine validé",
      description: "Vous allez maintenant créer votre compte pour accéder à votre rapport.",
    });

    // Navigate to auth page (sign up flow)
    navigate("/auth?mode=signup&domain=" + encodeURIComponent(domain.trim()));
  };

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      <main className="pt-32 pb-16">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-glow mb-6">
                <FileSignature className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Étape 1 sur 3</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Wizard <span className="text-gradient">ScopeGuard</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Confirmez votre domaine et votre autorisation pour obtenir votre rapport choc.
              </p>
            </motion.div>

            {/* Main card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="glass-card border-glow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Périmètre du diagnostic
                  </CardTitle>
                  <CardDescription>
                    Nous analyserons uniquement les informations publiques liées à ce domaine.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Domain input */}
                    <div className="space-y-2">
                      <Label htmlFor="domain">Domaine à analyser *</Label>
                      <Input
                        id="domain"
                        type="text"
                        placeholder="votre-entreprise.fr"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        className="h-12 text-lg bg-secondary/50"
                        required
                      />
                      {domain && !isValidDomain(domain) && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          Format invalide. Exemple: entreprise.fr
                        </p>
                      )}
                      {domain && isValidDomain(domain) && (
                        <p className="text-sm text-success flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          Format valide
                        </p>
                      )}
                    </div>

                    {/* Legal notice */}
                    <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-3">
                      <h3 className="font-semibold text-foreground text-sm">
                        Ce que nous analysons :
                      </h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• DNS et configuration des enregistrements</li>
                        <li>• Certificats SSL/TLS exposés</li>
                        <li>• Headers de sécurité HTTP</li>
                        <li>• Ports et services visibles publiquement</li>
                        <li>• Présence dans les bases de fuites connues</li>
                      </ul>
                      <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                        Aucune intrusion, aucune donnée sensible collectée. 100% légal.
                      </p>
                    </div>

                    {/* Consent checkbox */}
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <Checkbox
                        id="consent"
                        checked={consent}
                        onCheckedChange={(checked) => setConsent(checked as boolean)}
                        className="mt-0.5"
                      />
                      <div>
                        <Label htmlFor="consent" className="font-medium text-foreground cursor-pointer">
                          Je confirme être autorisé à analyser ce domaine *
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Je certifie être propriétaire du domaine ou disposer d'une autorisation écrite 
                          pour effectuer cette analyse. Cette déclaration sera horodatée et conservée.
                        </p>
                      </div>
                    </div>

                    {/* Submit */}
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full h-14 text-lg font-semibold neon-glow hover:scale-105 transition-transform"
                      disabled={isSubmitting || !domain || !isValidDomain(domain) || !consent}
                    >
                      {isSubmitting ? (
                        "Validation en cours..."
                      ) : (
                        <>
                          Continuer vers mon rapport
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>

                    <p className="text-center text-xs text-muted-foreground">
                      Vous devrez créer un compte pour accéder à votre rapport complet.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Steps indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 flex justify-center gap-2"
            >
              <div className="w-8 h-1 rounded-full bg-primary" />
              <div className="w-8 h-1 rounded-full bg-secondary" />
              <div className="w-8 h-1 rounded-full bg-secondary" />
            </motion.div>
          </div>
        </div>
      </main>

      <FooterSection />
    </div>
  );
};

export default ScopeGuard;
