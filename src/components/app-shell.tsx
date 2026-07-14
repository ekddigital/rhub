"use client";

import { AppSidebar, AppMobileNav } from "@/components/navigation/app-sidebar";

interface ShellUser {
  id: string;
  name: string;
  role: string;
  canAccessAdmin?: boolean | null;
  canImpersonate?: boolean | null;
  isImpersonating?: boolean;
}

interface AppShellProps {
  user: ShellUser;
  children: React.ReactNode;
}

/**
 * Wraps authenticated app pages with a sidebar (desktop) and compact
 * horizontal nav (mobile). Drop this inside any (hub) page that needs
 * a consistent in-app layout.
 */
export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <AppMobileNav user={user} />
      <div className="flex items-start">
        <AppSidebar user={user} />
        <div className="flex-1 min-w-0 pl-8">{children}</div>
      </div>
    </div>
  );
}
