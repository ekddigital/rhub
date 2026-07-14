"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  FileText,
  Link2,
  Loader2,
  Pencil,
  RefreshCcw,
  Search,
  Unlink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type MappingStatus = "unmapped" | "pending" | "confirmed";

type RosterRow = {
  rosterKey: string;
  committeeFormalName: string;
  committeeShortName: string;
  leaderName: string;
  leaderRole: string;
  csvPhotoUrl: string | null;
  resolvedPhotoPath: string | null;
  mappingStatus: MappingStatus;
  includeAddressPage: boolean;
  addressText: string | null;
  memberId: string | null;
  link: {
    delegateId: string | null;
    userId: string | null;
    linkSource: string | null;
    confirmed: boolean;
    includeAddressPage?: boolean;
    addressText?: string | null;
  } | null;
  linkedDelegateName: string | null;
  linkedDelegateCity: string | null;
  isMapped: boolean;
  isPending: boolean;
};

type DelegateOption = {
  id: string;
  name: string;
  email: string | null;
  city: string;
};

type ListFilter = "all" | "mapped" | "unmapped" | "pending";

function isSuggestedRow(row: RosterRow): boolean {
  return (
    row.mappingStatus === "unmapped" && row.link?.linkSource === "AUTO_SUGGESTED"
  );
}

function isNationalPresidentRow(row: RosterRow): boolean {
  return row.leaderRole.toLowerCase().includes("national president");
}

