import "server-only";
import { z } from "zod";

/** Server-only secrets for the GitHub App. Never import this from a client component. */
const schema = z.object({
  GITHUB_APP_ID: z.string().regex(/^\d+$/),
  GITHUB_APP_SLUG: z.string().min(1),
  // PEM private key; newlines may be escaped as \n in env files
  GITHUB_APP_PRIVATE_KEY: z.string().min(100).transform((k) => k.replace(/\\n/g, "\n")),
});

export type GitHubAppEnv = z.infer<typeof schema>;

export function githubAppEnv(): GitHubAppEnv | null {
  const parsed = schema.safeParse(process.env);
  return parsed.success ? parsed.data : null;
}
