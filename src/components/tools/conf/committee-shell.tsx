"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Mail,
  MapPin,
  Phone,
  Plus,
  Shield,
  Users,
  Crown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchDefaultConference } from "@/lib/conf/client";

type Member = {
  id: string;
  name: string;
  role: string;
  title: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  photoPath: string | null;
  joinedAt: string;
};

const ROLE_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  CHAIR: { label: "Chair", icon: Crown, color: "text-[#C8A061]" },
  VICE_CHAIR: { label: "Vice Chair", icon: Crown, color: "text-[#D4AF6A]" },
  SECRETARY: { label: "Secretary", icon: Shield, color: "text-blue-500" },
  TREASURER: { label: "Treasurer", icon: Shield, color: "text-emerald-500" },
  COMMITTEE: {
    label: "Committee Member",
    icon: Users,
    color: "text-purple-500",
  },
  DELEGATE: { label: "Delegate", icon: Users, color: "text-gray-500" },
};

export function CommitteeShell() {
  const [confId, setConfId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [role, setRole] = useState("COMMITTEE");
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const loadMembers = async (id: string) => {
    const res = await fetch(`/api/conf/${id}/members`, { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Failed to load committee members");
    }
    const data = (await res.json()) as Member[];
    setMembers(data);
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const conf = await fetchDefaultConference();
        setConfId(conf.id);
        await loadMembers(conf.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to initialize committee");
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, []);

  const cities = useMemo(
    () => [...new Set(members.map((m) => m.city).filter(Boolean))].sort(),
    [members],
  );

  const resetForm = () => {
    setName("");
    setRole("COMMITTEE");
    setTitle("");
    setCity("");
    setPhone("");
    setEmail("");
    setPhotoFile(null);
  };

  const handleAdd = async () => {
    if (!name || !confId || saving) return;
    setSaving(true);
    setError(null);

    try {
      const createRes = await fetch(`/api/conf/${confId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          role,
          title,
          city,
          phone,
          email,
        }),
      });

      if (!createRes.ok) {
        const payload = await createRes.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to add member");
      }

      let created = (await createRes.json()) as Member;

      if (photoFile) {
        const fd = new FormData();
        fd.append("file", photoFile);
        const uploadRes = await fetch(
          `/api/conf/${confId}/members/${created.id}/photo`,
          {
            method: "POST",
            body: fd,
          },
        );
        if (uploadRes.ok) {
          created = (await uploadRes.json()) as Member;
        }
      }

      setMembers((prev) => [...prev, created]);
      resetForm();
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add member");
    } finally {
      setSaving(false);
    }
  };

  const handleReplacePhoto = async (memberId: string, file: File | null) => {
    if (!file || !confId) return;
    setUploadingId(memberId);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(`/api/conf/${confId}/members/${memberId}/photo`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to upload profile photo");
      }

      const updated = (await res.json()) as Member;
      setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 py-6">
        <div className="h-10 w-64 animate-pulse rounded-md bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-28 animate-pulse rounded-md bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/tools/conf">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Committee</h1>
          <p className="text-sm text-muted-foreground">
            {members.length} members across {cities.length} cities
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="size-4" />
          Add Member
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {showForm && (
        <Card className="border-[#C8A061]/40">
          <CardHeader>
            <CardTitle className="text-base">Add Committee Member</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  {Object.entries(ROLE_CONFIG).map(([key, { label }]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Title / Position</Label>
                <Input
                  placeholder="e.g. Logistics Chair"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  placeholder="e.g. Jinan"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Professional Photo (optional)</Label>
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleAdd} disabled={!name || saving}>
                <Plus className="size-4" />
                {saving ? "Saving..." : "Add Member"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {members.map((member) => {
          const config = ROLE_CONFIG[member.role] || ROLE_CONFIG.COMMITTEE;
          const RoleIcon = config.icon;
          const initials = member.name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((n) => n[0]?.toUpperCase())
            .join("");

          return (
            <Card key={member.id} className="group overflow-hidden">
              <CardContent className="pt-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {member.photoPath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.photoPath}
                        alt={member.name}
                        className="h-14 w-14 rounded-xl border border-border object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-sm font-bold text-muted-foreground">
                        {initials || "CM"}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold leading-tight">{member.name}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <RoleIcon className={`size-3.5 ${config.color}`} />
                        <span className="text-xs text-muted-foreground">
                          {member.title || config.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Badge variant="outline" className="text-[11px]">
                    {config.label}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground">
                  {member.city && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="size-3" />
                      {member.city}
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="size-3" />
                      {member.phone}
                    </div>
                  )}
                  {member.email && (
                    <div className="flex items-center gap-1.5 break-all">
                      <Mail className="size-3" />
                      {member.email}
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                    <Camera className="size-3.5" />
                    {uploadingId === member.id ? "Uploading..." : "Upload Photo"}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) =>
                        handleReplacePhoto(member.id, e.target.files?.[0] || null)
                      }
                    />
                  </label>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Members by City</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {cities.map((city) => {
              const count = members.filter((m) => m.city === city).length;
              return (
                <Badge key={city} variant="secondary" className="gap-1">
                  <MapPin className="size-3" />
                  {city} ({count})
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
