import { Card, CardContent } from "@/components/ui/card";

type TimelineStatCardProps = {
  label: string;
  value: number;
};

export function TimelineStatCard({ label, value }: TimelineStatCardProps) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
