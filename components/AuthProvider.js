"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createSupabaseClient } from "@/lib/supabaseFactory";
import { supabase, setSupabaseClient } from "@/lib/supabase";

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  supabaseReady: false,
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supabaseReady, setSupabaseReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    createSupabaseClient().then((client) => {
      if (!mounted) return;

      if (!client) {
        setLoading(false);
        setSupabaseReady(false);
        return;
      }

      // Share the real client with all modules via the proxy
      setSupabaseClient(client);
      setSupabaseReady(true);

      // Get initial session
      client.auth
        .getSession()
        .then(({ data: { session: initialSession } }) => {
          if (!mounted) return;
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          setLoading(false);
        })
        .catch(() => {
          if (!mounted) return;
          setLoading(false);
        });

      // Listen for auth state changes
      const { data: authData } = client.auth.onAuthStateChange((_event, currentSession) => {
        if (!mounted) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      });

      return () => {
        authData?.subscription?.unsubscribe();
      };
    });

    return () => {
      mounted = false;
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, supabaseReady, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
