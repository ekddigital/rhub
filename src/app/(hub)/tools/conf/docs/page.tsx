import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clock,
  DollarSign,
  LayoutDashboard,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CONF_2026 } from "@/lib/conf/config";

export const metadata: Metadata = {
  title: "Conference Documentation | EKD Digital Resource Hub",
  description:
    "Operational documentation for LSUIC 2026 conference planning, workflows, and committee execution.",
};

const DOC_LINKS = [
  {
    href: "/tools/conf",
    title: "Conference Dashboard",
    description: "High-level status, milestones, and planning overview.",
    icon: LayoutDashboard,
  },
  {
    href: "/tools/conf/budget",
    title: "Budget Documentation",
    description: "Budget categories, totals, and export workflow.",
    icon: Wallet,
  },
  {
    href: "/tools/conf/payments",
    title: "Payment Documentation",
    description: "Payment intake, receipt verification, and tracking process.",
    icon: DollarSign,
  },
  {
    href: "/tools/conf/committee",
    title: "Committee Documentation",
    description: "Role assignments, responsibilities, and member structure.",
    icon: Users,
  },
  {
    href: "/tools/conf/delegates",
    title: "Delegate Documentation",
    description: "Delegate registration, grouping, and fee tracking guide.",
    icon: UserCheck,
  },
  {
    href: "/tools/conf/delegates/register",
    title: "Public Registration Portal",
    description:
      "Shareable participant signup form with uploads and payment declaration.",
    icon: UserCheck,
  },
  {
    href: "/tools/conf/booklet",
    title: "Booklet Builder",
    description:
      "Build and print participant booklet-ready cards with photos and room details.",
    icon: BookOpen,
  },
  {
    href: "/tools/conf/meetings",
    title: "Meetings & Minutes",
    description: "Recurring meeting cadence, agenda flow, and minutes records.",
    icon: CalendarDays,
  },
  {
    href: "/tools/conf/timeline",
    title: "Timeline Documentation",
    description: "Milestones, deadlines, and progress checkpoints.",
    icon: Clock,
  },
];

export default function ConferenceDocsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 py-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Conference Docs</Badge>
          <Badge variant="secondary">LSUIC {CONF_2026.year}</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Conference Documentation
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Centralized documentation and working references for {CONF_2026.name}.
          Use this space as the navigation entry point for planning workflows,
          operations, and committee execution guides.
        </p>
      </div>

      <Card className="border-[#C8A061]/30 bg-linear-to-r from-[#1F1C18]/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="size-4 text-[#C8A061]" />
            Event Snapshot
          </CardTitle>
          <CardDescription>
            Core conference details used across planning modules.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
          <p>
            <span className="font-medium text-foreground">Venue:</span>{" "}
            {CONF_2026.venue}
          </p>
          <p>
            <span className="font-medium text-foreground">City:</span>{" "}
            {CONF_2026.city}, {CONF_2026.province}
          </p>
          <p>
            <span className="font-medium text-foreground">Dates:</span>{" "}
            {CONF_2026.startsAt} to {CONF_2026.endsAt}
          </p>
          <p>
            <span className="font-medium text-foreground">Deposit:</span> ¥
            {CONF_2026.deposit.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DOC_LINKS.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="group h-full transition-all hover:border-[#C8A061]/50 hover:shadow-md">
              <CardHeader>
                <div className="mb-1 flex items-center justify-between">
                  <link.icon className="size-5 text-[#8E0E00]" />
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
                <CardTitle className="text-base">{link.title}</CardTitle>
                <CardDescription>{link.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">2026 Workflow Notes</CardTitle>
          <CardDescription>
            Registration now captures passport identity, payment state, and
            booklet media for automated participant operations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. Delegates receive a unique conference ID on registration.</p>
          <p>
            2. Personal attendance flyer becomes available after payment +
            booklet photo.
          </p>
          <p>
            3. Pairing requests support same-gender default policy,
            legal-partner exception flow, and single-room requests.
          </p>
          <p>
            4. Chair/admin controls support manual room assignment with override
            reason tracking.
          </p>
          <p>
            5. Booklet Builder generates printable participant cards from
            confirmed registration data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
