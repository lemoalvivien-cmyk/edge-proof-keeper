import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, ArrowRight, ArrowLeft, FileSignature, CheckCircle2, 
  AlertCircle, Upload, Loader2, Clock, Users, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LandingNav } from "@/components/landing/LandingNav";
import { FooterSection } from "@/components/landing/FooterSection";
import { TrustBanner } from "@/components/ui/TrustBanner";
import { useAuth } from "@/contexts/AuthContext";
import { useUploadAuthorization } from "@/hooks/useUploadAuthorization";

type WizardStep = 1 | 2 | 3;
type ScopeOption = 'vulnerability' | 'asset_discovery' | 'document_import';

const SCOPE_OPTIONS: { value: ScopeOption; label: string; description: string }[] = [
  { value: 'vulnerability', label: 'Scan de vulnérabilités', description: 'Détection des failles de sécurité' },
  { value: 'asset_discovery', label: 'Découverte d\'actifs', description: 'Inventaire automatique de vos actifs IT' },
  { value: 'document_import', label: 'Import de documents', description: 'Analyse de conformité documentaire' },
];

const ScopeGuard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, organization, isAdmin } = useAuth();
  const uploadMutation = useUploadAuthorization();
  
  const [step, setStep] = useState<WizardStep>(1);
  const [domain, setDomain] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<ScopeOption[]>(['vulnerability']);
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [authorizationResult, setAuthorizationResult] = useState<{
    id: string;
    status: 'approved' | 'pending';
  } | null>(null);

  useEffect(() => {
    const storedDomain = localStorage.getItem("sentinel_domain");
    if (storedDomain) {
      setDomain(storedDomain);
    }
  }, []);

  const isValidDomain = useCallback((d: string) => {
    const regex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return regex.test(d.trim());
  }, []);

  const toggleScope = (scope: ScopeOption) => {
    setSelectedScopes(prev => 
      prev.includes(scope) 
        ? prev.filter(s => s !== scope)
        : [...prev, scope]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: "Type de fichier non supporté",
          description: "Seuls les fichiers PDF, PNG et JPG sont acceptés.",
          variant: "destructive",
        });
        return;
      }
      // Validate file size (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "La taille maximale est de 10 Mo.",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleStep1Submit = () => {
    if (!domain.trim() || !isValidDomain(domain)) {
      toast({
        title: "Domaine invalide",
        description: "Veuillez entrer un domaine valide (ex: entreprise.fr)",
        variant: "destructive",
      });
      return;
    }
    if (selectedScopes.length === 0) {
      toast({
        title: "Périmètre requis",
        description: "Veuillez sélectionner au moins une opération.",
        variant: "destructive",
      });
      return;
    }
    
    localStorage.setItem("sentinel_domain", domain.trim());
    
    // If user is not authenticated, redirect to auth
    if (!user || !organization) {
      navigate("/auth?mode=signup&domain=" + encodeURIComponent(domain.trim()));
      return;
    }
    
    setStep(2);
  };

  const handleStep2Submit = async () => {
    if (!file) {
      toast({
        title: "Document requis",
        description: "Veuillez téléverser un document d'autorisation.",
        variant: "destructive",
      });
      return;
    }
    if (!consent) {
      toast({
        title: "Consentement requis",
        description: "Vous devez confirmer votre autorisation.",
        variant: "destructive",
      });
      return;
    }
    if (!organization) {
      toast({
        title: "Organisation manquante",
        description: "Veuillez vous reconnecter.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await uploadMutation.mutateAsync({
        file,
        organizationId: organization.id,
        scope: `domain:${domain};operations:${selectedScopes.join(',')}`,
        consentCheckbox: true,
      });

      setAuthorizationResult({
        id: result.authorization.id,
        status: result.status,
      });
      setStep(3);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Échec du téléversement",
        variant: "destructive",
      });
    }
  };

  const handleCreateAsset = () => {
    localStorage.setItem("sentinel_new_asset_domain", domain);
    localStorage.setItem("sentinel_authorization_id", authorizationResult?.id || "");
    navigate("/assets");
  };

  const handleNotifyAdmin = () => {
    toast({
      title: "Notification envoyée",
      description: "L'administrateur a été notifié. Vous serez informé dès validation.",
    });
  };

  // If not authenticated and trying to access step 2+, redirect
  useEffect(() => {
    if (step > 1 && (!user || !organization)) {
      setStep(1);
    }
  }, [step, user, organization]);

  const renderStep1 = () => (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <Card className="glass-card border-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Domaine & Périmètre
          </CardTitle>
          <CardDescription>
            Définissez le domaine et les opérations à effectuer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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

          {/* Scope selection */}
          <div className="space-y-3">
            <Label>Opérations souhaitées *</Label>
            <div className="grid gap-3">
              {SCOPE_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  onClick={() => toggleScope(option.value)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedScopes.includes(option.value)
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-secondary/30 hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      checked={selectedScopes.includes(option.value)}
                      onCheckedChange={() => toggleScope(option.value)}
                    />
                    <div>
                      <p className="font-medium text-foreground">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legal reminder */}
          <TrustBanner />

          <Button
            onClick={handleStep1Submit}
            size="lg"
            className="w-full h-14 text-lg font-semibold neon-glow hover:scale-105 transition-transform"
            disabled={!domain || !isValidDomain(domain) || selectedScopes.length === 0}
          >
            {user ? 'Continuer' : 'Créer mon compte'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          {!user && (
            <p className="text-center text-xs text-muted-foreground">
              Vous devrez créer un compte pour accéder à votre rapport complet.
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <Card className="glass-card border-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Preuve d'autorisation
          </CardTitle>
          <CardDescription>
            Téléversez un document prouvant votre autorisation (contrat, email, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Domain recap */}
          <div className="p-4 rounded-xl bg-secondary/50 border border-border">
            <p className="text-sm text-muted-foreground">Domaine sélectionné</p>
            <p className="font-mono text-lg text-foreground">{domain}</p>
            <p className="text-sm text-muted-foreground mt-2">Opérations</p>
            <p className="text-foreground">
              {selectedScopes.map(s => SCOPE_OPTIONS.find(o => o.value === s)?.label).join(', ')}
            </p>
          </div>

          {/* File upload */}
          <div className="space-y-3">
            <Label htmlFor="file">Document d'autorisation *</Label>
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                id="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file" className="cursor-pointer">
                {file ? (
                  <div className="space-y-2">
                    <CheckCircle2 className="w-12 h-12 mx-auto text-success" />
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} Mo
                    </p>
                    <p className="text-xs text-primary">Cliquez pour changer</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="font-medium text-foreground">
                      Cliquez pour téléverser
                    </p>
                    <p className="text-sm text-muted-foreground">
                      PDF, PNG ou JPG • Max 10 Mo
                    </p>
                  </div>
                )}
              </label>
            </div>
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
                Je certifie être autorisé à effectuer ces opérations *
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Je déclare être propriétaire du domaine ou disposer d'une autorisation écrite. 
                Cette déclaration sera horodatée, hashée et conservée dans l'Evidence Vault.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="h-12"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <Button
              onClick={handleStep2Submit}
              size="lg"
              className="flex-1 h-12 text-lg font-semibold neon-glow hover:scale-105 transition-transform"
              disabled={!file || !consent || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Traitement en cours...
                </>
              ) : (
                <>
                  Valider l'autorisation
                  <Shield className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      key="step3"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
    >
      <Card className="glass-card border-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {authorizationResult?.status === 'approved' ? (
              <>
                <CheckCircle2 className="w-6 h-6 text-success" />
                Autorisation validée
              </>
            ) : (
              <>
                <Clock className="w-6 h-6 text-warning" />
                En attente de validation
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {authorizationResult?.status === 'approved' ? (
            <>
              <div className="p-6 rounded-xl bg-success/10 border border-success/30 text-center">
                <CheckCircle2 className="w-16 h-16 mx-auto text-success mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Félicitations !
                </h3>
                <p className="text-muted-foreground">
                  Votre autorisation a été approuvée automatiquement. 
                  Vous pouvez maintenant créer vos actifs et lancer vos scans.
                </p>
              </div>

              <div className="grid gap-3">
                <Button
                  onClick={handleCreateAsset}
                  size="lg"
                  className="w-full h-14 text-lg font-semibold neon-glow hover:scale-105 transition-transform"
                >
                  Créer mon premier actif
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  className="w-full h-12"
                >
                  Aller au tableau de bord
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="p-6 rounded-xl bg-warning/10 border border-warning/30 text-center">
                <Clock className="w-16 h-16 mx-auto text-warning mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Autorisation en attente
                </h3>
                <p className="text-muted-foreground">
                  Votre demande d'autorisation a été soumise et doit être validée par un administrateur.
                  Vous serez notifié dès l'approbation.
                </p>
              </div>

              <div className="grid gap-3">
                <Button
                  onClick={handleNotifyAdmin}
                  size="lg"
                  className="w-full h-14 text-lg font-semibold"
                  variant="outline"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Prévenir l'administrateur
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/dashboard")}
                  className="w-full h-12"
                >
                  Aller au tableau de bord
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Une fois approuvé, vous pourrez lancer vos scans et imports.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

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
              className="text-center mb-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-glow mb-6">
                <FileSignature className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  Étape {step} sur 3
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Wizard <span className="text-gradient">ScopeGuard</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                {step === 1 && "Définissez votre périmètre d'analyse"}
                {step === 2 && "Fournissez votre preuve d'autorisation"}
                {step === 3 && "Confirmez et lancez vos opérations"}
              </p>
            </motion.div>

            {/* Step content */}
            <AnimatePresence mode="wait">
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
            </AnimatePresence>

            {/* Steps indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 flex justify-center gap-2"
            >
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-8 h-1 rounded-full transition-colors ${
                    s <= step ? 'bg-primary' : 'bg-secondary'
                  }`}
                />
              ))}
            </motion.div>
          </div>
        </div>
      </main>

      <FooterSection />
    </div>
  );
};

export default ScopeGuard;
