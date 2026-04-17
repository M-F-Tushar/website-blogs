"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenText,
  Files,
  GraduationCap,
  Home,
  LayoutDashboard,
  Mail,
  MessageSquareText,
  PanelsTopLeft,
  Route,
  Search,
  Settings2,
  Star,
} from "lucide-react";

import { signOutAction } from "@/features/admin/actions";
import { cn, normalizeEmailAddress } from "@/lib/utils";
import type { SessionProfile } from "@/types/content";

const navigationGroups = [
  {
    title: "Workspace",
    items: [{ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Pages",
    items: [
      { href: "/admin/content/pages", label: "Pages overview", icon: PanelsTopLeft },
      { href: "/admin/content/home", label: "Home page", icon: Home },
      { href: "/admin/content/about", label: "About page", icon: Files },
      { href: "/admin/content/blogs", label: "Blog page", icon: BookOpenText },
      { href: "/admin/content/academic-page", label: "Academic page", icon: GraduationCap },
      {
        href: "/admin/content/recommendations-page",
        label: "Recommendations page",
        icon: Star,
      },
      { href: "/admin/content/contact", label: "Contact links", icon: Mail },
    ],
  },
  {
    title: "Collections",
    items: [
      { href: "/admin/content/posts", label: "Posts", icon: BookOpenText },
      { href: "/admin/content/academic", label: "Academic entries", icon: GraduationCap },
      { href: "/admin/content/recommendations", label: "Recommendations", icon: Star },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/admin/navigation", label: "Navigation", icon: Route },
      { href: "/admin/media", label: "Media", icon: Files },
      { href: "/admin/messages", label: "Messages", icon: MessageSquareText },
      { href: "/admin/settings", label: "Settings", icon: Settings2 },
      { href: "/admin/seo", label: "SEO", icon: Search },
    ],
  },
];

export function AdminSidebar({ profile }: { profile: SessionProfile }) {
  const pathname = usePathname();
  const displayEmail = normalizeEmailAddress(profile.email) ?? profile.email;

  return (
    <aside className="surface-panel admin-sidebar-shell flex h-full flex-col rounded-[1.75rem] p-5">
      <div className="border-b border-border pb-5">
        <p className="font-mono text-xs uppercase tracking-[0.26em] text-accent">
          Admin
        </p>
        <h2 className="mt-4 font-display text-2xl font-semibold tracking-[-0.04em]">
          Publishing cockpit
        </h2>
        <p className="mt-2 text-sm text-muted">{displayEmail}</p>
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
                  className={cn(
                    "admin-sidebar-link",
                    (pathname === item.href || pathname.startsWith(`${item.href}/`)) &&
                      "admin-sidebar-link-active",
                  )}
                >
                  <item.icon className="h-4 w-4" />
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
