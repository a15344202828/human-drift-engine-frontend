"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createSupabaseClient } from "@/lib/supabaseFactory";
import { supabase, setSupabaseClient, getSupabaseClient } from "@/lib/supabase";

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  supabaseReady: false,
  supabaseError: null,
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supabaseReady, setSupabaseReady] = useState(false);
  const [supabaseError, setSupabaseError] = useState(null);

  useEffect(() => {
    let mounted = true;
    let authSubscription = null;

    async function init() {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      console.log("[auth] NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl);
      console.log("[auth] NEXT_PUBLIC_SUPABASE_ANON_KEY found:", !!supabaseAnonKey);

      const client = await createSupabaseClient(supabaseUrl, supabaseAnonKey);
      if (!mounted) return;

      if (!client) {
        setSupabaseError("Supabase not configured — check environment variables");
        setLoading(false);
        setSupabaseReady(false);
        return;
      }

      setSupabaseClient(client);
      setSupabaseReady(true);

      // ── Step 1: Get initial session ──
      const {
        data: { session: initialSession },
      } = await client.auth.getSession();

      if (!mounted) return;

      console.log("[auth] getSession result:", initialSession ? `user=${initialSession.user.email}` : "no session");
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);

      // ── Step 2: Listen for auth changes ──
      const { data: authData } = client.auth.onAuthStateChange((event, currentSession) => {
        console.log("[auth] onAuthStateChange event:", event, currentSession ? `user=${currentSession.user.email}` : "no session");
        if (!mounted) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      });
      authSubscription = authData?.subscription;
    }

    init();

    return () => {
      mounted = false;
      if (authSubscription) authSubscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
    setUser(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, supabaseReady, supabaseError, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
