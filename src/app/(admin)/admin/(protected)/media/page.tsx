import { MediaUploadForm } from "@/components/admin/media-upload-form";
import { AdminPageIntro, AdminPanel } from "@/components/admin/primitives";
import { getAdminMediaAssets } from "@/lib/content/admin-queries";
import { formatDisplayDate } from "@/lib/utils";
import type { MediaAsset } from "@/types/content";

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ uploaded?: string }>;
}) {
  const { uploaded } = await searchParams;

  let assets: MediaAsset[] = [];
  let assetsError: string | null = null;

  try {
    assets = await getAdminMediaAssets();
  } catch (error) {
    assetsError =
      error instanceof Error
        ? error.message
        : "The media library could not be loaded right now.";
  }

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
          {uploaded === "1" ? (
            <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Media asset uploaded successfully.
            </p>
          ) : null}
          <MediaUploadForm />
        </AdminPanel>

        <AdminPanel>
          <h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">
            Stored assets
          </h2>
          {assetsError ? (
            <div className="mt-6 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
              The upload form is still available, but the existing media list could not be
              loaded right now.
              <p className="mt-2 break-words text-amber-700">{assetsError}</p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {assets.length === 0 ? (
                <div className="rounded-[1.25rem] border border-dashed border-border bg-white/40 p-4 text-sm text-muted">
                  No media assets have been uploaded yet.
                </div>
              ) : null}

              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="rounded-[1.25rem] border border-border bg-white/55 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-foreground">
                        {asset.label ?? asset.objectPath}
                      </p>
                      <p className="mt-1 break-all text-sm text-muted">{asset.id}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                        {asset.bucketName} | {formatDisplayDate(asset.createdAt)}
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
          )}
        </AdminPanel>
      </div>
    </div>
  );
}
