"use client";

import { useEffect, useState } from "react";

export default function SuccessPage() {
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
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-[#0b1121] dark:text-white mb-3">Payment Successful</h1>
        <p className="text-sm text-slate-500 mb-6">
          Unlimited creator rewrites unlocked. You&apos;re all set.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-violet-500/20 transition-all"
        >
          Start Drifting (redirecting in {countdown}s)
        </a>
      </div>
    </div>
  );
}
