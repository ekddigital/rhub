import { JICF_WEDDING_COLORS as C } from "@/lib/jicf/wedding-certificate-data";

type JicfCrossSealProps = {
  size?: number;
  className?: string;
};

/** Circular JICF seal: navy disc, gold ring, Latin cross — matches service-cert palette. */
export function JicfCrossSeal({ size = 72, className = "" }: JicfCrossSealProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      role="img"
      aria-label="JICF cross seal"
      className={className}
    >
      <circle cx="40" cy="40" r="38" fill={C.navy} />
      <circle
        cx="40"
        cy="40"
        r="34"
        fill="none"
        stroke={C.gold}
        strokeWidth="2.4"
      />
      <circle
        cx="40"
        cy="40"
        r="30"
        fill="none"
        stroke={C.yellow}
        strokeWidth="0.7"
        opacity="0.85"
      />
      <rect x="36.4" y="18" width="7.2" height="44" rx="1.4" fill={C.gold} />
      <rect x="22" y="32.4" width="36" height="7.2" rx="1.4" fill={C.gold} />
    </svg>
  );
}
