/**
 * SECURIT-E — SovereignReportExport Component
 * Exporte un rapport Direction (CEO) + Technique (DSI) avec watermark souverain
 */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { FileText, Download, Loader2, Eye } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

interface SovereignReportExportProps {
  compact?: boolean;
}

export function SovereignReportExport({ compact = false }: SovereignReportExportProps) {
  const { organization } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState<{
    html: string;
    proof_hash: string;
    report: Record<string, unknown>;
  } | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const handleGenerate = async (reportType = "both") => {
    if (!organization?.id) return;
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Non authentifié");

      const res = await fetch(`${SUPABASE_URL}/functions/v1/export-sovereign-report`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organization_id: organization.id,
          report_type: reportType,
        }),
      });

      if (res.status === 429) {
        toast({ title: "Limite IA", description: "Réessayez dans quelques minutes", variant: "destructive" });
        return;
      }
      if (res.status === 402) {
        toast({ title: "Crédits IA épuisés", description: "Rechargez vos crédits", variant: "destructive" });
        return;
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Erreur ${res.status}`);

      setReportData(json);
      toast({
        title: "📄 Rapport souverain généré",
        description: `Hash SHA-256 : ${json.proof_hash?.slice(0, 16)}…`,
      });
    } catch (e: unknown) {
      toast({ title: "Erreur export", description: (e as Error).message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadHTML = () => {
    if (!reportData?.html) return;
    const blob = new Blob([reportData.html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SECURIT-E_Rapport_Souverain_${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "✅ Rapport téléchargé", description: "Ouvrez le fichier HTML dans votre navigateur pour imprimer en PDF" });
  };

  const handleDownloadJSON = () => {
    if (!reportData?.report) return;
    const blob = new Blob([JSON.stringify(reportData.report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SECURIT-E_Rapport_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePreview = () => {
    if (!reportData?.html) return;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(reportData.html);
      win.document.close();
    }
    setPreviewing(false);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleGenerate("both")}
          disabled={generating}
          className="gap-2"
        >
          {generating ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Génération…</>
          ) : (
            <><FileText className="h-4 w-4" />Exporter PDF</>
          )}
        </Button>
        {reportData && (
          <>
            <Button size="sm" variant="ghost" onClick={handlePreview} className="gap-1.5">
              <Eye className="h-4 w-4" />
              Prévisualiser
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDownloadHTML} className="gap-1.5">
              <Download className="h-4 w-4" />
              HTML→PDF
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        <div>
          <p className="font-semibold text-sm">Rapports Souverains</p>
          <p className="text-xs text-muted-foreground">Direction (CEO) + Technique (DSI) • Watermark SECURIT-E</p>
        </div>
        <Badge variant="outline" className="ml-auto text-xs border-primary/30 text-primary">
          🇫🇷 Souverain
        </Badge>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Button
          variant="outline"
          onClick={() => handleGenerate("direction")}
          disabled={generating}
          className="gap-2 justify-start"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          Rapport Direction
        </Button>
        <Button
          variant="outline"
          onClick={() => handleGenerate("technique")}
          disabled={generating}
          className="gap-2 justify-start"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          Rapport Technique
        </Button>
        <Button
          onClick={() => handleGenerate("both")}
          disabled={generating}
          className="gap-2 justify-start"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Rapport Complet
        </Button>
      </div>

      {/* Result */}
      {reportData && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">Rapport prêt</span>
            <code className="text-[10px] font-mono text-muted-foreground ml-auto">
              SHA-256: {reportData.proof_hash?.slice(0, 20)}…
            </code>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={handlePreview} variant="outline" className="gap-1.5 h-8">
              <Eye className="h-3.5 w-3.5" />
              Prévisualiser
            </Button>
            <Button size="sm" onClick={handleDownloadHTML} className="gap-1.5 h-8">
              <Download className="h-3.5 w-3.5" />
              Télécharger HTML → PDF
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDownloadJSON} className="gap-1.5 h-8">
              <Download className="h-3.5 w-3.5" />
              JSON
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            💡 Pour exporter en PDF : ouvrez le HTML dans votre navigateur → Fichier → Imprimer → Enregistrer en PDF
          </p>
          <p className="text-[10px] text-muted-foreground font-mono">
            🔐 Watermark : SECURIT-E — Souverain France — Preuve post-quantique
          </p>
        </div>
      )}
    </div>
  );
}
