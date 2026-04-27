import type { Metadata } from "next";
import {
  ConfMobileNav,
  ConfSidebar,
} from "@/components/tools/conf/conf-sidebar";

export const metadata: Metadata = {
  title: "Conference Hub | EKD Digital Resource Hub",
  description:
    "LSUIC Conference Management — budgets, payments, delegates, meetings, and timeline tracking.",
};

export default function ConferenceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="conf-light-scope min-h-[calc(100vh-8rem)] bg-background text-foreground">
      <ConfMobileNav />
      <div className="flex items-start min-h-[calc(100vh-8rem)]">
        <ConfSidebar />
        <div className="flex-1 min-w-0 px-6 lg:px-10 pb-10">{children}</div>
      </div>
    </div>
  );
}
