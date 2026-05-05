import { HubLayoutShell } from "@/components/navigation/hub-layout-shell";
import { UserProvider } from "@/contexts/user-context";
import { ReactNode } from "react";

export default function HubLayout({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <HubLayoutShell>{children}</HubLayoutShell>
    </UserProvider>
  );
}
