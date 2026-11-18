import type { Metadata } from "next";
import { Suspense } from "react";


import { signInWithGitHub } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { GithubIcon } from "@/components/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { safeNext } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <Suspense fallback={null}>
      <Login searchParams={searchParams} />
    </Suspense>
  );
}

async function Login({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const params = await searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : undefined);
  const error = typeof params.error === "string";

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Sign in to DarkTerminal Academy</CardTitle>
          <CardDescription>
            Sign in with GitHub. Publishing your work to a repo is a separate step you control
            later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p role="alert" className="text-sm text-destructive">
              Sign-in didn&apos;t complete. Please try again.
            </p>
          )}
          <form action={signInWithGitHub}>
            <input type="hidden" name="next" value={next} />
            <Button type="submit" className="w-full">
              <GithubIcon /> Continue with GitHub
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
