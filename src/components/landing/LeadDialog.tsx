import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface LeadDialogProps {
  trigger: React.ReactNode;
  defaultDomain?: string;
}

export function LeadDialog({ trigger, defaultDomain = "" }: LeadDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    company: "",
    role: "",
    domain: defaultDomain,
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call (mock for now)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Store lead in localStorage as mock
    const leads = JSON.parse(localStorage.getItem("sentinel_leads") || "[]");
    leads.push({
      ...formData,
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID(),
    });
    localStorage.setItem("sentinel_leads", JSON.stringify(leads));

    setIsSubmitting(false);
    setIsSuccess(true);

    toast({
      title: "Demande enregistrée !",
      description: "Nous vous contacterons dans les 24h pour activer votre compte.",
    });

    // Reset after 3 seconds
    setTimeout(() => {
      setOpen(false);
      setIsSuccess(false);
      setFormData({ email: "", company: "", role: "", domain: defaultDomain });
    }, 3000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md glass-card border-glass-border">
        <DialogHeader>
          <DialogTitle className="text-xl">Demander l'activation</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Remplissez ce formulaire et nous activerons votre compte SENTINEL EDGE sous 24h.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 text-center space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="w-16 h-16 mx-auto rounded-full bg-success/20 flex items-center justify-center"
              >
                <CheckCircle2 className="w-8 h-8 text-success" />
              </motion.div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Demande envoyée !</h3>
                <p className="text-sm text-muted-foreground">
                  Un email de confirmation vous a été envoyé à {formData.email}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-4 pt-2"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email professionnel *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@entreprise.fr"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  required
                  className="bg-secondary/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Nom de la société *</Label>
                <Input
                  id="company"
                  type="text"
                  placeholder="Votre Entreprise SAS"
                  value={formData.company}
                  onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
                  required
                  className="bg-secondary/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Votre rôle *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
                  required
                >
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue placeholder="Sélectionnez votre rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dirigeant">Dirigeant / CEO</SelectItem>
                    <SelectItem value="dsi">DSI / CTO</SelectItem>
                    <SelectItem value="rssi">RSSI / CISO</SelectItem>
                    <SelectItem value="dpo">DPO</SelectItem>
                    <SelectItem value="daf">DAF / CFO</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">Domaine principal</Label>
                <Input
                  id="domain"
                  type="text"
                  placeholder="votre-entreprise.fr"
                  value={formData.domain}
                  onChange={(e) => setFormData((prev) => ({ ...prev, domain: e.target.value }))}
                  className="bg-secondary/50"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold neon-glow"
                disabled={isSubmitting || !formData.email || !formData.company || !formData.role}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer ma demande
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                En soumettant ce formulaire, vous acceptez d'être contacté par SENTINEL EDGE.
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
