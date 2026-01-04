import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileCheck, Upload, Loader2, CheckCircle2, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { sanitizeTextInput } from '@/lib/validation';

const authorizationSchema = z.object({
  scope: z.string()
    .min(10, 'La portée doit contenir au moins 10 caractères')
    .max(1000, 'La portée ne peut pas dépasser 1000 caractères')
    .refine(val => val.trim().length >= 10, 'La portée ne peut pas être vide ou contenir uniquement des espaces'),
  validUntil: z.string().optional(),
  consent: z.boolean().refine(val => val === true, {
    message: 'Vous devez accepter les conditions',
  }),
});

type AuthorizationFormData = z.infer<typeof authorizationSchema>;

export default function NewAuthorization() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const { user, organization } = useAuth();
  const navigate = useNavigate();

  const form = useForm<AuthorizationFormData>({
    resolver: zodResolver(authorizationSchema),
    defaultValues: {
      scope: '',
      validUntil: '',
      consent: false,
    },
  });

  // Compute SHA-256 hash of file
  const computeHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Get client IP
  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${organization?.id}/${crypto.randomUUID()}.${fileExt}`;
      
      // For now, we'll create a placeholder URL since storage isn't set up
      // In production, this would upload to Supabase Storage
      const url = `authorization://${fileName}`;
      return url;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AuthorizationFormData & { fileUrl: string; fileHash: string; ip: string }) => {
      if (!organization?.id || !user?.id) throw new Error('Not authenticated');

      // Sanitize scope input
      const sanitizedScope = sanitizeTextInput(data.scope);

      const { error } = await supabase
        .from('authorizations')
        .insert([{
          organization_id: organization.id,
          created_by: user.id,
          document_url: data.fileUrl,
          document_hash: data.fileHash,
          consent_checkbox: data.consent,
          consent_ip: data.ip,
          scope: sanitizedScope,
          valid_until: data.validUntil || null,
          status: 'approved', // Auto-approve for V1
        }]);

      if (error) throw error;

      // Note: Evidence logging is now done server-side only via upload-authorization edge function
    },
    onSuccess: () => {
      toast.success('Autorisation créée avec succès');
      navigate('/authorizations');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création', {
        description: error.message,
      });
    },
  });

  const onSubmit = async (data: AuthorizationFormData) => {
    if (!file) {
      toast.error('Veuillez télécharger un document d\'autorisation');
      return;
    }

    try {
      const [fileUrl, fileHash, ip] = await Promise.all([
        uploadMutation.mutateAsync(file),
        computeHash(file),
        getClientIP(),
      ]);

      await createMutation.mutateAsync({
        ...data,
        fileUrl,
        fileHash,
        ip,
      });
    } catch (error) {
      console.error('Error creating authorization:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('Le fichier est trop volumineux (max 10MB)');
        return;
      }
      setFile(selectedFile);
      setFileUrl(URL.createObjectURL(selectedFile));
    }
  };

  const isLoading = uploadMutation.isPending || createMutation.isPending;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nouvelle Autorisation</h1>
          <p className="text-muted-foreground">
            Fournissez une preuve d'autorisation légale pour effectuer des opérations.
          </p>
        </div>

        {/* Info Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-start gap-4 pt-6">
            <Shield className="h-6 w-6 text-primary shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Pourquoi cette étape est obligatoire ?</p>
              <p className="text-muted-foreground mt-1">
                Toute opération de scan ou d'import nécessite une autorisation légale documentée. 
                Cela garantit la conformité GDPR/NIS2 et protège votre organisation.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Formulaire d'Autorisation
            </CardTitle>
            <CardDescription>
              Tous les champs sont requis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* File Upload */}
                <div className="space-y-2">
                  <FormLabel>Document d'autorisation</FormLabel>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    {file ? (
                      <div className="flex items-center justify-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span className="font-medium">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFile(null);
                            setFileUrl(null);
                          }}
                        >
                          Changer
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <p className="font-medium">Cliquez pour télécharger</p>
                          <p className="text-sm text-muted-foreground">PDF, PNG, JPG (max 10MB)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={handleFileChange}
                        />
                      </label>
                    )}
                  </div>
                  <FormDescription>
                    Document signé autorisant les opérations de sécurité
                  </FormDescription>
                </div>

                {/* Scope */}
                <FormField
                  control={form.control}
                  name="scope"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Portée de l'autorisation</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Décrivez les systèmes, réseaux ou opérations couverts par cette autorisation..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Soyez précis sur ce qui est autorisé
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Valid Until */}
                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date d'expiration (optionnel)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        Laissez vide pour une autorisation sans date d'expiration
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Consent Checkbox */}
                <FormField
                  control={form.control}
                  name="consent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium">
                          Je confirme avoir l'autorisation légale
                        </FormLabel>
                        <FormDescription>
                          Je certifie que le document fourni m'autorise légalement à effectuer 
                          les opérations de sécurité décrites dans la portée ci-dessus. 
                          Mon adresse IP et l'horodatage seront enregistrés.
                        </FormDescription>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/authorizations')}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isLoading || !file}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Créer l'autorisation
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
