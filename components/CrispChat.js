"use client";

import { useEffect } from "react";

export function CrispChat() {
  useEffect(() => {
    const websiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
    if (!websiteId) return;

    // Load Crisp script
    const w = window;
    const d = document;
    const s = "https://client.crisp.chat/l.js";
    const script = d.createElement("script");
    script.src = s;
    script.async = true;
    d.head.appendChild(script);

    // Configure after load
    const interval = setInterval(() => {
      if (w.$crisp) {
        w.$crisp.push(["set", "website_id", websiteId]);
        clearInterval(interval);
      }
    }, 200);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return null;
}
