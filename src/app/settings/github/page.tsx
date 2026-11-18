import type { Metadata } from "next";
import { Suspense } from "react";
import { ExternalLink } from "lucide-react";

import { selectRepo } from "@/app/actions/github";
import { PublishButton } from "@/components/publish-button";
import { GithubIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getGitHubApp, installationRepos, verifiedInstallation } from "@/lib/github";
import { getUser, githubIdentity } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Publish to GitHub" };

const STATUS: Record<string, string> = {
  connected: "GitHub App connected. Now choose a repository.",
  "not-yours": "That installation belongs to a different GitHub account.",
  "no-github": "Your account isn't linked to GitHub.",
  invalid: "GitHub didn't send a valid installation.",
  error: "Something went wrong connecting GitHub.",
};

export default function GitHubSettingsPage({ searchParams }: PageProps<"/settings/github">) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-10"><Skeleton className="h-96" /></div>}>
      <Settings searchParams={searchParams} />
    </Suspense>
  );
}

async function Settings({ searchParams }: { searchParams: PageProps<"/settings/github">["searchParams"] }) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? STATUS[params.status] : undefined;
  const app = getGitHubApp();
  const { supabase, user } = await getUser();
  const gh = user ? githubIdentity(user) : null;
  const { data: conn } = await supabase.from("github_connections").select("*").maybeSingle();

  let repos: { fullName: string; private: boolean }[] = [];
  let connectionError: string | null = null;
  if (app && conn && gh) {
    try {
      repos = await installationRepos(await verifiedInstallation(conn.installation_id, gh.id));
    } catch {
      connectionError = "We couldn't verify your GitHub App installation. Try reinstalling it.";
    }
  }
  const installUrl = app ? `https://github.com/apps/${app.slug}/installations/new` : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-bold">Publish to GitHub</h1>
      {status && <p className="rounded-md border p-3 text-sm">{status}</p>}

      <Card>
        <CardHeader>
          <CardTitle>1. Connect a repository</CardTitle>
          <CardDescription>
            Create an empty public repo (e.g. <code className="font-mono">secplus-labs</code>), then
            install the DarkTerminal GitHub App on <strong>only that repository</strong>. The app can
            only read and write contents in repos you select.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!installUrl ? (
            <p className="text-sm text-muted-foreground">Publishing isn&apos;t configured on this server yet.</p>
          ) : (
            <Button variant={conn ? "outline" : "default"} asChild>
              <a href={installUrl}>
                <GithubIcon /> {conn ? "Change repository access" : "Install GitHub App"}
              </a>
            </Button>
          )}
          {connectionError && <p className="text-sm text-destructive">{connectionError}</p>}
          {repos.length > 0 && (
            <form action={selectRepo} className="flex gap-2">
              <select
                name="repo"
                defaultValue={conn?.repo_full_name ?? ""}
                className="h-9 flex-1 rounded-md border bg-transparent px-3 text-sm dark:bg-input/30"
                aria-label="Repository"
              >
                <option value="" disabled>
                  Choose a repository…
                </option>
                {repos.map((r) => (
                  <option key={r.fullName} value={r.fullName}>
                    {r.fullName} {r.private ? "(private)" : ""}
                  </option>
                ))}
              </select>
              <Button type="submit" variant="secondary">
                Save
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Publish your work</CardTitle>
          <CardDescription>
            Commits your checklists, notes and screenshots to <code className="font-mono">academy/</code> in
            your repo, and a progress README if the repo doesn&apos;t already have one. Review your
            screenshots for anything sensitive first: published repos are public.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <PublishButton disabled={!conn?.repo_full_name || !!connectionError} />
          {conn?.last_commit_url && (
            <a
              href={conn.last_commit_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
            >
              Last published commit <ExternalLink className="size-3" />
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
