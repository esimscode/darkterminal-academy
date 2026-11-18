import Link from "next/link";
import { FileCheck2, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { GithubIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DOMAINS, LABS } from "@/content/labs";

const features = [
  { icon: ShieldCheck, title: "Real labs", body: "Wazuh, Sysmon, Atomic Red Team, Suricata and CloudTrail, run on your own isolated VMs." },
  { icon: FileCheck2, title: "Evidence, not badges", body: "Every lab ends with an evidence checklist: screenshots, rules, notes and reports." },
  { icon: GithubIcon, title: "Publish to GitHub", body: "One click commits your work to your own repo, ready for hiring managers to review." },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 space-y-16">
      <section className="space-y-6">
        <Badge variant="outline" className="font-mono">Security+ SY0-801</Badge>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Study for Security+ by <span className="text-primary">doing the job</span>.
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Hands-on detection engineering labs mapped to the exam objectives. Work through them
          here, then publish a portfolio repo that shows what you can actually do.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <Link href="/labs">Start the labs</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="https://github.com/esimscode/darkterminal-labs" target="_blank" rel="noopener noreferrer">
              See an example repo
            </a>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {features.map(({ icon: Icon, title, body }) => (
          <Card key={title}>
            <CardHeader>
              <Icon className="size-6 text-primary" />
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{body}</CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">The labs</h2>
        <ol className="grid gap-2 sm:grid-cols-2">
          {LABS.map((lab) => (
            <li key={lab.slug} className="flex items-start gap-3 rounded-lg border p-3">
              <span className="font-mono text-primary">{lab.number}</span>
              <div>
                <p className="font-medium">{lab.title}</p>
                <p className="text-xs text-muted-foreground">
                  {lab.domains.map((d) => DOMAINS[d]).join(" · ")}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
