import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

import { getLab } from "@/content/labs";

export type ChecklistItem = { id: string; text: string };

const CHECKLIST_LINE = /^\s*- \[[ xX]\] (.+)$/;

/** Stable id for a checklist item: changes only if the item text changes. */
function itemId(slug: string, text: string) {
  return `${slug}:${createHash("sha256").update(text.trim()).digest("hex").slice(0, 10)}`;
}

/**
 * Loads a lab's markdown and pulls its "- [ ]" evidence items out into an
 * interactive checklist. The rest of the markdown is rendered as the guide.
 */
export async function loadLab(slug: string) {
  "use cache";
  const lab = getLab(slug);
  if (!lab) return null;
  const raw = await readFile(path.join(process.cwd(), "content", "labs", `${slug}.md`), "utf8");

  const checklist: ChecklistItem[] = [];
  const body = raw
    .split("\n")
    .filter((line) => {
      const m = line.match(CHECKLIST_LINE);
      if (!m) return true;
      checklist.push({ id: itemId(slug, m[1]), text: m[1].trim() });
      return false;
    })
    .join("\n")
    // the first "# Lab NN: Title" heading is shown by the page header instead
    .replace(/^# .*\n/, "");

  return { lab, body, checklist };
}

export async function checklistCounts() {
  "use cache";
  const { LABS } = await import("@/content/labs");
  const entries = await Promise.all(LABS.map(async (l) => [l.slug, (await loadLab(l.slug))?.checklist.length ?? 0] as const));
  return Object.fromEntries(entries) as Record<string, number>;
}
