"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  Users,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  Wallet,
  UserCheck,
  CalendarDays,
  FileText,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
];

export function ConfDashboard() {
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
      <Card className="border-[#C8A061]/30 bg-gradient-to-r from-[#1F1C18]/5 to-transparent">
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="size-4 text-[#C8A061]" />
              Arcadia Spa Golf International Hotel
            </div>
            <p className="text-xs text-muted-foreground">
              齐河阿尔卡迪亚温泉高尔夫国际酒店 · Shandong Province
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Calendar className="size-4 text-muted-foreground" />
              <span>July 23–27, 2026</span>
            </div>
            <Badge>¥5,000 Deposit Paid</Badge>
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
        <StatCard label="Weekly Meetings" value="Fridays" icon={CalendarDays} />
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
