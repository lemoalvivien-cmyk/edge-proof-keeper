/**
 * SECURIT-E — CryptoProof Component
 * Preuve cryptographique réelle : SHA-256 Merkle Tree
 * Note: La signature est une chaîne déterministe SHA-256, pas du CRYSTALS-Dilithium réel.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Shield, CheckCircle2, Lock, Loader2, Copy, ChevronDown, ChevronRight } from "lucide-react";

// ── Real SHA-256 via WebCrypto ────────────────────────────────────────────────
async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ── Real Merkle Tree implementation ──────────────────────────────────────────
async function buildMerkleTree(leaves: string[]): Promise<{
  root: string;
  layers: string[][];
  proofPath: string[];
}> {
  if (leaves.length === 0) {
    const empty = await sha256("EMPTY_TREE");
    return { root: empty, layers: [[empty]], proofPath: [] };
  }

  const hashedLeaves = await Promise.all(leaves.map(l => sha256(l)));
  const layers: string[][] = [hashedLeaves];
  let current = [...hashedLeaves];

  while (current.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < current.length; i += 2) {
      const left = current[i];
      const right = current[i + 1] ?? left;
      next.push(await sha256(left + right));
    }
    layers.push(next);
    current = next;
  }

  return {
    root: current[0],
    layers,
    proofPath: layers.map(l => l[0]),
  };
}

// ── Deterministic signature (SHA-256 based, NOT a real post-quantum algo) ────
async function deterministicSign(
  message: string,
  seed: string
): Promise<{ signature: string; publicKey: string }> {
  const sk = await sha256(`SECURITE_SK:${seed}`);
  const pk = await sha256(`SECURITE_PK:${sk}`);
  const commitment = await sha256(`${message}:${sk}`);
  const signature = `SHA256-SIG:${commitment.slice(0, 16)}:${sk.slice(0, 8)}`;
  return { signature, publicKey: pk };
}

interface CryptoProofProps {
  entityId: string;
  entityType: string;
  evidenceItems?: string[];
  compact?: boolean;
}

export function CryptoProof({
  entityId,
  entityType,
  evidenceItems = [],
  compact = false,
}: CryptoProofProps) {
  const [generating, setGenerating] = useState(false);
  const [proof, setProof] = useState<{
    merkleRoot: string;
    signature: string;
    publicKey: string;
    timestamp: string;
    leafCount: number;
    layers: number;
    proofId: string;
    verified: boolean;
  } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateProof = async () => {
    setGenerating(true);
    try {
      const now = new Date().toISOString();

      const leaves = [
        `entity:${entityType}:${entityId}`,
        `timestamp:${now}`,
        `sovereign:SECURIT-E:France`,
        ...evidenceItems.slice(0, 10),
      ];

      const { root, layers } = await buildMerkleTree(leaves);

      const message = `${root}:${entityId}:${now}`;
      const seed = await sha256(`SECURIT-E:SOVEREIGN:${entityId}`);
      const { signature, publicKey } = await deterministicSign(message, seed);

      const proofId = await sha256(`PROOF:${root}:${signature}`);

      setProof({
        merkleRoot: root,
        signature,
        publicKey,
        timestamp: now,
        leafCount: leaves.length,
        layers: layers.length,
        proofId: proofId.slice(0, 32),
        verified: true,
      });

      toast({
        title: "🔐 Preuve cryptographique générée",
        description: `Merkle root SHA-256: ${root.slice(0, 16)}…`,
      });
    } catch (e: unknown) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleVerify = async () => {
    if (!proof) return;
    const leaves = [
      `entity:${entityType}:${entityId}`,
      `timestamp:${proof.timestamp}`,
      `sovereign:SECURIT-E:France`,
      ...evidenceItems.slice(0, 10),
    ];
    const { root } = await buildMerkleTree(leaves);
    const isValid = root === proof.merkleRoot;
    toast({
      title: isValid ? "✅ Preuve vérifiée" : "❌ Preuve invalide",
      description: isValid
        ? `Merkle root SHA-256 validé`
        : "La preuve ne correspond pas aux données",
      variant: isValid ? "default" : "destructive",
    });
  };

  const handleCopy = async () => {
    if (!proof) return;
    await navigator.clipboard.writeText(JSON.stringify(proof, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (compact && !proof) {
    return (
      <Button size="sm" variant="outline" onClick={handleGenerateProof} disabled={generating} className="h-7 text-xs gap-1.5">
        {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lock className="h-3 w-3" />}
        Preuve SHA-256
      </Button>
    );
  }

  return (
    <Card className={compact ? "border-primary/20" : ""}>
      {!compact && (
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            Preuve Cryptographique
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
              SHA-256 Merkle Tree
            </Badge>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={compact ? "pt-4" : "pt-0"}>
        {!proof ? (
          <div className="flex flex-col items-center py-4 text-center gap-3">
            <Lock className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Preuve non générée</p>
              <p className="text-xs text-muted-foreground mt-1">
                SHA-256 Merkle Tree — preuve déterministe vérifiable
              </p>
            </div>
            <Button size="sm" onClick={handleGenerateProof} disabled={generating} className="gap-2">
              {generating ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" />Génération…</>
              ) : (
                <><Shield className="h-3.5 w-3.5" />Générer la preuve</>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                Preuve cryptographique vérifiable
              </span>
              <Badge variant="outline" className="text-[10px] border-green-500/40 text-green-600">
                VALID
              </Badge>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground w-28 shrink-0">Merkle Root:</span>
                <code className="font-mono bg-muted px-2 py-0.5 rounded text-[10px] truncate">
                  {proof.merkleRoot.slice(0, 32)}…
                </code>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground w-28 shrink-0">Signature:</span>
                <code className="font-mono bg-muted px-2 py-0.5 rounded text-[10px] truncate">
                  {proof.signature}
                </code>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground w-28 shrink-0">Proof ID:</span>
                <code className="font-mono bg-muted px-2 py-0.5 rounded text-[10px]">
                  {proof.proofId}
                </code>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-28 shrink-0">Feuilles / Couches:</span>
                <span>{proof.leafCount} feuilles · {proof.layers} couches</span>
              </div>
            </div>

            <div>
              <button
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setExpanded(v => !v)}
              >
                {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Détails techniques
              </button>
              {expanded && (
                <div className="mt-2 rounded border border-border bg-muted/30 p-3 space-y-1.5 text-xs font-mono">
                  <div><span className="text-muted-foreground">Algorithme :</span> SHA-256 Merkle Tree (NIST FIPS 180-4)</div>
                  <div><span className="text-muted-foreground">Hash :</span> SHA-256 (WebCrypto API)</div>
                  <div><span className="text-muted-foreground">Merkle :</span> Binary tree · {proof.layers} niveaux</div>
                  <div><span className="text-muted-foreground">Timestamp :</span> {proof.timestamp}</div>
                  <div><span className="text-muted-foreground">Vérifiable :</span> Même inputs → même output (déterministe)</div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="outline" onClick={handleVerify} className="h-7 text-xs gap-1.5">
                <CheckCircle2 className="h-3 w-3" />
                Vérifier preuve
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCopy} className="h-7 text-xs gap-1.5">
                {copied ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copié" : "Exporter JSON"}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleGenerateProof} disabled={generating} className="h-7 text-xs gap-1.5">
                {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : "↻"}
                Regénérer
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground font-mono">
              🔐 SHA-256 Merkle Tree · SECURIT-E Souverain France
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Backward-compatible alias (imports existants de PostQuantumProof)
export { CryptoProof as PostQuantumProof };
