"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function AccountPage() {
  useRequireAuth();
  const { user, session, signOut } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!session) return;
    fetch(`${API_BASE}/me`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then(setProfile)
      .catch(() => {});
  }, [session]);

  if (!user) return null;

  const credits = profile?.credits ?? "—";
  const plan = profile?.plan ?? "free";
  const isPaid = profile?.is_paid ?? false;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-[#0b1121] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#0b1121] dark:text-white mb-2">Account</h1>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>

        <div className="bg-white dark:bg-[#131c31] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Plan</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 capitalize">{plan}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Credits</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {isPaid ? "Unlimited ♾️" : credits}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Status</span>
              <span className={isPaid ? "text-emerald-500 font-medium" : "text-amber-500 font-medium"}>
                {isPaid ? "Active" : "Free"}
              </span>
            </div>
          </div>

          {!isPaid && (
            <button
              onClick={() => (window.location.href = "/api/checkout")}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all"
            >
              Upgrade &mdash; $9 Unlimited
            </button>
          )}

          <button
            onClick={signOut}
            className="w-full py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-500 hover:text-red-500 transition-all"
          >
            Sign Out
          </button>

          <p className="text-center">
            <a href="/" className="text-xs text-slate-400 hover:text-slate-500">Back to home</a>
          </p>
        </div>
      </div>
    </div>
  );
}
