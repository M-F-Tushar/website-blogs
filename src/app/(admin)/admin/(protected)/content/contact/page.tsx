import Link from "next/link";

import {
  AdminField,
  AdminInput,
  AdminPageIntro,
  AdminPanel,
  StatusPill,
  SubmitButton,
} from "@/components/admin/primitives";
import { saveContactQuickLinksAction } from "@/features/admin/actions";
import { fallbackSiteSettings } from "@/lib/content/fallback-data";
import {
  getAdminPageSections,
  getAdminSiteSettings,
} from "@/lib/content/admin-queries";

function getSectionHref(section: { settings: Record<string, unknown> } | null) {
  const href = section?.settings?.href;
  return typeof href === "string" && href.trim().length > 0 ? href.trim() : null;
}

export default async function AdminContactPageManager() {
  const [settings, sections] = await Promise.all([
    getAdminSiteSettings(),
    getAdminPageSections("contact"),
  ]);
  const resolvedSettings = settings ?? fallbackSiteSettings;
  const emailSection = sections.find((section) => section.sectionKey === "email") ?? null;
  const githubSection = sections.find((section) => section.sectionKey === "github") ?? null;
  const linkedinSection = sections.find((section) => section.sectionKey === "linkedin") ?? null;
  const locationSection = sections.find((section) => section.sectionKey === "location") ?? null;
  const visibleCards = [
    emailSection ? "Email" : null,
    githubSection?.isVisible ? "GitHub" : null,
    linkedinSection?.isVisible ? "LinkedIn" : null,
    locationSection?.isVisible ? "Location" : null,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-8">
      <AdminPageIntro
        eyebrow="Contact"
        title="Quick contact editor"
        description="This page is now the simple control panel for the live contact cards. Update the values below and save. If you ever need the old section builder, use the advanced editor link."
        actions={
          <Link
            href="/admin/content/contact/advanced"
            className="inline-flex items-center justify-center rounded-full border border-border-strong px-5 py-3 text-sm font-medium text-foreground transition hover:bg-white/60"
          >
            Open advanced editor
          </Link>
        }
      />

      <AdminPanel className="admin-panel-quiet">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
              Quick Contact Links
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">
              These fields control the visible cards on the live <code>/contact</code> page.
              Change the values here and save. Leave GitHub, LinkedIn, or Location blank if
              you want that card hidden.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {visibleCards.map((item) => (
              <StatusPill key={item} tone="success">
                {item}
              </StatusPill>
            ))}
          </div>
        </div>

        <form action={saveContactQuickLinksAction} className="mt-6 grid gap-5">
          <input type="hidden" name="returnTo" value="/admin/content/contact" />

          <div className="grid gap-5 xl:grid-cols-2">
            <AdminField
              label="Public email"
              hint="Shown as the main email card on the public contact page."
            >
              <AdminInput
                name="email"
                type="email"
                defaultValue={emailSection?.heading ?? resolvedSettings.contactEmail}
                required
              />
            </AdminField>

            <AdminField
              label="Location"
              hint="Shown as a location card if you fill it in."
            >
              <AdminInput
                name="locationLabel"
                defaultValue={locationSection?.heading ?? resolvedSettings.locationLabel ?? ""}
              />
            </AdminField>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <AdminField
              label="GitHub URL"
              hint="Example: https://github.com/your-username"
            >
              <AdminInput
                name="githubUrl"
                type="url"
                defaultValue={getSectionHref(githubSection) ?? resolvedSettings.githubUrl ?? ""}
              />
            </AdminField>

            <AdminField
              label="LinkedIn URL"
              hint="Example: https://www.linkedin.com/in/your-profile"
            >
              <AdminInput
                name="linkedinUrl"
                type="url"
                defaultValue={
                  getSectionHref(linkedinSection) ?? resolvedSettings.linkedinUrl ?? ""
                }
              />
            </AdminField>
          </div>

          <div className="rounded-[1.2rem] border border-border bg-white/55 p-4 text-sm leading-7 text-muted">
            This quick editor also keeps the contact page sections and the global site settings
            aligned, so the public contact cards stop drifting away from what you entered in
            admin.
          </div>

          <div className="pt-2">
            <SubmitButton>Save quick contact links</SubmitButton>
          </div>
        </form>
      </AdminPanel>

      <AdminPanel className="admin-panel-quiet">
        <p className="font-display text-xl font-semibold tracking-[-0.04em] text-foreground">
          What each field does
        </p>
        <div className="mt-4 grid gap-3 text-sm leading-7 text-muted md:grid-cols-2">
          <div className="rounded-[1.1rem] border border-border bg-white/60 p-4">
            <p className="font-medium text-foreground">Public email</p>
            <p className="mt-1">Main featured email card shown on the contact page.</p>
          </div>
          <div className="rounded-[1.1rem] border border-border bg-white/60 p-4">
            <p className="font-medium text-foreground">GitHub URL</p>
            <p className="mt-1">Shows or hides the GitHub card based on whether a URL is filled in.</p>
          </div>
          <div className="rounded-[1.1rem] border border-border bg-white/60 p-4">
            <p className="font-medium text-foreground">LinkedIn URL</p>
            <p className="mt-1">Shows or hides the LinkedIn card based on whether a URL is filled in.</p>
          </div>
          <div className="rounded-[1.1rem] border border-border bg-white/60 p-4">
            <p className="font-medium text-foreground">Location</p>
            <p className="mt-1">Optional location card for city, country, or remote availability.</p>
          </div>
        </div>
      </AdminPanel>
    </div>
  );
}
