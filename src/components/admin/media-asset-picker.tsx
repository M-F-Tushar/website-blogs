import Image from "next/image";
import Link from "next/link";

import { AdminField, AdminSelect } from "@/components/admin/primitives";
import type { MediaAsset } from "@/types/content";

interface MediaAssetPickerProps {
  label: string;
  name: string;
  assets: MediaAsset[];
  selectedAssetId?: string | null;
  hint?: string;
}

export function MediaAssetPicker({
  label,
  name,
  assets,
  selectedAssetId,
  hint,
}: MediaAssetPickerProps) {
  const publicAssets = assets.filter((asset) => Boolean(asset.publicUrl));
  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId) ?? null;
  const selectableAssets = selectedAsset?.id
    ? [
        selectedAsset,
        ...publicAssets.filter((asset) => asset.id !== selectedAsset.id),
      ]
    : publicAssets;

  return (
    <AdminField
      label={label}
      hint={
        hint ??
        "Choose a public media asset from the media library. Select 'No image selected' to remove it."
      }
    >
      <AdminSelect name={name} defaultValue={selectedAssetId ?? ""}>
        <option value="">No image selected</option>
        {selectableAssets.map((asset) => (
          <option key={asset.id} value={asset.id}>
            {asset.label ?? asset.objectPath}
            {asset.publicUrl ? "" : " (private asset)"}
          </option>
        ))}
      </AdminSelect>

      <div className="mt-3 rounded-[1.25rem] border border-border bg-white/55 p-4">
        {selectedAsset?.publicUrl ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="overflow-hidden rounded-[1rem] border border-border bg-white">
              <Image
                src={selectedAsset.publicUrl}
                alt={selectedAsset.altText ?? selectedAsset.label ?? "Selected media preview"}
                width={selectedAsset.width ?? 320}
                height={selectedAsset.height ?? 220}
                className="h-36 w-full object-cover sm:w-48"
                unoptimized
              />
            </div>
            <div className="space-y-2 text-sm text-muted">
              <p className="font-medium text-foreground">
                {selectedAsset.label ?? "Selected image"}
              </p>
              <p>{selectedAsset.objectPath}</p>
              <p>
                {selectedAsset.altText
                  ? `Alt: ${selectedAsset.altText}`
                  : "No alt text saved yet."}
              </p>
            </div>
          </div>
        ) : selectedAsset ? (
          <div className="space-y-2 text-sm text-muted">
            <p className="font-medium text-foreground">
              {selectedAsset.label ?? "Selected asset"}
            </p>
            <p>{selectedAsset.objectPath}</p>
            <p className="text-amber-700">
              This asset is not public, so it will not render on the public site until
              you replace it with a public media item.
            </p>
          </div>
        ) : (
          <div className="space-y-2 text-sm text-muted">
            <p>No cover image selected yet.</p>
            <p>
              Upload a public asset in{" "}
              <Link href="/admin/media" className="text-accent-strong underline">
                Media
              </Link>{" "}
              first, then come back and select it here.
            </p>
          </div>
        )}
      </div>
    </AdminField>
  );
}
