import { FileText, Plus, Upload, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { Document } from '@/types/database';

const documentSchema = z.object({
  title: z.string().min(2, 'Le titre doit contenir au moins 2 caractères'),
  document_type: z.string().min(1, 'Sélectionnez un type'),
  framework: z.enum(['gdpr', 'nis2']).optional(),
});

type DocumentFormData = z.infer<typeof documentSchema>;

export default function Documents() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: '',
      document_type: '',
    },
  });

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Document[];
    },
    enabled: !!organization?.id,
  });

  const computeHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const createMutation = useMutation({
    mutationFn: async (data: DocumentFormData) => {
      if (!organization?.id || !user?.id || !file) throw new Error('Missing data');

      const fileHash = await computeHash(file);
      const fileExt = file.name.split('.').pop();
      const fileUrl = `documents://${organization.id}/${crypto.randomUUID()}.${fileExt}`;

      const { data: doc, error } = await supabase
        .from('documents')
        .insert([{
          organization_id: organization.id,
          created_by: user.id,
          title: data.title,
          document_type: data.document_type,
          file_url: fileUrl,
          file_hash: fileHash,
          framework: data.framework || null,
        }])
        .select()
        .single();

      if (error) throw error;

      // Note: Evidence logging is now done server-side only via upload-document edge function
      return doc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document importé avec succès');
      setIsDialogOpen(false);
      form.reset();
      setFile(null);
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'import', { description: error.message });
    },
  });

  const documentTypes = [
    'Politique de sécurité',
    'Procédure',
    'Rapport d\'audit',
    'Certification',
    'Contrat',
    'DPIA',
    'Registre des traitements',
    'Autre',
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
            <p className="text-muted-foreground">
              Bibliothèque de documents de conformité et de sécurité.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Importer un document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importer un document</DialogTitle>
                <DialogDescription>
                  Ajoutez un document de conformité à votre bibliothèque.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                  <div className="space-y-2">
                    <FormLabel>Fichier</FormLabel>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      {file ? (
                        <div className="flex items-center justify-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setFile(null)}
                          >
                            Changer
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                            <p className="text-sm">Cliquez pour télécharger</p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titre</FormLabel>
                        <FormControl>
                          <Input placeholder="Politique de sécurité 2024" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="document_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de document</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {documentTypes.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="framework"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Référentiel (optionnel)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Aucun" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="gdpr">GDPR</SelectItem>
                            <SelectItem value="nis2">NIS2</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending || !file}>
                      {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Importer
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Bibliothèque de documents
            </CardTitle>
            <CardDescription>
              {documents?.length ?? 0} document(s) enregistré(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : documents?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Aucun document</p>
                <p className="text-sm text-muted-foreground">
                  Importez vos documents de conformité
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {documents?.map(doc => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{doc.title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{doc.document_type}</span>
                          <span>•</span>
                          <span>{new Date(doc.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <p className="text-xs font-mono text-muted-foreground">
                          Hash: {doc.file_hash.slice(0, 16)}...
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.framework && (
                          <Badge variant="outline" className="uppercase">
                            {doc.framework}
                          </Badge>
                        )}
                        <Badge variant="secondary">{doc.document_type}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
