import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function GET(request) {
  try {
    // Forward user_id from session if available
    const auth = request.headers.get("authorization") || "";

    const res = await fetch(`${API_BASE}/create-checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: auth },
      body: JSON.stringify({}),
    });

    const data = await res.json();
    if (data.checkout_url) {
      return NextResponse.redirect(data.checkout_url);
    }
    return NextResponse.json(data, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const auth = request.headers.get("authorization") || "";

    const res = await fetch(`${API_BASE}/create-checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: auth },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (data.checkout_url) {
      return NextResponse.json({ checkout_url: data.checkout_url });
    }
    return NextResponse.json(data, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
