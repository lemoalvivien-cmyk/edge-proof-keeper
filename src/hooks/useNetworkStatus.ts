import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: '✅ Connexion rétablie',
        description: 'Vous êtes de nouveau connecté. Les données sont synchronisées.',
        duration: 3000,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: '⚠️ Connexion perdue — mode hors-ligne activé',
        description: 'Les données en cache restent disponibles. La synchronisation reprendra automatiquement.',
        duration: 0, // persist until back online
        variant: 'destructive',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}
