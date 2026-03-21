import Link from "next/link";

import { signOutAction } from "@/features/admin/actions";
import type { SessionProfile } from "@/types/content";

const navigationGroups = [
  {
    title: "Overview",
    items: [{ href: "/admin/dashboard", label: "Dashboard" }],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/content/pages", label: "Pages" },
      { href: "/admin/content/home", label: "Home" },
      { href: "/admin/content/about", label: "About" },
      { href: "/admin/content/posts", label: "Posts" },
      { href: "/admin/content/academic", label: "Academic" },
      { href: "/admin/content/recommendations", label: "Recommendations" },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/navigation", label: "Navigation" },
      { href: "/admin/media", label: "Media" },
      { href: "/admin/messages", label: "Messages" },
      { href: "/admin/settings", label: "Settings" },
      { href: "/admin/seo", label: "SEO" },
    ],
  },
];

export function AdminSidebar({ profile }: { profile: SessionProfile }) {
  return (
    <aside className="surface-panel flex h-full flex-col rounded-[1.75rem] p-5">
      <div className="border-b border-border pb-5">
        <p className="font-mono text-xs uppercase tracking-[0.26em] text-accent">
          Admin
        </p>
        <h2 className="mt-4 font-display text-2xl font-semibold tracking-[-0.04em]">
          Content cockpit
        </h2>
        <p className="mt-2 text-sm text-muted">{profile.email}</p>
      </div>

      <div className="mt-6 flex-1 space-y-6">
        {navigationGroups.map((group) => (
          <div key={group.title}>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-muted">
              {group.title}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl px-4 py-3 text-sm text-foreground transition hover:bg-white/60"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <form action={signOutAction}>
        <button
          type="submit"
          className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-border-strong px-5 py-3 text-sm font-medium text-foreground transition hover:bg-white/60"
        >
          Sign out
        </button>
      </form>
    </aside>
  );
}
