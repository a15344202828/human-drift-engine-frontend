"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { getSupabaseClient } from "@/lib/supabase";

export default function LoginPage() {
  const { supabaseReady, supabaseError: authError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  // Log supabase status on every render
  useEffect(() => {
    const client = getSupabaseClient();
    console.log("[login] supabaseReady:", supabaseReady);
    console.log("[login] supabase client exists:", !!client);
    console.log("[login] authError:", authError);
  }, [supabaseReady, authError]);

  const handleGoogleLogin = async () => {
    setError(null);

    const client = getSupabaseClient();
    if (!client) {
      setError("Supabase auth is not available.");
      return;
    }

    setGoogleLoading(true);
    console.log("[login] starting Google OAuth...");

    const { error: oauthError } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: "https://human.runshensm88.com/auth/callback" },
    });

    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
    }
    // If no error, browser navigates away — no need to reset loading
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMsg(null);

    const client = getSupabaseClient();
    if (!client) {
      setError("Supabase auth is not available.");
      return;
    }

    try {
      if (mode === "login") {
        const { error: authErr } = await client.auth.signInWithPassword({ email, password });
        if (authErr) return setError(authErr.message);
        router.push("/");
      } else {
        const { error: authErr } = await client.auth.signUp({ email, password });
        if (authErr) return setError(authErr.message);
        setMsg("Check your email to confirm signup.");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#0b1121] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#0b1121] dark:text-white mb-2">Human Drift Engine</h1>
          <p className="text-sm text-slate-500">{mode === "login" ? "Sign in to your account" : "Create an account"}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#131c31] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {googleLoading ? "Redirecting..." : "Continue with Google"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200 dark:border-slate-700" />
            <span className="text-[11px] text-slate-400 uppercase font-medium">or</span>
            <div className="flex-1 h-px bg-slate-200 dark:border-slate-700" />
          </div>

          <div>
            <label className="block text-[11px] font-semibold mb-1.5 text-slate-400 uppercase tracking-widest">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/30 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 text-slate-900 dark:text-slate-100"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1.5 text-slate-400 uppercase tracking-widest">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/30 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 text-slate-900 dark:text-slate-100"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
          {msg && <p className="text-xs text-emerald-500">{msg}</p>}

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all"
          >
            {mode === "login" ? "Sign In" : "Sign Up"}
          </button>

          <p className="text-center text-xs text-slate-400">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button type="button" onClick={() => setMode("signup")} className="text-violet-500 hover:text-violet-600">Sign Up</button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button type="button" onClick={() => setMode("login")} className="text-violet-500 hover:text-violet-600">Sign In</button>
              </>
            )}
          </p>
        </form>

        <p className="mt-4 text-center">
          <a href="/" className="text-xs text-slate-400 hover:text-slate-500">Back to home</a>
        </p>
      </div>
    </div>
  );
}
