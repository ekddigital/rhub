import type { Metadata } from "next";

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
  return <>{children}</>;
}
