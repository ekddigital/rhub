import { requireConferencePageAccess } from "@/lib/conf/access";
import { redirect } from "next/navigation";

export default async function FlyerStudioPage() {
  await requireConferencePageAccess("/tools/conf/flyers", "manager");
  redirect("/tools/kit?surface=fly");
}
