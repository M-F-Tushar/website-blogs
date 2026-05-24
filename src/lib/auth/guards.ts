import "server-only";
import { redirect } from "next/navigation";

import { createAuthenticatedServerClient } from "@/lib/supabase/server";
import { normalizeEmailAddress } from "@/lib/utils";
import type { SessionProfile } from "@/types/content";

export async function getOptionalSessionProfile() {
  const supabase = await createAuthenticatedServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Read the caller's own profile via the authenticated client. RLS already
  // restricts profiles to `id = auth.uid()` or admin, so we don't need to
  // burn the service-role client on routine page renders.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, headline, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return null;
  }

  const mappedProfile: SessionProfile = {
    id: profile.id,
    email: normalizeEmailAddress(profile.email) ?? profile.email,
    fullName: profile.full_name,
    headline: profile.headline,
    role: profile.role,
  };

  return {
    user,
    profile: mappedProfile,
    supabase,
  };
}

export async function requireAdminSession() {
  const session = await getOptionalSessionProfile();

  if (!session?.user) {
    redirect("/admin/login");
  }

  if (session.profile.role !== "admin") {
    redirect("/admin/login?reason=forbidden");
  }

  return session;
}
