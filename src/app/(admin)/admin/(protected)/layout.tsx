import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminSession } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { profile } = await requireAdminSession();

  return <AdminShell profile={profile}>{children}</AdminShell>;
}
