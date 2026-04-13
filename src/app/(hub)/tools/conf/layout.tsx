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
    <>
      <ConfMobileNav />
      <div className="flex items-start mt-2">
        <ConfSidebar />
        <div className="flex-1 min-w-0 lg:pl-8">{children}</div>
      </div>
    </>
  );
}
