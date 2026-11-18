import type { Metadata } from "next";
import { Suspense } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: { default: "DarkTerminal Academy", template: "%s · DarkTerminal Academy" },
  description:
    "Hands-on Security+ (SY0-801) detection labs. Do the work, then publish your evidence to GitHub for employers to review.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <Suspense fallback={<div className="h-14 border-b" />}>
          <SiteHeader />
        </Suspense>
        <main className="flex-1">{children}</main>
        <footer className="border-t py-6 text-center text-xs text-muted-foreground px-4">
          Unofficial study resource. Not affiliated with or endorsed by CompTIA. Security+ is a
          trademark of CompTIA, Inc. Run all labs on isolated systems you own.
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
