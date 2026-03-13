import { Link, useLocation } from 'react-router-dom';
import { House } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NavbarHomeButton() {
  const location = useLocation();

  // Hide on landing page itself
  if (location.pathname === '/') return null;

  return (
    <Link
      to="/"
      className={cn(
        'fixed z-[9999] flex items-center gap-2 px-3 py-2 rounded-xl',
        'bg-background/60 backdrop-blur-md border border-primary/30',
        'text-primary hover:text-primary hover:bg-primary/10 hover:border-primary/60',
        'transition-all duration-200 shadow-lg shadow-primary/10',
        // Desktop: top-left
        'top-3 left-3',
        // Mobile: bottom-left floating
        'sm:bottom-auto sm:top-3'
      )}
      title="Accueil"
    >
      <House className="h-4 w-4 shrink-0" />
      <span className="hidden sm:inline text-sm font-medium">Accueil</span>
    </Link>
  );
}
