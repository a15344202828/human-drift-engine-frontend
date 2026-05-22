"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { track } from "@/components/PostHogProvider";

const CATEGORIES = [
  { value: "supplements", label: "💊 Supplements" },
  { value: "skincare", label: "🧴 Skincare" },
  { value: "fashion", label: "👗 Fashion" },
  { value: "jewelry", label: "💍 Jewelry" },
  { value: "fitness", label: "🏋️ Fitness" },
  { value: "saas", label: "💻 SaaS" },
  { value: "home", label: "🏠 Home" },
  { value: "beauty", label: "💄 Beauty" },
];

const STATE_PILLS = [
  { value: "tired_after_work", label: "tired after work" },
  { value: "low_social_battery", label: "low social battery" },
  { value: "trying_not_to_sound_sponsored", label: "trying not to sound sponsored" },
  { value: "filming_too_late", label: "filming too late" },
  { value: "distracted_while_talking", label: "emotionally distracted" },
];

const CREATOR_TYPE_PILLS = [
  { value: "skeptical_gym_guy", label: "skeptical gym guy" },
  { value: "awkward_recommender", label: "awkward recommender" },
  { value: "low_energy_skincare_creator", label: "low-energy skincare creator" },
  { value: "sarcastic_fashion_creator", label: "sarcastic fashion creator" },
];

const DRIFT_LOADING_STEPS = [
  "rewriting ad energy...",
  "flattening enthusiasm...",
  "injecting hesitation...",
  "removing marketing tone...",
  "adding creator drift...",
  "simulating low social battery...",
  "breaking sentence rhythm...",
  "introducing uncertainty...",
  "making it less polished...",
  "de-optimizing CTA...",
  "making it feel accidentally recorded...",
  "lowering emotional intensity...",
  "adding awkward transitions...",
  "removing sales structure...",
  "simulating phone recording fatigue...",
];

const DRIFT_INDICATORS = [
  "hesitation",
  "emotional flattening",
  "imperfect transition",
  "anti-sales tone",
  "creator pacing",
];

const DAILY_FREE = 3;
const STORAGE_KEY = "humanizer_usage";
const PRO_PRICE = "$9";

function getUsage() {
  if (typeof window === "undefined") return { date: "", count: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: "", count: 0 };
    return JSON.parse(raw);
  } catch {
    return { date: "", count: 0 };
  }
}

