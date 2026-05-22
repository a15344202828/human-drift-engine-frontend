// This file must not fail at module load time during SSR/build.
// The real client is created lazily via createSupabaseClient() at runtime.
// The supabase constant is a Proxy that delegates to the real client
// only when called from browser context.

import { createSupabaseClient } from "./supabaseFactory";

// Re-export the factory for components that need to await a client
export { createSupabaseClient };

// A stub proxy for use in components that import { supabase } at module level.
// All method calls return no-op promises until the real client is created.
let realClient = null;

// Called once by AuthProvider to set the real client
export function setSupabaseClient(client) {
  realClient = client;
}

export function getSupabaseClient() {
  return realClient;
}

export const supabase = new Proxy(
  {},
  {
    get(_, prop) {
      return function (...args) {
        if (realClient && realClient[prop]) {
          const target = realClient[prop];
          if (typeof target === "function") {
            return target.apply(realClient, args);
          }
          return target;
        }
        // During SSR/build: return a no-op promise
        return Promise.resolve({ data: null, error: null });
      };
    },
  }
);
