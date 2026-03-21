import { AdminField, AdminInput, AdminPageIntro, AdminPanel, AdminSelect } from "@/components/admin/primitives";
import { getAdminMediaAssets } from "@/lib/content/admin-queries";
import { formatDisplayDate } from "@/lib/utils";
import { uploadMediaAssetAction } from "@/features/admin/content-actions";

export default async function AdminMediaPage() {
  const assets = await getAdminMediaAssets();

  return (
    <div className="space-y-8">
      <AdminPageIntro
        eyebrow="System"
        title="Media library"
        description="Upload reusable assets with alt text and storage visibility. Public-facing media should go into the presentation bucket."
      />

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <AdminPanel>
          <h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">
            Upload asset
          </h2>
          <form action={uploadMediaAssetAction} className="mt-6 grid gap-5">
            <AdminField label="File">
              <AdminInput name="file" type="file" required />
            </AdminField>
            <AdminField label="Label">
              <AdminInput name="label" placeholder="Homepage portrait" />
            </AdminField>
            <AdminField label="Alt text">
              <AdminInput name="altText" placeholder="Describe the image accessibly" />
            </AdminField>
            <AdminField label="Bucket">
              <AdminSelect name="bucketName" defaultValue="site-public">
                <option value="site-public">site-public</option>
                <option value="site-admin">site-admin</option>
              </AdminSelect>
            </AdminField>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-surface-dark px-5 py-3 text-sm font-medium text-white transition hover:bg-surface-dark/92"
            >
              Upload asset
            </button>
          </form>
        </AdminPanel>

        <AdminPanel>
          <h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">
            Stored assets
          </h2>
          <div className="mt-6 space-y-3">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="rounded-[1.25rem] border border-border bg-white/55 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">{asset.label ?? asset.objectPath}</p>
                    <p className="mt-1 break-all text-sm text-muted">{asset.id}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                      {asset.bucketName} · {formatDisplayDate(asset.createdAt)}
                    </p>
                  </div>
                  {asset.publicUrl ? (
                    <a
                      href={asset.publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-accent"
                    >
                      Open
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
