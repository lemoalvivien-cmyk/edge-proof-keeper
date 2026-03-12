import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { bootstrapOwner } from '@/lib/bootstrap';
import type { Profile, Organization, AppRole } from '@/types/database';

// ── Module-level bootstrap lock ────────────────────────────────────────────────
// React refs are per-component-instance. A module-level Map survives re-renders
// and strict-mode double-mounts, making it a true process-level mutex.
// Key = userId, Value = in-flight Promise<void>
const bootstrapLock = new Map<string, Promise<void>>();

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  organization: Organization | null;
  roles: AppRole[];
  isLoading: boolean;
  isAdmin: boolean;
  isAuditor: boolean;
  hasRole: (role: AppRole) => boolean;
  signUp: (email: string, password: string, fullName: string, orgName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrgAndRoles = useCallback(async (userId: string, orgId: string | null) => {
    if (!orgId) return;
    const [orgResult, rolesResult] = await Promise.all([
      supabase.from('organizations').select('*').eq('id', orgId).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', userId).eq('organization_id', orgId),
    ]);
    if (orgResult.data) setOrganization(orgResult.data as Organization);
    if (rolesResult.data) setRoles(rolesResult.data.map(r => r.role as AppRole));
  }, []);

  const fetchUserData = useCallback(async (currentUser: User) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (!profileData) {
        // ── Module-level bootstrap mutex ───────────────────────────────────────
        // If a bootstrap is already in flight for this userId (from any concurrent
        // React effect / token refresh), wait for it instead of launching a second
        // one that will hit the RLS "no-role user can create first organization" wall.
        const existing = bootstrapLock.get(currentUser.id);
        if (existing) {
          console.log('[AuthContext] Bootstrap already in flight, waiting…');
          try { await existing; } catch { /* handled by the original caller */ }
        } else {
          const promise = bootstrapOwner(currentUser.id, currentUser.email ?? '')
            .catch((err) => {
              console.warn('[AuthContext] Bootstrap non-fatal warning:', err);
            })
            .finally(() => {
              bootstrapLock.delete(currentUser.id);
            });
          bootstrapLock.set(currentUser.id, promise);
          await promise;
        }

        // Re-fetch after bootstrap
        const { data: newProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle();
        if (newProfile) {
          setProfile(newProfile as Profile);
          await fetchOrgAndRoles(currentUser.id, newProfile.organization_id);
        }
        return;
      }

      setProfile(profileData as Profile);
      await fetchOrgAndRoles(currentUser.id, profileData.organization_id);
    } catch (error) {
      console.error('[AuthContext] Error fetching user data:', error);
    }
  }, [fetchOrgAndRoles]);

  useEffect(() => {
    // ── Single-entry guard for initial session ─────────────────────────────────
    // getSession() is the authoritative initial check.
    // onAuthStateChange(INITIAL_SESSION) fires before getSession resolves — we
    // skip it to avoid a duplicate fetch. TOKEN_REFRESHED never needs bootstrap.
    // Only SIGNED_IN (new login/signup) and SIGNED_OUT are handled by the listener.
    let initialHandled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      // TOKEN_REFRESHED: session updated but user already bootstrapped — update
      // state but skip fetchUserData to avoid re-triggering bootstrap.
      if (event === 'TOKEN_REFRESHED') {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        return;
      }

      // INITIAL_SESSION: covered by getSession() below — skip entirely.
      if (event === 'INITIAL_SESSION') return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        // SIGNED_IN: new login or signup — bootstrap if needed
        setTimeout(() => fetchUserData(currentSession.user), 0);
      } else {
        // SIGNED_OUT
        setProfile(null);
        setOrganization(null);
        setRoles([]);
        setIsLoading(false);
      }
    });

    // Authoritative initial session check — runs once
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (initialHandled) return;
      initialHandled = true;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        fetchUserData(currentSession.user).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const signUp = async (email: string, password: string, fullName: string, orgName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: fullName, org_name: orgName },
        },
      });
      if (error) throw error;
      // Bootstrap triggered exclusively by onAuthStateChange(SIGNED_IN) → fetchUserData
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setOrganization(null);
    setRoles([]);
  };

  const refreshProfile = async () => {
    if (user) await fetchUserData(user);
  };

  const hasRole = (role: AppRole) => roles.includes(role);
  const isAdmin = hasRole('admin');
  const isAuditor = hasRole('auditor');

  return (
    <AuthContext.Provider value={{
      user, session, profile, organization, roles,
      isLoading, isAdmin, isAuditor, hasRole,
      signUp, signIn, signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
