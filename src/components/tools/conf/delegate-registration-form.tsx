"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type DelegateRegistrationPayload = {
  name: string;
  passportNo: string;
  university: string;
  city: string;
  phone: string;
  wechat: string;
  email: string;
  gender: "MALE" | "FEMALE";
  feePaid: boolean;
  feeAmount: number | null;
  roomPref: "PAIR" | "SINGLE";
  partnerClaimNote: string;
  passportPhoto: File | null;
  bookletPhoto: File | null;
};

type Props = {
  submitting: boolean;
  submitLabel?: string;
  onCancel?: () => void;
  onSubmit: (payload: DelegateRegistrationPayload) => Promise<void>;
};

export function DelegateRegistrationForm({
  submitting,
  submitLabel = "Submit Registration",
  onCancel,
  onSubmit,
}: Props) {
  const [name, setName] = useState("");
  const [passportNo, setPassportNo] = useState("");
  const [university, setUniversity] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [wechat, setWechat] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE");
  const [feePaid, setFeePaid] = useState(false);
  const [feeAmount, setFeeAmount] = useState("");
  const [roomPref, setRoomPref] = useState<"PAIR" | "SINGLE">("PAIR");
  const [partnerClaimNote, setPartnerClaimNote] = useState("");
  const [passportPhoto, setPassportPhoto] = useState<File | null>(null);
  const [bookletPhoto, setBookletPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setPassportNo("");
    setUniversity("");
    setCity("");
    setPhone("");
    setWechat("");
    setEmail("");
    setGender("MALE");
    setFeePaid(false);
    setFeeAmount("");
    setRoomPref("PAIR");
    setPartnerClaimNote("");
    setPassportPhoto(null);
    setBookletPhoto(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (
      !name ||
      !passportNo ||
      !university ||
      !city ||
      !phone ||
      !wechat ||
      !email ||
      !passportPhoto ||
      !bookletPhoto
    ) {
      setError("Please complete all required fields and uploads.");
      return;
    }

    setError(null);

    await onSubmit({
      name,
      passportNo,
      university,
      city,
      phone,
      wechat,
      email,
      gender,
      feePaid,
      feeAmount: feeAmount ? Number(feeAmount) : null,
      roomPref,
      partnerClaimNote,
      passportPhoto,
      bookletPhoto,
    });

    resetForm();
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>1. Full Name (as in passport) *</Label>
          <Input
            placeholder="Enter full legal name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>2. Passport Number *</Label>
          <Input
            placeholder="Passport number"
            value={passportNo}
            onChange={(e) => setPassportNo(e.target.value.toUpperCase())}
          />
        </div>

        <div className="space-y-2">
          <Label>3. University *</Label>
          <Input
            placeholder="Current university"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>4. City *</Label>
          <Input
            placeholder="Current city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>5. Phone Number *</Label>
          <Input
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>6. WeChat ID *</Label>
          <Input
            placeholder="WeChat ID"
            value={wechat}
            onChange={(e) => setWechat(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>7. Email *</Label>
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Gender *</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
            value={gender}
            onChange={(e) => setGender(e.target.value as "MALE" | "FEMALE")}
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>8. Completed Conference Payment? *</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
            value={feePaid ? "YES" : "NO"}
            onChange={(e) => setFeePaid(e.target.value === "YES")}
          >
            <option value="NO">No</option>
            <option value="YES">Yes</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>Conference Fee Amount (optional)</Label>
          <Input
            type="number"
            min={0}
            placeholder="Amount in RMB"
            value={feeAmount}
            onChange={(e) => setFeeAmount(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Room Preference</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
            value={roomPref}
            onChange={(e) => setRoomPref(e.target.value as "PAIR" | "SINGLE")}
          >
            <option value="PAIR">Pair room (2 people)</option>
            <option value="SINGLE">Single room request</option>
          </select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>
            Pairing / Partner Note (for legal partner or special room requests)
          </Label>
          <Textarea
            placeholder="Optional note: preferred pairing partner, legal partner request details, or single-room request reason"
            value={partnerClaimNote}
            onChange={(e) => setPartnerClaimNote(e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>9. Upload Passport Photo Page *</Label>
          <Input
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            onChange={(e) => setPassportPhoto(e.target.files?.[0] || null)}
          />
          {passportPhoto && (
            <p className="text-xs text-muted-foreground">{passportPhoto.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>10. Upload Photo for Conference Booklet *</Label>
          <Input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setBookletPhoto(e.target.files?.[0] || null)}
          />
          {bookletPhoto && (
            <p className="text-xs text-muted-foreground">{bookletPhoto.name}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button size="sm" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Submitting..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}
