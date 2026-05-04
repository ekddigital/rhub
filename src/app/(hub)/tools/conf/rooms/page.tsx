import { redirect } from "next/navigation";

export default function RoomsPage() {
  // Room Pairing is now integrated into the Delegates page
  redirect("/tools/conf/delegates");
}
