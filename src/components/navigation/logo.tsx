import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 text-base font-semibold tracking-tight text-foreground"
      aria-label="EKD Digital Resource Hub"
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-[#1F1C18] text-[#D4AF6A] shadow-lg shadow-[#1F1C18]/40">
        EKD
      </span>
      <div className="flex flex-col leading-tight">
        <span>Resource Hub</span>
        <span className="text-xs font-normal text-foreground/70">
          EKD Digital
        </span>
      </div>
    </Link>
  );
}
