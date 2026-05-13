"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function FinanceSectionNav({
  showFs,
  showTreasurer,
  showOps,
}: {
  showFs: boolean;
  showTreasurer: boolean;
  showOps: boolean;
}) {
  const pathname = usePathname();

  const links: { href: string; label: string; tone: "fs" | "treasurer" | "neutral" }[] =
    [];
  if (showFs) {
    links.push({
      href: "/tools/conf/finance/fs",
      label: "Financial Secretary",
      tone: "fs",
    });
  }
  if (showTreasurer) {
    links.push({
      href: "/tools/conf/finance/treasurer",
      label: "Treasurer",
      tone: "treasurer",
    });
  }
  if (showOps) {
    links.push({
      href: "/tools/conf/finance/audit",
      label: "Audit log",
      tone: "neutral",
    });
    links.push({
      href: "/tools/conf/finance/reports",
      label: "Reports",
      tone: "neutral",
    });
  }

  if (links.length === 0) return null;

  return (
    <nav
      className="flex flex-wrap gap-2 rounded-xl border border-border bg-muted/40 p-2 text-sm"
      aria-label="Conference finance sections"
    >
      {links.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-lg px-3 py-1.5 font-medium transition-colors",
              active
                ? item.tone === "fs"
                  ? "bg-[#002868] text-white shadow-sm"
                  : item.tone === "treasurer"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-foreground text-background"
                : item.tone === "fs"
                  ? "text-[#002868] hover:bg-[#002868]/10"
                  : item.tone === "treasurer"
                    ? "text-amber-900 hover:bg-amber-500/15"
                    : "text-muted-foreground hover:bg-muted",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
