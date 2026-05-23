"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthRedirect = async () => {
      // Supabase SDK automatically exchanges the auth code
      // when the page loads and calls getSession internally.
      // We just wait for the session to be available.
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("[auth/callback] getSession error:", error);
      }

      console.log("[auth/callback] session:", data?.session ? "exists" : "null");

      if (data?.session) {
        router.push("/");
      } else {
        router.push("/login");
      }
    };

    // Small delay to let Supabase process URL hash
    const timer = setTimeout(handleAuthRedirect, 500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#0b1121]">
      <div className="text-center">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500">Completing sign in...</p>
      </div>
    </div>
  );
}
