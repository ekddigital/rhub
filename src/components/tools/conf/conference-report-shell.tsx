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
import { REPORT_META } from "@/components/tools/conf/conference-report/content-data";
import type { ReportRuntimeContext } from "@/lib/conf/conference-report/report-runtime";

export function ConferenceReportShell({
  runtime,
}: {
  runtime: ReportRuntimeContext;
}) {
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
            Official post-conference report — {REPORT_META.bookletTitle}
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
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Jinan, Shandong Province · Report certified {REPORT_META.reportDate}
          </p>
        </CardContent>
      </Card>

      <ConferenceReportPreview runtime={runtime} />
    </div>
  );
}
