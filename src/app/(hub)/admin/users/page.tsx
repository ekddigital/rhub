"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  UserCog,
  Search,
  UserPlus,
  History,
  RefreshCw,
  Check,
  X,
  ChevronLeft,
  Eye,
  EyeOff,
  Trash2,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getRoleMeta } from "@/lib/roles";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { RoleChangeBanner } from "@/components/role-change-banner";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  accessStatus: "PENDING" | "APPROVED" | "RESTRICTED" | "REJECTED";
  isActive: boolean;
  canAccessHub: boolean;
  canAccessConference: boolean | null;
  canAccessAdmin: boolean | null;
  approvedBy: string | null;
  approvedAt: string | null;
  accessNote: string | null;
  emailVerified: boolean;
  createdAt: string;
}

interface AdminUser {
  id: string;
  name: string;
  role: string;
  canAccessAdmin?: boolean | null;
  roleChangedAt?: string | null;
  sessionCreatedAt?: string;
}

const ALL_ROLES = [
  { value: "USER", label: "User" },
  { value: "JUDGE", label: "Judge" },
  { value: "HEAD_JUDGE", label: "Head Judge" },
  { value: "JUDGE_ADMIN", label: "Judge Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];

const ACCESS_STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "RESTRICTED", label: "Restricted" },
  { value: "REJECTED", label: "Rejected" },
];

