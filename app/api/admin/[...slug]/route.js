import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function GET(request) {
  try {
    const auth = request.headers.get("authorization") || "";
    const url = new URL(request.url);
    const endpoint = url.pathname.replace("/api/admin", "");

    const res = await fetch(`${API_BASE}/admin${endpoint}`, {
      headers: { Authorization: auth },
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
