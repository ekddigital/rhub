"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  Settings2,
  Link2,
  Search,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Pencil,
  X,
  Check,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchDefaultConference } from "@/lib/conf/client";
import { validateProfilePhotoFile } from "@/lib/conf/file-upload-client";
import {
  formatUploadError,
  parseUploadErrorPayload,
} from "@/lib/conf/upload-feedback-client";

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
  // Enhanced fields
  committeeScope: string | null;
  canAssignCommittee: boolean;
  canApprovePayments: boolean;
  userId: string | null;
  linkedUserName?: string | null;
  linkedUserEmail?: string | null;
};

type UserSearchResult = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type DelegateOption = {
  id: string;
  name: string;
  email: string | null;
  city: string;
  phone: string | null;
  conferencePosition: string | null;
  userId: string | null;
  feePaid: boolean;
  status: "REGISTERED" | "CONFIRMED" | "ATTENDED" | "CANCELLED";
};

type AccessInfo = {
  isSuperAdmin: boolean;
  isChair: boolean;
  canAssignCommittee: boolean;
  memberId: string | null;
  committeeScope: string | null;
};

type RoleTemplate = {
  id: string;
  key: string;
  label: string;
  baseRole: "CHAIR" | "VICE_CHAIR" | "SECRETARY" | "TREASURER" | "COMMITTEE" | "DELEGATE";
  title: string | null;
  committeeScope: string | null;
  officeLabel: string | null;
  isSystem: boolean;
  sortOrder: number;
  isActive: boolean;
};

const BASE_ROLE_OPTIONS = [
  "CHAIR",
  "VICE_CHAIR",
  "SECRETARY",
  "TREASURER",
  "COMMITTEE",
  "DELEGATE",
] as const;

const ROLE_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  CHAIR: {
    label: "Conference Chair",
    icon: Crown,
    color: "text-[#C8A061]",
  },
  VICE_CHAIR: {
    label: "Conference Vice-Chair",
    icon: Crown,
    color: "text-[#D4AF6A]",
  },
  SECRETARY: {
    label: "Conference Secretary",
    icon: Shield,
    color: "text-blue-500",
  },
  TREASURER: {
    label: "National Financial Secretary",
    icon: Shield,
    color: "text-emerald-500",
  },
  COMMITTEE: {
    label: "Committee Member",
    icon: Users,
    color: "text-purple-500",
  },
  DELEGATE: { label: "Delegate", icon: Users, color: "text-gray-500" },
};

