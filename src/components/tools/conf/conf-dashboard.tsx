"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  DollarSign,
  HandCoins,
  Users,
  UserCog,
  Calendar,
  Clock,
  MapPin,
  ChevronDown,
  ChevronRight,
  Wallet,
  UserCheck,
  UserPlus,
  CalendarDays,
  FileText,
  Film,
  Megaphone,
  Download,
  ImageIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CONF_2026 } from "@/lib/conf/config";
import { daysUntilDate } from "@/lib/conf/dates";
import { Badge } from "@/components/ui/badge";
import { fetchDefaultConference } from "@/lib/conf/client";
import { groupConferenceFeePackages, formatFeeRmb } from "@/lib/conf/fees";
import { ConfQA } from "@/components/tools/conf/conf-qa";

type ConfNavItem = {
  href: string;
  icon: React.ElementType;
  title: string;
  desc: string;
  color: string;
  minAccess: "public" | "delegate" | "manager";
  superAdminOnly?: boolean;
};

const NAV_ITEMS: ConfNavItem[] = [
  {
    href: "/tools/conf/budget",
    icon: Wallet,
    title: "Budget Manager",
    desc: "Create & manage budgets with auto-calculations, export to CSV/PDF",
    color: "text-emerald-500",
    minAccess: "manager",
  },
  {
    href: "/tools/conf/payments",
    icon: DollarSign,
    title: "Payment Tracker",
    desc: "Track payments, upload receipt screenshots, verify spending",
    color: "text-blue-500",
    minAccess: "manager",
  },
  {
    href: "/tools/conf/finance",
    icon: HandCoins,
    title: "Conference finance",
    desc: "Financial Secretary verification vs. Treasurer receipts — separate dashboards",
    color: "text-emerald-600",
    minAccess: "manager",
  },
  {
    href: "/tools/conf/committee",
    icon: Users,
    title: "Committee",
    desc: "Manage committee members, roles, and contact information",
    color: "text-purple-500",
    minAccess: "manager",
  },
  {
    href: "/tools/conf/committee?roles=1",
    icon: UserCog,
    title: "Role Control",
    desc: "Super-admin role templates and committee-role assignment controls",
    color: "text-slate-500",
    minAccess: "manager",
    superAdminOnly: true,
  },
  {
    href: "/tools/conf/delegates",
    icon: UserCheck,
    title: "Delegates",
    desc: "Delegate registration, fee tracking, city-based grouping",
    color: "text-orange-500",
    minAccess: "delegate",
  },
  {
    href: "/tools/conf/delegates/register",
    icon: UserPlus,
    title: "Registration Portal",
    desc: "Public form link for participant registration and document upload",
    color: "text-indigo-500",
    minAccess: "public",
  },
  {
    href: "/tools/conf/booklet",
    icon: BookOpen,
    title: "Booklet Builder",
    desc: "Printable participant booklet cards with IDs, photos, and room assignments",
    color: "text-rose-500",
    minAccess: "delegate",
  },
  {
    href: "/tools/conf/meetings",
    icon: CalendarDays,
    title: "Meetings",
    desc: "Weekly meeting schedule, agendas, and minutes recording",
    color: "text-cyan-500",
    minAccess: "manager",
  },
  {
    href: "/tools/conf/timeline",
    icon: Clock,
    title: "Timeline",
    desc: "Conference milestones, deadlines, and progress tracking",
    color: "text-pink-500",
    minAccess: "manager",
  },
  {
    href: "/tools/conf/docs",
    icon: FileText,
    title: "Documentation",
    desc: "Conference planning docs, process guides, and quick references",
    color: "text-amber-500",
    minAccess: "manager",
  },
  {
    href: "/tools/conf/letterhead",
    icon: Download,
    title: "Letterhead Downloads",
    desc: "Header, sidebar, and footer PNG/SVG pieces for Word & Google Docs",
    color: "text-[#C8A061]",
    minAccess: "manager",
  },
  {
    href: "/tools/conf/letters",
    icon: FileText,
    title: "Letter Composer",
    desc: "Official LSUIC letters, fundraising templates, and PDF export",
    color: "text-[#002868]",
    minAccess: "manager",
  },
  {
    href: "/tools/kit?surface=fly",
    icon: Megaphone,
    title: "Flyer Studio",
    desc: "Edit promo and signup flyers in-system with live preview",
    color: "text-red-500",
    minAccess: "manager",
  },
];

