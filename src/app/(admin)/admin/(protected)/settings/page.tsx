import { fallbackSiteSettings } from "@/lib/content/fallback-data";
import {
  getAdminMediaAssets,
  getAdminSiteSettings,
} from "@/lib/content/admin-queries";
import { saveSiteSettingsAction } from "@/features/admin/actions";
import {
  AdminField,
  AdminInput,
  AdminPageIntro,
  AdminPanel,
  AdminSelect,
  AdminTextarea,
  SubmitButton,
} from "@/components/admin/primitives";

export default async function AdminSettingsPage() {
  const [settings, assets] = await Promise.all([
    getAdminSiteSettings(),
    getAdminMediaAssets(),
  ]);
  const resolvedSettings = settings ?? fallbackSiteSettings;
  const publicAssets = assets.filter((asset) => Boolean(asset.publicUrl));

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
              <AdminInput name="siteName" defaultValue={resolvedSettings.siteName} required />
            </AdminField>
            <AdminField label="Site tagline">
              <AdminInput
                name="siteTagline"
                defaultValue={resolvedSettings.siteTagline}
                required
              />
            </AdminField>
          </div>

          <AdminField label="Site description">
            <AdminTextarea
              name="siteDescription"
              defaultValue={resolvedSettings.siteDescription}
              rows={4}
              required
            />
          </AdminField>

          <AdminField label="Footer blurb">
            <AdminTextarea
              name="footerBlurb"
              defaultValue={resolvedSettings.footerBlurb}
              rows={4}
              required
            />
          </AdminField>

          <div className="grid gap-5 xl:grid-cols-2">
            <AdminField label="Contact email">
              <AdminInput
                name="contactEmail"
                type="email"
                defaultValue={resolvedSettings.contactEmail}
                required
              />
            </AdminField>
            <AdminField label="Location label">
              <AdminInput
                name="locationLabel"
                defaultValue={resolvedSettings.locationLabel ?? ""}
              />
            </AdminField>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <AdminField label="GitHub URL">
              <AdminInput name="githubUrl" defaultValue={resolvedSettings.githubUrl ?? ""} />
            </AdminField>
            <AdminField label="LinkedIn URL">
              <AdminInput
                name="linkedinUrl"
                defaultValue={resolvedSettings.linkedinUrl ?? ""}
              />
            </AdminField>
            <AdminField label="X URL">
              <AdminInput name="xUrl" defaultValue={resolvedSettings.xUrl ?? ""} />
            </AdminField>
            <AdminField label="Resume URL">
              <AdminInput name="resumeUrl" defaultValue={resolvedSettings.resumeUrl ?? ""} />
            </AdminField>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <AdminField label="Default meta title">
              <AdminInput name="metaTitle" defaultValue={resolvedSettings.metaTitle ?? ""} />
            </AdminField>
            <AdminField label="Canonical URL">
              <AdminInput
                name="canonicalUrl"
                defaultValue={resolvedSettings.canonicalUrl ?? ""}
              />
            </AdminField>
          </div>

          <AdminField label="Default meta description">
            <AdminTextarea
              name="metaDescription"
              defaultValue={resolvedSettings.metaDescription ?? ""}
              rows={3}
            />
          </AdminField>

          <AdminField
            label="Default OG image"
            hint="Choose a public media asset to use as the site-level social share image."
          >
            <AdminSelect
              name="defaultOgImageAssetId"
              defaultValue={resolvedSettings.defaultOgImageAssetId ?? ""}
            >
              <option value="">No OG image selected</option>
              {publicAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.label ?? asset.objectPath}
                </option>
              ))}
            </AdminSelect>
          </AdminField>

          <div className="pt-2">
            <SubmitButton>Save settings</SubmitButton>
          </div>
        </form>
      </AdminPanel>
    </div>
  );
}
