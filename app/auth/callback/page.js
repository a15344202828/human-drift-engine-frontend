"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, getSupabaseClient } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [retries, setRetries] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function handleAuth() {
      const url = window.location.href;
      const parsed = new URL(url);
      const code = parsed.searchParams.get("code");
      const hasHash = parsed.hash && parsed.hash.includes("access_token");

      console.log("[callback] URL:", url);
      console.log("[callback] has code param:", !!code);
      console.log("[callback] has hash:", !!hasHash);

      if (code) {
        // PKCE flow — exchange the code for a session
        console.log("[callback] exchanging code for session...");
        try {
          const client = getSupabaseClient();
          if (client) {
            const { data, error: exchangeError } = await client.auth.exchangeCodeForSession(code);
            if (cancelled) return;

            if (exchangeError) {
              console.error("[callback] exchangeCodeForSession error:", exchangeError);
              setError(exchangeError.message);
              return;
            }

            console.log("[callback] exchange success, session:", !!data.session);
            if (data.session) {
              router.replace("/");
              return;
            }
          }
        } catch (err) {
          console.error("[callback] exchangeCodeForSession threw:", err);
          if (cancelled) return;
        }
      }

      if (hasHash) {
        // Implicit flow — Supabase SDK auto-handles hash on next getSession()
        console.log("[callback] hash detected, trying getSession...");
      }

      // Fallback: try getSession
      console.log("[callback] fallback: calling getSession...");
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (cancelled) return;

      if (sessionError) {
        console.error("[callback] getSession error:", sessionError);
        setError(sessionError.message);
        return;
      }

      if (data?.session) {
        console.log("[callback] session found via getSession, redirecting...");
        router.replace("/");
      } else {
        console.log("[callback] no session yet, retrying...");
        // Retry after a short delay (Supabase may still be processing)
        if (retries < 5) {
          setTimeout(() => setRetries((r) => r + 1), 1000);
        } else {
          setError("Unable to complete sign in after multiple attempts.");
        }
      }
    }

    handleAuth();

    return () => {
      cancelled = true;
    };
  }, [router, retries]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#0b1121]">
      <div className="text-center">
        {error ? (
          <>
            <div className="text-3xl mb-4">⚠️</div>
            <p className="text-sm text-red-500 max-w-xs">{error}</p>
            <button
              onClick={() => router.push("/login")}
              className="mt-4 text-xs text-violet-500 hover:text-violet-600"
            >
              Back to login
            </button>
          </>
        ) : (
          <>
            <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-500">Completing sign in...</p>
          </>
        )}
      </div>
    </div>
  );
}
