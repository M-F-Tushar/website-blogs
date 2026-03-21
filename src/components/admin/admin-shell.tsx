import type { PropsWithChildren } from "react";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import type { SessionProfile } from "@/types/content";

export function AdminShell({
  profile,
  children,
}: PropsWithChildren<{ profile: SessionProfile }>) {
  return (
    <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[280px_minmax(0,1fr)]">
      <AdminSidebar profile={profile} />
      <div>{children}</div>
    </div>
  );
}
