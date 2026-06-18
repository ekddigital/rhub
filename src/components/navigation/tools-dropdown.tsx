"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { getToolsByGroup } from "@/lib/tools-config";
import { downloadHubNav, getAllPlatforms } from "@/lib/download-hub/client";
import { getFeaturedConversions } from "@/lib/img/conversions-config";
import { getFeaturedDocumentTools } from "@/lib/doc/tools-config";
import { kitSurfaces } from "@/lib/kit/tools-config";

export function ToolsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setHoveredGroup(null);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Group tools by category
  const imgTools = getToolsByGroup("img");
  const downloadTools = getToolsByGroup("download");
  const downloadPlatforms = getAllPlatforms();
  const refTools = getToolsByGroup("ref");
  const urlTools = getToolsByGroup("url");
  const docTools = getToolsByGroup("doc");
  const confTools = getToolsByGroup("conf");
  const kitTools = getToolsByGroup("kit");

  // Get featured image conversions
  const featuredImgConversions = getFeaturedConversions().slice(0, 5);
  // Get featured document conversions
  const featuredDocTools = getFeaturedDocumentTools();
  const confNavItems = [
    {
      href: "/tools/conf",
      title: "Dashboard",
      description: "Overview of conference planning progress",
    },
    {
      href: "/tools/conf/budget",
      title: "Budget Manager",
      description: "Track budget lines and export reports",
    },
    {
      href: "/tools/conf/payments",
      title: "Payment Tracker",
      description: "Record and verify conference payments",
    },
    {
      href: "/tools/conf/logistics/name-list",
      title: "Logistics Name List",
      description: "Printable roster with passport, visa, and entry stamp documents",
    },
    {
      href: "/tools/conf/finance",
      title: "Conference finance",
      description:
        "Financial Secretary queue and Treasurer register with role-based access",
    },
    {
      href: "/tools/conf/committee",
      title: "Committee",
      description: "Manage committee members and roles",
    },
    {
      href: "/tools/conf/delegates",
      title: "Delegates",
      description: "Registration, grouping, and fee tracking",
    },
    {
      href: "/tools/conf/booklet",
      title: "Booklet Builder",
      description:
        "Printable participant cards with IDs, photos, and room details",
    },
    {
      href: "/tools/conf/meetings",
      title: "Meetings",
      description: "Agenda planning and minutes tracking",
    },
    {
      href: "/tools/conf/timeline",
      title: "Timeline",
      description: "Milestones, deadlines, and progress tracking",
    },
    {
      href: "/tools/conf/finance/audit",
      title: "Finance Audit Log",
      description: "Full history of all financial actions and approvals",
    },
    {
      href: "/tools/conf/finance/reports",
      title: "Report Builder",
      description: "Build and export custom financial reports",
    },
  ];

  return (
    <div
      className="relative"
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
        Tools
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-150 rounded-lg border-2 border-border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95">
          <div className="grid grid-cols-2 gap-2 p-2">
            {/* Left Column - Main Tools */}
            <div className="space-y-1">
              <Link
                href="/#resources"
                className="block rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground border-2 border-transparent hover:border-gold/20"
              >
                All Tools
              </Link>
              <div className="my-1 h-px bg-border" />

              {/* Image Converters Group */}
              {imgTools.length > 0 && (
                <div
                  className="relative"
                  onMouseEnter={() => setHoveredGroup("img")}
                >
                  <Link
                    href="/tools/img"
                    className="flex items-center justify-between rounded-md px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground border-2 border-transparent hover:border-gold/20"
                  >
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        Image Converters
                      </div>
                      <div className="text-xs text-muted-foreground">
                        25+ format conversions
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              )}

              {/* Document Converters Group */}
              {docTools.length > 0 && (
                <div
                  className="relative"
                  onMouseEnter={() => setHoveredGroup("doc")}
                >
                  <Link
                    href="/tools/doc"
                    className="flex items-center justify-between rounded-md px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground border-2 border-transparent hover:border-gold/20"
                  >
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        Document Converters
                      </div>
                      <div className="text-xs text-muted-foreground">
                        PDF, Word, ODT & more
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              )}

              {/* Download Hub */}
              {downloadTools.length > 0 && (
                <div
                  className="relative"
                  onMouseEnter={() => setHoveredGroup("download")}
                >
                  <Link
                    href={downloadHubNav.href}
                    className="flex items-center justify-between rounded-md px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground border-2 border-transparent hover:border-gold/20"
                  >
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {downloadHubNav.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {downloadHubNav.description}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              )}

              {/* Other Tools */}
              {refTools.map((tool) => (
                <Link
                  key={tool.slug}
                  href={tool.path}
                  className="block rounded-md px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground border-2 border-transparent hover:border-gold/20"
                >
                  <div className="text-sm font-medium text-foreground">
                    {tool.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {tool.tagline}
                  </div>
                </Link>
              ))}

              {urlTools.map((tool) => (
                <Link
                  key={tool.slug}
                  href={tool.path}
                  className="block rounded-md px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground border-2 border-transparent hover:border-gold/20"
                >
                  <div className="text-sm font-medium text-foreground">
                    {tool.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {tool.tagline}
                  </div>
                </Link>
              ))}

              {/* Conference Hub */}
              {confTools.length > 0 && (
                <div
                  className="relative"
                  onMouseEnter={() => setHoveredGroup("conf")}
                >
                  <Link
                    href="/tools/conf"
                    className="flex items-center justify-between rounded-md px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground border-2 border-transparent hover:border-gold/20"
                  >
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        Conference Hub
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Planning, tracking &amp; documentation
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              )}

              {/* Creative Kit */}
              {kitTools.length > 0 && (
                <div
                  className="relative"
                  onMouseEnter={() => setHoveredGroup("kit")}
                >
                  <Link
                    href="/tools/kit"
                    className="flex items-center justify-between rounded-md px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground border-2 border-transparent hover:border-gold/20"
                  >
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        Creative Kit
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Org brands, flyers, docs &amp; certificates
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              )}

              {/* Debate Hub */}
              <div
                className="relative"
                onMouseEnter={() => setHoveredGroup("dbt")}
              >
                <Link
                  href="/tools/dbt"
                  className="flex items-center justify-between rounded-md px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground border-2 border-transparent hover:border-gold/20"
                >
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      Debate Hub
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Scoring, judging &amp; management
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Right Column - Sub-menus */}
            <div className="border-l border-border pl-2">
              {hoveredGroup === "img" && (
                <div className="space-y-1 animate-in fade-in-0 slide-in-from-left-2">
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                    Featured Conversions
                  </div>
                  {featuredImgConversions.map((conv) => (
                    <Link
                      key={conv.slug}
                      href={`/tools/img/${conv.slug}`}
                      className="block rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground border-2 border-transparent hover:border-gold/20"
                    >
                      <div className="font-medium text-foreground">
                        {conv.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {conv.description}
                      </div>
                    </Link>
                  ))}
                  <Link
                    href="/tools/img"
                    className="block rounded-md px-3 py-2 text-sm font-medium text-gold hover:bg-accent border-2 border-transparent hover:border-gold/20"
                  >
                    View all 25+ conversions →
                  </Link>
                </div>
              )}

              {hoveredGroup === "download" && (
                <div className="space-y-1 animate-in fade-in-0 slide-in-from-left-2">
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                    Platforms
                  </div>
                  {downloadPlatforms.map((platform) => (
                    <Link
                      key={platform.id}
                      href={platform.href}
                      className="block rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground border-2 border-transparent hover:border-gold/20"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground">
                          {platform.icon} {platform.displayName}
                        </span>
                        <span
                          className={`text-[10px] uppercase tracking-wide ${
                            platform.status === "live"
                              ? "text-green-600 dark:text-green-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          {platform.status === "live" ? "Live" : "Soon"}
                        </span>
                      </div>
                    </Link>
                  ))}
                  <Link
                    href={downloadHubNav.href}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-gold hover:bg-accent border-2 border-transparent hover:border-gold/20"
                  >
                    Open Download Hub →
                  </Link>
                </div>
              )}

              {hoveredGroup === "doc" && (
                <div className="space-y-1 animate-in fade-in-0 slide-in-from-left-2">
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                    Document Conversions
                  </div>
                  {featuredDocTools.map((tool) => (
                    <Link
                      key={tool.slug}
                      href={`/tools/doc/${tool.slug}`}
                      className="block rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground border-2 border-transparent hover:border-gold/20"
                    >
                      <div className="font-medium text-foreground">
                        {tool.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {tool.inputFormat
                          .map((f) => f.toUpperCase())
                          .join(", ")}{" "}
                        →{" "}
                        {tool.outputFormat
                          .map((f) => f.toUpperCase())
                          .join(", ")}
                      </div>
                    </Link>
                  ))}
                  <Link
                    href="/tools/doc"
                    className="block rounded-md px-3 py-2 text-sm font-medium text-gold hover:bg-accent border-2 border-transparent hover:border-gold/20"
                  >
                    View all document tools →
                  </Link>
                </div>
              )}

              {hoveredGroup === "conf" && (
                <div className="space-y-1 animate-in fade-in-0 slide-in-from-left-2">
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                    Conference Hub
                  </div>
                  {confNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground border-2 border-transparent hover:border-gold/20"
                    >
                      <div className="font-medium text-foreground">
                        {item.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    </Link>
                  ))}
                  <Link
                    href="/tools/conf/docs"
                    className="block rounded-md px-3 py-2 text-sm font-medium text-gold hover:bg-accent border-2 border-transparent hover:border-gold/20"
                  >
                    Open conference documentation →
                  </Link>
                </div>
              )}

              {hoveredGroup === "kit" && (
                <div className="space-y-1 animate-in fade-in-0 slide-in-from-left-2">
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                    Creative Kit
                  </div>
                  <Link
                    href="/tools/kit"
                    className="block rounded-md px-3 py-2 text-sm font-medium text-gold transition-colors hover:bg-accent hover:text-accent-foreground border-2 border-transparent hover:border-gold/20"
                  >
                    Design workspace →
                  </Link>
                  {kitSurfaces.map((s) => (
                    <Link
                      key={s.slug}
                      href={s.navHref ?? s.href}
                      className="block rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground border-2 border-transparent hover:border-gold/20"
                    >
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {s.slug}
                      </div>
                      <div className="font-medium text-foreground">
                        {s.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {s.description}
                      </div>
                    </Link>
                  ))}
                  <Link
                    href="/tools/kit"
                    className="block rounded-md px-3 py-2 text-sm font-medium text-gold hover:bg-accent border-2 border-transparent hover:border-gold/20"
                  >
                    Open Creative Kit hub →
                  </Link>
                </div>
              )}

              {hoveredGroup === "dbt" && (
                <div className="space-y-1 animate-in fade-in-0 slide-in-from-left-2">
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                    Debate Hub
                  </div>
                  <Link
                    href="/tools/dbt"
                    className="block rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground border-2 border-transparent hover:border-gold/20"
                  >
                    <div className="font-medium text-foreground">
                      All Events
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Browse debate events
                    </div>
                  </Link>
                  <Link
                    href="/tools/dbt/judge"
                    className="block rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground border-2 border-transparent hover:border-gold/20"
                  >
                    <div className="font-medium text-foreground">
                      Judge Dashboard
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Score & manage rounds
                    </div>
                  </Link>
                  <Link
                    href="/login?redirect=/tools/dbt"
                    className="block rounded-md px-3 py-2 text-sm font-medium text-gold hover:bg-accent border-2 border-transparent hover:border-gold/20"
                  >
                    Sign in as Judge →
                  </Link>
                </div>
              )}

              {!hoveredGroup && (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  Hover over groups to see more
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
