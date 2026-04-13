"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  Clock,
  DollarSign,
  FileText,
  LayoutDashboard,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ConfNavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

const CONF_NAV_ITEMS: ConfNavItem[] = [
  { href: "/tools/conf", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tools/conf/docs", label: "Documentation", icon: BookOpen },
  { href: "/tools/conf/budget", label: "Budget", icon: Wallet },
  { href: "/tools/conf/payments", label: "Payments", icon: DollarSign },
  { href: "/tools/conf/committee", label: "Committee", icon: Users },
  { href: "/tools/conf/delegates", label: "Delegates", icon: UserCheck },
  { href: "/tools/conf/delegates/register", label: "Register", icon: UserPlus },
  { href: "/tools/conf/booklet", label: "Booklet", icon: FileText },
  { href: "/tools/conf/meetings", label: "Meetings", icon: CalendarDays },
  { href: "/tools/conf/timeline", label: "Timeline", icon: Clock },
];

function isItemActive(pathname: string, href: string): boolean {
  if (href === "/tools/conf") {
    return pathname === href;
  }
  return pathname.startsWith(href);
}

export function ConfSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-56 shrink-0 flex-col gap-1 self-start sticky top-24 min-h-[calc(100vh-8rem)] border-r border-border pr-6">
      <p className="px-3 pt-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
        Conference Hub
      </p>
      {CONF_NAV_ITEMS.map((item) => {
        const active = isItemActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-ekd-gold/15 text-ekd-dark-brown dark:text-ekd-gold"
                : "text-muted-foreground hover:text-foreground hover:bg-accent",
            )}
          >
            <item.icon
              className={cn("h-4 w-4 shrink-0", active ? "text-ekd-gold" : "")}
            />
            {item.label}
          </Link>
        );
      })}
    </aside>
  );
}

export function ConfMobileNav() {
  const pathname = usePathname();

  return (
    <div className="lg:hidden overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
      <div className="flex gap-1.5 w-max">
        {CONF_NAV_ITEMS.map((item) => {
          const active = isItemActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors shrink-0",
                active
                  ? "bg-ekd-gold text-ekd-dark-brown"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon className="h-3.5 w-3.5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
