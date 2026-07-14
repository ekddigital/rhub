import { resolveLeadersForBookletSection } from "@/lib/conf/resolve-booklet-leader";
import { leaderProfileToSpeaker } from "@/lib/conf/resolve-booklet-section-content";
import { AddressSection } from "./AddressSection";
import type { BookletSection, LeaderProfile } from "./types";

export function LeaderSection({
  section,
  leaders,
  conferenceId,
  confName,
  confYear,
  startPageNum,
  totalPages,
}: {
  section: BookletSection;
  leaders: LeaderProfile[];
  conferenceId: string;
  confName: string;
  confYear: number;
  startPageNum: number;
  totalPages: number;
}) {
  const rosterLeaders = resolveLeadersForBookletSection(
    section.title,
    leaders,
    conferenceId,
  );
  const leader = rosterLeaders[0];

  if (!leader) return null;

  const addressContent = (leader.bio ?? "").trim();
  if (!addressContent) return null;

  return (
    <AddressSection
      section={section}
      speaker={leaderProfileToSpeaker(leader)}
      content={addressContent}
      confName={confName}
      confYear={confYear}
      pageNum={startPageNum}
      totalPages={totalPages}
    />
  );
}
