import { Link } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Terms() {
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
            <CardTitle className="text-2xl">Conditions Générales d'Utilisation</CardTitle>
            <p className="text-sm text-muted-foreground">Dernière mise à jour : Janvier 2025</p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Objet</h2>
              <p className="text-muted-foreground">
                Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation 
                de la plateforme SECURIT-E, éditée par <strong>VLM Consulting</strong> — SIRET 835 125 089 000 28 — 59170 Croix, 
                ci-après dénommée "l'Éditeur".
              </p>
              <p className="text-muted-foreground">
                SECURIT-E est une plateforme SaaS de gouvernance et de preuve cyber, destinée aux
                entreprises souhaitant piloter leur conformité RGPD et NIS2.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Définitions</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Utilisateur</strong> : toute personne physique ou morale accédant à la plateforme</li>
                <li><strong>Abonnement</strong> : droit d'accès à la plateforme moyennant paiement</li>
                <li><strong>Evidence Vault</strong> : coffre-fort numérique de preuves immuables</li>
                <li><strong>Proof Pack</strong> : ensemble de preuves exportables et vérifiables</li>
                <li><strong>Autorisation</strong> : document légal autorisant l'analyse de sécurité</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Accès à la plateforme</h2>
              <p className="text-muted-foreground">
                L'accès à SECURIT-E nécessite la création d'un compte utilisateur et la souscription 
                à un abonnement. L'Utilisateur s'engage à fournir des informations exactes et à jour.
              </p>
              <p className="text-muted-foreground mt-2">
                <strong>Tarif :</strong> 490€ TTC par an, payable annuellement.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Obligations de l'Utilisateur</h2>
              <p className="text-muted-foreground">L'Utilisateur s'engage à :</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
                <li>Utiliser la plateforme de manière légale et éthique</li>
                <li>Disposer des autorisations nécessaires pour analyser les actifs déclarés</li>
                <li>Ne pas utiliser la plateforme à des fins malveillantes ou illégales</li>
                <li>Maintenir la confidentialité de ses identifiants de connexion</li>
                <li>Respecter la Charte d'Usage Autorisé</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Propriété intellectuelle</h2>
              <p className="text-muted-foreground">
                Tous les éléments de la plateforme (code, design, marques, contenus) sont la propriété 
                exclusive de l'Éditeur ou de ses partenaires. Toute reproduction non autorisée est interdite.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Protection des données</h2>
              <p className="text-muted-foreground">
                L'Éditeur s'engage à protéger les données personnelles conformément au RGPD. 
                Pour plus d'informations, consultez notre{" "}
                <Link to="/legal/privacy" className="text-primary hover:underline">
                  Politique de Confidentialité
                </Link>.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Limitation de responsabilité</h2>
              <p className="text-muted-foreground">
                SECURIT-E est un outil d'aide à la décision. L'Éditeur ne garantit pas l'absence 
                totale de vulnérabilités et ne saurait être tenu responsable des dommages résultant 
                de l'utilisation de la plateforme. Voir notre{" "}
                <Link to="/legal/disclaimer" className="text-primary hover:underline">
                  Clause de Limitation
                </Link>.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Modification des CGU</h2>
              <p className="text-muted-foreground">
                L'Éditeur se réserve le droit de modifier les présentes CGU à tout moment. 
                Les Utilisateurs seront informés de toute modification significative.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Droit applicable</h2>
              <p className="text-muted-foreground">
                Les présentes CGU sont soumises au droit français. Tout litige sera soumis 
                à la compétence exclusive des tribunaux de Paris.
              </p>
            </section>

            <div className="mt-8 p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">
                <strong>Contact :</strong> contact@securit-e.com
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
