"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  DollarSign,
  Users,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  Wallet,
  UserCheck,
  UserPlus,
  CalendarDays,
  FileText,
  Film,
  Megaphone,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchDefaultConference } from "@/lib/conf/client";

const NAV_ITEMS = [
  {
    href: "/tools/conf/budget",
    icon: Wallet,
    title: "Budget Manager",
    desc: "Create & manage budgets with auto-calculations, export to CSV/PDF",
    color: "text-emerald-500",
  },
  {
    href: "/tools/conf/payments",
    icon: DollarSign,
    title: "Payment Tracker",
    desc: "Track payments, upload receipt screenshots, verify spending",
    color: "text-blue-500",
  },
  {
    href: "/tools/conf/committee",
    icon: Users,
    title: "Committee",
    desc: "Manage committee members, roles, and contact information",
    color: "text-purple-500",
  },
  {
    href: "/tools/conf/delegates",
    icon: UserCheck,
    title: "Delegates",
    desc: "Delegate registration, fee tracking, city-based grouping",
    color: "text-orange-500",
  },
  {
    href: "/tools/conf/delegates/register",
    icon: UserPlus,
    title: "Registration Portal",
    desc: "Public form link for participant registration and document upload",
    color: "text-indigo-500",
  },
  {
    href: "/tools/conf/booklet",
    icon: BookOpen,
    title: "Booklet Builder",
    desc: "Printable participant booklet cards with IDs, photos, and room assignments",
    color: "text-rose-500",
  },
  {
    href: "/tools/conf/meetings",
    icon: CalendarDays,
    title: "Meetings",
    desc: "Weekly meeting schedule, agendas, and minutes recording",
    color: "text-cyan-500",
  },
  {
    href: "/tools/conf/timeline",
    icon: Clock,
    title: "Timeline",
    desc: "Conference milestones, deadlines, and progress tracking",
    color: "text-pink-500",
  },
  {
    href: "/tools/conf/docs",
    icon: FileText,
    title: "Documentation",
    desc: "Conference planning docs, process guides, and quick references",
    color: "text-amber-500",
  },
  {
    href: "/tools/conf/flyers",
    icon: Megaphone,
    title: "Flyer Studio",
    desc: "Edit promo and signup flyers in-system with live preview",
    color: "text-red-500",
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
  const liberiaAnniversary = Math.max(0, confYear - LIBERIA_INDEPENDENCE_YEAR);
  const liberiaAnniversaryLabel = formatOrdinal(liberiaAnniversary);
  const independenceDateLabel = `July 26, ${confYear}`;

  useEffect(() => {
    let mounted = true;

    const loadConference = async () => {
      try {
        const conf = await fetchDefaultConference();
        if (mounted) {
          setConfYear(conf.year);
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            LSUIC 2026
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Planning Phase
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Conference Hub</h1>
        <p className="text-muted-foreground">
          LSUIC 20th Anniversary National Conference — Jinan, Shandong
        </p>
      </div>

      {/* Venue Card */}
      <Card className="border-[#C8A061]/30 bg-linear-to-r from-[#1F1C18]/5 to-transparent">
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="size-4 text-[#C8A061]" />
              Arcadia Spa Golf International Hotel
            </div>
            <p className="text-xs text-muted-foreground">
              齐河阿尔卡迪亚温泉高尔夫国际酒店 · Shandong Province
            </p>
            <p className="text-xs font-medium text-[#8E0E00]">
              Special program: Liberia Independence Day celebration on{" "}
              {independenceDateLabel}
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Calendar className="size-4 text-muted-foreground" />
              <span>July 23–27, 2026</span>
            </div>
            <Badge
              variant="outline"
              className="border-[#8E0E00]/40 text-[#8E0E00]"
            >
              {`${liberiaAnniversaryLabel} Independence`}
            </Badge>
            <Badge>¥5,000 Deposit Paid</Badge>
          </div>
        </CardContent>
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

      {/* Navigation Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {NAV_ITEMS.map((item) => (
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
  const confDate = new Date("2026-07-23");
  const now = new Date();
  const diff = Math.ceil(
    (confDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
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
