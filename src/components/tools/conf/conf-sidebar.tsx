"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  Clock,
  DollarSign,
  Megaphone,
  FileText,
  LayoutDashboard,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  HandCoins,
  ClipboardList,
  BarChart3,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ConfNavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  minAccess?: "public" | "delegate" | "manager";
};

const CONF_NAV_ITEMS: ConfNavItem[] = [
  {
    href: "/tools/conf",
    label: "Dashboard",
    icon: LayoutDashboard,
    minAccess: "public",
  },
  {
    href: "/tools/conf/docs",
    label: "Documentation",
    icon: BookOpen,
    minAccess: "manager",
  },
  {
    href: "/tools/conf/delegates",
    label: "Delegates",
    icon: UserCheck,
    minAccess: "delegate",
  },
  {
    href: "/tools/conf/delegates/register",
    label: "Register",
    icon: UserPlus,
    minAccess: "public",
  },
  {
    href: "/tools/conf/booklet",
    label: "Booklet",
    icon: FileText,
    minAccess: "delegate",
  },
  {
    href: "/tools/conf/budget",
    label: "Budget",
    icon: Wallet,
    minAccess: "manager",
  },
  {
    href: "/tools/conf/finance/secretary",
    label: "Financial Secretary",
    icon: HandCoins,
    minAccess: "manager",
  },
  {
    href: "/tools/conf/payments",
    label: "Payments",
    icon: DollarSign,
    minAccess: "manager",
  },
  {
    href: "/tools/conf/letters",
    label: "Letters / Memos",
    icon: Mail,
    minAccess: "manager",
  },
  {
    href: "/tools/conf/committee",
    label: "Committee",
    icon: Users,
    minAccess: "delegate",
  },
  {
    href: "/tools/conf/meetings",
    label: "Meetings",
    icon: CalendarDays,
    minAccess: "manager",
  },
  {
    href: "/tools/conf/timeline",
    label: "Timeline",
    icon: Clock,
    minAccess: "manager",
  },
  {
    href: "/tools/kit?surface=fly",
    label: "Flyers",
    icon: Megaphone,
    minAccess: "manager",
  },
  {
    href: "/tools/conf/finance/audit",
    label: "Audit Log",
    icon: ClipboardList,
    minAccess: "manager",
  },
  {
    href: "/tools/conf/finance/reports",
    label: "Report Builder",
    icon: BarChart3,
    minAccess: "manager",
  },
];

type ConfAccessFlags = {
  isParticipant: boolean;
  isManager: boolean;
  isSuperAdmin: boolean;
};

function canViewNavItem(item: ConfNavItem, access: ConfAccessFlags): boolean {
  const requirement = item.minAccess ?? "manager";

  if (requirement === "public") return true;
  if (requirement === "delegate") {
    return access.isParticipant || access.isManager || access.isSuperAdmin;
  }

  return access.isManager || access.isSuperAdmin;
}

function getManagerFlagsFromRole(role: string) {
  const normalized = role.toUpperCase();
  const isManager = [
    "SUPER_ADMIN",
    "ADMIN",
    "JUDGE_ADMIN",
    "HEAD_JUDGE",
  ].includes(normalized);
  return {
    isManager,
    isSuperAdmin: normalized === "SUPER_ADMIN",
  };
}

async function resolveConferenceAccessFlags(): Promise<ConfAccessFlags> {
  const [confRes, authRes] = await Promise.all([
    fetch("/api/conf/default/access", { cache: "no-store" }),
    fetch("/api/auth/me", { cache: "no-store" }),
  ]);

  let confFlags: ConfAccessFlags = {
    isParticipant: false,
    isManager: false,
    isSuperAdmin: false,
  };

  if (confRes.ok) {
    const payload = (await confRes.json()) as {
      isParticipant?: boolean;
      isManager?: boolean;
      isSuperAdmin?: boolean;
    };

    confFlags = {
      isParticipant: Boolean(payload.isParticipant),
      isManager: Boolean(payload.isManager),
      isSuperAdmin: Boolean(payload.isSuperAdmin),
    };
  }

  let roleFlags = {
    isManager: false,
    isSuperAdmin: false,
  };
  if (authRes.ok) {
    const authPayload = (await authRes.json()) as {
      role?: string;
    };
    roleFlags = getManagerFlagsFromRole(String(authPayload.role || ""));
  }

  return {
    isParticipant:
      confFlags.isParticipant || roleFlags.isManager || roleFlags.isSuperAdmin,
    isManager: confFlags.isManager || roleFlags.isManager,
    isSuperAdmin: confFlags.isSuperAdmin || roleFlags.isSuperAdmin,
  };
}

function isItemActive(pathname: string, href: string): boolean {
  if (href === "/tools/conf") {
    return pathname === href;
  }
  return pathname.startsWith(href);
}

export function ConfSidebar() {
  const pathname = usePathname();
  const [access, setAccess] = useState<ConfAccessFlags>({
    isParticipant: false,
    isManager: false,
    isSuperAdmin: false,
  });

  useEffect(() => {
    let active = true;

    const loadAccess = async () => {
      try {
        const flags = await resolveConferenceAccessFlags();
        if (!active) return;
        setAccess(flags);
      } catch {
        // Keep public-only navigation on network errors.
      }
    };

    void loadAccess();
    return () => {
      active = false;
    };
  }, []);

  const visibleItems = CONF_NAV_ITEMS.filter((item) =>
    canViewNavItem(item, access),
  );

  return (
    <aside className="hidden lg:flex w-56 shrink-0 flex-col gap-1 self-start sticky top-24 min-h-[calc(100vh-8rem)] border-r border-border pl-4 sm:pl-5 lg:pl-6 pr-4">
      <p className="px-2 pt-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
        Conference Hub
      </p>
      {visibleItems.map((item) => {
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
  const [access, setAccess] = useState<ConfAccessFlags>({
    isParticipant: false,
    isManager: false,
    isSuperAdmin: false,
  });

  useEffect(() => {
    let active = true;

    const loadAccess = async () => {
      try {
        const flags = await resolveConferenceAccessFlags();
        if (!active) return;
        setAccess(flags);
      } catch {
        // Keep public-only navigation on network errors.
      }
    };

    void loadAccess();
    return () => {
      active = false;
    };
  }, []);

  const visibleItems = CONF_NAV_ITEMS.filter((item) =>
    canViewNavItem(item, access),
  );

  return (
    <div className="lg:hidden overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
      <div className="flex gap-1.5 w-max">
        {visibleItems.map((item) => {
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
