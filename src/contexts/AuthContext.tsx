import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { bootstrapOwner } from '@/lib/bootstrap';
import type { Profile, UserRole, Organization, AppRole } from '@/types/database';

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

  const fetchUserData = useCallback(async (currentUser: User) => {
    try {
      // Use maybeSingle to avoid 406 when no profile row exists yet
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (!profileData) {
        // No profile → run bootstrap (idempotent)
        // This handles the case where user authenticated via persistent session
        // but bootstrapOwner was never called (e.g. first session after DB reset)
        try {
          await bootstrapOwner(currentUser.id, currentUser.email ?? '');
        } catch (bootstrapErr) {
          console.warn('[AuthContext] Bootstrap warning (non-fatal):', bootstrapErr);
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchOrgAndRoles = async (userId: string, orgId: string | null) => {
    if (!orgId) return;

    const [orgResult, rolesResult] = await Promise.all([
      supabase.from('organizations').select('*').eq('id', orgId).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', userId).eq('organization_id', orgId),
    ]);

    if (orgResult.data) setOrganization(orgResult.data as Organization);
    if (rolesResult.data) setRoles(rolesResult.data.map(r => r.role as AppRole));
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer to avoid Supabase deadlock
          setTimeout(() => {
            fetchUserData(session.user);
          }, 0);
        } else {
          setProfile(null);
          setOrganization(null);
          setRoles([]);
        }
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const signUp = async (email: string, password: string, fullName: string, orgName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { full_name: fullName, org_name: orgName },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Use bootstrapOwner for consistent setup
        await bootstrapOwner(data.user.id, email);
        await fetchUserData(data.user);
      }

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
      user,
      session,
      profile,
      organization,
      roles,
      isLoading,
      isAdmin,
      isAuditor,
      hasRole,
      signUp,
      signIn,
      signOut,
      refreshProfile,
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
