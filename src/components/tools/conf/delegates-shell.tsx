"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  UserCheck,
  MapPin,
  Mail,
  Phone,
  Search,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { fmtRmb } from "@/lib/conf/currency";

type Delegate = {
  id: string;
  name: string;
  email: string;
  city: string;
  university: string;
  phone: string;
  wechat: string;
  feeAmount: number;
  feePaid: boolean;
  status: "REGISTERED" | "CONFIRMED" | "ATTENDED" | "CANCELLED";
};

const STATUS_CONFIG = {
  REGISTERED: { label: "Registered", variant: "outline" as const, icon: Clock },
  CONFIRMED: {
    label: "Confirmed",
    variant: "default" as const,
    icon: CheckCircle2,
  },
  ATTENDED: {
    label: "Attended",
    variant: "secondary" as const,
    icon: UserCheck,
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "destructive" as const,
    icon: XCircle,
  },
};

export function DelegatesShell() {
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [university, setUniversity] = useState("");
  const [phone, setPhone] = useState("");
  const [wechat, setWechat] = useState("");
  const [feeAmount, setFeeAmount] = useState("");

  const handleAdd = () => {
    if (!name || !city) return;
    const delegate: Delegate = {
      id: `del_${Date.now()}`,
      name,
      email,
      city,
      university,
      phone,
      wechat,
      feeAmount: Number(feeAmount) || 0,
      feePaid: false,
      status: "REGISTERED",
    };
    setDelegates((prev) => [...prev, delegate]);
    setName("");
    setEmail("");
    setCity("");
    setUniversity("");
    setPhone("");
    setWechat("");
    setFeeAmount("");
    setShowForm(false);
  };

  const filtered = useMemo(() => {
    if (!search) return delegates;
    const q = search.toLowerCase();
    return delegates.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.city.toLowerCase().includes(q) ||
        d.university.toLowerCase().includes(q),
    );
  }, [delegates, search]);

  const totalFees = delegates.reduce((sum, d) => sum + d.feeAmount, 0);
  const paidFees = delegates
    .filter((d) => d.feePaid)
    .reduce((sum, d) => sum + d.feeAmount, 0);
  const cities = [...new Set(delegates.map((d) => d.city).filter(Boolean))];

  const handleExportCsv = () => {
    const header = "Name,Email,City,University,Phone,WeChat,Fee,Paid,Status";
    const rows = delegates.map((d) =>
      [
        `"${d.name}"`,
        d.email,
        d.city,
        `"${d.university}"`,
        d.phone,
        d.wechat,
        d.feeAmount,
        d.feePaid ? "Yes" : "No",
        d.status,
      ].join(","),
    );
    const csv = `${header}\n${rows.join("\n")}`;
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "delegates.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const togglePaid = (id: string) => {
    setDelegates((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              feePaid: !d.feePaid,
              status: d.feePaid ? "REGISTERED" : "CONFIRMED",
            }
          : d,
      ),
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/tools/conf">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Delegates</h1>
          <p className="text-sm text-muted-foreground">
            {delegates.length} registered · {cities.length} cities
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={delegates.length === 0}
          >
            <Download className="size-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="size-4" />
            Register
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <UserCheck className="size-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xl font-bold">{delegates.length}</p>
              <p className="text-xs text-muted-foreground">Total Registered</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-green-500/10 p-2">
              <CheckCircle2 className="size-5 text-green-500" />
            </div>
            <div>
              <p className="text-xl font-bold">{fmtRmb(paidFees)}</p>
              <p className="text-xs text-muted-foreground">Fees Collected</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-orange-500/10 p-2">
              <Clock className="size-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xl font-bold">
                {fmtRmb(totalFees - paidFees)}
              </p>
              <p className="text-xs text-muted-foreground">Outstanding</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      {delegates.length > 0 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, city, or university..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <Card className="border-[#C8A061]/40">
          <CardHeader>
            <CardTitle className="text-base">Register Delegate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>City *</Label>
                <Input
                  placeholder="e.g. Jinan"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>University</Label>
                <Input
                  placeholder="University name"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                <Label>WeChat</Label>
                <Input
                  placeholder="WeChat ID"
                  value={wechat}
                  onChange={(e) => setWechat(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Registration Fee (¥)</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleAdd} disabled={!name || !city}>
                <Plus className="size-4" />
                Register
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {delegates.length === 0 && !showForm && (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <UserCheck className="mb-4 size-12 text-muted-foreground/30" />
            <p className="text-lg font-medium">No delegates registered yet</p>
            <p className="text-sm text-muted-foreground">
              Click &quot;Register&quot; to start adding delegates
            </p>
          </CardContent>
        </Card>
      )}

      {/* Delegate List */}
      <div className="space-y-3">
        {filtered.map((delegate) => {
          const config = STATUS_CONFIG[delegate.status];
          const StatusIcon = config.icon;
          return (
            <Card key={delegate.id}>
              <CardContent className="flex items-center justify-between pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-bold uppercase">
                    {delegate.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{delegate.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="size-3" />
                      {delegate.city}
                      {delegate.university && (
                        <>
                          <span>·</span>
                          {delegate.university}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {delegate.feeAmount > 0 && (
                    <button
                      className={`rounded-md px-2 py-1 text-xs font-medium ${
                        delegate.feePaid
                          ? "bg-green-500/10 text-green-600"
                          : "bg-yellow-500/10 text-yellow-600"
                      }`}
                      onClick={() => togglePaid(delegate.id)}
                    >
                      {fmtRmb(delegate.feeAmount)}
                      {delegate.feePaid ? " Paid" : " Unpaid"}
                    </button>
                  )}
                  <Badge variant={config.variant}>
                    <StatusIcon className="mr-1 size-3" />
                    {config.label}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
