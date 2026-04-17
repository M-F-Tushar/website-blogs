import { AdminManagedPageWorkspace } from "@/components/admin/admin-managed-page-workspace";
import {
  AdminField,
  AdminInput,
  AdminPageIntro,
  AdminPanel,
  SubmitButton,
} from "@/components/admin/primitives";
import {
  saveContactQuickLinksAction,
} from "@/features/admin/actions";
import { fallbackSiteSettings } from "@/lib/content/fallback-data";
import {
  getAdminPageSections,
  getAdminSiteSettings,
} from "@/lib/content/admin-queries";

const CONTACT_SECTION_TYPES = [
  { value: "hero", label: "Hero" },
  { value: "detail", label: "Detail card" },
  { value: "form", label: "Form intro" },
] as const;

interface AdminContactPageManagerProps {
  searchParams: Promise<{ edit?: string }>;
}

function getSectionHref(section: { settings: Record<string, unknown> } | null) {
  const href = section?.settings?.href;
  return typeof href === "string" && href.trim().length > 0 ? href.trim() : null;
}

export default async function AdminContactPageManager({
  searchParams,
}: AdminContactPageManagerProps) {
  const [settings, sections] = await Promise.all([
    getAdminSiteSettings(),
    getAdminPageSections("contact"),
  ]);
  const resolvedSettings = settings ?? fallbackSiteSettings;
  const emailSection = sections.find((section) => section.sectionKey === "email") ?? null;
  const githubSection = sections.find((section) => section.sectionKey === "github") ?? null;
  const linkedinSection = sections.find((section) => section.sectionKey === "linkedin") ?? null;
  const locationSection = sections.find((section) => section.sectionKey === "location") ?? null;

  return (
    <div className="space-y-8">
      <AdminPageIntro
        eyebrow="Page workspace"
        title="Contact page"
        description="Use the quick editor below for the public contact cards. The larger section editor is still available underneath for advanced copy changes."
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

      <AdminManagedPageWorkspace
        pageKey="contact"
        pageTitle="Contact"
        description="Control the public contact page intro, live contact cards, and form copy from admin."
        sectionTypes={CONTACT_SECTION_TYPES}
        settingsHint='Hero supports {"eyebrow":"Contact","tracks":["Research conversations"],"availabilityTitle":"Currently Available","availabilityDescription":"Reply timing or expectations"}. Form supports {"eyebrow":"Secure intake","badge":"Thoughtful replies over volume"}. Detail cards use Heading as the visible value and Subheading as supporting copy. For the email card, keep Section key as "email" and the public mailto link will follow the Heading automatically. Other cards can use Settings JSON like {"eyebrow":"GitHub","href":"https://github.com/username","icon":"github"}.'
        searchParams={searchParams}
        adminRoute="/admin/content/contact"
        showIntro={false}
      />
    </div>
  );
}
