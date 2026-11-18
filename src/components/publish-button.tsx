"use client";

import { useTransition } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { publishToGitHub } from "@/app/actions/github";
import { Button } from "@/components/ui/button";

export function PublishButton({ disabled }: { disabled?: boolean }) {
  const [pending, startTransition] = useTransition();

  const publish = () =>
    startTransition(async () => {
      const res = await publishToGitHub();
      if (!res.ok) return void toast.error(res.error);
      toast.success("Published to GitHub", {
        action: res.url ? { label: "View", onClick: () => window.open(res.url, "_blank", "noopener") } : undefined,
      });
    });

  return (
    <Button onClick={publish} disabled={disabled || pending}>
      <Upload /> {pending ? "Publishing…" : "Publish to GitHub"}
    </Button>
  );
}
