"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  MapPin,
  Phone,
  Mail,
  Users,
  Crown,
  Shield,
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

type Member = {
  id: string;
  name: string;
  role: string;
  title: string;
  city: string;
  phone: string;
  email: string;
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

// Initial committee from the appointment letter
const INITIAL_MEMBERS: Member[] = [
  {
    id: "1",
    name: "Enoch Kwateh Dongbo",
    role: "CHAIR",
    title: "Conference Chair",
    city: "Jinan",
    phone: "",
    email: "",
  },
  {
    id: "2",
    name: "Alfreda Ruth Togbah",
    role: "VICE_CHAIR",
    title: "Co-Chair",
    city: "Suzhou",
    phone: "",
    email: "",
  },
  {
    id: "3",
    name: "Harris M Bowulo",
    role: "SECRETARY",
    title: "Secretary",
    city: "Beijing",
    phone: "",
    email: "",
  },
  {
    id: "4",
    name: "Abdul Corneh",
    role: "COMMITTEE",
    title: "PRO/Media",
    city: "Zhengzhou",
    phone: "",
    email: "",
  },
  {
    id: "5",
    name: "Kukor Brooks",
    role: "COMMITTEE",
    title: "Cooking Chair",
    city: "Jinan",
    phone: "",
    email: "",
  },
  {
    id: "6",
    name: "Jefferson T Banquando",
    role: "COMMITTEE",
    title: "Sports Chair",
    city: "Suzhou",
    phone: "",
    email: "",
  },
  {
    id: "7",
    name: "Lisa Y SET",
    role: "COMMITTEE",
    title: "Cooking",
    city: "Qingdao",
    phone: "",
    email: "",
  },
  {
    id: "8",
    name: "Blessing Hawa Washington",
    role: "COMMITTEE",
    title: "Cooking",
    city: "Nantong",
    phone: "",
    email: "",
  },
  {
    id: "9",
    name: "Robert D Molley",
    role: "COMMITTEE",
    title: "Logistics Chair",
    city: "Qufu",
    phone: "",
    email: "",
  },
  {
    id: "10",
    name: "Priscilla Bamu Dweh",
    role: "COMMITTEE",
    title: "Cooking",
    city: "Suzhou",
    phone: "",
    email: "",
  },
  {
    id: "11",
    name: "Williamena Yah SENET",
    role: "COMMITTEE",
    title: "Cooking",
    city: "Suzhou",
    phone: "",
    email: "",
  },
];

export function CommitteeShell() {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("COMMITTEE");
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const handleAdd = () => {
    if (!name) return;
    const member: Member = {
      id: `local_${Date.now()}`,
      name,
      role,
      title,
      city,
      phone,
      email,
    };
    setMembers((prev) => [...prev, member]);
    setName("");
    setRole("COMMITTEE");
    setTitle("");
    setCity("");
    setPhone("");
    setEmail("");
    setShowForm(false);
  };

  // Group by city
  const cities = [
    ...new Set(members.map((m) => m.city).filter(Boolean)),
  ].sort();

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
          <h1 className="text-2xl font-bold tracking-tight">Committee</h1>
          <p className="text-sm text-muted-foreground">
            {members.length} members across {cities.length} cities
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="size-4" />
          Add Member
        </Button>
      </div>

      {/* Add Form */}
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
                  placeholder="e.g. Cooking Chair"
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
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleAdd} disabled={!name}>
                <Plus className="size-4" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Member Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => {
          const config = ROLE_CONFIG[member.role] || ROLE_CONFIG.COMMITTEE;
          const RoleIcon = config.icon;
          return (
            <Card key={member.id} className="group">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold">{member.name}</p>
                    <div className="flex items-center gap-1.5">
                      <RoleIcon className={`size-3.5 ${config.color}`} />
                      <span className="text-xs text-muted-foreground">
                        {member.title || config.label}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {config.label}
                  </Badge>
                </div>
                {member.city && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3" />
                    {member.city}
                  </div>
                )}
                {member.phone && (
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="size-3" />
                    {member.phone}
                  </div>
                )}
                {member.email && (
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="size-3" />
                    {member.email}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* City Summary */}
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
