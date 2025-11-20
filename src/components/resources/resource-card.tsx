import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ResourceWithActions } from "@/lib/resources-data";
import { getCategoryAccent } from "@/lib/utils";
import {
  BadgeCheck,
  Code2,
  FileText,
  Shield,
  Sparkles,
  Wand2,
  Download,
} from "lucide-react";
import Link from "next/link";
import type { ResourceCategory } from "@prisma/client";

const statusCopy: Record<string, string> = {
  LIVE: "Live",
  DRAFT: "Coming soon",
  ARCHIVED: "Archived",
};

const categoryIconMap: Record<ResourceCategory, React.ElementType> = {
  CONVERTER: Sparkles,
  DATASET: Shield,
  PLAYGROUND: Code2,
  API: Wand2,
  GUIDE: FileText,
  UTILITY: BadgeCheck,
  DOWNLOAD: Download,
};

export function ResourceCard({ resource }: { resource: ResourceWithActions }) {
  const Icon = categoryIconMap[resource.category];
  const accent = getCategoryAccent(resource.category);

  return (
    <Card className="flex h-full flex-col justify-between border-white/10 bg-card/80 p-6 shadow-[0_15px_50px_rgba(12,10,8,0.25)]">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
            style={{ backgroundColor: accent }}
          >
            <Icon className="size-6" />
          </div>
          <Badge variant="secondary" className="uppercase tracking-wide">
            {statusCopy[resource.status]}
          </Badge>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-foreground">
            {resource.title}
          </h3>
          <p className="text-sm text-foreground/70">{resource.tagline}</p>
        </div>
        <p className="text-sm leading-relaxed text-foreground/80">
          {resource.summary}
        </p>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        {resource.actions.map((action) => (
          <Button
            key={action.id}
            asChild
            variant={action.type === "DOCUMENTATION" ? "outline" : "default"}
          >
            <Link href={action.url ?? `#${resource.slug}`}>{action.label}</Link>
          </Button>
        ))}
      </div>
    </Card>
  );
}
