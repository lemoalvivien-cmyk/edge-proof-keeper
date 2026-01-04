import { Shield, Lock, FileCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface TrustBannerProps {
  className?: string;
}

export function TrustBanner({ className = '' }: TrustBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-sm">
        <div className="flex items-center gap-2 text-primary">
          <Shield className="w-4 h-4" />
          <span>100% légal</span>
        </div>
        <div className="flex items-center gap-2 text-primary">
          <FileCheck className="w-4 h-4" />
          <span>Preuve d'autorisation obligatoire</span>
        </div>
        <div className="flex items-center gap-2 text-primary">
          <Lock className="w-4 h-4" />
          <span>Logs conservés</span>
        </div>
      </div>
    </motion.div>
  );
}
