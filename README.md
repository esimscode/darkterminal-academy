# DarkTerminal Academy

A course app for the [darkterminal-labs](https://github.com/esimscode/darkterminal-labs) Security+ (SY0-801) detection labs. Learners work through each lab, tick off evidence, upload screenshots and write notes, then **publish everything to their own GitHub repo** for hiring managers to review.

**Stack:** Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind v4 · shadcn/ui · Supabase (Auth, Postgres + RLS, Storage) · GitHub App · Vercel

## Features (MVP)
- GitHub sign-in (Supabase Auth)
- Lab player: guides are prerendered from markdown; the evidence checklist, screenshots and notes stream in for each user
- Progress dashboard by lab and exam domain
- Evidence locker: a private Storage bucket, 5 MB images, short-lived signed URLs
- **Publish to GitHub:** commits `academy/labs/<lab>/README.md` plus screenshots, and a progress README, to a repo the learner picks

## Security model
- **Row-level security on every table.** Users can only read and write their own rows ([migration](supabase/migrations/20261118000000_init.sql)). No Supabase service-role key is used anywhere.
- **Storage:** private bucket; objects must sit under `<user_id>/…`; MIME type and size limits are enforced by the bucket.
- **GitHub:** the sign-in OAuth asks only for `read:user`. Repo writes go through a GitHub App the user installs on chosen repos only (Contents: read & write). Every publish re-verifies with the GitHub API that the installation belongs to the signed-in user's GitHub account and that the target repo is granted.
- Server actions validate all input with zod. Checklist item ids must exist in the lab content. `?next=` redirects are restricted to relative paths.
- Security headers include CSP, HSTS, `frame-ancestors 'none'` and nosniff. A nonce-based CSP is on the roadmap.
- Publishing is limited to once a minute per user.

## Setup

### 1. Supabase
1. Create a project at supabase.com.
2. Run the migration in the SQL editor (or `supabase db push`): `supabase/migrations/20261118000000_init.sql`.
3. **Auth → Providers → GitHub:** enable it, using a GitHub **OAuth App** whose callback URL is `https://<project>.supabase.co/auth/v1/callback`.
4. **Auth → URL Configuration:** set the Site URL and add `http://localhost:3000/auth/callback` and `https://<your-domain>/auth/callback` to the redirect URLs.

### 2. GitHub App (for publishing)
GitHub → Settings → Developer settings → **GitHub Apps → New**:
- **Homepage URL:** your site
- **Setup URL:** `https://<your-domain>/api/github/setup`, with *Redirect on update* ticked
- **Webhook:** off
- **Repository permissions:** Contents **Read & write** (Metadata read-only is added automatically)
- **Where can it be installed:** Any account
- Generate a **private key**. Put the App ID, slug and key in your env.

### 3. Run
```bash
cp .env.example .env.local   # fill in values
pnpm install
pnpm dev
```

### Lab content
Lab guides live in `content/labs/` and are synced from darkterminal-labs:
```bash
node scripts/sync-content.mjs ../darkterminal-labs
```
Every `- [ ]` line in a guide becomes a trackable evidence item.

## Roadmap
- **v2:** Sigma/Wazuh rule editor with live validation, incident report builder, public portfolio page
- **v3:** Gumroad license-key unlock for Pro labs, walkthrough videos, PBQ-style scenarios, objective quizzes

---
Unofficial study resource. Not affiliated with or endorsed by CompTIA.
