"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map((s) => s.trim());

export default function AdminPage() {
  const { user, session } = useAuth();
  const [stats, setStats] = useState(null);
  const [generations, setGenerations] = useState([]);
  const [users, setUsers] = useState([]);

  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    if (!session || !isAdmin) return;
    const headers = { Authorization: `Bearer ${session.access_token}` };

    fetch(`${API_BASE}/admin/stats`, { headers })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});

    fetch(`${API_BASE}/admin/recent-generations`, { headers })
      .then((r) => r.json())
      .then((d) => setGenerations(d.generations || []))
      .catch(() => {});

    fetch(`${API_BASE}/admin/recent-users`, { headers })
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []))
      .catch(() => {});
  }, [session, isAdmin]);

  if (!user) return null;
  if (!isAdmin) return <div className="p-8 text-center text-red-500">Access denied.</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b1121] px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#0b1121] dark:text-white mb-6">Admin</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {stats &&
            [
              ["Total Users", stats.total_users],
              ["Paid Users", stats.paid_users],
              ["Today Humanizations", stats.today_humanizations],
              ["Today Paywall Views", stats.today_paywall_shown],
            ].map(([label, value]) => (
              <div key={label} className="bg-white dark:bg-[#131c31] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-[#0b1121] dark:text-white">{value}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">{label}</div>
              </div>
            ))}
        </div>

        {/* Recent Generations */}
        <div className="bg-white dark:bg-[#131c31] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 mb-6">
          <h2 className="text-sm font-bold mb-3 text-[#0b1121] dark:text-white">Recent Generations</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {generations.map((g) => (
              <div key={g.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 text-xs text-slate-600 dark:text-slate-400">
                <span className="text-violet-500 font-mono">{g.category}</span> — {g.input_script?.slice(0, 80)}...
              </div>
            ))}
            {generations.length === 0 && <p className="text-xs text-slate-400">No generations yet.</p>}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white dark:bg-[#131c31] border border-slate-200 dark:border-slate-800 rounded-3xl p-5">
          <h2 className="text-sm font-bold mb-3 text-[#0b1121] dark:text-white">Recent Users</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {users.map((u) => (
              <div key={u.id} className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 text-xs">
                <span className="text-slate-600 dark:text-slate-400">{u.email}</span>
                <span className={u.is_paid ? "text-emerald-500 font-medium" : "text-slate-400"}>{u.plan}</span>
              </div>
            ))}
            {users.length === 0 && <p className="text-xs text-slate-400">No users yet.</p>}
          </div>
        </div>

        <p className="mt-4 text-center">
          <a href="/" className="text-xs text-slate-400 hover:text-slate-500">Back to home</a>
        </p>
      </div>
    </div>
  );
}
