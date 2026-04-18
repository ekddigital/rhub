"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Search,
  UserRound,
  AlertTriangle,
  Eye,
  Shield,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type UserResult = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  accessStatus: string;
};

type CurrentUser = {
  id: string;
  name: string;
  role: string;
  canAccessAdmin?: boolean | null;
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "border-red-500/40 text-red-600",
  ADMIN: "border-orange-500/40 text-orange-600",
  JUDGE_ADMIN: "border-purple-500/40 text-purple-600",
  HEAD_JUDGE: "border-blue-500/40 text-blue-600",
  JUDGE: "border-cyan-500/40 text-cyan-600",
  USER: "border-gray-400/40 text-gray-600",
};

export default function ImpersonatePage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [impersonating, setImpersonating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.replace("/login");
          return;
        }
        const data = (await res.json()) as { user: CurrentUser };
        const u = data.user;
        if (u.role !== "SUPER_ADMIN" && !u.canAccessAdmin) {
          router.replace("/dashboard");
          return;
        }
        setCurrentUser(u);
      } finally {
        setLoading(false);
      }
    };
    void fetchMe();
  }, [router]);

  const search = useCallback(async (q: string) => {
    setSearching(true);
    setError(null);
    try {
      const params = new URLSearchParams({ search: q, limit: "20" });
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("Failed to search users");
      const data = (await res.json()) as { users: UserResult[] };
      // Filter out super admins — cannot be impersonated
      setResults(data.users.filter((u) => u.role !== "SUPER_ADMIN"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  const startImpersonation = async (user: UserResult) => {
    setImpersonating(user.id);
    setError(null);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: user.id,
          note: note || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok)
        throw new Error(data.error ?? "Failed to start impersonation");
      // Reload to activate the banner + switched view
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setImpersonating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <AppShell user={currentUser}>
      <div className="mx-auto max-w-2xl space-y-6 py-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Eye className="size-5 text-amber-500" />
            <h1 className="text-2xl font-bold">User Impersonation</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Temporarily view the platform exactly as another user experiences
            it. All impersonation sessions are logged.
          </p>
        </div>

        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 pt-4">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
            <div className="text-sm text-amber-700 dark:text-amber-400">
              <strong>Security notice:</strong> Impersonation is logged with
              your identity, the target user, timestamp, and reason. Super Admin
              accounts cannot be impersonated. Use this feature only for support
              and troubleshooting.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4" />
              Select a User to Impersonate
            </CardTitle>
            <CardDescription>
              Search by name or email. Super Admins are excluded.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name or email..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Reason / Note (optional — logged)
              </label>
              <Input
                placeholder="e.g. Debugging payment approval issue for user"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {searching && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-3 animate-spin" />
                Searching...
              </div>
            )}

            <div className="space-y-2">
              {results.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                      <UserRound className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${ROLE_COLORS[user.role] ?? ""}`}
                    >
                      {user.role.replace(/_/g, " ")}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled={impersonating === user.id}
                      onClick={() => void startImpersonation(user)}
                    >
                      {impersonating === user.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Eye className="size-3" />
                      )}
                      View As
                    </Button>
                  </div>
                </div>
              ))}

              {!searching && results.length === 0 && query.length > 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No users found for &ldquo;{query}&rdquo;
                </p>
              )}

              {!searching && results.length === 0 && query.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Start typing to search for users
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
