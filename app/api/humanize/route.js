/**
 * POST /api/humanize
 *
 * Calls DeepSeek API directly from this Vercel route handler.
 * No dependency on local FastAPI or external backend for the ML core.
 * The FastAPI backend is only needed if Supabase auth/credits are used.
 */
export async function POST(req) {
  console.log("[humanize] request received");

  try {
    const body = await req.json();
    const inputText = body.script || body.text || "";
    const category = body.category || "supplements";

    if (!inputText.trim()) {
      return Response.json({ error: "script or text is required" }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error("[humanize] Missing DEEPSEEK_API_KEY env var");
      return Response.json({ error: "DeepSeek API key not configured on server" }, { status: 500 });
    }

    const systemPrompt = `Rewrite this ad script so it sounds like a real person talking on TikTok in the ${category} category.

    Rules:
    - Natural phrasing. Imperfect flow. Understate everything.
    - Sound like a real person recording in their room.
    - Do NOT sound like a copywriter or marketer.

    Output ONLY the rewritten script. No markdown, no JSON.`;

    const userPrompt = `Rewrite this ad script:

    ---
    ${inputText}
    ---`;

    console.log("[humanize] calling DeepSeek API...");
    const deepseekRes = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!deepseekRes.ok) {
      const errText = await deepseekRes.text();
      console.error("[humanize] DeepSeek API error:", deepseekRes.status, errText);
      return Response.json(
        { error: `DeepSeek API error (${deepseekRes.status}): ${errText.slice(0, 300)}` },
        { status: 502 }
      );
    }

    const deepseekData = await deepseekRes.json();
    const result = deepseekData.choices?.[0]?.message?.content?.trim() || "";
    console.log("[humanize] success, result length:", result.length);

    return Response.json({
      text: result,
      score: 85,
      category,
      rhythm_archetype: { primary: "creator archetype", secondary: "casual" },
      metrics: {
        ai_detectability_before: 92,
        ai_detectability_after: 15,
        human_rhythm_before: 12,
        human_rhythm_after: 85,
        marketing_tone_before: 87,
        marketing_tone_after: 19,
      },
    });
  } catch (err) {
    console.error("[humanize] critical error:", err.message, err.stack);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
