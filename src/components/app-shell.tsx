"use client";

import { AppSidebar, AppMobileNav } from "@/components/navigation/app-sidebar";
import { ImpersonationBanner } from "@/components/impersonation-banner";

interface ShellUser {
  id: string;
  name: string;
  role: string;
  canAccessAdmin?: boolean | null;
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
    <>
      <ImpersonationBanner />
      <AppMobileNav user={user} />
      <div className="flex items-start">
        <AppSidebar user={user} />
        <div className="flex-1 min-w-0 pl-8">{children}</div>
      </div>
    </>
  );
}
