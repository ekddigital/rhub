import { C } from "./constants";
import type { NecMember } from "./types";

type ContactTone = "light" | "dark" | "hero";

function toneColors(tone: ContactTone) {
  if (tone === "dark") {
    return {
      muted: `${C.white}80`,
      phone: `${C.white}95`,
      university: `${C.white}7A`,
    };
  }
  if (tone === "hero") {
    return {
      muted: `${C.white}80`,
      phone: `${C.white}95`,
      university: `${C.white}7A`,
    };
  }
  return {
    muted: C.muted,
    phone: C.blue,
    university: C.muted,
  };
}

export function ProfileContactDetails({
  member,
  tone = "light",
  fontSize = "9px",
  showIcons = false,
}: {
  member: Pick<
    NecMember,
    "city" | "province" | "phone" | "university" | "delegateCode"
  >;
  tone?: ContactTone;
  fontSize?: string;
  showIcons?: boolean;
}) {
  const colors = toneColors(tone);
  const location =
    (member.city ?? "Member") +
    (member.province ? `, ${member.province}` : "");
  const university = member.university?.trim() || "Member";
  const phone = member.phone ?? "Phone pending";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        width: "100%",
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize,
          color: colors.muted,
          lineHeight: 1.35,
          overflowWrap: "break-word",
          wordBreak: "normal",
        }}
      >
        {showIcons ? `📍 ${location}` : location}
      </div>
      <div
        style={{
          fontSize,
          color: colors.phone,
          lineHeight: 1.35,
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {showIcons ? `Phone: ${phone}` : phone}
      </div>
      <div
        style={{
          fontSize,
          color: colors.university,
          lineHeight: 1.35,
          overflowWrap: "break-word",
          wordBreak: "normal",
        }}
      >
        {showIcons ? `🎓 ${university}` : university}
      </div>
    </div>
  );
}

export function ProfileDelegateCodeBadge({
  delegateCode,
  tone = "light",
  fontSize = "8px",
}: {
  delegateCode: string | null | undefined;
  tone?: "light" | "dark" | "hero";
  fontSize?: string;
}) {
  const isHero = tone === "hero";
  const isDark = tone === "dark" || isHero;

  return (
    <div
      style={{
        marginTop: "4px",
        fontSize,
        fontFamily: "monospace",
        color: delegateCode
          ? isHero
            ? C.gold
            : isDark
              ? C.red
              : C.red
          : isHero
            ? `${C.white}80`
            : C.muted,
        background: delegateCode
          ? isHero
            ? `${C.gold}20`
            : `${C.red}15`
          : isHero
            ? `${C.white}15`
            : `${C.border}60`,
        padding: isHero ? "3px 8px" : "1px 6px",
        borderRadius: isHero ? "5px" : "4px",
        display: "inline-block",
        width: "fit-content",
        fontWeight: 600,
      }}
    >
      {delegateCode ?? "ID pending"}
    </div>
  );
}
