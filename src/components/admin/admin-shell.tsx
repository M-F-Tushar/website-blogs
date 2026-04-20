import type { PropsWithChildren } from "react";
import Link from "next/link";
import {
  ExternalLink,
  FilePenLine,
  ImagePlus,
  LayoutTemplate,
  Mail,
  Route,
  Settings2,
} from "lucide-react";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { normalizeEmailAddress } from "@/lib/utils";
import type { SessionProfile } from "@/types/content";

export function AdminShell({
  profile,
  children,
}: PropsWithChildren<{ profile: SessionProfile }>) {
  const displayEmail = normalizeEmailAddress(profile.email) ?? profile.email;
  const quickTasks = [
    {
      href: "/admin/content/home",
      label: "Edit homepage",
      description: "Change the first page visitors see",
      icon: LayoutTemplate,
    },
    {
      href: "/admin/content/posts",
      label: "Write a blog post",
      description: "Add, edit, or publish articles",
      icon: FilePenLine,
    },
    {
      href: "/admin/messages",
      label: "Read messages",
      description: "Check contact form submissions",
      icon: Mail,
    },
    {
      href: "/admin/media",
      label: "Upload media",
      description: "Manage images and public files",
      icon: ImagePlus,
    },
    {
      href: "/admin/navigation",
      label: "Edit menu",
      description: "Control header and footer links",
      icon: Route,
    },
    {
      href: "/admin/settings",
      label: "Site settings",
      description: "Update name, email, and social links",
      icon: Settings2,
    },
  ];

  return (
    <div className="mx-auto grid min-h-screen max-w-[1500px] gap-6 px-6 py-8 lg:grid-cols-[320px_minmax(0,1fr)]">
      <AdminSidebar profile={profile} />
      <div className="space-y-6">
        <div className="surface-panel admin-topbar rounded-[1.75rem] p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-accent">
                Website manager
              </p>
              <h1 className="mt-3 font-display text-[2.35rem] font-semibold leading-none tracking-[-0.05em] text-foreground">
                What do you want to change?
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
                Use the cards below for the most common jobs, or choose a section from the left.
                Every public page and site setting is controlled from here.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 sm:items-end">
              <Link href="/" target="_blank" rel="noreferrer" className="admin-quick-action">
                <ExternalLink className="h-4 w-4" />
                View public website
              </Link>
              <p className="text-xs text-muted">Signed in as {profile.fullName ?? displayEmail}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {quickTasks.map((task) => {
              const Icon = task.icon;

              return (
                <Link key={task.href} href={task.href} className="admin-task-card">
                  <span className="admin-task-icon">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block font-medium text-foreground">{task.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-muted">
                      {task.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}
