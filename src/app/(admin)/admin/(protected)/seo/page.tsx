import Link from "next/link";

import { AdminPageIntro, AdminPanel, StatusPill } from "@/components/admin/primitives";
import { getAdminPages, getAdminSiteSettings } from "@/lib/content/admin-queries";

export default async function AdminSeoPage() {
  const [settings, pages] = await Promise.all([
    getAdminSiteSettings(),
    getAdminPages(),
  ]);

  return (
    <div className="space-y-8">
      <AdminPageIntro
        eyebrow="System"
        title="SEO overview"
        description="A quick readout of global metadata defaults and page-specific SEO coverage."
      />

      <AdminPanel>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">
              Global defaults
            </h2>
            <p className="mt-2 text-sm text-muted">
              These values are used when a page or entry does not override them.
            </p>
          </div>
          <Link href="/admin/settings" className="text-sm text-accent">
            Edit settings
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.25rem] border border-border bg-white/55 p-4">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              Default meta title
            </p>
            <p className="mt-3 text-sm text-foreground">{settings?.metaTitle ?? "Not set"}</p>
          </div>
          <div className="rounded-[1.25rem] border border-border bg-white/55 p-4">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              Default meta description
            </p>
            <p className="mt-3 text-sm text-foreground">
              {settings?.metaDescription ?? "Not set"}
            </p>
          </div>
        </div>
      </AdminPanel>

      <AdminPanel>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">
              Page metadata coverage
            </h2>
            <p className="mt-2 text-sm text-muted">
              Each public page should have clear metadata and visibility rules.
            </p>
          </div>
          <Link href="/admin/content/pages" className="text-sm text-accent">
            Manage pages
          </Link>
        </div>

        <div className="mt-6 space-y-3">
          {pages.map((page) => (
            <div
              key={page.id}
              className="rounded-[1.25rem] border border-border bg-white/55 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-foreground">{page.title}</p>
                  <p className="mt-1 text-sm text-muted">
                    {page.metaTitle || "No meta title"} ·{" "}
                    {page.metaDescription || "No meta description"}
                  </p>
                </div>
                <StatusPill tone={page.status === "published" ? "success" : "warning"}>
                  {page.status}
                </StatusPill>
              </div>
            </div>
          ))}
        </div>
      </AdminPanel>
    </div>
  );
}
