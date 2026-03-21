import { fallbackSiteSettings } from "@/lib/content/fallback-data";
import { getAdminSiteSettings } from "@/lib/content/admin-queries";
import { saveSiteSettingsAction } from "@/features/admin/actions";
import {
  AdminField,
  AdminInput,
  AdminPageIntro,
  AdminPanel,
  AdminTextarea,
  SubmitButton,
} from "@/components/admin/primitives";

export default async function AdminSettingsPage() {
  const settings = (await getAdminSiteSettings()) ?? fallbackSiteSettings;

  return (
    <div className="space-y-8">
      <AdminPageIntro
        eyebrow="System"
        title="Site settings"
        description="Manage the global site identity, footer, contact details, and default SEO values."
      />

      <AdminPanel>
        <form action={saveSiteSettingsAction} className="grid gap-5">
          <div className="grid gap-5 xl:grid-cols-2">
            <AdminField label="Site name">
              <AdminInput name="siteName" defaultValue={settings.siteName} required />
            </AdminField>
            <AdminField label="Site tagline">
              <AdminInput name="siteTagline" defaultValue={settings.siteTagline} required />
            </AdminField>
          </div>

          <AdminField label="Site description">
            <AdminTextarea
              name="siteDescription"
              defaultValue={settings.siteDescription}
              rows={4}
              required
            />
          </AdminField>

          <AdminField label="Footer blurb">
            <AdminTextarea
              name="footerBlurb"
              defaultValue={settings.footerBlurb}
              rows={4}
              required
            />
          </AdminField>

          <div className="grid gap-5 xl:grid-cols-2">
            <AdminField label="Contact email">
              <AdminInput
                name="contactEmail"
                type="email"
                defaultValue={settings.contactEmail}
                required
              />
            </AdminField>
            <AdminField label="Location label">
              <AdminInput name="locationLabel" defaultValue={settings.locationLabel ?? ""} />
            </AdminField>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <AdminField label="GitHub URL">
              <AdminInput name="githubUrl" defaultValue={settings.githubUrl ?? ""} />
            </AdminField>
            <AdminField label="LinkedIn URL">
              <AdminInput name="linkedinUrl" defaultValue={settings.linkedinUrl ?? ""} />
            </AdminField>
            <AdminField label="X URL">
              <AdminInput name="xUrl" defaultValue={settings.xUrl ?? ""} />
            </AdminField>
            <AdminField label="Resume URL">
              <AdminInput name="resumeUrl" defaultValue={settings.resumeUrl ?? ""} />
            </AdminField>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <AdminField label="Default meta title">
              <AdminInput name="metaTitle" defaultValue={settings.metaTitle ?? ""} />
            </AdminField>
            <AdminField label="Canonical URL">
              <AdminInput name="canonicalUrl" defaultValue={settings.canonicalUrl ?? ""} />
            </AdminField>
          </div>

          <AdminField label="Default meta description">
            <AdminTextarea
              name="metaDescription"
              defaultValue={settings.metaDescription ?? ""}
              rows={3}
            />
          </AdminField>

          <div className="pt-2">
            <SubmitButton>Save settings</SubmitButton>
          </div>
        </form>
      </AdminPanel>
    </div>
  );
}
