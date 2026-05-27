import { Skeleton } from "@/components/creative/ui/skeleton";
import { Card } from "@/components/ui/card";

export function VideoPreviewSkeleton() {
  return (
    <Card
      className="p-4 border-2 border-gold/10"
      aria-busy="true"
      aria-label="Loading video preview"
    >
      <div className="flex gap-4 animate-in fade-in duration-300">
        <Skeleton className="w-40 h-24 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function FormatPickerSkeleton() {
  return (
    <Card
      className="p-4 space-y-3 border-2 border-gold/10"
      aria-busy="true"
      aria-label="Loading download formats"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
    </Card>
  );
}
