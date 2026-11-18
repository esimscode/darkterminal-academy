import "server-only";
import { App, type Octokit } from "octokit";

import { githubAppEnv } from "@/lib/env.server";

let app: App | null = null;

export function getGitHubApp() {
  const env = githubAppEnv();
  if (!env) return null;
  app ??= new App({ appId: env.GITHUB_APP_ID, privateKey: env.GITHUB_APP_PRIVATE_KEY });
  return { app, slug: env.GITHUB_APP_SLUG };
}

export class GitHubAccessError extends Error {}

/**
 * Confirms that an installation id belongs to the signed-in user's own GitHub
 * account. Never trust an installation id from the client or the database
 * without this check.
 */
export async function verifiedInstallation(installationId: number, githubUserId: string): Promise<Octokit> {
  const gh = getGitHubApp();
  if (!gh) throw new GitHubAccessError("GitHub App is not configured");

  const { data } = await gh.app.octokit.request("GET /app/installations/{installation_id}", {
    installation_id: installationId,
  });
  const account = data.account as { id?: number; type?: string } | null;
  if (!account || account.type !== "User" || String(account.id) !== githubUserId) {
    throw new GitHubAccessError("This GitHub App installation does not belong to your account");
  }
  return gh.app.getInstallationOctokit(installationId);
}

export async function installationRepos(octokit: Octokit) {
  const repos = await octokit.paginate("GET /installation/repositories", { per_page: 100 });
  return repos.map((r) => ({ fullName: r.full_name, private: r.private, defaultBranch: r.default_branch }));
}
