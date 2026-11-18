import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { publicEnv } from "@/lib/env";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: proxy.ts refreshes the session instead.
        }
      },
    },
  });
}

/** Returns the verified user (validated against Supabase Auth, not just the cookie). */
export async function getUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}

/** The numeric GitHub account id of the signed-in user, from their GitHub identity. */
export function githubIdentity(user: { identities?: { provider: string; id: string; identity_data?: Record<string, unknown> }[] }) {
  const identity = user.identities?.find((i) => i.provider === "github");
  if (!identity) return null;
  const id = String(identity.identity_data?.provider_id ?? identity.id);
  const login = String(identity.identity_data?.user_name ?? identity.identity_data?.preferred_username ?? "");
  return { id, login };
}
