"use client";

import { useOptimistic, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

import { toggleChecklistItem } from "@/app/actions/labs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

type Item = { id: string; text: string };

export function Checklist({ slug, items, completed }: { slug: string; items: Item[]; completed: string[] }) {
  const [, startTransition] = useTransition();
  const [done, setDone] = useOptimistic(new Set(completed), (state, { id, value }: { id: string; value: boolean }) => {
    const next = new Set(state);
    if (value) next.add(id);
    else next.delete(id);
    return next;
  });

  const toggle = (id: string, value: boolean) =>
    startTransition(async () => {
      setDone({ id, value });
      const res = await toggleChecklistItem({ slug, itemId: id, done: value });
      if (!res.ok) toast.error(res.error);
    });

  const count = items.filter((i) => done.has(i.id)).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evidence checklist</CardTitle>
        <CardDescription>
          {count}/{items.length} complete
        </CardDescription>
        <Progress value={items.length ? (count / items.length) * 100 : 0} aria-label="Lab progress" />
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3">
              <Checkbox
                id={item.id}
                checked={done.has(item.id)}
                onCheckedChange={(v) => toggle(item.id, v === true)}
                className="mt-0.5"
              />
              <label htmlFor={item.id} className="text-sm leading-snug [&_code]:font-mono [&_code]:text-primary">
                <ReactMarkdown allowedElements={["p", "code", "strong", "em"]} unwrapDisallowed components={{ p: ({ children }) => <>{children}</> }}>
                  {item.text}
                </ReactMarkdown>
              </label>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
