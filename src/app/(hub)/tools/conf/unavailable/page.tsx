import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ConferenceUnavailablePage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 py-8">
      <Card className="border-amber-500/40 bg-amber-50/40">
        <CardHeader className="space-y-3">
          <div className="inline-flex size-10 items-center justify-center rounded-full bg-amber-500/15 text-amber-700">
            <AlertTriangle className="size-5" />
          </div>
          <CardTitle>Conference Data Temporarily Unavailable</CardTitle>
          <CardDescription>
            The conference database is unreachable right now. This is usually a
            temporary network or server issue.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link href="/tools/conf">
            <Button>Try Again</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