function setUsage(date, count) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date, count }));
  } catch {}
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function Home() {
  const { user, session, signOut } = useAuth();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [category, setCategory] = useState("supplements");
  const [humanState, setHumanState] = useState(null);
  const [creatorType, setCreatorType] = useState(null);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(null);
  const [details, setDetails] = useState(null);
  const [archetype, setArchetype] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [usage, setUsageState] = useState({ date: "", count: 0 });
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [revealedLines, setRevealedLines] = useState(0);

  const loadInterval = useRef(null);
  const revealInterval = useRef(null);

  useEffect(() => {
    setUsageState(getUsage());
    return () => {
      if (loadInterval.current) clearInterval(loadInterval.current);
      if (revealInterval.current) clearInterval(revealInterval.current);
    };
  }, []);

  const remaining = (() => {
    const today = todayKey();
    if (usage.date !== today) return DAILY_FREE;
    return Math.max(0, DAILY_FREE - usage.count);
  })();

  const humanize = useCallback(async () => {
    if (!input.trim()) return;
    if (remaining <= 0) {
      setShowUpgrade(true);
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setScore(null);
    setDetails(null);
    setCopied(false);
    setRevealedLines(0);

    track("humanize_click", { category, state: humanState, user_status: user ? "logged_in" : "anonymous" });

    // Drift loading steps
    setLoadingStep(0);
    loadInterval.current = setInterval(() => {
      setLoadingStep((p) => (p + 1) % DRIFT_LOADING_STEPS.length);
    }, 1000);

    try {
      const res = await fetch("/api/humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: input.trim(),
          category: category,
          state: humanState || undefined,
          creator_type: creatorType || undefined,
          drift_strength: "medium",
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body.slice(0, 200));
      }
      const json = await res.json();
      if (!json.output && !json.result) throw new Error("Empty response");

      const outputText = json.output || json.result;
      const metrics = json.metrics || {};
      const driftScore = json.score ?? metrics.human_rhythm_after ?? 81;

      track("humanize_success", { category, driftScore, user_status: user ? "logged_in" : "anonymous" });

      setResult(outputText);
      setScore(driftScore);
      setDetails({
        ...(json.score_details || {}),
        ai_before: metrics.ai_detectability_before ?? 92,
        ai_after: metrics.ai_detectability_after ?? Math.max(5, 100 - driftScore),
        human_before: metrics.human_rhythm_before ?? 12,
        human_after: metrics.human_rhythm_after ?? driftScore,
        marketing_before: metrics.marketing_tone_before ?? 87,
        marketing_after: metrics.marketing_tone_after ?? Math.max(3, 100 - driftScore - 5),
      });
      setArchetype(json.rhythm_archetype ?? null);

      const today = todayKey();
      const cur = getUsage();
      const newCount = cur.date === today ? cur.count + 1 : 1;
      setUsage({ date: today, count: newCount });
      setUsageState({ date: today, count: newCount });

      // Sentence-by-sentence reveal
      const lines = json.result.split("\n").filter(Boolean);
      let idx = 1;
      revealInterval.current = setInterval(() => {
        if (idx <= lines.length) {
          setRevealedLines(idx);
          idx++;
        } else {
          clearInterval(revealInterval.current);
        }
      }, 200);
    } catch (err) {
      setError(err.message);
    } finally {
      if (loadInterval.current) clearInterval(loadInterval.current);
      setLoading(false);
    }
  }, [input, category, remaining]);

  const handleRegenerate = () => humanize();

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const handleKeyDown = (e) => {
    if (e.metaKey && e.key === "Enter") humanize();
  };

  const resultLines = result ? result.split("\n").filter(Boolean) : [];

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── NAV ── */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-white/70 dark:bg-[#0b1121]/70 backdrop-blur-2xl">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center text-white text-[10px] font-bold shadow-lg shadow-violet-500/20">
              V
            </div>
            <span className="font-semibold text-sm text-[#0b1121] dark:text-white">
              Human Drift Engine
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 tabular-nums">
              {remaining} creator {remaining === 1 ? "rewrite" : "rewrites"} left
            </span>
            {user ? (
              <a href="/account" className="text-[11px] text-violet-500 hover:text-violet-600 font-medium ml-1">Account</a>
            ) : (
              <a href="/login" className="text-[11px] text-violet-500 hover:text-violet-600 font-medium ml-1">Login</a>
            )}
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          {/* ── HERO ── */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-950/60 dark:to-fuchsia-950/60 text-violet-600 dark:text-violet-400 text-xs font-medium mb-5 border border-violet-200/60 dark:border-violet-800/40">
              <span className="text-[10px]">✦</span>
              V5 — creator speech manipulation engine
            </div>
            <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-bold tracking-tight mb-4 text-[#0b1121] dark:text-white leading-[1.1]">
              Make AI Scripts Feel Like Real Creators.
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
              trained on how people actually talk<br />
              when they&apos;re tired, distracted,<br />
              awkward, skeptical, or trying not to sell you something
            </p>
          </div>

          {/* ── CATEGORY ── */}
          <div className="mb-5">
            <label className="block text-[11px] font-semibold mb-2.5 text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">
              Category
            </label>
            <div className="flex flex-wrap justify-center gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                    category === c.value
                      ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/20"
                      : "bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── STATE PILLS ── */}
          <div className="mb-5">
            <label className="block text-[11px] font-semibold mb-2 text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">
              State
            </label>
            <div className="flex flex-wrap justify-center gap-2">
              {STATE_PILLS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setHumanState(humanState === s.value ? null : s.value)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all ${
                    humanState === s.value
                      ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700"
                      : "bg-slate-50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── CREATOR TYPE ── */}
          <div className="mb-6">
            <label className="block text-[11px] font-semibold mb-2 text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">
              Creator Type
            </label>
            <div className="flex flex-wrap justify-center gap-2">
              {CREATOR_TYPE_PILLS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCreatorType(creatorType === c.value ? null : c.value)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all ${
                    creatorType === c.value
                      ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 border border-violet-300 dark:border-violet-700"
                      : "bg-slate-50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── BEFORE / AFTER ── */}
          <div className="mb-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/30 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-[10px] font-semibold text-red-500 uppercase tracking-wider">Your AI script</span>
              </div>
              <p className="text-xs leading-relaxed text-red-600/80 dark:text-red-400/80 italic">
                &ldquo;Unlock your full potential with this revolutionary supplement formula scientifically designed to optimize wellness and daily performance.&rdquo;
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">After V5 Drift</span>
              </div>
              <p className="text-xs leading-relaxed text-emerald-700 dark:text-emerald-300">
                ok wait maybe i&apos;m exaggerating lol but i swear i don&apos;t crash at 3pm anymore. honestly wasn&apos;t even gonna post this because it sounds fake but whatever
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-emerald-200/50 dark:border-emerald-800/30 pt-2.5">
                <span className="text-[9px] text-emerald-500 font-medium uppercase tracking-wider mr-1">human drift detected</span>
                {DRIFT_INDICATORS.map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-100/60 dark:bg-emerald-900/30 text-[9px] text-emerald-600 dark:text-emerald-400"
                  >
                    <span className="w-1 h-1 rounded-full bg-emerald-400" />
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── NOT AN AI COPYWRITER ── */}
          <div className="mb-6 text-center">
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed max-w-lg mx-auto italic">
              This is not an AI copywriter.
              <br />
              It&apos;s a creator speech manipulation engine.
            </p>
          </div>

          {/* ── INPUT ── */}
          <div className="bg-white dark:bg-[#131c31] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm">
            <div>
              <label className="block text-[11px] font-semibold mb-2 text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Paste your AI-generated script
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Paste your GPT / AI-generated ad here..."
                rows={6}
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/30 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all text-slate-900 dark:text-slate-100 resize-y"
              />
            </div>

            <div className="mt-3 text-[11px] text-slate-400 text-center">
              <span className="hidden sm:inline">
                Press <kbd className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[10px]">⌘ + Enter</kbd> to drift
              </span>
            </div>

            <button
              onClick={humanize}
              disabled={loading || !input.trim()}
              className="mt-4 w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-500 hover:via-purple-500 hover:to-fuchsia-500 disabled:from-slate-300 disabled:to-slate-300 dark:disabled:from-slate-700 dark:disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30"
            >
              {loading ? (
                <span className="font-mono text-[11px] tracking-wider">
                  {DRIFT_LOADING_STEPS[loadingStep]}
                </span>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Drift My Script
                </>
              )}
            </button>
          </div>

          {/* ── ERROR ── */}
          {error && (
            <div className="mt-5 p-4 rounded-2xl bg-red-50/80 dark:bg-red-900/15 border border-red-200/60 dark:border-red-800/40 text-red-700 dark:text-red-400 text-sm flex items-start gap-3">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          {/* ── OUTPUT ── */}
          {result && (
            <div className="mt-8">
              {/* Creator Mood / AI Detectability */}
              <div className="mb-4 space-y-3">
                {/* Creator mood indicator */}
                {archetype && (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">creator state:</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                      {archetype.secondary}
                    </span>
                  </div>
                )}

                {/* Fake-science metrics grid */}
                <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/40 p-2.5 text-center">
                    <div className="text-[9px] text-slate-400 uppercase tracking-wider mb-1">ai detectability</div>
                    <div className="text-xs font-bold">
                      <span className="text-red-400">{details?.ai_before ?? 92}%</span>
                      <span className="text-slate-300 mx-1">&rarr;</span>
                      <span className="text-emerald-500">{details?.ai_after ?? Math.max(5, 100 - score)}%</span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/40 p-2.5 text-center">
                    <div className="text-[9px] text-slate-400 uppercase tracking-wider mb-1">human rhythm</div>
                    <div className="text-xs font-bold">
                      <span className="text-red-400">{details?.human_before ?? 12}%</span>
                      <span className="text-slate-300 mx-1">&rarr;</span>
                      <span className="text-emerald-500">{details?.human_after ?? score}%</span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/40 p-2.5 text-center">
                    <div className="text-[9px] text-slate-400 uppercase tracking-wider mb-1">marketing tone</div>
                    <div className="text-xs font-bold">
                      <span className="text-red-400">{details?.marketing_before ?? 87}%</span>
                      <span className="text-slate-300 mx-1">&rarr;</span>
                      <span className="text-emerald-500">{details?.marketing_after ?? Math.max(3, 100 - score - 5)}%</span>
                    </div>
                  </div>
                </div>

                {/* Drift score bar */}
                <div className="flex items-center justify-center gap-3">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    Human Drift Score
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-28 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500"
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        score >= 80 ? "text-emerald-500" : score >= 60 ? "text-amber-500" : "text-red-500"
                      }`}
                    >
                      {score}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#131c31] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🧠</span>
                    <h2 className="text-sm font-bold text-[#0b1121] dark:text-white tracking-tight">
                      Drifted Script
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRegenerate}
                      disabled={loading}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Re-drift
                    </button>
                    <button
                      onClick={handleCopy}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
                <div className="px-5 py-5">
                  {resultLines.slice(0, revealedLines).map((line, i) => (
                    <p
                      key={i}
                      className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 animate-in fade-in slide-in-from-bottom-1 duration-300"
                      style={{ animationDelay: `${i * 80}ms` }}
                    >
                      {line}
                    </p>
                  ))}
                  {revealedLines < resultLines.length && (
                    <div className="flex items-center gap-1 text-slate-400 text-sm mt-1">
                      <span className="w-2 h-4 bg-violet-400/60 animate-pulse" />
                      <span className="text-[10px] font-mono">forming thought...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── UPGRADE MODAL ── */}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-[#131c31] rounded-3xl p-7 sm:p-8 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl text-center">
            <div className="text-3xl mb-4">🧠</div>
            <h3 className="text-lg font-bold text-[#0b1121] dark:text-white mb-2">
              Still sounding like ChatGPT?
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              You&apos;ve used all {DAILY_FREE} free drifts today.
              <br />
              Unlimited creator rewrites &mdash; {PRO_PRICE}.
            </p>
            <button
              onClick={() => setShowUpgrade(false)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all"
            >
              Remove the AI smell permanently &mdash; {PRO_PRICE}
            </button>
            <button
              onClick={() => setShowUpgrade(false)}
              className="mt-3 text-xs text-slate-400 hover:text-slate-500 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      <footer className="border-t border-slate-100 dark:border-slate-800/60 py-6 mt-4">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center text-[11px] text-slate-400 dark:text-slate-500">
          Human Drift Engine V5 &mdash; creator speech manipulation engine &middot; found this on X at 2am
        </div>
      </footer>
    </div>
  );
}
