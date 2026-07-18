import { DetailedProgramShell } from "@/components/tools/conf/detailed-program-shell";
import { requireConferencePageAccess } from "@/lib/conf/access";

export default async function DetailedProgramPage() {
  await requireConferencePageAccess(
    "/tools/conf/detailed-program",
    "participant",
  );
  return <DetailedProgramShell />;
}
