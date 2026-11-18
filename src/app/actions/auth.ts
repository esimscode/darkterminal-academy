"use server";

import { redirect } from "next/navigation";

import { publicEnv } from "@/lib/env";
import { safeNext } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

export async function signInWithGitHub(formData: FormData) {
  const next = safeNext(formData.get("next")?.toString());
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`,
      // identity only: repo access goes through the GitHub App, not this login
      scopes: "read:user",
    },
  });
  if (error || !data.url) redirect("/login?error=oauth");
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
