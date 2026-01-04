import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Authorization } from '@/types/database';

interface UploadAuthorizationParams {
  file: File;
  organizationId: string;
  scope: string;
  consentCheckbox: boolean;
  validUntil?: string | null;
}

interface UploadAuthorizationResponse {
  success: boolean;
  authorization: Authorization;
  status: 'approved' | 'pending';
  message: string;
}

export function useUploadAuthorization() {
  return useMutation({
    mutationFn: async (params: UploadAuthorizationParams): Promise<UploadAuthorizationResponse> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const formData = new FormData();
      formData.append('file', params.file);
      formData.append('organization_id', params.organizationId);
      formData.append('scope', params.scope);
      formData.append('consent_checkbox', params.consentCheckbox.toString());
      if (params.validUntil) {
        formData.append('valid_until', params.validUntil);
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-authorization`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload authorization');
      }

      return data;
    },
  });
}
