const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

/**
 * Check if user has credits remaining via backend.
 */
export async function checkCredits(supabaseSession) {
  if (supabaseSession) {
    try {
      const token = supabaseSession.access_token;
      const res = await fetch(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        return { credits: data.credits, plan: data.plan, is_paid: data.is_paid };
      }
    } catch {
      // fallback
    }
  }
  return { credits: null, plan: "anonymous", is_paid: false };
}

export async function canGenerate(supabaseSession) {
  const { credits, is_paid } = await checkCredits(supabaseSession);
  if (is_paid) return true;
  if (credits !== null && credits > 0) return true;
  return false;
}
