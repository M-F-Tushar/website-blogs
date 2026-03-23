import type { PropsWithChildren } from "react";
import Link from "next/link";
import { ExternalLink, FilePenLine, GraduationCap, LayoutTemplate, Sparkles } from "lucide-react";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { normalizeEmailAddress } from "@/lib/utils";
import type { SessionProfile } from "@/types/content";

export function AdminShell({
  profile,
  children,
}: PropsWithChildren<{ profile: SessionProfile }>) {
  const displayEmail = normalizeEmailAddress(profile.email) ?? profile.email;

  return (
    <div className="mx-auto grid min-h-screen max-w-[1500px] gap-6 px-6 py-8 lg:grid-cols-[320px_minmax(0,1fr)]">
      <AdminSidebar profile={profile} />
      <div className="space-y-6">
        <div className="surface-panel admin-topbar rounded-[1.75rem] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-accent">
                Workspace
              </p>
              <h1 className="mt-3 font-display text-[2.3rem] font-semibold tracking-[-0.05em] text-foreground">
                Publishing system
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">
                Move through page control, content creation, media, and system settings without
                bouncing between disconnected screens.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/admin/content/posts" className="admin-quick-action">
                <FilePenLine className="h-4 w-4" />
                New post
              </Link>
              <Link href="/admin/content/academic" className="admin-quick-action">
                <GraduationCap className="h-4 w-4" />
                New academic
              </Link>
              <Link href="/admin/content/home" className="admin-quick-action">
                <LayoutTemplate className="h-4 w-4" />
                Manage pages
              </Link>
              <Link
                href="/"
                target="_blank"
                rel="noreferrer"
                className="admin-quick-action"
              >
                <ExternalLink className="h-4 w-4" />
                Open site
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="admin-mini-stat">
              <span className="admin-mini-label">Current role</span>
              <span className="admin-mini-value">{profile.role}</span>
            </div>
            <div className="admin-mini-stat">
              <span className="admin-mini-label">Active editor</span>
              <span className="admin-mini-value">{profile.fullName ?? displayEmail}</span>
            </div>
            <div className="admin-mini-stat">
              <span className="admin-mini-label">Flow</span>
              <span className="admin-mini-value flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-accent" />
                Edit, preview, publish
              </span>
            </div>
          </div>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}
