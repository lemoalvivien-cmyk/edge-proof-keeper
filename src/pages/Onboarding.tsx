import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Shield, 
  Building2, 
  UserPlus, 
  FileCheck, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STEPS = [
  { id: "organization", title: "Organisation", icon: Building2 },
  { id: "invite", title: "Équipe", icon: UserPlus },
  { id: "authorization", title: "Autorisation", icon: FileCheck },
];

const orgSchema = z.object({
  orgName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
});

const inviteSchema = z.object({
  memberEmail: z.string().email("Email invalide").optional().or(z.literal("")),
});

const authorizationSchema = z.object({
  domain: z.string().min(3, "Domaine requis"),
  scope: z.string().min(10, "Décrivez la portée de l'autorisation"),
});

type OrgFormData = z.infer<typeof orgSchema>;
type InviteFormData = z.infer<typeof inviteSchema>;
type AuthFormData = z.infer<typeof authorizationSchema>;

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [orgCreated, setOrgCreated] = useState(false);
  const navigate = useNavigate();
  const { user, organization, refreshProfile } = useAuth();

  const orgForm = useForm<OrgFormData>({
    resolver: zodResolver(orgSchema),
    defaultValues: { orgName: organization?.name || "" },
  });

  const inviteForm = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { memberEmail: "" },
  });

  const authForm = useForm<AuthFormData>({
    resolver: zodResolver(authorizationSchema),
    defaultValues: {
      domain: localStorage.getItem("sentinel_domain") || "",
      scope: "",
    },
  });

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleOrgSubmit = async (data: OrgFormData) => {
    if (organization) {
      // Already has org, skip
      setOrgCreated(true);
      setCurrentStep(1);
      return;
    }

    setIsLoading(true);
    try {
      const orgSlug = data.orgName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .insert({ name: data.orgName, slug: `${orgSlug}-${Date.now()}` })
        .select()
        .single();

      if (orgError) throw orgError;

      // Update profile with org
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ organization_id: orgData.id })
        .eq("id", user?.id);

      if (profileError) throw profileError;

      // Add admin role
      await supabase.from("user_roles").insert({
        user_id: user?.id,
        organization_id: orgData.id,
        role: "admin",
      });

      await refreshProfile();
      setOrgCreated(true);
      toast.success("Organisation créée !");
      setCurrentStep(1);
    } catch (error) {
      console.error("Error creating org:", error);
      toast.error("Erreur lors de la création de l'organisation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteSubmit = async (data: InviteFormData) => {
    // Optional step - just proceed
    if (data.memberEmail) {
      toast.info("Fonctionnalité d'invitation bientôt disponible");
    }
    setCurrentStep(2);
  };

  const handleAuthSubmit = async (data: AuthFormData) => {
    // Store data and redirect to ScopeGuard
    localStorage.setItem("sentinel_domain", data.domain);
    localStorage.setItem("sentinel_scope", data.scope);
    navigate("/scopeguard");
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipToImport = () => {
    navigate("/tools");
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">SENTINEL EDGE</span>
          </div>
          <Badge variant="outline" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            Configuration en 3 minutes
          </Badge>
          <Progress value={progress} className="h-2 mt-4" />
          <p className="text-sm text-muted-foreground mt-2">
            Étape {currentStep + 1} sur {STEPS.length}
          </p>
        </div>

        {/* Pricing Banner */}
        <div className="text-center mb-6">
          <Badge className="bg-primary/10 text-primary border-primary/20">
            490€ TTC/an — Paiement externe bientôt disponible
          </Badge>
        </div>

        {/* Steps */}
        <div className="flex justify-center gap-4 mb-8">
          {STEPS.map((step, idx) => (
            <div
              key={step.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                idx === currentStep
                  ? "bg-primary text-primary-foreground"
                  : idx < currentStep
                  ? "bg-green-500/10 text-green-600"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {idx < currentStep ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <step.icon className="h-4 w-4" />
              )}
              <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentStep === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Votre organisation
                  </CardTitle>
                  <CardDescription>
                    {organization
                      ? "Vous avez déjà une organisation"
                      : "Créez votre espace de travail sécurisé"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {organization ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <span className="font-medium">{organization.name}</span>
                        </div>
                      </div>
                      <Button onClick={() => setCurrentStep(1)} className="w-full">
                        Continuer
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Form {...orgForm}>
                      <form onSubmit={orgForm.handleSubmit(handleOrgSubmit)} className="space-y-4">
                        <FormField
                          control={orgForm.control}
                          name="orgName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nom de l'organisation</FormLabel>
                              <FormControl>
                                <Input placeholder="Ma Société SAS" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Créer l'organisation
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
            )}

            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Inviter un membre
                  </CardTitle>
                  <CardDescription>
                    Optionnel — vous pourrez en ajouter plus tard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...inviteForm}>
                    <form onSubmit={inviteForm.handleSubmit(handleInviteSubmit)} className="space-y-4">
                      <FormField
                        control={inviteForm.control}
                        name="memberEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email du collaborateur</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="collegue@entreprise.fr"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Laissez vide pour passer cette étape
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={goBack}>
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Retour
                        </Button>
                        <Button type="submit" className="flex-1">
                          Continuer
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5" />
                    Première autorisation
                  </CardTitle>
                  <CardDescription>
                    Définissez le périmètre de votre première analyse
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...authForm}>
                    <form onSubmit={authForm.handleSubmit(handleAuthSubmit)} className="space-y-4">
                      <FormField
                        control={authForm.control}
                        name="domain"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Domaine principal</FormLabel>
                            <FormControl>
                              <Input placeholder="entreprise.fr" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={authForm.control}
                        name="scope"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Portée de l'autorisation</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Analyse de sécurité du site web entreprise.fr"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Décrivez brièvement ce que vous analysez
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={goBack}>
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Retour
                        </Button>
                        <Button type="submit" className="flex-1">
                          Configurer l'autorisation
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </form>
                  </Form>

                  <div className="mt-6 pt-6 border-t">
                    <Button
                      variant="ghost"
                      className="w-full text-muted-foreground"
                      onClick={skipToImport}
                    >
                      J'ai déjà une autorisation — Importer des résultats
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
