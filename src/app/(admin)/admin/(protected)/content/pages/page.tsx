import Link from "next/link";
import { FilePenLine, GraduationCap, Home, Mail, NotebookTabs, Star } from "lucide-react";

import { AdminPageIntro, AdminPanel, StatusPill } from "@/components/admin/primitives";
import { getAdminPages } from "@/lib/content/admin-queries";

const pageWorkspaces = [
  {
    pageKey: "home",
    title: "Home page",
    href: "/admin/content/home",
    description: "Hero, focus rails, previews, and connect section.",
    icon: Home,
  },
  {
    pageKey: "about",
    title: "About page",
    href: "/admin/content/about",
    description: "Identity framing, roadmap, supporting sections, and portrait.",
    icon: NotebookTabs,
  },
  {
    pageKey: "blogs",
    title: "Blog page",
    href: "/admin/content/blogs",
    description: "Archive intro, support cards, and writing index framing.",
    icon: FilePenLine,
  },
  {
    pageKey: "academic",
    title: "Academic page",
    href: "/admin/content/academic-page",
    description: "Research continuity, academic positioning, and landing-page sections.",
    icon: GraduationCap,
  },
  {
    pageKey: "recommendations",
    title: "Recommendations page",
    href: "/admin/content/recommendations-page",
    description: "Curation notes, support blocks, and recommendations landing layout.",
    icon: Star,
  },
  {
    pageKey: "contact",
    title: "Contact links",
    href: "/admin/content/contact",
    description: "Simple editor for email, GitHub, LinkedIn, and location cards.",
    icon: Mail,
  },
] as const;

export default async function AdminPagesPage() {
  const pages = await getAdminPages();

  return (
    <div className="space-y-8">
      <AdminPageIntro
        eyebrow="Pages"
        title="Page workspaces"
        description="Each public page now has one designated admin surface. Open the page you want to control, then manage metadata and sections together instead of across disconnected routes."
      />

      <div className="grid gap-5 xl:grid-cols-2">
        {pageWorkspaces.map((workspace) => {
          const page = pages.find((item) => item.pageKey === workspace.pageKey) ?? null;
          const Icon = workspace.icon;

          return (
            <Link key={workspace.pageKey} href={workspace.href}>
              <AdminPanel className="admin-list-card h-full transition hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="rounded-[1rem] border border-border bg-white/70 p-3 text-accent">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
                        {workspace.title}
                      </p>
                      <p className="mt-2 max-w-xl text-sm leading-7 text-muted">
                        {workspace.description}
                      </p>
                      <p className="mt-3 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted">
                        {page?.slug ?? "missing route"}
                      </p>
                    </div>
                  </div>
                  {page ? (
                    <StatusPill tone={page.status === "published" ? "success" : "warning"}>
                      {page.status}
                    </StatusPill>
                  ) : null}
                </div>
              </AdminPanel>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
