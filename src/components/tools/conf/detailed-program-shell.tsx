"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DetailedProgramPreview } from "@/components/tools/conf/detailed-program/DetailedProgramPreview";
import { PROGRAM_META } from "@/components/tools/conf/detailed-program/program-data";

export function DetailedProgramShell() {
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
            Detailed Conference Program
          </h1>
          <p className="text-sm text-muted-foreground">
            Full day-by-day program flow with times, activities, and
            responsible persons for the {PROGRAM_META.confName}.
          </p>
        </div>
      </div>

      <Card className="border-blue-200/50 bg-gradient-to-r from-blue-50/30 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <CalendarDays className="size-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base">{PROGRAM_META.confName} — Detailed Program</CardTitle>
              <CardDescription className="mt-1">
                {PROGRAM_META.venue} · {PROGRAM_META.dates}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>
            Theme: &ldquo;{PROGRAM_META.theme}&rdquo;
          </p>
          <p>Sub-theme: &ldquo;{PROGRAM_META.subTheme}&rdquo;</p>
          <p>
            This guide provides the complete detailed program for all four
            conference days. Download as PDF to share or print.
          </p>
        </CardContent>
      </Card>

      <DetailedProgramPreview />
    </div>
  );
}
