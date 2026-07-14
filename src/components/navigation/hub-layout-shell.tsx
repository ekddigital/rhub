"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { cn } from "@/lib/utils";

export function HubLayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const hideFooter =
    pathname.startsWith("/tools/kit") || pathname.startsWith("/tools/conf");

  return (
    <div className="relative isolate flex min-h-screen flex-col bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-40">
        <div className="absolute -left-10 top-10 h-64 w-64 rounded-full bg-linear-to-br from-[#8E0E00]/40 via-[#C8A061]/30 to-transparent blur-3xl" />
        <div className="absolute right-0 top-64 h-72 w-72 rounded-full bg-linear-to-br from-[#182E5F]/40 via-[#1F1C18]/30 to-transparent blur-3xl" />
      </div>
      <div className="sticky top-0 z-50">
        <ImpersonationBanner />
        <SiteHeader sticky={false} />
      </div>
      <main
        className={cn(
          "flex-1 w-full pt-8",
          hideFooter ? "pb-8" : "pb-20",
        )}
      >
        {children}
      </main>
      {!hideFooter ? <SiteFooter /> : null}
    </div>
  );
}
