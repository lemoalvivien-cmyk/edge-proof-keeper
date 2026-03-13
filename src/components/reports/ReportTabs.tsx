import { useState } from 'react';
import { Download, Printer, FileText, Briefcase, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Report } from '@/types/reports';

interface ReportTabsProps {
  report: Report;
}

// Simple Markdown renderer - handles headers, bold, tables, lists
function renderMarkdown(md: string | null): React.ReactNode {
  if (!md) return <p className="text-muted-foreground">Contenu non disponible</p>;

  const lines = md.split('\n');
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];

  const flushTable = () => {
    if (tableRows.length > 0) {
      elements.push(
        <div key={`table-${elements.length}`} className="overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                {tableHeaders.map((h, i) => (
                  <th key={i} className="text-left p-2 font-medium">{h.trim()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, ri) => (
                <tr key={ri} className="border-b">
                  {row.map((cell, ci) => (
                    <td key={ci} className="p-2">{cell.trim()}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    tableHeaders = [];
    tableRows = [];
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Table detection
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.slice(1, -1).split('|');
      if (!inTable) {
        // Check if next line is separator
        const nextLine = lines[i + 1] || '';
        if (nextLine.includes('---')) {
          tableHeaders = cells;
          inTable = true;
          i++; // Skip separator line
          continue;
        }
      }
      if (inTable) {
        tableRows.push(cells);
        continue;
      }
    } else if (inTable) {
      flushTable();
    }

    // Headers
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="text-2xl font-bold mt-6 mb-4">{line.slice(2)}</h1>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-xl font-semibold mt-6 mb-3">{line.slice(3)}</h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{line.slice(4)}</h3>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li key={i} className="ml-4 list-disc">{renderInline(line.slice(2))}</li>
      );
    } else if (/^\d+\. /.test(line)) {
      const match = line.match(/^\d+\. (.*)$/);
      if (match) {
        elements.push(
          <li key={i} className="ml-4 list-decimal">{renderInline(match[1])}</li>
        );
      }
    } else if (line.startsWith('---')) {
      elements.push(<hr key={i} className="my-4 border-border" />);
    } else if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
      elements.push(
        <p key={i} className="text-sm text-muted-foreground italic">{line.slice(1, -1)}</p>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="mb-2">{renderInline(line)}</p>
      );
    }
  }

  // Flush any remaining table
  flushTable();

  return <div className="prose prose-sm max-w-none dark:prose-invert">{elements}</div>;
}

// Handle inline formatting
function renderInline(text: string): React.ReactNode {
  // Handle bold **text**
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

export function ReportTabs({ report }: ReportTabsProps) {
  const [activeTab, setActiveTab] = useState<'executive' | 'technical'>('executive');

  const handleExportJson = () => {
    const exportData = {
      executive: report.executive_json,
      technical: report.technical_json,
      metadata: {
        report_id: report.id,
        tool_run_id: report.tool_run_id,
        generated_at: report.created_at,
      },
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `securit-e-report-${report.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  if (report.status !== 'ready') {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          {report.status === 'generating' && (
            <div className="space-y-4">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-muted-foreground">Génération du rapport en cours...</p>
            </div>
          )}
          {report.status === 'failed' && (
            <div className="space-y-2">
              <p className="text-destructive font-medium">Échec de la génération</p>
              <p className="text-muted-foreground text-sm">
                Veuillez réessayer ou contacter le support
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Export buttons */}
      <div className="flex justify-end gap-2 print:hidden">
        <Button variant="outline" onClick={handleExportJson}>
          <Download className="h-4 w-4 mr-2" />
          Exporter JSON
        </Button>
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimer PDF
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'executive' | 'technical')}>
        <TabsList className="print:hidden">
          <TabsTrigger value="executive" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Rapport Direction
          </TabsTrigger>
          <TabsTrigger value="technical" className="gap-2">
            <Code className="h-4 w-4" />
            Rapport Technique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="executive" className="mt-4">
          <Card>
            <CardHeader className="print:pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Rapport Direction (CEO/DG)
                </CardTitle>
                <Badge variant="outline">
                  Confiance: {report.executive_json?.confidence || 'N/A'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {renderMarkdown(report.executive_md)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="mt-4">
          <Card>
            <CardHeader className="print:pb-2">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Rapport Technique (DSI/Tech)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderMarkdown(report.technical_md)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Print-only: show both reports */}
      <div className="hidden print:block space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-4">Rapport Direction</h1>
          {renderMarkdown(report.executive_md)}
        </div>
        <div className="page-break-before">
          <h1 className="text-2xl font-bold mb-4">Rapport Technique</h1>
          {renderMarkdown(report.technical_md)}
        </div>
      </div>
    </div>
  );
}
