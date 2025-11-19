import Link from "next/link";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Tools", href: "#resources" },
  { label: "Docs", href: "/docs" },
  { label: "API", href: "/api" },
  { label: "Support", href: "/support" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden gap-6 text-sm font-medium text-foreground/70 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button asChild variant="outline" size="sm">
            <Link href="/signin">Access Console</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