const VENUE_GALLERY = [
  "/conf/assets/hotel/main_entrance_view.png",
  "/conf/assets/hotel/conference_hall.jpg",
  "/conf/assets/hotel/swimming_pool_at_night.png",
  "/conf/assets/jinan_city/day_view_landscape.png",
] as const;

const LIBERIA_INDEPENDENCE_YEAR = 1847;

export function ConfDashboard() {
  const [confYear, setConfYear] = useState(2026);
  const [confId, setConfId] = useState("");
  const [isParticipant, setIsParticipant] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [showFeeStructure, setShowFeeStructure] = useState(false);
  const liberiaAnniversary = Math.max(0, confYear - LIBERIA_INDEPENDENCE_YEAR);
  const liberiaAnniversaryLabel = formatOrdinal(liberiaAnniversary);
  const independenceDateLabel = `July 26, ${confYear}`;
  const feeGroups = groupConferenceFeePackages();

  useEffect(() => {
    let mounted = true;

    const loadConference = async () => {
      try {
        const [conf, accessRes, authRes] = await Promise.all([
          fetchDefaultConference(),
          fetch("/api/conf/default/access", { cache: "no-store" }),
          fetch("/api/auth/me", { cache: "no-store" }),
        ]);

        if (!mounted) return;

        if (accessRes.ok) {
          const accessPayload = (await accessRes.json()) as {
            isParticipant?: boolean;
            isManager?: boolean;
            isSuperAdmin?: boolean;
          };
          setIsParticipant(Boolean(accessPayload.isParticipant));
          setIsManager(Boolean(accessPayload.isManager));
          setIsSuperAdmin(Boolean(accessPayload.isSuperAdmin));
        }

        if (authRes.ok) {
          const authPayload = (await authRes.json()) as {
            role?: string;
          };
          const role = String(authPayload.role || "").toUpperCase();
          const roleIsManager = [
            "SUPER_ADMIN",
            "ADMIN",
            "JUDGE_ADMIN",
            "HEAD_JUDGE",
          ].includes(role);
          const roleIsSuperAdmin = role === "SUPER_ADMIN";

          if (roleIsManager || roleIsSuperAdmin) {
            setIsParticipant(true);
            setIsManager(true);
          }
          if (roleIsSuperAdmin) {
            setIsSuperAdmin(true);
          }
        }

        if (mounted) {
          setConfYear(conf.year);
          setConfId(conf.id);
        }
      } catch {
        // Keep default year if conference metadata is unavailable.
      }
    };

    void loadConference();
    return () => {
      mounted = false;
    };
  }, []);

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.superAdminOnly) {
      return isSuperAdmin;
    }

    if (item.minAccess === "public") return true;
    if (item.minAccess === "delegate") {
      return isParticipant || isManager || isSuperAdmin;
    }

    return isManager || isSuperAdmin;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {CONF_2026.shortLabel}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {CONF_2026.phase}
          </Badge>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Conference Hub
        </h1>
        <p className="text-lg font-medium text-muted-foreground">
          {CONF_2026.name} — {CONF_2026.city}, {CONF_2026.province}
        </p>
        {/* Theme */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-xl font-bold text-[#C8A061] sm:text-2xl">
            &ldquo;{CONF_2026.theme}&rdquo;
          </p>
          <p className="text-sm italic text-muted-foreground">
            {CONF_2026.subTheme}
          </p>
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            {CONF_2026.coreValues.map((v) => (
              <Badge
                key={v}
                variant="outline"
                className="border-[#C8A061]/40 px-3 py-0.5 text-xs font-semibold text-[#C8A061]"
              >
                {v}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Venue Card */}
      <Card className="border-[#C8A061]/30 bg-linear-to-r from-[#1F1C18]/5 to-transparent">
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="size-4 text-[#C8A061]" />
              {CONF_2026.venue}
            </div>
            <p className="text-xs text-muted-foreground">
              {CONF_2026.venueCn} · {CONF_2026.province} Province
            </p>
            <p className="text-xs font-medium text-[#8E0E00]">
              Special program: Liberia Independence Day celebration on{" "}
              {independenceDateLabel}
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Calendar className="size-4 text-muted-foreground" />
              <span>July 24–27, 2026</span>
            </div>
            <Badge
              variant="outline"
              className="border-[#8E0E00]/40 text-[#8E0E00]"
            >
              {`${liberiaAnniversaryLabel} Independence`}
            </Badge>
            {isManager && <Badge>¥5,000 Deposit Paid</Badge>}
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#C8A061]/30">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">
                Conference Fees Structure
              </CardTitle>
              <CardDescription>
                Select the package that best matches the participant type and
                room preference during registration.
              </CardDescription>
            </div>
            <button
              type="button"
              onClick={() => setShowFeeStructure((prev) => !prev)}
              aria-expanded={showFeeStructure}
              aria-controls="conference-fee-structure-content"
              className="inline-flex items-center gap-1.5 rounded-md border border-[#C8A061]/30 bg-background px-3 py-1.5 text-xs font-medium text-[#1F1C18] transition-colors hover:bg-muted"
            >
              {showFeeStructure ? "Hide fee packages" : "Show fee packages"}
              <ChevronDown
                className={`size-4 transition-transform ${showFeeStructure ? "rotate-180" : "rotate-0"}`}
              />
            </button>
          </div>
        </CardHeader>
        {showFeeStructure && (
          <CardContent
            id="conference-fee-structure-content"
            className="space-y-4"
          >
            {Object.entries(feeGroups).map(([category, items]) => (
              <div
                key={category}
                className="space-y-2 rounded-xl border border-border/60 p-3"
              >
                <h3 className="font-semibold text-sm text-[#0B1E78]">
                  {category}
                </h3>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg bg-muted/30 p-3 text-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.packageSummary}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {formatFeeRmb(item.price)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      <Card className="overflow-hidden border-[#C8A061]/30 bg-linear-to-br from-[#0B4FD9]/10 via-transparent to-[#8E0E00]/15">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Film className="size-5 text-[#0B4FD9]" />
            Venue And City Showcase
          </CardTitle>
          <CardDescription>
            City-first visual treatment inspired by the brochure style, paired
            with venue walkthrough media.
          </CardDescription>
        </CardHeader>

        <div className="relative mx-6 mb-4 overflow-hidden rounded-xl border border-white/15 bg-black/70">
          <Image
            src="/conf/assets/jinan_city/morning_view_landscape.png"
            alt="Jinan skyline"
            width={1600}
            height={900}
            className="h-56 w-full object-cover sm:h-64"
          />
          <div className="absolute inset-0 bg-linear-to-b from-[#061338]/35 via-[#061338]/55 to-[#061338]/95" />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.22) 1px, transparent 1px)",
              backgroundSize: "34px 34px",
            }}
          />
          <div className="absolute inset-x-0 bottom-0 z-10 p-5 text-white">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-white/80">
              {`LSUIC 20th Conference | Liberia ${liberiaAnniversaryLabel} Independence`}
            </p>
            <h3
              className="text-2xl font-bold sm:text-3xl"
              style={{
                textShadow:
                  "0 2px 8px rgba(0, 0, 0, 0.75), 0 0 24px rgba(0, 0, 0, 0.45)",
              }}
            >
              Jinan welcomes LSUIC 2026
            </h3>
            <p
              className="text-sm text-white/90"
              style={{ textShadow: "0 2px 8px rgba(0, 0, 0, 0.75)" }}
            >
              {`Conference week includes Liberia Independence Day celebration on ${independenceDateLabel}`}
            </p>
          </div>
        </div>

        <CardContent className="grid gap-4 pt-0 lg:grid-cols-3">
          <div className="overflow-hidden rounded-xl border border-white/20 bg-black/90 lg:col-span-2">
            <video
              className="h-72 w-full object-cover"
              controls
              preload="metadata"
              poster="/conf/assets/hotel/conference_hall.jpg"
            >
              <source src="/conf/assets/hotel/full_tour.mp4" type="video/mp4" />
            </video>
            <div className="border-t border-white/10 px-3 py-2 text-xs text-white/85">
              Arcadia Hotel full tour preview
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {VENUE_GALLERY.map((src) => (
              <div
                key={src}
                className="group overflow-hidden rounded-xl border border-white/20 bg-black/80"
              >
                <Image
                  src={src}
                  alt="Conference media"
                  width={640}
                  height={420}
                  className="h-24 w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Committee Members" value="11" icon={Users} />
        <StatCard
          label="Days Until Event"
          value={daysUntilConf()}
          icon={Clock}
        />
        <StatCard label="Conference Year" value="20th" icon={FileText} />
        <StatCard
          label="Weekly Meetings"
          value="Thursdays"
          icon={CalendarDays}
        />
      </div>

      {/* Countdown Flyer */}
      {confId && <CountdownFlyerCard confId={confId} />}

      {/* Q&A / FAQ Section */}
      {confId && (
        <ConfQA
          confId={confId}
          isManager={isManager}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {/* Navigation Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleNavItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="group h-full cursor-pointer transition-all hover:border-[#C8A061]/50 hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <item.icon className={`size-5 ${item.color}`} />
                  <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
                <CardTitle className="text-base">{item.title}</CardTitle>
                <CardDescription className="text-xs">
                  {item.desc}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="rounded-lg bg-muted p-2">
          <Icon className="size-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function daysUntilConf(): string {
  const diff = daysUntilDate(CONF_2026.startsAt, "Asia/Shanghai");
  return diff > 0 ? String(diff) : "Now!";
}

function formatOrdinal(value: number): string {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) {
    return `${value}th`;
  }

  const mod10 = value % 10;
  if (mod10 === 1) return `${value}st`;
  if (mod10 === 2) return `${value}nd`;
  if (mod10 === 3) return `${value}rd`;
  return `${value}th`;
}

// ── Countdown Flyer Card ──────────────────────────────────────────────────────

function CountdownFlyerCard({ confId }: { confId: string }) {
  const days = daysUntilConf();
  const svgUrl = `/api/conf/${confId}/countdown-flyer`;
  const pngDownloadUrl = `/api/conf/${confId}/countdown-flyer?format=png&download=1`;

  return (
    <Card className="overflow-hidden border-[#C8A061]/30 bg-linear-to-br from-ekd-deep-navy/10 via-transparent to-[#C8A061]/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="size-5 text-[#C8A061]" />
            Daily Countdown Flyer
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-[#C8A061]/40 text-[#C8A061]"
            >
              {days} days to go
            </Badge>
            <a href={pngDownloadUrl} download>
              <button className="flex items-center gap-1.5 rounded-md bg-[#C8A061] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90">
                <Download className="size-3.5" />
                Download PNG
              </button>
            </a>
          </div>
        </div>
        <CardDescription className="text-xs">
          Auto-updates daily. Download and share directly via messaging or
          social platforms.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={svgUrl}
          alt={`${days} days countdown flyer`}
          className="mx-auto max-h-85 w-auto rounded-xl border border-[#C8A061]/20 shadow-md"
        />
      </CardContent>
    </Card>
  );
}
