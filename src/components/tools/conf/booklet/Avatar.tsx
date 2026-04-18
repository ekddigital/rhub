import { C } from "./constants";

export function Avatar({
  src,
  name,
  size = 48,
  square = false,
  borderColor = C.blue,
}: {
  src: string | null | undefined;
  name: string;
  size?: number;
  square?: boolean;
  borderColor?: string;
}) {
  const radius = square ? "6px" : "50%";
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          objectFit: "cover",
          flexShrink: 0,
          border: `2px solid ${borderColor}30`,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `linear-gradient(135deg, ${C.blue} 0%, ${C.darkBlue} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: Math.max(10, size * 0.32),
        fontWeight: 700,
        color: C.white,
        border: `2px solid ${borderColor}30`,
        letterSpacing: "0.04em",
      }}
    >
      {initials}
    </div>
  );
}
