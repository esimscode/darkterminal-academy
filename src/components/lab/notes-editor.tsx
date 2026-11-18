"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { saveNotes } from "@/app/actions/labs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function NotesEditor({ slug, initial }: { slug: string; initial: string }) {
  const [body, setBody] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      const res = await saveNotes({ slug, body });
      if (res.ok) {
        setSaved(body);
        toast.success("Notes saved");
      } else toast.error(res.error);
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
        <CardDescription>Markdown. Published to GitHub as this lab&apos;s write-up.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={50_000}
          rows={10}
          placeholder="What you did, what you saw, what you learned…"
          className="font-mono text-xs"
          aria-label="Lab notes"
        />
        <Button onClick={save} disabled={pending || body === saved} size="sm">
          {pending ? "Saving…" : body === saved ? "Saved" : "Save notes"}
        </Button>
      </CardContent>
    </Card>
  );
}
