import Link from "next/link";
import {
  BookOpenText,
  ExternalLink,
  FilePenLine,
  GraduationCap,
  Home,
  ImagePlus,
  Mail,
  PanelsTopLeft,
  Star,
  type LucideIcon,
} from "lucide-react";

import {
  AdminPageIntro,
  AdminPanel,
  StatusPill,
} from "@/components/admin/primitives";
import { getAdminDashboardSnapshot } from "@/lib/content/admin-queries";
import { formatDisplayDate } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const dashboard = await getAdminDashboardSnapshot();

  const commonTasks: Array<{
    href: string;
    label: string;
    description: string;
    icon: LucideIcon;
  }> = [
    {
      href: "/admin/content/posts",
      label: "Write or edit a blog post",
      description: "Use this when you want to publish an article or update an existing one.",
      icon: FilePenLine,
    },
    {
      href: "/admin/content/home",
      label: "Change the homepage",
      description: "Edit the first thing visitors see when they open the website.",
      icon: Home,
    },
    {
      href: "/admin/messages",
      label: "Check contact messages",
      description: "Read messages sent through the contact form.",
      icon: Mail,
    },
    {
      href: "/admin/media",
      label: "Upload or choose images",
      description: "Manage images used by posts, pages, and sections.",
      icon: ImagePlus,
    },
  ];

  const pageCards: Array<{
    href: string;
    label: string;
    description: string;
    icon: LucideIcon;
  }> = [
    {
      href: "/admin/content/home",
      label: "Home",
      description: "Hero, featured writing, recent sections, and final call-to-action.",
      icon: Home,
    },
    {
      href: "/admin/content/about",
      label: "About",
      description: "Profile, current focus, story, statistics, and timeline.",
      icon: PanelsTopLeft,
    },
    {
      href: "/admin/content/blogs",
      label: "Blog page",
      description: "Intro text and presentation for the public blog archive.",
      icon: BookOpenText,
    },
    {
      href: "/admin/content/academic-page",
      label: "Academic page",
      description: "Intro text and presentation for coursework and research notes.",
      icon: GraduationCap,
    },
    {
      href: "/admin/content/recommendations-page",
      label: "Recommendations page",
      description: "Intro text and presentation for curated resources.",
      icon: Star,
    },
    {
      href: "/admin/content/contact",
      label: "Contact",
      description: "Contact copy, links, availability message, and form content.",
      icon: Mail,
    },
  ];

  const libraryCards = [
    {
      label: "Blog posts",
      value: dashboard.postsCount,
      href: "/admin/content/posts",
      description: `${dashboard.postDraftCount} drafts waiting`,
    },
    {
      label: "Academic records",
      value: dashboard.academicCount,
      href: "/admin/content/academic",
      description: "Coursework, research notes, and experiments",
    },
    {
      label: "Recommendations",
      value: dashboard.recommendationCount,
      href: "/admin/content/recommendations",
      description: "Books, tools, courses, and resources",
    },
  ];

  const siteTools = [
    {
      label: "Public pages",
      value: dashboard.pageCount,
      href: "/admin/content/pages",
      description: "Visibility and page list",
    },
    {
      label: "Unread messages",
      value: dashboard.unreadMessages,
      href: "/admin/messages",
      description: "Contact form inbox",
    },
    {
      label: "Menu links",
      value: "Edit",
      href: "/admin/navigation",
      description: "Header and footer navigation",
    },
  ];

  return (
    <div className="space-y-8">
      <AdminPageIntro
        eyebrow="Start here"
        title="Website manager"
        description="Choose a simple task below. You can edit the public pages, add new content, check messages, upload images, and adjust site-wide settings from this panel."
        actions={
          <Link
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border-strong px-5 py-3 text-sm font-medium text-foreground transition hover:bg-white/70"
          >
            View public website
            <ExternalLink className="h-4 w-4" />
          </Link>
        }
      />

      <AdminPanel>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">
              Common jobs
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.05em]">
              What do you want to do today?
            </h2>
          </div>
          <Link href="/admin/settings" className="text-sm font-medium text-accent">
            Site settings
          </Link>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {commonTasks.map((task) => {
            const Icon = task.icon;

            return (
              <Link key={task.href} href={task.href} className="admin-task-card">
                <span className="admin-task-icon">
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block font-medium text-foreground">{task.label}</span>
                  <span className="mt-1 block text-sm leading-6 text-muted">
                    {task.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </AdminPanel>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <AdminPanel>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">
                Edit public pages
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.05em]">
                Pick the page visitors see
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
                These controls change the main website pages. Open a page, edit its sections,
                save, then view it live.
              </p>
            </div>
            <Link href="/admin/content/pages" className="text-sm font-medium text-accent">
              All pages
            </Link>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {pageCards.map((page) => {
              const Icon = page.icon;

              return (
                <Link key={page.href} href={page.href} className="admin-list-card">
                  <div className="flex items-start gap-3">
                    <span className="admin-task-icon">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block font-medium text-foreground">{page.label}</span>
                      <span className="mt-1 block text-sm leading-6 text-muted">
                        {page.description}
                      </span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </AdminPanel>

        <AdminPanel>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">
            Website status
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.05em]">
            At a glance
          </h2>
          <div className="mt-6 grid gap-3">
            {siteTools.map((tool) => (
              <Link key={tool.label} href={tool.href} className="admin-mini-stat">
                <span className="admin-mini-label">{tool.label}</span>
                <span className="admin-mini-value">{tool.value}</span>
                <span className="text-xs leading-5 text-muted">{tool.description}</span>
              </Link>
            ))}
          </div>
        </AdminPanel>
      </section>

      <AdminPanel>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">
              Content libraries
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.05em]">
              Add and organize entries
            </h2>
          </div>
          <Link href="/admin/media" className="text-sm font-medium text-accent">
            Media library
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {libraryCards.map((card) => (
            <Link key={card.label} href={card.href} className="admin-list-card">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
                {card.label}
              </p>
              <p className="mt-4 font-display text-4xl font-semibold tracking-[-0.05em]">
                {card.value}
              </p>
              <p className="mt-3 text-sm leading-6 text-muted">{card.description}</p>
            </Link>
          ))}
        </div>
      </AdminPanel>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminPanel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-display text-2xl font-semibold tracking-[-0.04em]">
                Recent blog work
              </p>
              <p className="mt-2 text-sm text-muted">
                The newest blog posts in the site library.
              </p>
            </div>
            <Link href="/admin/content/posts" className="text-sm text-accent">
              Manage
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {dashboard.latestPosts.length > 0 ? dashboard.latestPosts.map((post) => (
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
            )) : (
              <div className="rounded-[1.25rem] border border-dashed border-border bg-white/40 p-5 text-sm leading-7 text-muted">
                No posts yet. Start by opening Blog posts and creating the first article.
              </div>
            )}
          </div>
        </AdminPanel>

        <AdminPanel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-display text-2xl font-semibold tracking-[-0.04em]">
                Recent academic work
              </p>
              <p className="mt-2 text-sm text-muted">
                The newest coursework, research notes, and experiment records.
              </p>
            </div>
            <Link href="/admin/content/academic" className="text-sm text-accent">
              Manage
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {dashboard.latestAcademicEntries.length > 0 ? dashboard.latestAcademicEntries.map((entry) => (
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
            )) : (
              <div className="rounded-[1.25rem] border border-dashed border-border bg-white/40 p-5 text-sm leading-7 text-muted">
                No academic records yet. Open Academic records when you are ready to add one.
              </div>
            )}
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
