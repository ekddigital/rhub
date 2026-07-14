import type { ReactNode } from "react";
import { C } from "../booklet/constants";
import {
  HOTEL_DIDI_TIP,
  HOTEL_MAP_TIP,
  NAV_GUIDE_META,
} from "./content-data";

/** Usable horizontal space inside NavA4Page (794px page − 40px side padding × 2). */
export const NAV_CONTENT_WIDTH = 714;

export type NavImageSpec = {
  src: string;
  alt: string;
  caption?: string;
};

export function PageContent({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  id,
  children,
  level = 2,
}: {
  id?: string;
  children: ReactNode;
  level?: 1 | 2 | 3;
}) {
  const Tag = (`h${level}` as "h1" | "h2" | "h3");
  const sizes = { 1: "20px", 2: "16px", 3: "13px" };
  return (
    <Tag
      id={id}
      style={{
        fontSize: sizes[level],
        fontWeight: 800,
        color: C.blue,
        margin: level === 1 ? "0 0 6px" : "10px 0 5px",
        lineHeight: 1.3,
      }}
    >
      {children}
    </Tag>
  );
}

export function SubHeading({ children }: { children: ReactNode }) {
  return (
    <h3
      style={{
        fontSize: "12px",
        fontWeight: 700,
        color: C.red,
        margin: "6px 0 4px",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </h3>
  );
}

export function BodyText({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontSize: "10.5px",
        color: C.text,
        lineHeight: 1.55,
        margin: "0 0 5px",
      }}
    >
      {children}
    </p>
  );
}

export function StepList({ steps }: { steps: string[] }) {
  return (
    <ol
      style={{
        margin: "0 0 6px",
        paddingLeft: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "3px",
      }}
    >
      {steps.map((step, i) => (
        <li
          key={i}
          style={{
            fontSize: "10px",
            color: C.text,
            lineHeight: 1.5,
          }}
        >
          {step}
        </li>
      ))}
    </ol>
  );
}

