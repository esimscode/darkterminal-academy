"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteEvidence, recordEvidence } from "@/app/actions/labs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
const MAX_BYTES = 5 * 1024 * 1024;

type Item = { id: string; caption: string; url: string | null };

export function EvidenceLocker({ slug, userId, items }: { slug: string; userId: string; items: Item[] }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [pending, startTransition] = useTransition();

  const upload = () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return toast.error("Choose an image first");
    const ext = TYPES[file.type];
    if (!ext) return toast.error("PNG, JPEG or WebP only");
    if (file.size > MAX_BYTES) return toast.error("Max 5 MB");

    startTransition(async () => {
      const path = `${userId}/${slug}/${crypto.randomUUID()}.${ext}`;
      const supabase = createClient();
      const { error } = await supabase.storage.from("evidence").upload(path, file, { contentType: file.type });
      if (error) return void toast.error("Upload failed");
      const res = await recordEvidence({ slug, storagePath: path, caption });
      if (!res.ok) return void toast.error(res.error);
      setCaption("");
      if (fileRef.current) fileRef.current.value = "";
      toast.success("Evidence added");
    });
  };

  const remove = (id: string) =>
    startTransition(async () => {
      const res = await deleteEvidence({ id });
      if (!res.ok) toast.error(res.error);
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evidence locker</CardTitle>
        <CardDescription>
          Screenshots are private until you publish. Blur real hostnames, IPs, usernames and
          anything outside your lab first.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length > 0 && (
          <ul className="grid grid-cols-2 gap-2">
            {items.map((item) => (
              <li key={item.id} className="group relative overflow-hidden rounded-md border">
                {item.url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL
                  <img src={item.url} alt={item.caption || "Lab evidence"} className="aspect-video w-full object-cover" />
                ) : (
                  <div className="aspect-video bg-muted" />
                )}
                <p className="truncate px-2 py-1 text-xs text-muted-foreground">{item.caption || "Untitled"}</p>
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute right-1 top-1 size-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  onClick={() => remove(item.id)}
                  aria-label={`Delete ${item.caption || "evidence"}`}
                  disabled={pending}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div className="space-y-2">
          <Label htmlFor={`file-${slug}`}>Screenshot</Label>
          <Input id={`file-${slug}`} ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" />
          <Label htmlFor={`caption-${slug}`}>Caption</Label>
          <Input
            id={`caption-${slug}`}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={300}
            placeholder="e.g. Wazuh agent showing as active"
          />
          <Button onClick={upload} disabled={pending} size="sm" className="w-full">
            <ImagePlus /> {pending ? "Uploading…" : "Add evidence"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
