import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TrustBanner } from "@/components/ui/TrustBanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useProofPacksPaginated, type ProofPack } from "@/hooks/useProofPacks";
import { format } from "date-fns";
import { 
  Package, 
  Copy, 
  Eye, 
  Download, 
  CheckCircle2, 
  XCircle,
  FileJson,
  Shield,
  Loader2
} from "lucide-react";

export default function Proofs() {
  const { 
    data, 
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useProofPacksPaginated();
  const [selectedPack, setSelectedPack] = useState<ProofPack | null>(null);

  // Flatten all pages into a single array
  const proofPacks = data?.pages.flatMap(page => page.data) ?? [];
  const totalCount = proofPacks.length;

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast({
      title: "Hash Copied",
      description: "Pack hash copied to clipboard",
    });
  };

  const handleExportJson = (pack: ProofPack) => {
    const blob = new Blob([JSON.stringify(pack.pack_json, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proof-pack-${pack.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exported",
      description: "Proof pack JSON downloaded",
    });
  };

  const getChainStatus = (packJson: Record<string, unknown>) => {
    const chainVerification = packJson.chain_verification as { is_valid?: boolean } | undefined;
    return chainVerification?.is_valid ?? true;
  };

  return (
    <AppLayout>
      <TrustBanner />
      <div className="container py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-6 w-6" />
            Proof Packs
          </h1>
          <p className="text-muted-foreground">
            Auditor-ready evidence packages with hash verification
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Export History</CardTitle>
            <CardDescription>
              {totalCount} proof pack(s) loaded
              {hasNextPage && " • More available"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : proofPacks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No proof packs exported yet</p>
                <p className="text-sm">Export a proof pack from the GO/NO-GO page or a tool run</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Pack Hash</TableHead>
                      <TableHead>Chain Valid</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proofPacks.map((pack) => (
                      <TableRow key={pack.id}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(pack.created_at), "MMM d, yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          {pack.scope ? (
                            <Badge variant="outline">{pack.scope}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {pack.tool_run_id && (
                            <Badge variant="secondary">Tool Run</Badge>
                          )}
                          {pack.report_id && (
                            <Badge variant="secondary">Report</Badge>
                          )}
                          {!pack.tool_run_id && !pack.report_id && (
                            <span className="text-muted-foreground">Manual</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {pack.pack_hash ? (
                            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                              {pack.pack_hash.slice(0, 16)}...
                            </code>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              ⚠️ Hash manquant
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {getChainStatus(pack.pack_json) ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="text-sm">Valid</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-red-600">
                              <XCircle className="h-4 w-4" />
                              <span className="text-sm">Invalid</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={pack.status === "ready" ? "default" : "destructive"}
                          >
                            {pack.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedPack(pack)}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => pack.pack_hash && handleCopyHash(pack.pack_hash)}
                              title="Copy hash"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleExportJson(pack)}
                              title="Download JSON"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Load More Button */}
                {hasNextPage && (
                  <div className="flex justify-center mt-6">
                    <Button
                      variant="outline"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                    >
                      {isFetchingNextPage ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Chargement...
                        </>
                      ) : (
                        "Charger plus"
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={!!selectedPack} onOpenChange={() => setSelectedPack(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Proof Pack Details
              </DialogTitle>
              <DialogDescription>
                Pack ID: {selectedPack?.id}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Hash Display */}
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Pack Hash (SHA-256)</p>
                <code className="text-sm font-mono break-all">
                  {selectedPack?.pack_hash}
                </code>
              </div>

              {/* JSON Viewer */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    Pack Contents
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectedPack && handleExportJson(selectedPack)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                <ScrollArea className="h-[400px] border rounded-lg">
                  <pre className="p-4 text-xs font-mono">
                    {JSON.stringify(selectedPack?.pack_json, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
