"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { LABS } from "@/content/labs";
import { GitHubAccessError, installationRepos, verifiedInstallation } from "@/lib/github";
import { MANAGED_DIR, README_MARKER, buildLabReadme, buildRootReadme } from "@/lib/portfolio";
import { getUser, githubIdentity } from "@/lib/supabase/server";

type Result = { ok: true; url?: string } | { ok: false; error: string };

const MIN_INTERVAL_MS = 60_000;
const MAX_IMAGES = 80;

async function context() {
  const { supabase, user } = await getUser();
  if (!user) throw new GitHubAccessError("Not signed in");
  const gh = githubIdentity(user);
  if (!gh) throw new GitHubAccessError("Sign in with GitHub to publish");
  const { data: conn } = await supabase.from("github_connections").select("*").maybeSingle();
  if (!conn) throw new GitHubAccessError("Install the GitHub App first");
  const octokit = await verifiedInstallation(conn.installation_id, gh.id);
  return { supabase, user, gh, conn, octokit };
}

export async function selectRepo(formData: FormData): Promise<void> {
  const repo = z.string().regex(/^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/).safeParse(formData.get("repo"));
  if (!repo.success) return;
  const { supabase, user, octokit } = await context();
  const repos = await installationRepos(octokit);
  if (!repos.some((r) => r.fullName === repo.data)) return; // not granted to the app
  await supabase
    .from("github_connections")
    .update({ repo_full_name: repo.data, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);
  revalidatePath("/settings/github");
}

export async function publishToGitHub(): Promise<Result> {
  try {
    const { supabase, user, gh, conn, octokit } = await context();
    if (!conn.repo_full_name) return { ok: false, error: "Choose a repository first" };
    if (conn.last_published_at && Date.now() - new Date(conn.last_published_at).getTime() < MIN_INTERVAL_MS)
      return { ok: false, error: "Please wait a minute between publishes" };

    // Re-check the repo is still granted to this installation
    const repos = await installationRepos(octokit);
    const target = repos.find((r) => r.fullName === conn.repo_full_name);
    if (!target) return { ok: false, error: "The app no longer has access to that repository" };
    const [owner, repo] = target.fullName.split("/");

    // Gather the user's work (RLS limits these queries to their own rows)
    const [{ data: progress }, { data: notes }, { data: evidence }] = await Promise.all([
      supabase.from("checklist_progress").select("lab_slug, item_id"),
      supabase.from("lab_notes").select("lab_slug, body"),
      supabase.from("evidence").select("lab_slug, storage_path, caption").order("created_at").limit(MAX_IMAGES),
    ]);

    const touched = new Set<string>([
      ...(progress ?? []).map((p) => p.lab_slug),
      ...(notes ?? []).filter((n) => n.body.trim()).map((n) => n.lab_slug),
      ...(evidence ?? []).map((e) => e.lab_slug),
    ]);
    if (touched.size === 0) return { ok: false, error: "Nothing to publish yet: complete a checklist item or add notes first" };

    // Make sure the branch exists (a brand-new repo has no commits)
    const branch = target.defaultBranch || "main";
    let headSha: string;
    try {
      const { data: ref } = await octokit.rest.git.getRef({ owner, repo, ref: `heads/${branch}` });
      headSha = ref.object.sha;
    } catch {
      const { data } = await octokit.rest.repos.createOrUpdateFileContents({
        owner, repo, path: "README.md", branch,
        message: "Initialize portfolio repo",
        content: Buffer.from(`${README_MARKER}\n`).toString("base64"),
      });
      headSha = data.commit.sha!;
    }
    const { data: headCommit } = await octokit.rest.git.getCommit({ owner, repo, commit_sha: headSha });
    const { data: existing } = await octokit.rest.git.getTree({ owner, repo, tree_sha: headCommit.tree.sha, recursive: "true" });

    type Entry = { path: string; mode: "100644"; type: "blob"; sha?: string | null; content?: string };
    const entries: Entry[] = [];
    const rows: { slug: string; done: number; total: number }[] = [];

    for (const lab of LABS.filter((l) => touched.has(l.slug))) {
      const labEvidence = (evidence ?? [])
        .filter((e) => e.lab_slug === lab.slug)
        .map((e) => ({ path: e.storage_path, caption: e.caption, fileName: e.storage_path.split("/").pop()! }));

      for (const e of labEvidence) {
        const { data: file, error } = await supabase.storage.from("evidence").download(e.path);
        if (error || !file) continue;
        const { data: blob } = await octokit.rest.git.createBlob({
          owner, repo, encoding: "base64",
          content: Buffer.from(await file.arrayBuffer()).toString("base64"),
        });
        entries.push({ path: `${MANAGED_DIR}/labs/${lab.slug}/evidence/${e.fileName}`, mode: "100644", type: "blob", sha: blob.sha });
      }

      const readme = await buildLabReadme({
        slug: lab.slug,
        completed: new Set((progress ?? []).filter((p) => p.lab_slug === lab.slug).map((p) => p.item_id)),
        notes: notes?.find((n) => n.lab_slug === lab.slug)?.body ?? "",
        evidence: labEvidence,
      });
      if (!readme) continue;
      entries.push({ path: `${MANAGED_DIR}/labs/${lab.slug}/README.md`, mode: "100644", type: "blob", content: readme.content });
      rows.push({ slug: lab.slug, done: readme.done, total: readme.total });
    }

    // Root README: only write it if it's missing or one we created earlier
    const rootReadme = existing.tree.find((t) => t.path === "README.md");
    let ownsRoot = !rootReadme;
    if (rootReadme?.sha) {
      const { data: blob } = await octokit.rest.git.getBlob({ owner, repo, file_sha: rootReadme.sha });
      ownsRoot = Buffer.from(blob.content, "base64").toString("utf8").startsWith(README_MARKER);
    }
    if (ownsRoot) entries.push({ path: "README.md", mode: "100644", type: "blob", content: buildRootReadme(gh.login, rows) });

    // Remove files we previously published that no longer exist (e.g. deleted screenshots)
    const written = new Set(entries.map((e) => e.path));
    for (const t of existing.tree) {
      if (t.type === "blob" && t.path?.startsWith(`${MANAGED_DIR}/`) && !written.has(t.path)) {
        entries.push({ path: t.path, mode: "100644", type: "blob", sha: null });
      }
    }

    const { data: tree } = await octokit.rest.git.createTree({ owner, repo, base_tree: headCommit.tree.sha, tree: entries });
    if (tree.sha === headCommit.tree.sha) return { ok: true, url: `https://github.com/${owner}/${repo}` };

    const { data: commit } = await octokit.rest.git.createCommit({
      owner, repo, tree: tree.sha, parents: [headSha],
      message: `Update lab portfolio (${rows.map((r) => r.slug.slice(0, 2)).join(", ")})`,
    });
    await octokit.rest.git.updateRef({ owner, repo, ref: `heads/${branch}`, sha: commit.sha });

    const url = `https://github.com/${owner}/${repo}/commit/${commit.sha}`;
    await supabase
      .from("github_connections")
      .update({ last_published_at: new Date().toISOString(), last_commit_url: url })
      .eq("user_id", user.id);
    revalidatePath("/settings/github");
    return { ok: true, url };
  } catch (e) {
    if (e instanceof GitHubAccessError) return { ok: false, error: e.message };
    console.error("publish failed", e);
    return { ok: false, error: "Publishing failed. Please try again." };
  }
}
