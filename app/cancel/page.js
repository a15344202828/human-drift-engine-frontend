"use client";

import { useEffect, useState } from "react";

export default function CancelPage() {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          window.location.href = "/";
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#0b1121] px-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">🤷</div>
        <h1 className="text-2xl font-bold text-[#0b1121] dark:text-white mb-3">Payment Canceled</h1>
        <p className="text-sm text-slate-500 mb-6">
          No worries. You can keep using free drifts.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:border-violet-300 transition-all"
        >
          Back to Home (redirecting in {countdown}s)
        </a>
      </div>
    </div>
  );
}
