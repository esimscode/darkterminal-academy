import { NextResponse, type NextRequest } from "next/server";

import { GitHubAccessError, verifiedInstallation } from "@/lib/github";
import { getUser, githubIdentity } from "@/lib/supabase/server";

/**
 * GitHub App "Setup URL". GitHub redirects here after the user installs the
 * app. The installation_id is untrusted input, so it is verified against the
 * signed-in user's GitHub account before it's saved.
 */
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const back = (status: string) => NextResponse.redirect(`${origin}/settings/github?status=${status}`);

  const installationId = Number(searchParams.get("installation_id"));
  if (!Number.isSafeInteger(installationId) || installationId <= 0) return back("invalid");

  const { supabase, user } = await getUser();
  if (!user) return NextResponse.redirect(`${origin}/login?next=/settings/github`);
  const gh = githubIdentity(user);
  if (!gh) return back("no-github");

  try {
    await verifiedInstallation(installationId, gh.id);
  } catch (e) {
    return back(e instanceof GitHubAccessError ? "not-yours" : "error");
  }

  const { error } = await supabase
    .from("github_connections")
    .upsert({ user_id: user.id, installation_id: installationId, updated_at: new Date().toISOString() });
  return back(error ? "error" : "connected");
}
