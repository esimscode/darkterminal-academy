import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Checklist } from "@/components/lab/checklist";
import { EvidenceLocker } from "@/components/lab/evidence-locker";
import { NotesEditor } from "@/components/lab/notes-editor";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DOMAINS, LABS, getLab } from "@/content/labs";
import { loadLab, type ChecklistItem } from "@/lib/content";
import { getUser } from "@/lib/supabase/server";

export function generateStaticParams() {
  return LABS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: PageProps<"/labs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const lab = getLab(slug);
  return { title: lab ? `Lab ${lab.number}: ${lab.title}` : "Lab" };
}

export default async function LabPage({ params }: PageProps<"/labs/[slug]">) {
  const { slug } = await params;
  const data = await loadLab(slug);
  if (!data) notFound();
  const { lab, body, checklist } = data;

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1fr_360px]">
      <article className="min-w-0 space-y-6">
        <header className="space-y-3">
          <p className="font-mono text-primary">Lab {lab.number}</p>
          <h1 className="text-3xl font-bold">{lab.title}</h1>
          <div className="flex flex-wrap gap-2">
            {lab.domains.map((d) => (
              <Badge key={d} variant="outline">
                Domain {d}: {DOMAINS[d]}
              </Badge>
            ))}
          </div>
        </header>
        <div className="prose prose-invert max-w-none prose-pre:bg-card prose-pre:border prose-code:before:content-none prose-code:after:content-none prose-a:text-primary prose-table:text-sm">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
            }}
          >
            {body}
          </ReactMarkdown>
        </div>
      </article>

      <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <Suspense fallback={<Skeleton className="h-96" />}>
          <Workspace slug={slug} checklist={checklist} />
        </Suspense>
      </aside>
    </div>
  );
}

/** The learner's own progress, evidence and notes: rendered per request. */
async function Workspace({ slug, checklist }: { slug: string; checklist: ChecklistItem[] }) {
  const { supabase, user } = await getUser();
  if (!user) return null;

  const [{ data: progress }, { data: notes }, { data: evidence }] = await Promise.all([
    supabase.from("checklist_progress").select("item_id").eq("lab_slug", slug),
    supabase.from("lab_notes").select("body").eq("lab_slug", slug).maybeSingle(),
    supabase.from("evidence").select("id, storage_path, caption, created_at").eq("lab_slug", slug).order("created_at"),
  ]);

  // Short-lived signed URLs: the bucket is private
  const paths = (evidence ?? []).map((e) => e.storage_path);
  const { data: signed } = paths.length
    ? await supabase.storage.from("evidence").createSignedUrls(paths, 60 * 10)
    : { data: [] };
  const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));

  return (
    <>
      <Checklist slug={slug} items={checklist} completed={(progress ?? []).map((p) => p.item_id)} />
      <EvidenceLocker
        slug={slug}
        userId={user.id}
        items={(evidence ?? []).map((e) => ({ id: e.id, caption: e.caption, url: urlByPath.get(e.storage_path) ?? null }))}
      />
      <NotesEditor slug={slug} initial={notes?.body ?? ""} />
    </>
  );
}
