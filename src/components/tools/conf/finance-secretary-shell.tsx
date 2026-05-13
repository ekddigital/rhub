"use client";

import { ConferenceFinanceDelegatesBoard } from "@/components/tools/conf/conference-finance-delegates-board";

/** @deprecated Prefer `ConferenceFinanceDelegatesBoard` with `variant="fs"`. */
export function FinanceSecretaryShell() {
  return <ConferenceFinanceDelegatesBoard variant="fs" />;
}
