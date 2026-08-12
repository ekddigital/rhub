"use client";

import Link from "next/link";
import { ArrowLeft, FileBarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConferenceReportPreview } from "@/components/tools/conf/conference-report/ConferenceReportPreview";
import {
  ATTENDANCE_STATS,
  REPORT_META,
} from "@/components/tools/conf/conference-report/content-data";

export function ConferenceReportShell() {
  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center gap-4">
        <Link href="/tools/conf">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {REPORT_META.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Official post-conference report for the {REPORT_META.confName} —{" "}
            {REPORT_META.theme}.
          </p>
        </div>
      </div>

      <Card className="border-blue-200/50 bg-gradient-to-r from-blue-50/30 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <FileBarChart className="size-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base">
                {REPORT_META.bookletTitle}
              </CardTitle>
              <CardDescription className="mt-1">
                {REPORT_META.venueEn} · {REPORT_META.dates}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>
            Theme: &ldquo;{REPORT_META.theme}&rdquo; · Sub-theme: &ldquo;
            {REPORT_META.subTheme}&rdquo;
          </p>
          <p>
            {ATTENDANCE_STATS.totalRegistered} registered participants from{" "}
            {ATTENDANCE_STATS.uniqueCities} cities. Download as PDF to share or
            print.
          </p>
          <p>
            Source markdown:{" "}
            <a
              href={REPORT_META.markdownPath}
              className="text-blue-600 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              jinan-2026-conference-report.md
            </a>
          </p>
        </CardContent>
      </Card>

      <ConferenceReportPreview />
    </div>
  );
}