export function CommitteeShell({ accessInfo }: { accessInfo?: AccessInfo }) {
  const searchParams = useSearchParams();
  const [confId, setConfId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  // Role templates (persistent CRUD)
  const [roles, setRoles] = useState<RoleTemplate[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleDeletingId, setRoleDeletingId] = useState<string | null>(null);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [newMemberRoleKey, setNewMemberRoleKey] = useState("");
  const [roleLabelInput, setRoleLabelInput] = useState("");
  const [roleBaseInput, setRoleBaseInput] = useState<
    "CHAIR" | "VICE_CHAIR" | "SECRETARY" | "TREASURER" | "COMMITTEE" | "DELEGATE"
  >("COMMITTEE");
  const [roleTitleInput, setRoleTitleInput] = useState("");
  const [roleScopeInput, setRoleScopeInput] = useState("");
  const [roleOfficeInput, setRoleOfficeInput] = useState("");
  const [roleSortInput, setRoleSortInput] = useState("100");
  const [roleActiveInput, setRoleActiveInput] = useState(true);
  const [assignRoleKey, setAssignRoleKey] = useState("");
  const [assignUserId, setAssignUserId] = useState("");
  const [assignTargetMemberId, setAssignTargetMemberId] = useState("");
  const [assignSaving, setAssignSaving] = useState(false);

  // Per-member permissions panel
  const [permPanelId, setPermPanelId] = useState<string | null>(null);
  const [permSaving, setPermSaving] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
  const [userSearching, setUserSearching] = useState(false);
  const [allUsers, setAllUsers] = useState<UserSearchResult[]>([]);
  const [delegateOptions, setDelegateOptions] = useState<DelegateOption[]>([]);
  const [selectedDelegateId, setSelectedDelegateId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  // Inline edit for contact details (phone / city / email / name)
  const [editMemberId, setEditMemberId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const openEdit = (m: Member) => {
    setEditMemberId(m.id);
    setEditName(m.name);
    setEditPhone(m.phone ?? "");
    setEditCity(m.city ?? "");
    setEditEmail(m.email ?? "");
  };

  const handleEditSave = async (memberId: string) => {
    if (!confId || editSaving) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/conf/${confId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim() || undefined,
          phone: editPhone.trim() || null,
          city: editCity.trim() || null,
          email: editEmail.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Failed to save");
      }
      const updated = (await res.json()) as Member;
      setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
      setEditMemberId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setEditSaving(false);
    }
  };

  const [name, setName] = useState("");
  const [role, setRole] = useState("COMMITTEE");
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const loadMembers = useCallback(async (id: string) => {
    const res = await fetch(`/api/conf/${id}/members`, { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Failed to load committee members");
    }
    const data = (await res.json()) as Member[];
    setMembers(data);
  }, []);

  const loadRoles = useCallback(async (id: string) => {
    setRolesLoading(true);
    try {
      const includeInactive = accessInfo?.isSuperAdmin ? "?includeInactive=1" : "";
      const res = await fetch(`/api/conf/${id}/roles${includeInactive}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("Failed to load committee roles");
      }
      const data = (await res.json()) as RoleTemplate[];
      setRoles(data);
      if (!newMemberRoleKey && data.length > 0) {
        setNewMemberRoleKey(data[0].key);
      }
    } finally {
      setRolesLoading(false);
    }
  }, [accessInfo?.isSuperAdmin, newMemberRoleKey]);

  const loadAssignables = useCallback(
    async (id: string) => {
      const delegatesRes = await fetch(`/api/conf/${id}/delegates`, {
        cache: "no-store",
      });
      if (delegatesRes.ok) {
        const delegates = (await delegatesRes.json()) as DelegateOption[];
        setDelegateOptions(
          delegates.filter((d) => d.status !== "CANCELLED").sort((a, b) => {
            if (a.feePaid !== b.feePaid) return a.feePaid ? -1 : 1;
            return a.name.localeCompare(b.name);
          }),
        );
      }

      if (accessInfo?.isSuperAdmin) {
        const usersRes = await fetch("/api/admin/users?limit=500", {
          cache: "no-store",
        });
        if (usersRes.ok) {
          const payload = (await usersRes.json()) as { users: UserSearchResult[] };
          setAllUsers(
            (payload.users ?? []).sort((a, b) => a.name.localeCompare(b.name)),
          );
        }
      }
    },
    [accessInfo?.isSuperAdmin],
  );

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const conf = await fetchDefaultConference();
        setConfId(conf.id);
        await Promise.all([
          loadMembers(conf.id),
          loadRoles(conf.id),
          loadAssignables(conf.id),
        ]);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to initialize committee",
        );
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, [loadAssignables, loadMembers, loadRoles]);

  useEffect(() => {
    if (!accessInfo?.isSuperAdmin) return;
    if (searchParams.get("roles") === "1") {
      setShowRoleForm(true);
    }
  }, [accessInfo?.isSuperAdmin, searchParams]);

  const cities = useMemo(
    () => [...new Set(members.map((m) => m.city).filter(Boolean))].sort(),
    [members],
  );

  const activeRoles = useMemo(
    () => roles.filter((r) => r.isActive),
    [roles],
  );

  const roleByKey = useMemo(
    () => new Map(roles.map((r) => [r.key, r])),
    [roles],
  );

  const activeRolesForAssignment = useMemo(() => {
    const rolePriority: Record<RoleTemplate["baseRole"], number> = {
      CHAIR: 1,
      VICE_CHAIR: 2,
      SECRETARY: 3,
      TREASURER: 4,
      COMMITTEE: 5,
      DELEGATE: 6,
    };
    return [...activeRoles].sort((a, b) => {
      const priorityDiff = rolePriority[a.baseRole] - rolePriority[b.baseRole];
      if (priorityDiff !== 0) return priorityDiff;
      return a.sortOrder === b.sortOrder
        ? a.label.localeCompare(b.label)
        : a.sortOrder - b.sortOrder;
    });
  }, [activeRoles]);

  const assignTargetOptions = useMemo(() => {
    if (!assignRoleKey) return [] as Member[];
    const selectedRole = roleByKey.get(assignRoleKey);
    if (!selectedRole) return [] as Member[];
    const matched = members.filter((member) => {
      if (member.role !== selectedRole.baseRole) return false;
      const sameTitle =
        (selectedRole.title ?? "").trim().toLowerCase() ===
        (member.title ?? "").trim().toLowerCase();
      const sameScope =
        (selectedRole.committeeScope ?? "").trim().toLowerCase() ===
        (member.committeeScope ?? "").trim().toLowerCase();
      return sameTitle && sameScope;
    });
    const uniqueByDisplay = new Map<string, Member>();
    for (const member of matched) {
      const displayKey = [
        member.name.trim().toLowerCase(),
        member.role,
        (member.title ?? "").trim().toLowerCase(),
        (member.committeeScope ?? "").trim().toLowerCase(),
      ].join("|");
      if (!uniqueByDisplay.has(displayKey)) {
        uniqueByDisplay.set(displayKey, member);
      }
    }
    return Array.from(uniqueByDisplay.values());
  }, [assignRoleKey, members, roleByKey]);
  const userById = useMemo(
    () => new Map(allUsers.map((u) => [u.id, u])),
    [allUsers],
  );

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const resetForm = () => {
    setName("");
    setRole("COMMITTEE");
    setTitle("");
    setCity("");
    setPhone("");
    setEmail("");
    setPhotoFile(null);
    setNewMemberRoleKey("");
    setSelectedDelegateId("");
    setSelectedUserId("");
  };

  const getDisplayTitle = (member: Member, fallbackLabel: string) => {
    if (member.role === "TREASURER") {
      if (!member.title || member.title.trim().toLowerCase() === "treasurer") {
        return "National Financial Secretary";
      }
    }
    return member.title || fallbackLabel;
  };

  const resetRoleForm = () => {
    setEditingRoleId(null);
    setRoleLabelInput("");
    setRoleBaseInput("COMMITTEE");
    setRoleTitleInput("");
    setRoleScopeInput("");
    setRoleOfficeInput("");
    setRoleSortInput("100");
    setRoleActiveInput(true);
  };

  const beginEditRole = (template: RoleTemplate) => {
    setEditingRoleId(template.id);
    setRoleLabelInput(template.label);
    setRoleBaseInput(template.baseRole);
    setRoleTitleInput(template.title ?? "");
    setRoleScopeInput(template.committeeScope ?? "");
    setRoleOfficeInput(template.officeLabel ?? "");
    setRoleSortInput(String(template.sortOrder));
    setRoleActiveInput(template.isActive);
    setShowRoleForm(true);
  };

  const handleSaveRoleTemplate = async () => {
    if (!confId || roleSaving) return;
    if (!roleLabelInput.trim()) {
      setError("Role label is required");
      return;
    }

    setRoleSaving(true);
    setError(null);
    try {
      const payload = {
        label: roleLabelInput.trim(),
        baseRole: roleBaseInput,
        title: roleTitleInput.trim() || null,
        committeeScope: roleScopeInput.trim() || null,
        officeLabel: roleOfficeInput.trim() || null,
        sortOrder: Number.isFinite(Number(roleSortInput))
          ? Number(roleSortInput)
          : 100,
        isActive: roleActiveInput,
      };

      const endpoint = editingRoleId
        ? `/api/conf/${confId}/roles/${editingRoleId}`
        : `/api/conf/${confId}/roles`;
      const method = editingRoleId ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        cache: "no-store",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Failed to save role template");
      }

      await loadRoles(confId);
      resetRoleForm();
      setShowRoleForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save role template");
    } finally {
      setRoleSaving(false);
    }
  };

  const handleDeleteRoleTemplate = async (template: RoleTemplate) => {
    if (!confId || roleDeletingId) return;
    setRoleDeletingId(template.id);
    setError(null);
    try {
      const res = await fetch(`/api/conf/${confId}/roles/${template.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Failed to delete role template");
      }
      await loadRoles(confId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete role template");
    } finally {
      setRoleDeletingId(null);
    }
  };

  const handleAssignUserToRoleTemplate = async () => {
    if (!confId || !assignRoleKey || !assignUserId || assignSaving) return;
    setAssignSaving(true);
    setError(null);
    setNotice(null);
    try {
      const selectedRole = roleByKey.get(assignRoleKey);
      const selectedUser = allUsers.find((u) => u.id === assignUserId);
      if (!selectedRole) {
        throw new Error("Please select a valid role template");
      }
      if (!selectedUser) {
        throw new Error("Please select a valid user");
      }

      const selectedTargetMember = assignTargetMemberId
        ? members.find((m) => m.id === assignTargetMemberId) || null
        : null;
      const existingMemberByUser = members.find((m) => m.userId === selectedUser.id);
      const existingMemberByRole = members.find(
        (m) =>
          m.role === selectedRole.baseRole &&
          (m.title ?? "").trim().toLowerCase() ===
            (selectedRole.title ?? "").trim().toLowerCase() &&
          (m.committeeScope ?? "").trim().toLowerCase() ===
            (selectedRole.committeeScope ?? "").trim().toLowerCase(),
      );
      const existingMember =
        selectedTargetMember || existingMemberByUser || existingMemberByRole;
      const payload = {
        roleTemplateKey: selectedRole.key,
        role: selectedRole.baseRole,
        title: selectedRole.title ?? null,
        committeeScope: selectedRole.committeeScope ?? null,
        userId: selectedUser.id,
        name: selectedUser.name,
        email: selectedUser.email,
      };

      const endpoint = existingMember
        ? `/api/conf/${confId}/members/${existingMember.id}`
        : `/api/conf/${confId}/members`;
      const method = existingMember ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responsePayload = (await res.json().catch(() => ({}))) as {
        error?: string;
        existingMemberId?: string;
      };
      if (!res.ok && res.status === 409 && responsePayload.existingMemberId) {
        const patchRes = await fetch(
          `/api/conf/${confId}/members/${responsePayload.existingMemberId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        const patchPayload = (await patchRes.json().catch(() => ({}))) as {
          error?: string;
        };
        if (!patchRes.ok) {
          throw new Error(patchPayload.error || "Failed to update existing member");
        }
      } else if (!res.ok) {
        throw new Error(responsePayload.error || "Failed to assign role");
      }

      await loadMembers(confId);
      setAssignUserId("");
      setAssignRoleKey("");
      setAssignTargetMemberId("");
      setNotice(
        existingMember
          ? `Updated ${selectedUser.name} to ${selectedRole.label}.`
          : `Assigned ${selectedUser.name} as ${selectedRole.label}.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to assign role");
    } finally {
      setAssignSaving(false);
    }
  };

  const handleDeleteMember = async (member: Member) => {
    if (!confId || deletingMemberId) return;
    const proceed = window.confirm(
      `Delete ${member.name}? This removes the duplicate/member record from committee.`,
    );
    if (!proceed) return;
    setDeletingMemberId(member.id);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/conf/${confId}/members/${member.id}`, {
        method: "DELETE",
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || "Failed to delete member");
      }
      await loadMembers(confId);
      setNotice(`Deleted ${member.name}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete member");
    } finally {
      setDeletingMemberId(null);
    }
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
          roleTemplateKey: newMemberRoleKey || undefined,
          userId: selectedUserId || undefined,
        }),
      });

      if (!createRes.ok) {
        const payload = await createRes.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to add member");
      }

      let created = (await createRes.json()) as Member;

      if (photoFile) {
        const validation = validateProfilePhotoFile(photoFile);
        if (!validation.ok) {
          throw new Error(
            `Cannot upload profile photo: ${validation.error} (File: ${photoFile.name})`,
          );
        }
        const fd = new FormData();
        fd.append("file", photoFile);
        const uploadRes = await fetch(
          `/api/conf/${confId}/members/${created.id}/photo`,
          {
            method: "POST",
            body: fd,
          },
        );
        if (!uploadRes.ok) {
          const payload = await parseUploadErrorPayload(uploadRes);
          throw new Error(
            formatUploadError(
              payload,
              "Failed to upload profile photo",
              uploadRes.status,
            ),
          );
        }
        created = (await uploadRes.json()) as Member;
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
    const validation = validateProfilePhotoFile(file);
    if (!validation.ok) {
      setError(
        `Cannot upload profile photo: ${validation.error} (File: ${file.name})`,
      );
      return;
    }
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
        const payload = await parseUploadErrorPayload(res);
        throw new Error(
          formatUploadError(payload, "Failed to upload profile photo", res.status),
        );
      }

      const updated = (await res.json()) as Member;
      setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingId(null);
    }
  };

  const searchUsers = async (q: string) => {
    if (!q.trim() || q.length < 2) {
      setUserResults([]);
      return;
    }
    setUserSearching(true);
    try {
      const res = await fetch(
        `/api/admin/users?q=${encodeURIComponent(q)}&limit=10`,
      );
      if (res.ok) {
        const data = (await res.json()) as { users: UserSearchResult[] };
        setUserResults(data.users ?? []);
      }
    } finally {
      setUserSearching(false);
    }
  };

  const handleUpdatePermissions = async (
    memberId: string,
    patch: Partial<{
      role: string;
      roleTemplateKey: string;
      committeeScope: string | null;
      canAssignCommittee: boolean;
      canApprovePayments: boolean;
      userId: string | null;
      title: string | null;
    }>,
  ) => {
    if (!confId) return;
    setPermSaving(true);
    try {
      const res = await fetch(`/api/conf/${confId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Failed to update");
      }
      const updated = (await res.json()) as Member;
      setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
      setPermPanelId(null);
      setUserSearch("");
      setUserResults([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setPermSaving(false);
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
        <div className="flex items-center gap-2">
          {accessInfo?.isSuperAdmin && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowRoleForm((v) => !v)}
            >
              <Settings2 className="size-4" />
              Manage Roles
            </Button>
          )}
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus className="size-4" />
            Add Member
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}
      {notice && (
        <div className="fixed right-4 top-4 z-50 rounded-lg border border-emerald-500/30 bg-emerald-500/95 px-3 py-2 text-sm text-white shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4" />
            {notice}
          </div>
        </div>
      )}

      {showRoleForm && accessInfo?.isSuperAdmin && (
        <Card className="border-[#C8A061]/40">
          <CardHeader>
            <CardTitle className="text-base">
              {editingRoleId ? "Edit Role Template" : "Create Role Template"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Role Label</Label>
                <Input
                  placeholder="e.g. Conference Protocol Chair"
                  value={roleLabelInput}
                  onChange={(e) => setRoleLabelInput(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Base Role</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                  value={roleBaseInput}
                  onChange={(e) =>
                    setRoleBaseInput(
                      e.target.value as
                        | "CHAIR"
                        | "VICE_CHAIR"
                        | "SECRETARY"
                        | "TREASURER"
                        | "COMMITTEE"
                        | "DELEGATE",
                    )
                  }
                >
                  {BASE_ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  placeholder="100"
                  value={roleSortInput}
                  onChange={(e) => setRoleSortInput(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Title / Position</Label>
                <Input
                  placeholder="e.g. General Secretary"
                  value={roleTitleInput}
                  onChange={(e) => setRoleTitleInput(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Committee Scope</Label>
                <Input
                  placeholder="e.g. Cooking, Logistics"
                  value={roleScopeInput}
                  onChange={(e) => setRoleScopeInput(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Office Label</Label>
                <Input
                  placeholder="e.g. Office of the Cooking Committee"
                  value={roleOfficeInput}
                  onChange={(e) => setRoleOfficeInput(e.target.value)}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={roleActiveInput}
                onChange={(e) => setRoleActiveInput(e.target.checked)}
              />
              Active role template
            </label>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  resetRoleForm();
                  setShowRoleForm(false);
                }}
              >
                Close
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetRoleForm}
              >
                Reset Form
              </Button>
              <Button size="sm" onClick={() => void handleSaveRoleTemplate()}>
                {roleSaving ? "Saving..." : editingRoleId ? "Update Role" : "Create Role"}
              </Button>
            </div>

            <div className="rounded-lg border border-border p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Existing Role Templates
              </p>
              {rolesLoading ? (
                <div className="text-xs text-muted-foreground">Loading roles...</div>
              ) : roles.length === 0 ? (
                <div className="text-xs text-muted-foreground">No role templates yet.</div>
              ) : (
                <div className="space-y-2">
                  {roles.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between rounded-md border border-border px-2 py-1.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{template.label}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {template.baseRole}
                          {template.title ? ` · ${template.title}` : ""}
                          {template.committeeScope
                            ? ` · ${template.committeeScope}`
                            : ""}
                          {!template.isActive ? " · inactive" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => beginEditRole(template)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="text-red-500"
                          disabled={roleDeletingId === template.id}
                          onClick={() => void handleDeleteRoleTemplate(template)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-[#C8A061]/30 bg-[#C8A061]/5 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Assign User To Role Template
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Pick role template</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                    value={assignRoleKey}
                    onChange={(e) => {
                      setAssignRoleKey(e.target.value);
                      setAssignTargetMemberId("");
                    }}
                  >
                    <option value="">Select role template</option>
                    {activeRolesForAssignment.map((template) => (
                      <option key={template.id} value={template.key}>
                        {template.label} · {template.baseRole}
                        {template.committeeScope
                          ? ` · ${template.committeeScope}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Link to specific post/card (optional)</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                    value={assignTargetMemberId}
                    onChange={(e) => setAssignTargetMemberId(e.target.value)}
                    disabled={!assignRoleKey}
                  >
                    <option value="">
                      Auto-match by role/user (or create if not found)
                    </option>
                    {assignTargetOptions.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} · {member.title || member.role}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Pick user account</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                    value={assignUserId}
                    onChange={(e) => setAssignUserId(e.target.value)}
                  >
                    <option value="">Select system user</option>
                    {allUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} · {user.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                If the user is already in committee, this updates their role.
                Otherwise, it creates a new committee member with the selected role.
              </p>
              <div className="mt-3 flex justify-end">
                <Button
                  size="sm"
                  onClick={() => void handleAssignUserToRoleTemplate()}
                  disabled={!assignRoleKey || !assignUserId || assignSaving}
                >
                  {assignSaving ? "Assigning..." : "Assign User To Role"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card className="border-[#C8A061]/40">
          <CardHeader>
            <CardTitle className="text-base">Add Committee Member</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Import from registered delegates (optional)</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                  value={selectedDelegateId}
                  onChange={(e) => {
                    const delegateId = e.target.value;
                    setSelectedDelegateId(delegateId);
                    const selected = delegateOptions.find((d) => d.id === delegateId);
                    if (!selected) return;
                    setName(selected.name);
                    setEmail(selected.email ?? "");
                    setCity(selected.city);
                    setPhone(selected.phone ?? "");
                    if (selected.conferencePosition) {
                      setTitle(selected.conferencePosition);
                    }
                    if (selected.userId) {
                      setSelectedUserId(selected.userId);
                    }
                  }}
                >
                  <option value="">Choose a delegate to prefill member form</option>
                  {delegateOptions.map((delegate) => (
                    <option key={delegate.id} value={delegate.id}>
                      {delegate.name}
                      {delegate.conferencePosition
                        ? ` · ${delegate.conferencePosition}`
                        : ""}
                      {delegate.feePaid ? " · Paid" : " · Unpaid"}
                    </option>
                  ))}
                </select>
              </div>
              {accessInfo?.isSuperAdmin && (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Link platform user account (optional)</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                    value={selectedUserId}
                    onChange={(e) => {
                      const userId = e.target.value;
                      setSelectedUserId(userId);
                      const selected = allUsers.find((user) => user.id === userId);
                      if (!selected) return;
                      if (!name.trim()) setName(selected.name);
                      if (!email.trim()) setEmail(selected.email);
                    }}
                  >
                    <option value="">Choose a user account to link</option>
                    {allUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} · {user.email} · {user.role}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Role Template</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                  value={newMemberRoleKey}
                  onChange={(e) => {
                    const key = e.target.value;
                    setNewMemberRoleKey(key);
                    const selected = roleByKey.get(key);
                    if (selected) {
                      setRole(selected.baseRole);
                      setTitle(selected.title ?? "");
                    }
                  }}
                >
                  <option value="">Custom / manual assignment</option>
                  {activeRoles.map((template) => (
                    <option key={template.id} value={template.key}>
                      {template.label}
                    </option>
                  ))}
                </select>
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
          const linkedUser = member.userId ? userById.get(member.userId) : null;
          const displayEmail =
            member.email || member.linkedUserEmail || linkedUser?.email || null;
          const displayLinkedName =
            member.linkedUserName || linkedUser?.name || null;
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
                      <p className="font-semibold leading-tight">
                        {member.name}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <RoleIcon className={`size-3.5 ${config.color}`} />
                        <span className="text-xs text-muted-foreground">
                          {getDisplayTitle(member, config.label)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-1.5">
                    <Badge variant="outline" className="text-[11px]">
                      {config.label}
                    </Badge>
                    {(accessInfo?.isSuperAdmin ||
                      accessInfo?.canAssignCommittee) && (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="h-6 w-6 opacity-60 hover:opacity-100"
                        onClick={() =>
                          setPermPanelId(
                            permPanelId === member.id ? null : member.id,
                          )
                        }
                      >
                        <Settings2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
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
                  {displayEmail && (
                    <div className="flex items-center gap-1.5 break-all">
                      <Mail className="size-3" />
                      {displayEmail}
                    </div>
                  )}
                  {member.userId && displayLinkedName && (
                    <div className="flex items-center gap-1.5">
                      <Link2 className="size-3" />
                      Linked: {displayLinkedName}
                    </div>
                  )}
                </div>

                {/* Permission badges */}
                {(member.committeeScope ||
                  member.canApprovePayments ||
                  member.canAssignCommittee ||
                  member.userId) && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {member.committeeScope && (
                      <Badge variant="secondary" className="text-[10px]">
                        {member.committeeScope} Committee
                      </Badge>
                    )}
                    {member.canApprovePayments && (
                      <Badge
                        variant="outline"
                        className="border-blue-500/40 text-[10px] text-blue-600 dark:text-blue-400"
                      >
                        <Shield className="mr-0.5 size-2.5" />
                        Approver
                      </Badge>
                    )}
                    {member.canAssignCommittee && (
                      <Badge
                        variant="outline"
                        className="border-amber-500/40 text-[10px] text-amber-600 dark:text-amber-400"
                      >
                        <Crown className="mr-0.5 size-2.5" />
                        Can Assign
                      </Badge>
                    )}
                    {member.userId && (
                      <Badge
                        variant="outline"
                        className="border-green-500/40 text-[10px] text-green-600 dark:text-green-400"
                      >
                        <Link2 className="mr-0.5 size-2.5" />
                        Account Linked
                      </Badge>
                    )}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {/* Edit contact details button */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1.5 text-xs"
                    onClick={() =>
                      editMemberId === member.id
                        ? setEditMemberId(null)
                        : openEdit(member)
                    }
                  >
                    <Pencil className="size-3" />
                    Edit Details
                  </Button>
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                    <Camera className="size-3.5" />
                    {uploadingId === member.id
                      ? "Uploading..."
                      : "Upload Photo"}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) =>
                        handleReplacePhoto(
                          member.id,
                          e.target.files?.[0] || null,
                        )
                      }
                    />
                  </label>
                  {accessInfo?.isSuperAdmin && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 gap-1.5 text-xs"
                      disabled={deletingMemberId === member.id}
                      onClick={() => void handleDeleteMember(member)}
                    >
                      <Trash2 className="size-3" />
                      {deletingMemberId === member.id ? "Deleting..." : "Delete"}
                    </Button>
                  )}
                </div>

                {/* Inline edit panel */}
                {editMemberId === member.id && (
                  <div className="mt-3 space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs font-semibold text-foreground">
                      Edit Contact Details
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-[11px]">Full Name</Label>
                        <Input
                          className="h-7 text-xs"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Full name"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px]">Phone</Label>
                        <Input
                          className="h-7 text-xs"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="e.g. +8615812345678"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px]">City</Label>
                        <Input
                          className="h-7 text-xs"
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          placeholder="e.g. Jinan"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px]">Email</Label>
                        <Input
                          className="h-7 text-xs"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          placeholder="email@example.com"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => setEditMemberId(null)}
                      >
                        <X className="size-3" /> Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-[#002868] hover:bg-[#001A4E]"
                        onClick={() => void handleEditSave(member.id)}
                        disabled={editSaving}
                      >
                        <Check className="size-3" />
                        {editSaving ? "Saving…" : "Save"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Permissions Panel */}
                {permPanelId === member.id && (
                  <MemberPermissionsPanel
                    member={member}
                    isSuperAdmin={accessInfo?.isSuperAdmin ?? false}
                    roleTemplates={activeRoles}
                    saving={permSaving}
                    userSearch={userSearch}
                    userResults={userResults}
                    userSearching={userSearching}
                    onUserSearch={(q) => {
                      setUserSearch(q);
                      void searchUsers(q);
                    }}
                    onSave={(patch) =>
                      handleUpdatePermissions(member.id, patch)
                    }
                    onClose={() => {
                      setPermPanelId(null);
                      setUserSearch("");
                      setUserResults([]);
                    }}
                  />
                )}
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

// ── Member Permissions Panel ──────────────────────────────────────────────────

function MemberPermissionsPanel({
  member,
  isSuperAdmin,
  roleTemplates,
  saving,
  userSearch,
  userResults,
  userSearching,
  onUserSearch,
  onSave,
  onClose,
}: {
  member: Member;
  isSuperAdmin: boolean;
  roleTemplates: RoleTemplate[];
  saving: boolean;
  userSearch: string;
  userResults: UserSearchResult[];
  userSearching: boolean;
  onUserSearch: (q: string) => void;
  onSave: (
    patch: Partial<{
      role: string;
      roleTemplateKey: string;
      committeeScope: string | null;
      canAssignCommittee: boolean;
      canApprovePayments: boolean;
      userId: string | null;
      title: string | null;
    }>,
  ) => void;
  onClose: () => void;
}) {
  const [role, setRole] = useState(member.role);
  const [roleTemplateKey, setRoleTemplateKey] = useState(() => {
    const matched = roleTemplates.find(
      (t) =>
        t.baseRole === member.role &&
        (t.title ?? "") === (member.title ?? "") &&
        (t.committeeScope ?? "") === (member.committeeScope ?? ""),
    );
    return matched?.key ?? "";
  });
  const [committeeScope, setCommitteeScope] = useState(
    member.committeeScope ?? "",
  );
  const [canApprove, setCanApprove] = useState(member.canApprovePayments);
  const [canAssign, setCanAssign] = useState(member.canAssignCommittee);
  const [linkedUserId, setLinkedUserId] = useState<string | null>(
    member.userId,
  );
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(
    null,
  );
  const [title, setTitle] = useState(member.title ?? "");

  const handleSave = () => {
    const patch: Parameters<typeof onSave>[0] = {
      role,
      roleTemplateKey: roleTemplateKey || undefined,
      committeeScope: committeeScope || null,
      canApprovePayments: canApprove,
      title: title || null,
    };
    if (isSuperAdmin) {
      patch.canAssignCommittee = canAssign;
      patch.userId = linkedUserId;
    }
    onSave(patch);
  };

  return (
    <div className="mt-3 rounded-lg border border-[#C8A061]/30 bg-muted/30 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Permissions &amp; Assignment
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          onClick={onClose}
        >
          Close
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Role Template</Label>
          <select
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs"
            value={roleTemplateKey}
            onChange={(e) => {
              const key = e.target.value;
              setRoleTemplateKey(key);
              const selected = roleTemplates.find((t) => t.key === key);
              if (selected) {
                setRole(selected.baseRole);
                setTitle(selected.title ?? "");
                setCommitteeScope(selected.committeeScope ?? "");
              }
            }}
          >
            <option value="">Custom / manual assignment</option>
            {roleTemplates.map((template) => (
              <option key={template.id} value={template.key}>
                {template.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Role</Label>
          <select
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs"
            value={role}
            onChange={(e) => {
              setRoleTemplateKey("");
              setRole(e.target.value);
            }}
          >
            {[
              "CHAIR",
              "VICE_CHAIR",
              "SECRETARY",
              "TREASURER",
              "COMMITTEE",
              "DELEGATE",
            ].map((r) => (
              <option key={r} value={r}>
                {r.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Title / Position</Label>
          <Input
            className="h-8 text-xs"
            placeholder="e.g. Cooking Committee Chair"
            value={title}
            onChange={(e) => {
              setRoleTemplateKey("");
              setTitle(e.target.value);
            }}
          />
        </div>

        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Committee Scope</Label>
          <Input
            className="h-8 text-xs"
            placeholder="e.g. Cooking, Sports, Logistics, Media"
            value={committeeScope}
            onChange={(e) => {
              setRoleTemplateKey("");
              setCommitteeScope(e.target.value);
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={canApprove}
            onChange={(e) => setCanApprove(e.target.checked)}
            className="rounded"
          />
          <Shield className="size-3 text-blue-500" />
          Can approve payments
        </label>
        {isSuperAdmin && (
          <label className="flex cursor-pointer items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={canAssign}
              onChange={(e) => setCanAssign(e.target.checked)}
              className="rounded"
            />
            <Crown className="size-3 text-amber-500" />
            Can assign committee members
          </label>
        )}
      </div>

      {/* User account linking (super admin only) */}
      {isSuperAdmin && (
        <div className="space-y-2 border-t pt-2">
          <Label className="text-xs flex items-center gap-1">
            <Link2 className="size-3" />
            Link to Platform User Account
          </Label>

          {linkedUserId && !selectedUser && (
            <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
              <CheckCircle2 className="size-3" />
              Currently linked (ID: {linkedUserId.slice(0, 8)}…)
              <button
                className="text-red-500 underline"
                onClick={() => setLinkedUserId(null)}
              >
                Unlink
              </button>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-2 top-2 size-3 text-muted-foreground" />
            <Input
              className="h-8 pl-6 text-xs"
              placeholder="Search by name or email..."
              value={userSearch}
              onChange={(e) => onUserSearch(e.target.value)}
            />
          </div>

          {userSearching && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Searching...
            </div>
          )}

          {userResults.length > 0 && (
            <div className="space-y-1">
              {userResults.map((u) => (
                <button
                  key={u.id}
                  className={`flex w-full items-center justify-between rounded-md border px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent ${linkedUserId === u.id ? "border-green-500/40 bg-green-500/10" : "border-border"}`}
                  onClick={() => {
                    setLinkedUserId(u.id);
                    setSelectedUser(u);
                  }}
                >
                  <div>
                    <span className="font-medium">{u.name}</span>
                    <span className="ml-1 text-muted-foreground">
                      {u.email}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {u.role}
                  </Badge>
                </button>
              ))}
            </div>
          )}

          {selectedUser && linkedUserId === selectedUser.id && (
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <CheckCircle2 className="size-3" />
              Will link to: {selectedUser.name} ({selectedUser.email})
            </div>
          )}
        </div>
      )}

      {/* Save/cancel */}
      <div className="flex justify-end gap-2 border-t pt-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <AlertCircle className="size-3" />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
