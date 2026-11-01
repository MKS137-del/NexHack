import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../authService';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load initial session
  useEffect(() => {
    async function initAuth() {
      try {
        const { data: session } = await authService.getSession();
        if (session?.user) {
          setUser(session.user);
          // Load profile details
          const { data: prof } = await authService.getProfile(session.user.id);
          setProfile(prof || session.user);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        setLoading(false);
      }
    }

    initAuth();

    // Listen for auth state changes if Supabase is active
    if (isSupabaseConfigured && supabase) {
      const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          const { data: prof } = await authService.getProfile(session.user.id);
          setProfile(prof || session.user);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      });

      return () => {
        listener?.subscription?.unsubscribe();
      };
    }
  }, []);

  const login = async (credentials) => {
    const res = await authService.signIn(credentials);
    if (!res.error && res.data?.user) {
      setUser(res.data.user);
      const { data: prof } = await authService.getProfile(res.data.user.id);
      setProfile(prof || res.data.user);
    }
    return res;
  };

  const signup = async (details) => {
    const res = await authService.signUp(details);
    if (!res.error && res.data?.user) {
      setUser(res.data.user);
      const { data: prof } = await authService.getProfile(res.data.user.id);
      setProfile(prof || res.data.user);
    }
    return res;
  };

  const logout = async () => {
    await authService.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user?.id) {
      const { data: prof } = await authService.getProfile(user.id);
      if (prof) setProfile(prof);
    }
  };

  const value = {
    user,
    profile,
    loading,
    login,
    signup,
    logout,
    refreshProfile,
    isAuthenticated: Boolean(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
