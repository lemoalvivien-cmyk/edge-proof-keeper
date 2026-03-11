import { useState } from "react";
import { getHealth } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ApiTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await getHealth();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-foreground">Test API Cyber Serenity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleTest} disabled={loading} className="w-full">
            {loading ? "Test en cours..." : "Tester Cyber Serenity API"}
          </Button>

          {result !== null && (
            <div className="rounded-md border border-border bg-muted p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Résultat</p>
              <pre className="text-sm text-foreground whitespace-pre-wrap break-all">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          {error !== null && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4">
              <p className="text-xs font-semibold text-destructive mb-1 uppercase tracking-wide">Erreur</p>
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
