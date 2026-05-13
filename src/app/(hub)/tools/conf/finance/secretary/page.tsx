import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** @deprecated Use `/tools/conf/finance/fs`. */
export default function FinanceSecretaryRedirectPage() {
  redirect("/tools/conf/finance/fs");
}
