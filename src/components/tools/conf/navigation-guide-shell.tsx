"use client";

import Link from "next/link";
import { ArrowLeft, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NavigationGuidePreview } from "@/components/tools/conf/navigation-guide/NavigationGuidePreview";
import { HOTEL_ADDRESS_LABEL, NAV_GUIDE_META } from "@/components/tools/conf/navigation-guide/content-data";

export function NavigationGuideShell() {
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
            Conference Navigation Guide
          </h1>
          <p className="text-sm text-muted-foreground">
            Printable travel directions from Jinan train stations to the
            conference hotel.
          </p>
        </div>
      </div>

      <Card className="border-[#C8A061]/30 bg-linear-to-r from-[#1F1C18]/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <MapPinned className="size-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base">{NAV_GUIDE_META.title}</CardTitle>
              <CardDescription className="mt-1">
                {NAV_GUIDE_META.venueEn} ({NAV_GUIDE_META.venueZh}) ·{" "}
                {NAV_GUIDE_META.dates}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-1 text-xs text-muted-foreground">
          <p>
            Theme: &ldquo;{NAV_GUIDE_META.theme}&rdquo; — Includes public transit
            (Section A) and taxi/private car routes (Section B) from all three
            Jinan railway stations.
          </p>
          <p>
            {HOTEL_ADDRESS_LABEL}: {NAV_GUIDE_META.addressZh}
          </p>
        </CardContent>
      </Card>

      <NavigationGuidePreview />
    </div>
  );
}
