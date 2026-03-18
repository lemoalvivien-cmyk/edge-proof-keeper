// [FIXED: D5.1 NotFound — full French, branded empty state with back link]
import { Link } from "react-router-dom";
import { Shield, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mx-auto">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <p className="text-xl font-semibold text-foreground">Page introuvable</p>
          <p className="text-muted-foreground text-sm">
            Cette page n'existe pas ou a été déplacée.
            Vérifiez l'URL ou retournez à l'accueil.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/">
              <Home className="w-4 h-4" />
              Accueil
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link to="/dashboard">
              <ArrowLeft className="w-4 h-4" />
              Retour au cockpit
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
