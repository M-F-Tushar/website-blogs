import Link from "next/link";

import {
  AdminPageIntro,
  AdminPanel,
  StatusPill,
} from "@/components/admin/primitives";
import { getAdminDashboardSnapshot } from "@/lib/content/admin-queries";
import { formatDisplayDate } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const dashboard = await getAdminDashboardSnapshot();

  const metricCards = [
    {
      label: "Posts",
      value: dashboard.postsCount,
      href: "/admin/content/posts",
    },
    {
      label: "Draft posts",
      value: dashboard.postDraftCount,
      href: "/admin/content/posts",
    },
    {
      label: "Academic entries",
      value: dashboard.academicCount,
      href: "/admin/content/academic",
    },
    {
      label: "Recommendations",
      value: dashboard.recommendationCount,
      href: "/admin/content/recommendations",
    },
    {
      label: "Pages",
      value: dashboard.pageCount,
      href: "/admin/content/pages",
    },
    {
      label: "Unread messages",
      value: dashboard.unreadMessages,
      href: "/admin/messages",
    },
  ];

  return (
    <div className="space-y-8">
      <AdminPageIntro
        eyebrow="Overview"
        title="Dashboard"
        description="A quick operational view of content volume, recent entries, and inbox activity."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metricCards.map((card) => (
          <Link key={card.label} href={card.href}>
            <AdminPanel className="h-full transition hover:-translate-y-0.5">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
                {card.label}
              </p>
              <p className="mt-4 font-display text-4xl font-semibold tracking-[-0.05em]">
                {card.value}
              </p>
            </AdminPanel>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminPanel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-display text-2xl font-semibold tracking-[-0.04em]">
                Latest posts
              </p>
              <p className="mt-2 text-sm text-muted">
                Recent writing moving through the platform.
              </p>
            </div>
            <Link href="/admin/content/posts" className="text-sm text-accent">
              Manage
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {dashboard.latestPosts.map((post) => (
              <div
                key={post.id}
                className="rounded-[1.25rem] border border-border bg-white/50 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">{post.title}</p>
                    <p className="mt-2 text-sm text-muted">{post.excerpt}</p>
                  </div>
                  <StatusPill tone={post.status === "published" ? "success" : "warning"}>
                    {post.status}
                  </StatusPill>
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted">
                  {formatDisplayDate(post.publishedAt)}
                </p>
              </div>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-display text-2xl font-semibold tracking-[-0.04em]">
                Academic activity
              </p>
              <p className="mt-2 text-sm text-muted">
                Research notes, coursework, and experimental entries.
              </p>
            </div>
            <Link href="/admin/content/academic" className="text-sm text-accent">
              Manage
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {dashboard.latestAcademicEntries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-[1.25rem] border border-border bg-white/50 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">{entry.title}</p>
                    <p className="mt-2 text-sm text-muted">{entry.summary}</p>
                  </div>
                  <StatusPill tone={entry.status === "published" ? "success" : "warning"}>
                    {entry.status}
                  </StatusPill>
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted">
                  {entry.entryType.replace(/_/g, " ")}
                </p>
              </div>
            ))}
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