const ACCESS_STATUS_BADGE: Record<string, string> = {
  PENDING:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  APPROVED:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  RESTRICTED:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

function UsersContent() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [tableLoading, setTableLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Create user modal
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState("USER");
  const [showCreatePwd, setShowCreatePwd] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Inline editing
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set(),
  );
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{ id: string; ok: boolean } | null>(
    null,
  );

  const isSuperAdmin = adminUser?.role === "SUPER_ADMIN";

  const canEditUser = useCallback(
    (user: UserRow) => {
      if (isSuperAdmin) return true;
      return user.role !== "SUPER_ADMIN" && user.role !== "ADMIN";
    },
    [isSuperAdmin],
  );

  const clearBulkNotices = () => {
    setBulkMessage(null);
    setBulkError(null);
  };

  const fetchUsers = useCallback(async () => {
    setTableLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("accessStatus", statusFilter);
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        const nextUsers = (data.users || []) as UserRow[];
        setUsers(nextUsers);
        setTotal(data.total);
        setSelectedUserIds((prev) => {
          const validIds = new Set(nextUsers.map((u) => u.id));
          const next = new Set<string>();
          prev.forEach((id) => {
            if (validIds.has(id)) next.add(id);
          });
          return next;
        });
      }
    } catch {
      // ignore
    } finally {
      setTableLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (
          !data.id ||
          !["SUPER_ADMIN", "ADMIN"].includes(data.role) ||
          data.canAccessAdmin === false
        ) {
          router.replace(
            data.id ? "/dashboard" : "/login?redirect=/admin/users",
          );
          return;
        }
        setAdminUser({
          id: data.id,
          name: data.name,
          role: data.role,
          canAccessAdmin: data.canAccessAdmin,
        });
        setLoading(false);
      })
      .catch(() => router.replace("/login?redirect=/admin/users"));
  }, [router]);

  useEffect(() => {
    if (!loading) fetchUsers();
  }, [loading, fetchUsers]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      if (!loading) fetchUsers();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter, statusFilter]);

  const cycleTriState = (value: boolean | null): boolean | null => {
    if (value === null) return true;
    if (value === true) return false;
    return null;
  };

  const handleUpdateUser = async (
    userId: string,
    patch: Record<string, unknown>,
  ) => {
    setSavingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, ...data.user } : u)),
        );
        setFeedback({ id: userId, ok: true });
      } else {
        setFeedback({ id: userId, ok: false });
        alert(data.error || "Failed to update user.");
      }
    } catch {
      setFeedback({ id: userId, ok: false });
    } finally {
      setSavingId(null);
      setEditingRole(null);
      setEditingStatus(null);
      setTimeout(() => setFeedback(null), 2000);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName,
          email: createEmail,
          password: createPassword,
          role: createRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || "Failed to create user");
        return;
      }
      setShowCreate(false);
      setCreateName("");
      setCreateEmail("");
      setCreatePassword("");
      setCreateRole("USER");
      fetchUsers();
    } catch {
      setCreateError("Network error. Please try again.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    await handleUpdateUser(userId, { role: newRole });
  };

  const handleUpdateAccessStatus = async (
    userId: string,
    newStatus: UserRow["accessStatus"],
  ) => {
    await handleUpdateUser(userId, { accessStatus: newStatus });
  };

  const handleToggleActive = async (userId: string, current: boolean) => {
    await handleUpdateUser(userId, { isActive: !current });
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!isSuperAdmin) return;
    if (!confirm(`Delete user "${userName}"? This cannot be undone.`)) return;
    setSavingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setTotal((t) => t - 1);
        setFeedback({ id: userId, ok: true });
        setTimeout(() => setFeedback(null), 2000);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to delete user.");
        setFeedback({ id: userId, ok: false });
        setTimeout(() => setFeedback(null), 2000);
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setSavingId(null);
    }
  };

  const selectableUserIds = users
    .filter((u) => canEditUser(u) && u.id !== adminUser?.id)
    .map((u) => u.id);

  const selectedCount = selectedUserIds.size;
  const allSelectableSelected =
    selectableUserIds.length > 0 &&
    selectableUserIds.every((id) => selectedUserIds.has(id));

  const toggleSelectedUser = (userId: string) => {
    clearBulkNotices();
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleSelectAllVisible = (checked: boolean) => {
    clearBulkNotices();
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (checked) selectableUserIds.forEach((id) => next.add(id));
      else selectableUserIds.forEach((id) => next.delete(id));
      return next;
    });
  };

  const runBulkPatch = async (
    label: string,
    patch: Record<string, unknown>,
    confirmMessage?: string,
    options?: { superAdminOnly?: boolean },
  ) => {
    if (options?.superAdminOnly && !isSuperAdmin) {
      setBulkError("Only Super Admins can run this bulk action.");
      return;
    }

    const targetUsers = users.filter(
      (u) =>
        selectedUserIds.has(u.id) && canEditUser(u) && u.id !== adminUser?.id,
    );

    if (!targetUsers.length) {
      setBulkError("No editable users are selected.");
      return;
    }

    if (
      confirmMessage &&
      !confirm(confirmMessage.replace("{count}", String(targetUsers.length)))
    ) {
      return;
    }

    setBulkLoading(true);
    setBulkMessage(null);
    setBulkError(null);

    const results = await Promise.all(
      targetUsers.map(async (user) => {
        try {
          const res = await fetch(`/api/admin/users/${user.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
          });

          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            return {
              id: user.id,
              ok: false as const,
              error: data.error || "Failed to update user.",
            };
          }

          return {
            id: user.id,
            ok: true as const,
            user: data.user as UserRow,
          };
        } catch {
          return {
            id: user.id,
            ok: false as const,
            error: "Network error.",
          };
        }
      }),
    );

    const successes = results.filter((r) => r.ok);
    const failures = results.filter((r) => !r.ok);

    if (successes.length) {
      const updatedById = new Map(successes.map((r) => [r.id, r.user]));
      setUsers((prev) =>
        prev.map((u) =>
          updatedById.has(u.id) ? { ...u, ...updatedById.get(u.id)! } : u,
        ),
      );
      setSelectedUserIds((prev) => {
        const next = new Set(prev);
        successes.forEach((r) => next.delete(r.id));
        return next;
      });
      setBulkMessage(
        `${label} applied to ${successes.length} user${successes.length === 1 ? "" : "s"}.`,
      );
    }

    if (failures.length) {
      setBulkError(
        `${failures.length} user${failures.length === 1 ? "" : "s"} failed to update.`,
      );
    }

    setBulkLoading(false);
  };

  if (loading || !adminUser) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-ekd-gold" />
      </div>
    );
  }

  return (
    <AppShell
      user={{ id: adminUser.id, name: adminUser.name, role: adminUser.role }}
    >
      <div className="max-w-6xl space-y-6 py-2">
        <RoleChangeBanner
          roleChangedAt={adminUser.roleChangedAt ?? null}
          sessionCreatedAt={adminUser.sessionCreatedAt ?? null}
        />
        {/* Header */}
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to Admin Panel
          </Link>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-ekd-gold" />
              <h1 className="text-2xl font-bold text-foreground">
                User Management
              </h1>
              <span className="ml-2 text-xs font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {total} users
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/audit"
                className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <History className="h-4 w-4" />
                Audit Log
              </Link>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 rounded-xl bg-ekd-gold hover:bg-ekd-light-gold text-ekd-dark-brown font-semibold px-4 py-2 text-sm transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                New User
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-50 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className={cn(
                "w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-ekd-gold/30 focus:border-ekd-gold",
              )}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={cn(
              "rounded-xl border border-border bg-background px-3 py-2 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-ekd-gold/30 focus:border-ekd-gold",
            )}
          >
            <option value="">All Roles</option>
            {ALL_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={cn(
              "rounded-xl border border-border bg-background px-3 py-2 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-ekd-gold/30 focus:border-ekd-gold",
            )}
          >
            <option value="">All Approval Statuses</option>
            {ACCESS_STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            onClick={fetchUsers}
            disabled={tableLoading}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <RefreshCw
              className={cn("h-4 w-4", tableLoading && "animate-spin")}
            />
            Refresh
          </button>
        </div>

        {selectedCount > 0 && (
          <div className="rounded-xl border border-ekd-gold/30 bg-ekd-gold/5 px-3 py-3 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm font-medium text-foreground">
                {selectedCount} user{selectedCount === 1 ? "" : "s"} selected
              </p>
              <button
                onClick={() => {
                  setSelectedUserIds(new Set());
                  clearBulkNotices();
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear selection
              </button>
            </div>

            {bulkMessage && (
              <p className="text-xs rounded-lg bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 px-2.5 py-1.5">
                {bulkMessage}
              </p>
            )}
            {bulkError && (
              <p className="text-xs rounded-lg bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 px-2.5 py-1.5">
                {bulkError}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  runBulkPatch(
                    "Approve + Hub access",
                    { accessStatus: "APPROVED", canAccessHub: true },
                    "Approve and enable hub access for {count} selected users?",
                  )
                }
                disabled={bulkLoading}
                className="rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-2.5 py-1.5 disabled:opacity-60"
              >
                Approve + Hub On
              </button>
              <button
                onClick={() =>
                  runBulkPatch(
                    "Restrict access",
                    { accessStatus: "RESTRICTED", canAccessHub: false },
                    "Restrict and disable hub access for {count} selected users?",
                  )
                }
                disabled={bulkLoading}
                className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold px-2.5 py-1.5 disabled:opacity-60"
              >
                Restrict + Hub Off
              </button>
              <button
                onClick={() =>
                  runBulkPatch(
                    "Enable accounts",
                    { isActive: true },
                    "Enable {count} selected accounts?",
                  )
                }
                disabled={bulkLoading}
                className="rounded-lg border border-border bg-background text-xs font-semibold px-2.5 py-1.5 hover:bg-accent disabled:opacity-60"
              >
                Enable
              </button>
              <button
                onClick={() =>
                  runBulkPatch(
                    "Disable accounts",
                    { isActive: false },
                    "Disable {count} selected accounts?",
                  )
                }
                disabled={bulkLoading}
                className="rounded-lg border border-border bg-background text-xs font-semibold px-2.5 py-1.5 hover:bg-accent disabled:opacity-60"
              >
                Disable
              </button>
              <button
                onClick={() =>
                  runBulkPatch("Conference access ON", {
                    canAccessConference: true,
                  })
                }
                disabled={bulkLoading}
                className="rounded-lg border border-border bg-background text-xs font-semibold px-2.5 py-1.5 hover:bg-accent disabled:opacity-60"
              >
                Conf ON
              </button>
              <button
                onClick={() =>
                  runBulkPatch("Conference access AUTO", {
                    canAccessConference: null,
                  })
                }
                disabled={bulkLoading}
                className="rounded-lg border border-border bg-background text-xs font-semibold px-2.5 py-1.5 hover:bg-accent disabled:opacity-60"
              >
                Conf AUTO
              </button>
              <button
                onClick={() =>
                  runBulkPatch("Conference access OFF", {
                    canAccessConference: false,
                  })
                }
                disabled={bulkLoading}
                className="rounded-lg border border-border bg-background text-xs font-semibold px-2.5 py-1.5 hover:bg-accent disabled:opacity-60"
              >
                Conf OFF
              </button>
              {isSuperAdmin && (
                <>
                  <button
                    onClick={() =>
                      runBulkPatch(
                        "Admin access ON",
                        { canAccessAdmin: true },
                        undefined,
                        { superAdminOnly: true },
                      )
                    }
                    disabled={bulkLoading}
                    className="rounded-lg border border-border bg-background text-xs font-semibold px-2.5 py-1.5 hover:bg-accent disabled:opacity-60"
                  >
                    Admin ON
                  </button>
                  <button
                    onClick={() =>
                      runBulkPatch(
                        "Admin access AUTO",
                        { canAccessAdmin: null },
                        undefined,
                        { superAdminOnly: true },
                      )
                    }
                    disabled={bulkLoading}
                    className="rounded-lg border border-border bg-background text-xs font-semibold px-2.5 py-1.5 hover:bg-accent disabled:opacity-60"
                  >
                    Admin AUTO
                  </button>
                  <button
                    onClick={() =>
                      runBulkPatch(
                        "Admin access OFF",
                        { canAccessAdmin: false },
                        undefined,
                        { superAdminOnly: true },
                      )
                    }
                    disabled={bulkLoading}
                    className="rounded-lg border border-border bg-background text-xs font-semibold px-2.5 py-1.5 hover:bg-accent disabled:opacity-60"
                  >
                    Admin OFF
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {tableLoading && users.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allSelectableSelected}
                        onChange={(e) =>
                          toggleSelectAllVisible(e.target.checked)
                        }
                        disabled={bulkLoading || selectableUserIds.length === 0}
                        className="h-4 w-4 rounded border-border"
                        aria-label="Select all visible users"
                      />
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">
                      User
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">
                      Role
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">
                      Approval
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">
                      Access
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">
                      Joined
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((u) => {
                    const roleMeta = getRoleMeta(u.role);
                    const isMe = u.id === adminUser?.id;
                    const canEdit = canEditUser(u);
                    const canManageAdminAccess = isSuperAdmin;
                    const selectable = canEdit && !isMe;
                    const saving = savingId === u.id;
                    const fb = feedback?.id === u.id;

                    return (
                      <tr
                        key={u.id}
                        className={cn(
                          "hover:bg-muted/20 transition-colors",
                          !u.isActive && "opacity-60",
                        )}
                      >
                        {/* Select */}
                        <td className="px-4 py-3 align-top">
                          {selectable ? (
                            <input
                              type="checkbox"
                              checked={selectedUserIds.has(u.id)}
                              onChange={() => toggleSelectedUser(u.id)}
                              disabled={saving || bulkLoading}
                              className="h-4 w-4 rounded border-border"
                              aria-label={`Select ${u.email}`}
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              -
                            </span>
                          )}
                        </td>

                        {/* User */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-ekd-gold to-ekd-maroon text-white text-xs font-bold shrink-0">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate max-w-45">
                                {u.name}
                                {isMe && (
                                  <span className="ml-1.5 text-[10px] text-muted-foreground">
                                    (you)
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground truncate max-w-45">
                                {u.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Role — inline select */}
                        <td className="px-4 py-3">
                          {editingRole === u.id && canEdit ? (
                            <select
                              autoFocus
                              defaultValue={u.role}
                              onChange={(e) =>
                                handleUpdateRole(u.id, e.target.value)
                              }
                              onBlur={() => setEditingRole(null)}
                              disabled={saving || bulkLoading}
                              className="rounded-lg border border-ekd-gold bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ekd-gold/30"
                            >
                              {ALL_ROLES.filter((r) =>
                                isSuperAdmin
                                  ? true
                                  : r.value !== "SUPER_ADMIN" &&
                                    r.value !== "ADMIN",
                              ).map((r) => (
                                <option key={r.value} value={r.value}>
                                  {r.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <button
                              onClick={() => canEdit && setEditingRole(u.id)}
                              disabled={!canEdit || saving || bulkLoading}
                              className={cn(
                                "inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full",
                                roleMeta.badge,
                                canEdit &&
                                  "cursor-pointer hover:opacity-80 transition-opacity",
                              )}
                              title={
                                canEdit ? "Click to change role" : undefined
                              }
                            >
                              {saving ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : fb ? (
                                feedback?.ok ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <X className="h-3 w-3" />
                                )
                              ) : null}
                              {roleMeta.label}
                            </button>
                          )}
                        </td>

                        {/* Approval */}
                        <td className="px-4 py-3">
                          {editingStatus === u.id && canEdit ? (
                            <select
                              autoFocus
                              defaultValue={u.accessStatus}
                              onChange={(e) =>
                                handleUpdateAccessStatus(
                                  u.id,
                                  e.target.value as UserRow["accessStatus"],
                                )
                              }
                              onBlur={() => setEditingStatus(null)}
                              disabled={saving || bulkLoading}
                              className="rounded-lg border border-ekd-gold bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ekd-gold/30"
                            >
                              {ACCESS_STATUS_OPTIONS.map((s) => (
                                <option key={s.value} value={s.value}>
                                  {s.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <button
                              onClick={() => canEdit && setEditingStatus(u.id)}
                              disabled={!canEdit || saving || bulkLoading}
                              className={cn(
                                "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide",
                                ACCESS_STATUS_BADGE[u.accessStatus],
                                canEdit &&
                                  "cursor-pointer hover:opacity-80 transition-opacity",
                              )}
                              title={
                                canEdit
                                  ? "Click to change approval status"
                                  : undefined
                              }
                            >
                              {u.accessStatus}
                            </button>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-start gap-1.5">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                                u.isActive
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                              )}
                            >
                              {u.isActive ? "Active" : "Disabled"}
                            </span>
                            {!u.emailVerified && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                Unverified
                              </span>
                            )}
                            {u.approvedAt && (
                              <span className="text-[10px] text-muted-foreground">
                                Approved{" "}
                                {new Date(u.approvedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Access */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-1.5 max-w-55">
                            <button
                              onClick={() =>
                                canEdit &&
                                handleUpdateUser(u.id, {
                                  canAccessHub: !u.canAccessHub,
                                })
                              }
                              disabled={saving || bulkLoading || !canEdit}
                              title="Toggle hub access"
                              className={cn(
                                "text-[10px] font-semibold px-2 py-1 rounded-full border",
                                u.canAccessHub
                                  ? "border-green-300 text-green-700 dark:border-green-700 dark:text-green-300"
                                  : "border-red-300 text-red-700 dark:border-red-700 dark:text-red-300",
                              )}
                            >
                              HUB {u.canAccessHub ? "ON" : "OFF"}
                            </button>

                            <button
                              onClick={() =>
                                canEdit &&
                                handleUpdateUser(u.id, {
                                  canAccessConference: cycleTriState(
                                    u.canAccessConference,
                                  ),
                                })
                              }
                              disabled={saving || bulkLoading || !canEdit}
                              title="Cycle conference access (Auto → On → Off)"
                              className={cn(
                                "text-[10px] font-semibold px-2 py-1 rounded-full border",
                                u.canAccessConference === true
                                  ? "border-green-300 text-green-700 dark:border-green-700 dark:text-green-300"
                                  : u.canAccessConference === false
                                    ? "border-red-300 text-red-700 dark:border-red-700 dark:text-red-300"
                                    : "border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300",
                              )}
                            >
                              CONF{" "}
                              {u.canAccessConference === null
                                ? "AUTO"
                                : u.canAccessConference
                                  ? "ON"
                                  : "OFF"}
                            </button>

                            {canManageAdminAccess && (
                              <button
                                onClick={() =>
                                  handleUpdateUser(u.id, {
                                    canAccessAdmin: cycleTriState(
                                      u.canAccessAdmin,
                                    ),
                                  })
                                }
                                disabled={saving || bulkLoading}
                                title="Cycle admin access (Auto → On → Off)"
                                className={cn(
                                  "text-[10px] font-semibold px-2 py-1 rounded-full border",
                                  u.canAccessAdmin === true
                                    ? "border-green-300 text-green-700 dark:border-green-700 dark:text-green-300"
                                    : u.canAccessAdmin === false
                                      ? "border-red-300 text-red-700 dark:border-red-700 dark:text-red-300"
                                      : "border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300",
                                )}
                              >
                                ADMIN{" "}
                                {u.canAccessAdmin === null
                                  ? "AUTO"
                                  : u.canAccessAdmin
                                    ? "ON"
                                    : "OFF"}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Joined */}
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 justify-end">
                            {/* Toggle active */}
                            {canEdit && !isMe && (
                              <button
                                onClick={() =>
                                  handleToggleActive(u.id, u.isActive)
                                }
                                disabled={saving || bulkLoading}
                                title={
                                  u.isActive
                                    ? "Disable account"
                                    : "Enable account"
                                }
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                              >
                                {u.isActive ? (
                                  <ShieldOff className="h-3.5 w-3.5" />
                                ) : (
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                )}
                              </button>
                            )}
                            {/* Delete — SUPER_ADMIN only */}
                            {isSuperAdmin && !isMe && (
                              <button
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                disabled={saving || bulkLoading}
                                title="Delete user"
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create User modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="w-full max-w-md rounded-2xl border border-border bg-background shadow-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-foreground">Create New User</h2>
                <button
                  onClick={() => {
                    setShowCreate(false);
                    setCreateError("");
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleCreateUser} className="space-y-4">
                {createError && (
                  <p className="text-sm text-red-500 rounded-lg bg-red-50 dark:bg-red-950/20 px-3 py-2">
                    {createError}
                  </p>
                )}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    required
                    minLength={2}
                    placeholder="John Doe"
                    className={cn(
                      "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm",
                      "focus:outline-none focus:ring-2 focus:ring-ekd-gold/30 focus:border-ekd-gold",
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    required
                    placeholder="user@example.com"
                    className={cn(
                      "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm",
                      "focus:outline-none focus:ring-2 focus:ring-ekd-gold/30 focus:border-ekd-gold",
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCreatePwd ? "text" : "password"}
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      className={cn(
                        "w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-11 text-sm",
                        "focus:outline-none focus:ring-2 focus:ring-ekd-gold/30 focus:border-ekd-gold",
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCreatePwd(!showCreatePwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      tabIndex={-1}
                    >
                      {showCreatePwd ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Role
                  </label>
                  <select
                    value={createRole}
                    onChange={(e) => setCreateRole(e.target.value)}
                    className={cn(
                      "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm",
                      "focus:outline-none focus:ring-2 focus:ring-ekd-gold/30 focus:border-ekd-gold",
                    )}
                  >
                    {ALL_ROLES.filter((r) =>
                      isSuperAdmin
                        ? true
                        : r.value !== "SUPER_ADMIN" && r.value !== "ADMIN",
                    ).map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-ekd-gold hover:bg-ekd-light-gold text-ekd-dark-brown font-semibold py-2.5 text-sm transition-colors disabled:opacity-50"
                  >
                    {createLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    {createLoading ? "Creating…" : "Create User"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreate(false);
                      setCreateError("");
                    }}
                    className="px-4 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-ekd-gold" />
        </div>
      }
    >
      <UsersContent />
    </Suspense>
  );
}