export function LsuicLeaderMappingPanel({ confId }: { confId: string }) {
  const [rows, setRows] = useState<RosterRow[]>([]);
  const [delegates, setDelegates] = useState<DelegateOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [autoLinking, setAutoLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [listFilter, setListFilter] = useState<ListFilter>("all");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draftDelegateId, setDraftDelegateId] = useState<string | null>(null);
  const [addressEditKey, setAddressEditKey] = useState<string | null>(null);
  const [addressDraft, setAddressDraft] = useState({
    includeAddressPage: false,
    addressText: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rosterRes, delegateRes] = await Promise.all([
        fetch(`/api/conf/${confId}/lsuic-leaders`),
        fetch(`/api/conf/${confId}/delegates`),
      ]);
      if (!rosterRes.ok) throw new Error("Failed to load LSUIC roster");
      const rosterPayload = (await rosterRes.json()) as { rows: RosterRow[] };
      setRows(rosterPayload.rows ?? []);

      if (delegateRes.ok) {
        const delegatePayload = (await delegateRes.json()) as
          | DelegateOption[]
          | { delegates?: DelegateOption[] };
        setDelegates(
          Array.isArray(delegatePayload)
            ? delegatePayload
            : (delegatePayload.delegates ?? []),
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [confId]);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(
    () => ({
      total: rows.length,
      mapped: rows.filter((r) => r.mappingStatus === "confirmed").length,
      unmapped: rows.filter((r) => r.mappingStatus === "unmapped").length,
      pending: rows.filter((r) => r.mappingStatus === "pending").length,
      withAddress: rows.filter(
        (r) => r.includeAddressPage && (r.addressText ?? "").trim().length > 0,
      ).length,
    }),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return rows.filter((row) => {
      if (listFilter === "mapped" && row.mappingStatus !== "confirmed") {
        return false;
      }
      if (listFilter === "unmapped" && row.mappingStatus !== "unmapped") {
        return false;
      }
      if (listFilter === "pending" && row.mappingStatus !== "pending") {
        return false;
      }
      if (!q) return true;
      return (
        row.leaderName.toLowerCase().includes(q) ||
        row.committeeShortName.toLowerCase().includes(q) ||
        row.leaderRole.toLowerCase().includes(q) ||
        (row.linkedDelegateName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [rows, filter, listFilter]);

  const handleAutoLink = async () => {
    setAutoLinking(true);
    setError(null);
    try {
      const res = await fetch(`/api/conf/${confId}/lsuic-leaders`, {
        method: "POST",
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error ?? "Auto-link failed");
      }
      await load();
      setListFilter("pending");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Auto-link failed");
    } finally {
      setAutoLinking(false);
    }
  };

  const patchLink = async (
    rosterKey: string,
    body: {
      delegateId?: string | null;
      userId?: string | null;
      confirmed?: boolean;
      includeAddressPage?: boolean;
      addressText?: string | null;
    },
  ) => {
    setSavingKey(rosterKey);
    setError(null);
    try {
      const res = await fetch(
        `/api/conf/${confId}/lsuic-leaders/${encodeURIComponent(rosterKey)}/link`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error ?? "Link update failed");
      }
      await load();
      setEditingKey(null);
      setDraftDelegateId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Link update failed");
    } finally {
      setSavingKey(null);
    }
  };

  const saveAddress = async (row: RosterRow) => {
    const trimmed = addressDraft.addressText.trim();
    const includeAddressPage =
      addressDraft.includeAddressPage || trimmed.length > 0;

    await patchLink(row.rosterKey, {
      includeAddressPage: includeAddressPage && trimmed.length > 0,
      addressText: trimmed || null,
    });

    // Keep National President / chair bookletBio in sync for existing address section.
    if (row.memberId && trimmed) {
      try {
        await fetch(`/api/conf/${confId}/members/${row.memberId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookletBio: trimmed }),
        });
      } catch {
        // Mapping save already succeeded; bio sync is best-effort.
      }
    }

    setAddressEditKey(null);
  };

  const toggleIncludeAddress = async (row: RosterRow, checked: boolean) => {
    const trimmed = (row.addressText ?? "").trim();
    if (checked && !trimmed) {
      startAddressEdit(row);
      setAddressDraft({ includeAddressPage: true, addressText: "" });
      return;
    }
    await patchLink(row.rosterKey, { includeAddressPage: checked });
  };

  const handleLink = (rosterKey: string, delegateId: string | null) =>
    patchLink(rosterKey, { delegateId, userId: null });

  const handleConfirm = (rosterKey: string) =>
    patchLink(rosterKey, { confirmed: true });

  const handleConfirmSuggestion = (rosterKey: string, delegateId: string | null) =>
    patchLink(rosterKey, { delegateId, userId: null, confirmed: true });

  const startEditing = (row: RosterRow) => {
    setEditingKey(row.rosterKey);
    if (isSuggestedRow(row)) {
      setDraftDelegateId(row.link?.delegateId ?? null);
    }
  };

  const startAddressEdit = (row: RosterRow) => {
    setAddressEditKey(row.rosterKey);
    setAddressDraft({
      includeAddressPage: row.includeAddressPage,
      addressText: row.addressText ?? "",
    });
  };

  const cancelEditing = () => {
    setEditingKey(null);
    setDraftDelegateId(null);
  };

  const cancelAddressEdit = () => {
    setAddressEditKey(null);
    setAddressDraft({ includeAddressPage: false, addressText: "" });
  };

  const handleUnlink = (rosterKey: string) =>
    patchLink(rosterKey, { delegateId: null, userId: null });

  const filterChips: Array<{
    key: ListFilter;
    label: string;
    count: number;
  }> = [
    { key: "all", label: "All", count: counts.total },
    { key: "mapped", label: "Mapped", count: counts.mapped },
    { key: "unmapped", label: "Unmapped", count: counts.unmapped },
    { key: "pending", label: "Pending", count: counts.pending },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="border-[#C8A061]/30">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">LSUIC Leader Account Mapping</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Link delegate signups to roster leaders, then optionally include a
              booklet address page and write their message. Leaders with no
              address text are omitted from the printed booklet.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCcw className="size-4" />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => void handleAutoLink()}
              disabled={autoLinking}
            >
              {autoLinking ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Link2 className="size-4" />
              )}
              Auto-link by name
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {filterChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setListFilter(chip.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                listFilter === chip.key
                  ? "border-[#C8A061] bg-[#C8A061]/15 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted/60",
              )}
            >
              <span>
                {chip.key === "all"
                  ? `${chip.count} roster leaders`
                  : `${chip.count} ${chip.label.toLowerCase()}`}
              </span>
            </button>
          ))}
          <Badge variant="outline" className="text-[10px]">
            {counts.withAddress} address pages enabled
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="relative min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search leader, committee, role, delegate..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
          {filteredRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No roster rows match the current filter.
            </p>
          ) : (
            filteredRows.map((row) => {
              const isSaving = savingKey === row.rosterKey;
              const isEditing = editingKey === row.rosterKey;
              const isAddressEditing = addressEditKey === row.rosterKey;
              const isSuggested = isSuggestedRow(row);
              const needsConfirmation =
                row.mappingStatus === "pending" || isSuggested;
              const showSelector =
                (row.mappingStatus === "unmapped" && !isSuggested) ||
                isEditing;
              const selectorValue = isEditing && isSuggested
                ? (draftDelegateId ?? "")
                : (row.link?.delegateId ?? "");
              const hasAddress = (row.addressText ?? "").trim().length > 0;

              return (
                <div
                  key={row.rosterKey}
                  className="rounded-lg border px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-[180px] flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium leading-tight">{row.leaderName}</p>
                        {row.mappingStatus === "confirmed" && (
                          <Badge variant="secondary" className="text-[10px]">
                            Mapped
                          </Badge>
                        )}
                        {row.mappingStatus === "pending" && (
                          <Badge
                            variant="outline"
                            className="border-amber-500/50 text-[10px] text-amber-700"
                          >
                            Pending confirmation
                          </Badge>
                        )}
                        {row.link?.linkSource === "AUTO_SUGGESTED" && (
                          <Badge variant="outline" className="text-[10px]">
                            Suggested
                          </Badge>
                        )}
                        {row.includeAddressPage && hasAddress && (
                          <Badge className="bg-[#C8A061]/20 text-[10px] text-[#8E0E00]">
                            Booklet address
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {row.committeeShortName} · {row.leaderRole}
                        {isNationalPresidentRow(row)
                          ? " · uses National President Address section"
                          : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {row.resolvedPhotoPath ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.resolvedPhotoPath}
                          alt=""
                          className="size-10 rounded-md object-cover"
                        />
                      ) : (
                        <div className="size-10 rounded-md bg-muted" />
                      )}

                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={row.includeAddressPage}
                          disabled={isSaving}
                          onChange={(e) =>
                            void toggleIncludeAddress(row, e.target.checked)
                          }
                        />
                        Include in booklet
                      </label>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isSaving}
                        onClick={() => startAddressEdit(row)}
                      >
                        <FileText className="size-4" />
                        {hasAddress ? "Edit Address" : "Write Address"}
                      </Button>

                      {row.mappingStatus === "confirmed" && !isEditing && (
                        <div className="min-w-[160px]">
                          <p className="text-sm font-medium leading-tight">
                            {row.linkedDelegateName ?? "Linked delegate"}
                          </p>
                          {row.linkedDelegateCity && (
                            <p className="text-xs text-muted-foreground">
                              {row.linkedDelegateCity}
                            </p>
                          )}
                        </div>
                      )}

                      {needsConfirmation && !isEditing && (
                        <div className="min-w-[160px]">
                          <p className="text-sm font-medium leading-tight">
                            {row.linkedDelegateName ??
                              (isSuggested
                                ? "Suggested delegate"
                                : "Auto-matched delegate")}
                          </p>
                          {row.linkedDelegateCity && (
                            <p className="text-xs text-muted-foreground">
                              {row.linkedDelegateCity}
                            </p>
                          )}
                        </div>
                      )}

                      {showSelector && (
                        <select
                          className="h-9 min-w-[200px] rounded-md border border-input bg-transparent px-2 text-sm"
                          value={selectorValue}
                          disabled={isSaving}
                          onChange={(e) => {
                            const value = e.target.value || null;
                            if (isEditing && isSuggested) {
                              setDraftDelegateId(value);
                              return;
                            }
                            void handleLink(row.rosterKey, value);
                          }}
                        >
                          <option value="">— Select delegate signup —</option>
                          {delegates.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                              {d.city ? ` · ${d.city}` : ""}
                            </option>
                          ))}
                        </select>
                      )}

                      {needsConfirmation && !isEditing && (
                        <Button
                          size="sm"
                          disabled={isSaving}
                          onClick={() =>
                            void (isSuggested
                              ? handleConfirmSuggestion(
                                  row.rosterKey,
                                  row.link?.delegateId ?? null,
                                )
                              : handleConfirm(row.rosterKey))
                          }
                        >
                          {isSaving ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Check className="size-4" />
                          )}
                          Confirm
                        </Button>
                      )}

                      {isEditing && isSuggested && (
                        <Button
                          size="sm"
                          disabled={isSaving || !draftDelegateId}
                          onClick={() =>
                            void handleConfirmSuggestion(
                              row.rosterKey,
                              draftDelegateId,
                            )
                          }
                        >
                          {isSaving ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Check className="size-4" />
                          )}
                          Confirm
                        </Button>
                      )}

                      {row.mappingStatus === "confirmed" && !isEditing && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isSaving}
                          onClick={() => startEditing(row)}
                        >
                          <Pencil className="size-4" />
                          Change
                        </Button>
                      )}

                      {needsConfirmation && !isEditing && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isSaving}
                          onClick={() => startEditing(row)}
                        >
                          <Pencil className="size-4" />
                          Change
                        </Button>
                      )}

                      {(row.mappingStatus === "confirmed" ||
                        row.mappingStatus === "pending") &&
                        !isEditing && (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            title="Unlink"
                            disabled={isSaving}
                            onClick={() => void handleUnlink(row.rosterKey)}
                          >
                            <Unlink className="size-4" />
                          </Button>
                        )}

                      {isEditing && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isSaving}
                          onClick={cancelEditing}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>

                  {isAddressEditing && (
                    <div className="mt-3 space-y-3 rounded-lg border border-[#C8A061]/30 bg-[#C8A061]/5 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-ekd-deep-navy">
                          Booklet Address — {row.leaderName}
                        </p>
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={addressDraft.includeAddressPage}
                            onChange={(e) =>
                              setAddressDraft((prev) => ({
                                ...prev,
                                includeAddressPage: e.target.checked,
                              }))
                            }
                          />
                          Include in booklet
                        </label>
                      </div>
                      <Textarea
                        rows={8}
                        placeholder="Dear delegates, dignitaries, and honored guests..."
                        value={addressDraft.addressText}
                        onChange={(e) =>
                          setAddressDraft((prev) => ({
                            ...prev,
                            addressText: e.target.value,
                          }))
                        }
                        className="resize-y font-serif text-sm"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isSaving}
                          onClick={cancelAddressEdit}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="bg-[#C8A061] text-white hover:bg-[#B8903A]"
                          disabled={isSaving}
                          onClick={() => void saveAddress(row)}
                        >
                          {isSaving ? "Saving…" : "Save Address"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
