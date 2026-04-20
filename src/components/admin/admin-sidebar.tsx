"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
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
  type LucideIcon,
} from "lucide-react";

import { signOutAction } from "@/features/admin/actions";
import { cn, normalizeEmailAddress } from "@/lib/utils";
import type { SessionProfile } from "@/types/content";

const navigationGroups: Array<{
  title: string;
  helper: string;
  items: Array<{
    href: string;
    label: string;
    description: string;
    icon: LucideIcon;
  }>;
}> = [
  {
    title: "Start Here",
    helper: "Daily overview",
    items: [
      {
        href: "/admin/dashboard",
        label: "Website manager",
        description: "Choose what to edit",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Edit Pages",
    helper: "Change public pages",
    items: [
      {
        href: "/admin/content/pages",
        label: "All pages",
        description: "Visibility and page list",
        icon: PanelsTopLeft,
      },
      { href: "/admin/content/home", label: "Home", description: "First screen", icon: Home },
      { href: "/admin/content/about", label: "About", description: "Profile and story", icon: Files },
      { href: "/admin/content/blogs", label: "Blog page", description: "Blog archive intro", icon: BookOpenText },
      {
        href: "/admin/content/academic-page",
        label: "Academic page",
        description: "Study archive intro",
        icon: GraduationCap,
      },
      {
        href: "/admin/content/recommendations-page",
        label: "Recommendations page",
        description: "Resource archive intro",
        icon: Star,
      },
      { href: "/admin/content/contact", label: "Contact", description: "Form and links", icon: Mail },
    ],
  },
  {
    title: "Add Content",
    helper: "Publish new items",
    items: [
      { href: "/admin/content/posts", label: "Blog posts", description: "Write articles", icon: BookOpenText },
      {
        href: "/admin/content/academic",
        label: "Academic records",
        description: "Coursework and notes",
        icon: GraduationCap,
      },
      {
        href: "/admin/content/recommendations",
        label: "Recommendations",
        description: "Books and resources",
        icon: Star,
      },
    ],
  },
  {
    title: "Website Tools",
    helper: "Site-wide controls",
    items: [
      { href: "/admin/navigation", label: "Menu", description: "Header and footer links", icon: Route },
      { href: "/admin/media", label: "Media library", description: "Images and files", icon: Archive },
      { href: "/admin/messages", label: "Messages", description: "Contact inbox", icon: MessageSquareText },
      { href: "/admin/seo", label: "Search settings", description: "Titles and descriptions", icon: Search },
      { href: "/admin/settings", label: "Site settings", description: "Name, email, links", icon: Settings2 },
    ],
  },
];

export function AdminSidebar({ profile }: { profile: SessionProfile }) {
  const pathname = usePathname();
  const displayEmail = normalizeEmailAddress(profile.email) ?? profile.email;

  return (
    <aside className="surface-panel admin-sidebar-shell flex h-full flex-col rounded-[1.75rem] p-5">
      <div className="border-b border-border pb-5">
        <p className="font-mono text-xs uppercase tracking-[0.26em] text-accent">Admin</p>
        <h2 className="mt-4 font-display text-2xl font-semibold tracking-[-0.04em]">
          Website control
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Manage pages, posts, messages, media, and settings from one place.
        </p>
        <p className="mt-3 truncate rounded-full border border-border bg-white/50 px-3 py-2 text-xs text-muted">
          {displayEmail}
        </p>
      </div>

      <div className="mt-6 flex-1 space-y-6">
        {navigationGroups.map((group) => (
          <div key={group.title}>
            <div className="flex items-end justify-between gap-3">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-muted">
                {group.title}
              </p>
              <p className="text-xs text-muted">{group.helper}</p>
            </div>
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
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{item.label}</span>
                    <span className="block truncate text-xs text-muted">
                      {item.description}
                    </span>
                  </span>
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
