"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createSupabaseClient } from "@/lib/supabaseFactory";
import { supabase, setSupabaseClient } from "@/lib/supabase";

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

    // Read env vars here — NEXT_PUBLIC_ is inlined at build time
    // in "use client" components
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log("[auth] NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl);
    console.log("[auth] NEXT_PUBLIC_SUPABASE_ANON_KEY found:", !!supabaseAnonKey);

    createSupabaseClient(supabaseUrl, supabaseAnonKey)
      .then((client) => {
        if (!mounted) return;

        if (!client) {
          setSupabaseError("Supabase not configured — check environment variables");
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
          .catch((err) => {
            if (!mounted) return;
            console.error("[auth] getSession error:", err);
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
      })
      .catch((err) => {
        if (!mounted) return;
        console.error("[auth] createSupabaseClient error:", err);
        setSupabaseError(err.message);
        setLoading(false);
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
    <AuthContext.Provider value={{ user, session, loading, supabaseReady, supabaseError, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
