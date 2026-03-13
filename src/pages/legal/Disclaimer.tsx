import { Link } from "react-router-dom";
import { Shield, ArrowLeft, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Disclaimer() {
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
            <CardTitle className="text-2xl">Limitation de Responsabilité</CardTitle>
            <p className="text-sm text-muted-foreground">
              Ce que SECURIT-E fait et ne fait pas
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-blue-500/50 bg-blue-500/10">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertTitle className="text-blue-600">SECURIT-E est un outil d'aide à la décision</AlertTitle>
              <AlertDescription className="text-blue-600/80">
                La plateforme agrège et présente des informations pour faciliter la gouvernance cyber, 
                mais ne remplace pas un audit de sécurité complet ni l'expertise d'un professionnel.
              </AlertDescription>
            </Alert>

            <section>
              <h2 className="text-xl font-semibold mb-3">1. Nature du service</h2>
              <p className="text-muted-foreground">
                SECURIT-E est une plateforme de <strong>gouvernance et de preuve cyber</strong> qui :
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
                <li>Importe et normalise des résultats d'outils de sécurité tiers</li>
                <li>Génère des rapports et tableaux de bord de synthèse</li>
                <li>Archive des preuves de diligence dans un coffre-fort immuable</li>
                <li>Facilite le suivi de conformité (RGPD, NIS2)</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                2. Ce que SECURIT-E NE fait PAS
              </h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>
                  <strong>Pas d'exécution active de scans</strong> : nous importons uniquement des 
                  résultats générés par des outils tiers (nmap, nuclei, etc.)
                </li>
                <li>
                  <strong>Pas de tests d'intrusion</strong> : aucune tentative d'exploitation de vulnérabilités
                </li>
                <li>
                  <strong>Pas de garantie d'exhaustivité</strong> : les vulnérabilités non détectées 
                  par les outils sources ne seront pas visibles
                </li>
                <li>
                  <strong>Pas de conseil juridique</strong> : les informations de conformité sont 
                  indicatives et ne remplacent pas un avis juridique
                </li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Limitation de garantie</h2>
              <p className="text-muted-foreground">
                SENTINEL EDGE est fourni "en l'état" (<em>as is</em>). L'Éditeur ne garantit pas :
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
                <li>L'absence totale de vulnérabilités dans vos systèmes</li>
                <li>L'exactitude ou l'exhaustivité des informations affichées</li>
                <li>La compatibilité avec tous les formats d'outils tiers</li>
                <li>La disponibilité continue et ininterrompue du service</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Exclusion de responsabilité</h2>
              <p className="text-muted-foreground">
                L'Éditeur ne pourra être tenu responsable des dommages résultant de :
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
                <li>L'utilisation ou l'impossibilité d'utiliser la plateforme</li>
                <li>Des décisions prises sur la base des informations fournies</li>
                <li>Des incidents de sécurité non détectés par les outils sources</li>
                <li>Des interruptions de service ou pertes de données</li>
                <li>L'utilisation non autorisée de la plateforme par l'Utilisateur</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                En tout état de cause, la responsabilité de l'Éditeur est limitée au montant 
                de l'abonnement annuel (490€ TTC).
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Responsabilité de l'Utilisateur</h2>
              <p className="text-muted-foreground">
                L'Utilisateur reste seul responsable de :
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
                <li>L'obtention des autorisations nécessaires avant toute analyse</li>
                <li>La qualité et la fiabilité des données importées</li>
                <li>Les actions entreprises suite aux recommandations</li>
                <li>La mise en œuvre effective des mesures de sécurité</li>
                <li>Le respect de la réglementation applicable</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Recommandations</h2>
              <p className="text-muted-foreground">
                Pour une évaluation complète de votre sécurité, nous recommandons de :
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
                <li>Compléter SENTINEL EDGE par des audits professionnels réguliers</li>
                <li>Faire valider les résultats par un expert en cybersécurité</li>
                <li>Mettre à jour régulièrement vos analyses</li>
                <li>Consulter un avocat pour les questions juridiques</li>
              </ul>
            </section>

            <div className="mt-8 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                <strong>En résumé :</strong> SENTINEL EDGE est un outil puissant pour piloter 
                votre gouvernance cyber et constituer des preuves de diligence, mais il ne 
                remplace pas l'expertise humaine ni les audits approfondis.
              </p>
            </div>

            <div className="mt-4 p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">
                <strong>Questions :</strong> contact@sentineledge.fr
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
