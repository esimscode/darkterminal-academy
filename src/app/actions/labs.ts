"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getLab } from "@/content/labs";
import { loadLab } from "@/lib/content";
import { getUser } from "@/lib/supabase/server";

type Result = { ok: true } | { ok: false; error: string };

const slugSchema = z.string().refine((s) => !!getLab(s), "Unknown lab");

export async function toggleChecklistItem(input: { slug: string; itemId: string; done: boolean }): Promise<Result> {
  const parsed = z.object({ slug: slugSchema, itemId: z.string().max(100), done: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request" };
  const { slug, itemId, done } = parsed.data;

  // Only accept item ids that really exist in this lab's checklist
  const lab = await loadLab(slug);
  if (!lab?.checklist.some((i) => i.id === itemId)) return { ok: false, error: "Unknown checklist item" };

  const { supabase, user } = await getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { error } = done
    ? await supabase.from("checklist_progress").upsert({ user_id: user.id, lab_slug: slug, item_id: itemId })
    : await supabase.from("checklist_progress").delete().match({ user_id: user.id, item_id: itemId });
  if (error) return { ok: false, error: "Could not save progress" };

  revalidatePath("/labs", "layout");
  return { ok: true };
}

export async function saveNotes(input: { slug: string; body: string }): Promise<Result> {
  const parsed = z.object({ slug: slugSchema, body: z.string().max(50_000) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Notes are too long (50,000 characters max)" };

  const { supabase, user } = await getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { error } = await supabase.from("lab_notes").upsert({
    user_id: user.id,
    lab_slug: parsed.data.slug,
    body: parsed.data.body,
    updated_at: new Date().toISOString(),
  });
  return error ? { ok: false, error: "Could not save notes" } : { ok: true };
}

/** Called after the browser has uploaded the file to Storage under the user's folder. */
export async function recordEvidence(input: { slug: string; storagePath: string; caption: string }): Promise<Result> {
  const parsed = z
    .object({
      slug: slugSchema,
      storagePath: z.string().regex(/^[0-9a-f-]{36}\/[0-9]{2}-[a-z0-9-]+\/[0-9a-f-]{36}\.(png|jpg|webp)$/),
      caption: z.string().max(300),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid upload" };

  const { supabase, user } = await getUser();
  if (!user) return { ok: false, error: "Not signed in" };
  if (!parsed.data.storagePath.startsWith(`${user.id}/${parsed.data.slug}/`)) return { ok: false, error: "Invalid upload path" };

  const { error } = await supabase.from("evidence").insert({
    user_id: user.id,
    lab_slug: parsed.data.slug,
    storage_path: parsed.data.storagePath,
    caption: parsed.data.caption,
  });
  if (error) return { ok: false, error: "Could not record evidence" };
  revalidatePath(`/labs/${parsed.data.slug}`);
  return { ok: true };
}

export async function deleteEvidence(input: { id: string }): Promise<Result> {
  const parsed = z.object({ id: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request" };

  const { supabase, user } = await getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: row } = await supabase.from("evidence").select("storage_path, lab_slug").eq("id", parsed.data.id).single();
  if (!row) return { ok: false, error: "Not found" };

  await supabase.storage.from("evidence").remove([row.storage_path]);
  const { error } = await supabase.from("evidence").delete().eq("id", parsed.data.id);
  if (error) return { ok: false, error: "Could not delete" };
  revalidatePath(`/labs/${row.lab_slug}`);
  return { ok: true };
}
