/**
 * useBootstrapState
 *
 * Computes the explicit first-run / nominal state of the platform.
 *
 * States (mutually exclusive, ordered by priority):
 *   bootstrap_incomplete  — no org in DB yet (fresh install, OwnerSetup not yet run)
 *   config_missing        — org exists but no URLs configured in runtime config
 *   tenant_ready          — org + app_runtime_config stub exist (tenant_resolved: true)
 *   public_config_ready   — at least booking_url or one checkout_url is set
 *
 * configSource mirrors usePublicTenantConfig values:
 *   "db:app_runtime_config" | "db:commercial_config" | "env" | "none"
 *
 * These states feed AdminReadiness, RevenueSettings banner, and debug displays.
 */

import { useAuth } from '@/contexts/AuthContext';
import { useRuntimeConfig } from './useRuntimeConfig';
import { usePublicTenantConfig } from './usePublicTenantConfig';

export type BootstrapPhase =
  | 'loading'
  | 'bootstrap_incomplete'   // No org at all
  | 'config_missing'         // Org exists, runtime config stub exists, but no URLs
  | 'tenant_ready'           // Org + config stub, no commercial URLs yet
  | 'public_config_ready';   // At least one commercial URL configured

export interface BootstrapState {
  phase: BootstrapPhase;
  /** Explicit label for display */
  label: string;
  /** true if admin action is needed to advance */
  needsAction: boolean;
  /** Suggested action for the admin */
  actionLabel: string | null;
  /** Route to fix the issue */
  actionRoute: string | null;
  /** Whether tenant is resolved from DB (not env) */
  tenantResolved: boolean;
  /** Which source is serving public config */
  publicConfigSource: string;
  /** Whether commercial URLs are configured */
  hasCommercialUrls: boolean;
}

export function useBootstrapState(): BootstrapState {
  const { organization, isLoading: authLoading } = useAuth();
  const rt = useRuntimeConfig();
  const pub = usePublicTenantConfig();

  if (authLoading || rt.isLoading || pub.isLoading) {
    return {
      phase: 'loading',
      label: 'Chargement...',
      needsAction: false,
      actionLabel: null,
      actionRoute: null,
      tenantResolved: false,
      publicConfigSource: 'none',
      hasCommercialUrls: false,
    };
  }

  const hasOrg = !!organization?.id;
  const hasCommercialUrls = !!(
    rt.bookingUrl ||
    rt.starterCheckoutUrl ||
    rt.proCheckoutUrl ||
    rt.enterpriseCheckoutUrl
  );

  // Bootstrap incomplete: no org in DB
  if (!hasOrg) {
    return {
      phase: 'bootstrap_incomplete',
      label: 'Bootstrap incomplet — aucune organisation en base',
      needsAction: true,
      actionLabel: 'Se connecter / Créer un compte',
      actionRoute: null, // handled by SoloModeWrapper
      tenantResolved: false,
      publicConfigSource: pub.configSource,
      hasCommercialUrls: false,
    };
  }

  // Org exists but no commercial URLs
  if (!hasCommercialUrls) {
    // Check if public tenant resolved (config stub exists)
    if (pub.tenantResolved) {
      return {
        phase: 'config_missing',
        label: 'Tenant résolu — URLs commerciales manquantes',
        needsAction: true,
        actionLabel: 'Configurer les URLs commerciales',
        actionRoute: '/settings/revenue',
        tenantResolved: true,
        publicConfigSource: pub.configSource,
        hasCommercialUrls: false,
      };
    }
    return {
      phase: 'tenant_ready',
      label: 'Authentifié — tenant en cours de résolution',
      needsAction: true,
      actionLabel: 'Configurer Revenue Settings',
      actionRoute: '/settings/revenue',
      tenantResolved: false,
      publicConfigSource: pub.configSource,
      hasCommercialUrls: false,
    };
  }

  // Full nominal mode
  return {
    phase: 'public_config_ready',
    label: 'Mode nominal — URLs commerciales configurées',
    needsAction: false,
    actionLabel: null,
    actionRoute: '/settings/revenue',
    tenantResolved: pub.tenantResolved,
    publicConfigSource: pub.configSource,
    hasCommercialUrls: true,
  };
}
