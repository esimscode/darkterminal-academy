import Link from "next/link";
import { Terminal } from "lucide-react";

import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/supabase/server";

export async function SiteHeader() {
  const { user } = await getUser();

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-mono font-semibold">
          <Terminal className="size-5 text-primary" />
          <span>
            dark<span className="text-primary">terminal</span>
          </span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-sm">
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/labs">Labs</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/settings/github">Publish</Link>
              </Button>
              <form action={signOut}>
                <Button variant="outline" size="sm" type="submit">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <Button size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
