import "server-only";

import { DOMAINS, LABS } from "@/content/labs";
import { loadLab } from "@/lib/content";

export const MANAGED_DIR = "academy";
export const README_MARKER = "<!-- managed-by: darkterminal-academy -->";

export type LabWork = {
  slug: string;
  completed: Set<string>;
  notes: string;
  evidence: { path: string; fileName: string; caption: string }[];
};

/** Keep captions from breaking out of markdown image syntax. */
function mdText(s: string) {
  return s.replace(/[\r\n]+/g, " ").replace(/([\[\]\\])/g, "\\$1");
}

export async function buildLabReadme(work: LabWork) {
  const data = await loadLab(work.slug);
  if (!data) return null;
  const { lab, checklist } = data;
  const done = checklist.filter((i) => work.completed.has(i.id)).length;

  const lines = [
    `# Lab ${lab.number}: ${lab.title}`,
    "",
    `**Exam domains:** ${lab.domains.map((d) => `${d}.0 ${DOMAINS[d]}`).join(", ")}  `,
    `**Progress:** ${done}/${checklist.length} evidence items`,
    "",
    "## Evidence checklist",
    ...checklist.map((i) => `- [${work.completed.has(i.id) ? "x" : " "}] ${i.text}`),
    "",
    "## Write-up",
    work.notes.trim() || "_No notes yet._",
    "",
  ];
  if (work.evidence.length) {
    lines.push("## Screenshots", "");
    for (const e of work.evidence) {
      const cap = mdText(e.caption || "Screenshot");
      lines.push(`![${cap}](evidence/${e.fileName})`, `*${cap}*`, "");
    }
  }
  return { content: lines.join("\n"), done, total: checklist.length };
}

export function buildRootReadme(login: string, rows: { slug: string; done: number; total: number }[]) {
  const table = LABS.map((lab) => {
    const r = rows.find((x) => x.slug === lab.slug);
    const status = !r || r.done === 0 ? "⬜" : r.done >= r.total ? "✅" : "🟨";
    const link = r ? `[${lab.title}](${MANAGED_DIR}/labs/${lab.slug}/)` : lab.title;
    return `| ${lab.number} | ${link} | ${status} | ${r ? `${r.done}/${r.total}` : `0`} | ${lab.domains.join(", ")} |`;
  });
  return [
    README_MARKER,
    `# ${login}: Security+ (SY0-801) Detection Labs`,
    "",
    "Hands-on detection engineering work completed with [DarkTerminal Academy](https://github.com/esimscode/darkterminal-labs):",
    "Wazuh, Sysmon, Atomic Red Team, Suricata and AWS CloudTrail, run in an isolated home lab.",
    "",
    "## Progress",
    "| # | Lab | Status | Evidence | Exam domains |",
    "|---|---|---|---|---|",
    ...table,
    "",
    "_All testing was performed on isolated systems I own._",
    "",
  ].join("\n");
}
