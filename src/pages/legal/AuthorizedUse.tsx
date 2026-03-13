import { Link } from "react-router-dom";
import { Shield, ArrowLeft, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AuthorizedUse() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container py-4 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold">SECURIT-E</span>
          </div>
        </div>
      </header>

      <main className="container py-12 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Charte d'Usage Autorisé</CardTitle>
            <p className="text-sm text-muted-foreground">
              Règles d'utilisation éthique et légale de SECURIT-E
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-red-500/50 bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertTitle className="text-red-600">Avertissement important</AlertTitle>
              <AlertDescription className="text-red-600/80">
                Toute utilisation de SECURIT-E sans autorisation préalable des propriétaires 
                des actifs analysés est strictement interdite et peut constituer un délit pénal.
              </AlertDescription>
            </Alert>

            <section>
              <h2 className="text-xl font-semibold mb-3">1. Principe fondamental</h2>
              <p className="text-muted-foreground">
                SECURIT-E est conçu pour aider les organisations à évaluer et améliorer 
                leur posture de sécurité <strong>sur leurs propres actifs</strong> ou sur des actifs 
                pour lesquels elles disposent d'une <strong>autorisation écrite explicite</strong>.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                2. Usages autorisés
              </h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Analyse de sécurité de vos propres domaines et infrastructures</li>
                <li>Analyse pour un client avec mandat écrit et signé</li>
                <li>Audit interne dans le cadre de votre fonction</li>
                <li>Préparation à un audit de conformité (RGPD, NIS2)</li>
                <li>Formation et sensibilisation sur vos propres systèmes de test</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                3. Usages strictement interdits
              </h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Analyse d'actifs sans autorisation du propriétaire</li>
                <li>Tentative d'intrusion ou d'exploitation de vulnérabilités</li>
                <li>Utilisation à des fins de nuisance ou de chantage</li>
                <li>Collecte de données personnelles sans base légale</li>
                <li>Revente ou partage des résultats sans consentement</li>
                <li>Utilisation pour des activités illégales de quelque nature que ce soit</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Exigences de consentement</h2>
              <p className="text-muted-foreground">
                Avant toute utilisation de la plateforme, vous devez :
              </p>
              <ol className="list-decimal pl-6 text-muted-foreground space-y-2 mt-2">
                <li>
                  <strong>Uploader une preuve d'autorisation</strong> : document signé attestant 
                  de votre droit à analyser les actifs déclarés
                </li>
                <li>
                  <strong>Cocher les déclarations de consentement</strong> :
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>"Je déclare être autorisé à analyser ces actifs"</li>
                    <li>"Je comprends les limites de l'outil"</li>
                  </ul>
                </li>
                <li>
                  <strong>Accepter l'enregistrement</strong> : votre adresse IP et l'horodatage 
                  seront enregistrés dans l'Evidence Vault
                </li>
              </ol>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Traçabilité et preuve</h2>
              <p className="text-muted-foreground">
                Toutes les actions effectuées sur SECURIT-E sont enregistrées de manière 
                immuable dans l'Evidence Vault :
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
                <li>Horodatage de chaque action</li>
                <li>Adresse IP tronquée (RGPD)</li>
                <li>Hash SHA-256 des documents</li>
                <li>Chaîne de hash pour garantir l'intégrité</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                Ces enregistrements constituent des preuves opposables en cas de litige.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Sanctions</h2>
              <p className="text-muted-foreground">
                En cas de violation de la présente charte :
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
                <li><strong>Suspension immédiate</strong> du compte</li>
                <li><strong>Signalement aux autorités</strong> compétentes si nécessaire</li>
                <li><strong>Conservation des preuves</strong> pour d'éventuelles poursuites</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Cadre légal</h2>
              <p className="text-muted-foreground">
                L'utilisation non autorisée de systèmes informatiques est punie par :
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
                <li>
                  <strong>Article 323-1 du Code pénal</strong> : accès frauduleux à un système 
                  (jusqu'à 2 ans d'emprisonnement et 60 000€ d'amende)
                </li>
                <li>
                  <strong>Article 323-2 du Code pénal</strong> : entrave au fonctionnement 
                  (jusqu'à 5 ans d'emprisonnement et 150 000€ d'amende)
                </li>
                <li>
                  <strong>RGPD</strong> : collecte illicite de données personnelles
                </li>
              </ul>
            </section>

            <div className="mt-8 p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm font-medium">
                En utilisant SECURIT-E, vous acceptez la présente Charte d'Usage Autorisé 
                et vous engagez à respecter scrupuleusement ses dispositions.
              </p>
            </div>

            <div className="mt-4 p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">
                <strong>Signalement d'abus :</strong> abuse@sentineledge.fr
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
