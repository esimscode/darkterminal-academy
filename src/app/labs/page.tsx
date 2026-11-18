import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { DOMAINS, LABS } from "@/content/labs";
import { checklistCounts } from "@/lib/content";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Labs" };

export default function LabsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-10"><Skeleton className="h-96" /></div>}>
      <LabsContent />
    </Suspense>
  );
}

async function LabsContent() {
  const { supabase } = await getUser();
  const [{ data: progress }, totals] = await Promise.all([
    supabase.from("checklist_progress").select("lab_slug"),
    checklistCounts(),
  ]);

  const done: Record<string, number> = {};
  for (const row of progress ?? []) done[row.lab_slug] = (done[row.lab_slug] ?? 0) + 1;

  const totalItems = Object.values(totals).reduce((a, b) => a + b, 0);
  const totalDone = Object.values(done).reduce((a, b) => a + b, 0);

  // Progress by exam domain: a lab counts toward every domain it covers
  const domainPct = Object.keys(DOMAINS).map((key) => {
    const d = Number(key);
    const labs = LABS.filter((l) => l.domains.includes(d));
    const t = labs.reduce((a, l) => a + (totals[l.slug] ?? 0), 0);
    const c = labs.reduce((a, l) => a + Math.min(done[l.slug] ?? 0, totals[l.slug] ?? 0), 0);
    return { d, pct: t ? Math.round((c / t) * 100) : 0 };
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold">Your labs</h1>
        <p className="text-muted-foreground">
          {totalDone} of {totalItems} evidence items complete
        </p>
        <Progress value={totalItems ? (totalDone / totalItems) * 100 : 0} aria-label="Overall progress" />
      </section>

      <section className="grid gap-3 sm:grid-cols-5">
        {domainPct.map(({ d, pct }) => (
          <div key={d} className="rounded-lg border p-3 space-y-2">
            <p className="text-xs text-muted-foreground">
              Domain {d}: {DOMAINS[d]}
            </p>
            <p className="font-mono text-xl">{pct}%</p>
            <Progress value={pct} aria-label={`Domain ${d} progress`} />
          </div>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {LABS.map((lab) => {
          const total = totals[lab.slug] ?? 0;
          const count = Math.min(done[lab.slug] ?? 0, total);
          return (
            <Link key={lab.slug} href={`/labs/${lab.slug}`} className="group">
              <Card className="h-full transition-colors group-hover:border-primary/60">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-primary">{lab.number}</span>
                    <CardTitle>{lab.title}</CardTitle>
                    {!lab.free && (
                      <Badge variant="secondary" className="ml-auto">
                        <Lock /> Pro
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{lab.summary}</CardDescription>
                  <div className="pt-2 space-y-1">
                    <Progress value={total ? (count / total) * 100 : 0} aria-label={`${lab.title} progress`} />
                    <p className="text-xs text-muted-foreground">
                      {count}/{total} evidence items
                    </p>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