export function BulletList({ items }: { items: string[] }) {
  return (
    <ul
      style={{
        margin: "0 0 6px",
        paddingLeft: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
      }}
    >
      {items.map((item, i) => (
        <li
          key={i}
          style={{
            fontSize: "10px",
            color: C.text,
            lineHeight: 1.5,
          }}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function WarningCallout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        margin: "5px 0",
        padding: "7px 10px",
        borderRadius: "8px",
        border: `2px solid ${C.red}`,
        background: `${C.red}10`,
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontWeight: 800,
          color: C.red,
          lineHeight: 1.5,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function InfoCallout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        margin: "5px 0",
        padding: "6px 8px",
        borderRadius: "6px",
        border: `1px solid ${C.gold}60`,
        background: `${C.gold}12`,
        fontSize: "9.5px",
        color: C.text,
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  );
}

export function NavSingleImage({
  src,
  alt,
  caption,
  maxHeight = 360,
  minHeight,
}: NavImageSpec & {
  maxHeight?: number;
  minHeight?: number;
}) {
  return (
    <figure
      style={{
        width: "100%",
        maxWidth: "100%",
        margin: "4px 0 6px",
        textAlign: "center",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        style={{
          display: "block",
          width: "100%",
          maxWidth: "100%",
          height: "auto",
          minHeight: minHeight ? `${minHeight}px` : undefined,
          maxHeight: `${maxHeight}px`,
          objectFit: "contain",
          borderRadius: "6px",
          border: `1px solid ${C.border}`,
          margin: "0 auto",
        }}
      />
      {caption && (
        <figcaption
          style={{
            fontSize: "8.5px",
            color: C.muted,
            marginTop: "3px",
            fontStyle: "italic",
          }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/** Side-by-side route screenshots — each column ~45% of content width. */
export function NavTwoColImages({
  left,
  right,
  minHeight = 240,
  maxHeight = 320,
}: {
  left: NavImageSpec;
  right: NavImageSpec;
  minHeight?: number;
  maxHeight?: number;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "12px",
        width: "100%",
        maxWidth: "100%",
        margin: "4px 0 6px",
      }}
    >
      <NavSingleImage {...left} minHeight={minHeight} maxHeight={maxHeight} />
      <NavSingleImage {...right} minHeight={minHeight} maxHeight={maxHeight} />
    </div>
  );
}

/** Vertical stack of images (e.g. in a split-column aside). */
export function NavImageStack({
  images,
  minHeight = 200,
  maxHeight = 240,
}: {
  images: NavImageSpec[];
  minHeight?: number;
  maxHeight?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        width: "100%",
      }}
    >
      {images.map((img, i) => (
        <NavSingleImage
          key={i}
          {...img}
          minHeight={minHeight}
          maxHeight={maxHeight}
        />
      ))}
    </div>
  );
}

/** Text left + image(s) right — uses empty horizontal space on route pages. */
export function TextImageSplit({
  text,
  aside,
  ratio = "55fr 45fr",
}: {
  text: ReactNode;
  aside: ReactNode;
  ratio?: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: ratio,
        gap: "14px",
        width: "100%",
        maxWidth: "100%",
        alignItems: "start",
      }}
    >
      <div style={{ minWidth: 0 }}>{text}</div>
      <div style={{ minWidth: 0, width: "100%" }}>{aside}</div>
    </div>
  );
}

/** @deprecated Use NavSingleImage — kept for backward compatibility. */
export function NavImage({
  src,
  alt,
  caption,
  maxHeight = 360,
}: NavImageSpec & { maxHeight?: number; fillSpace?: boolean }) {
  return (
    <NavSingleImage
      src={src}
      alt={alt}
      caption={caption}
      maxHeight={maxHeight}
    />
  );
}

/** @deprecated Use NavTwoColImages */
export function TwoColImages({
  left,
  right,
}: {
  left: NavImageSpec;
  right: NavImageSpec;
}) {
  return <NavTwoColImages left={left} right={right} />;
}

export function HubTable() {
  const rows = [
    {
      station: "Jinan West Railway Station (济南西站)",
      badge: "Recommended",
      drive: "23–32 mins",
      toll: "¥10–20",
      note: "Closest to the hotel",
    },
    {
      station: "Jinan Railway Station (济南站, City Center)",
      badge: null,
      drive: "~36 mins",
      toll: "¥10",
      note: "Downtown hub",
    },
    {
      station: "Jinan East Railway Station (济南东站)",
      badge: "Farthest",
      drive: "38–50 mins",
      toll: "¥10–22",
      note: "Far east station",
    },
  ];

  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "9.5px",
        margin: "4px 0 6px",
      }}
    >
      <thead>
        <tr style={{ background: C.lightBlue }}>
          <th
            style={{
              textAlign: "left",
              padding: "4px 6px",
              border: `1px solid ${C.border}`,
              color: C.blue,
            }}
          >
            Station
          </th>
          <th
            style={{
              textAlign: "left",
              padding: "4px 6px",
              border: `1px solid ${C.border}`,
              color: C.blue,
            }}
          >
            Drive Time
          </th>
          <th
            style={{
              textAlign: "left",
              padding: "4px 6px",
              border: `1px solid ${C.border}`,
              color: C.blue,
            }}
          >
            Toll
          </th>
          <th
            style={{
              textAlign: "left",
              padding: "4px 6px",
              border: `1px solid ${C.border}`,
              color: C.blue,
            }}
          >
            Notes
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.station}>
            <td
              style={{
                padding: "4px 6px",
                border: `1px solid ${C.border}`,
                fontWeight: 600,
              }}
            >
              {row.station}
              {row.badge && (
                <span
                  style={{
                    display: "inline-block",
                    marginLeft: "6px",
                    fontSize: "8px",
                    fontWeight: 700,
                    color: row.badge === "Recommended" ? C.blue : C.muted,
                    background:
                      row.badge === "Recommended" ? `${C.blue}12` : `${C.muted}15`,
                    padding: "1px 5px",
                    borderRadius: "4px",
                  }}
                >
                  {row.badge}
                </span>
              )}
            </td>
            <td
              style={{
                padding: "4px 6px",
                border: `1px solid ${C.border}`,
              }}
            >
              {row.drive}
            </td>
            <td
              style={{
                padding: "4px 6px",
                border: `1px solid ${C.border}`,
              }}
            >
              {row.toll}
            </td>
            <td
              style={{
                padding: "4px 6px",
                border: `1px solid ${C.border}`,
                color: C.muted,
              }}
            >
              {row.note}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function HotelMapCallout({ compact = false }: { compact?: boolean }) {
  return (
    <InfoCallout>
      <strong>Conference Hotel:</strong> {NAV_GUIDE_META.venueZh}
      <br />
      <strong>English:</strong> {NAV_GUIDE_META.venueEn}
      <br />
      <strong>Address:</strong> {NAV_GUIDE_META.addressZh}
      {!compact && (
        <>
          <br />
          <br />
          <strong>DiDi (滴滴):</strong> {HOTEL_DIDI_TIP}
          <br />
          <strong>Map apps:</strong> {HOTEL_MAP_TIP}
        </>
      )}
    </InfoCallout>
  );
}

export function CheatSheetBox() {
  return (
    <div
      style={{
        border: `2px dashed ${C.blue}`,
        borderRadius: "8px",
        padding: "8px 10px",
        background: C.lightBlue,
        marginTop: "4px",
        width: "100%",
      }}
    >
      <SectionHeading level={3}>Attendee Quick Reference Cheat Sheet</SectionHeading>

      <SubHeading>Arrival Station Quick Pick</SubHeading>
      <BulletList
        items={[
          "Jinan West Railway Station (Best): 23–32 min taxi / ~75 min subway+bus",
          "Jinan Railway Station (Downtown): 36 min taxi / ~55 min direct K904 bus",
          "Jinan East Railway Station (Far): 38–50 min taxi / ~95 min subway+bus",
        ]}
      />

      <SubHeading>Non-Negotiable Bus Rule</SubHeading>
      <WarningCallout>
        K904 last departure: 7:20 PM. After 7:20 PM, only taxis are available to
        reach the hotel.
      </WarningCallout>

      <SubHeading>Hotel &amp; DiDi / Map Search</SubHeading>
      <InfoCallout>
        <strong>Chinese:</strong> {NAV_GUIDE_META.venueZh}
        <br />
        <strong>English:</strong> {NAV_GUIDE_META.venueEn}
        <br />
        <strong>Address:</strong> {NAV_GUIDE_META.addressZh}
        <br />
        <br />
        <strong>DiDi (滴滴):</strong> {HOTEL_DIDI_TIP}
        <br />
        <strong>Map apps:</strong> {HOTEL_MAP_TIP}
      </InfoCallout>

      <SubHeading>Total Public Transit Cost Breakdown</SubHeading>
      <BulletList
        items={[
          "Jinan West Station: ¥10 total",
          "Jinan Railway Station: ¥6 total",
          "Jinan East Station: ¥11 total",
        ]}
      />
    </div>
  );
}

export function ContactSupportBlock() {
  return (
    <div
      style={{
        marginTop: "4px",
        padding: "8px 10px",
        borderRadius: "8px",
        border: `1.5px solid ${C.blue}30`,
        background: `${C.blue}06`,
        width: "100%",
      }}
    >
      <SectionHeading level={3}>Conference Travel Support Contact</SectionHeading>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {[
          {
            name: "Robert D. Molley",
            role: "Chair on Logistics",
            phone: "18662966349",
            wechat: "wxid_32k7ikgo33ax22",
          },
          {
            name: "Harris M Bowulo",
            role: "Conference General Secretary",
            phone: "18514556295",
            wechat: "Bowulo2019",
          },
          {
            name: "Enoch Kwateh Dongbo",
            role: "Conference Chair",
            phone: "18506832159",
            wechat: "EKD231777285010",
          },
        ].map((c) => (
          <div
            key={c.name}
            style={{
              fontSize: "9.5px",
              lineHeight: 1.5,
              paddingBottom: "6px",
              borderBottom: `1px solid ${C.border}40`,
            }}
          >
            <strong style={{ color: C.blue }}>{c.name}</strong>
            <span style={{ color: C.muted }}> — {c.role}</span>
            <br />
            Phone: {c.phone} · WeChat: {c.wechat}
          </div>
        ))}
      </div>
      <p
        style={{
          fontSize: "9px",
          color: C.muted,
          marginTop: "8px",
          fontStyle: "italic",
        }}
      >
        Conference Dates: July 24–27, 2026
      </p>
    </div>
  );
}
