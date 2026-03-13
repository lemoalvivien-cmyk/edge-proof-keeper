import { Link } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Privacy() {
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
            <CardTitle className="text-2xl">Politique de Confidentialité</CardTitle>
            <p className="text-sm text-muted-foreground">Dernière mise à jour : Janvier 2025</p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Responsable du traitement</h2>
              <p className="text-muted-foreground">
                [Nom de la société], éditeur de SECURIT-E, est responsable du traitement des 
                données personnelles collectées via la plateforme.
              </p>
              <p className="text-muted-foreground mt-2">
                <strong>Contact DPO :</strong> dpo@sentineledge.fr
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Données collectées</h2>
              <p className="text-muted-foreground">Nous collectons les données suivantes :</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
                <li><strong>Données d'identification :</strong> nom, email, organisation</li>
                <li><strong>Données de connexion :</strong> adresse IP (tronquée), horodatage</li>
                <li><strong>Données d'utilisation :</strong> actions effectuées sur la plateforme</li>
                <li><strong>Documents uploadés :</strong> autorisations, rapports d'outils</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Finalités du traitement</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Fourniture et amélioration du service</li>
                <li>Gestion des comptes utilisateurs</li>
                <li>Génération de preuves d'audit (Evidence Vault)</li>
                <li>Conformité légale et réglementaire</li>
                <li>Communication avec les utilisateurs</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Base légale</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Exécution du contrat :</strong> fourniture du service</li>
                <li><strong>Intérêt légitime :</strong> amélioration et sécurité</li>
                <li><strong>Obligation légale :</strong> conservation des preuves</li>
                <li><strong>Consentement :</strong> communications marketing (optionnel)</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Durée de conservation</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Données de compte :</strong> durée de l'abonnement + 3 ans</li>
                <li><strong>Evidence Vault :</strong> 10 ans (exigence d'auditabilité)</li>
                <li><strong>Logs de connexion :</strong> 1 an</li>
                <li><strong>Cookies :</strong> 13 mois maximum</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Partage des données</h2>
              <p className="text-muted-foreground">
                Vos données ne sont jamais vendues. Elles peuvent être partagées avec :
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
                <li>Nos sous-traitants techniques (hébergement en France/UE)</li>
                <li>Les autorités compétentes en cas d'obligation légale</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Transferts internationaux</h2>
              <p className="text-muted-foreground">
                Toutes les données sont hébergées en France 🇫🇷. Aucun transfert hors UE n'est effectué 
                sans garanties appropriées (clauses contractuelles types, décision d'adéquation).
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Vos droits</h2>
              <p className="text-muted-foreground">
                Conformément au RGPD, vous disposez des droits suivants :
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
                <li><strong>Accès :</strong> obtenir une copie de vos données</li>
                <li><strong>Rectification :</strong> corriger des données inexactes</li>
                <li><strong>Effacement :</strong> demander la suppression (sous conditions)</li>
                <li><strong>Portabilité :</strong> récupérer vos données dans un format standard</li>
                <li><strong>Opposition :</strong> vous opposer à certains traitements</li>
                <li><strong>Limitation :</strong> restreindre le traitement</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                Pour exercer ces droits : <strong>privacy@sentineledge.fr</strong>
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Sécurité</h2>
              <p className="text-muted-foreground">
                Nous mettons en œuvre des mesures techniques et organisationnelles appropriées :
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
                <li>Chiffrement des données en transit et au repos</li>
                <li>Authentification forte</li>
                <li>Contrôle d'accès basé sur les rôles (RBAC)</li>
                <li>Journalisation des accès (Evidence Vault)</li>
                <li>Tests de sécurité réguliers</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Réclamations</h2>
              <p className="text-muted-foreground">
                En cas de désaccord, vous pouvez déposer une réclamation auprès de la CNIL :
              </p>
              <p className="text-muted-foreground mt-2">
                <strong>CNIL</strong> - 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07
                <br />
                <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  www.cnil.fr
                </a>
              </p>
            </section>

            <div className="mt-8 p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">
                <strong>Contact :</strong> privacy@sentineledge.fr
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
