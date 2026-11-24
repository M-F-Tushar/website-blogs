"use client";

import { AdminActionForm } from "@/components/admin/admin-action-form";
import { deleteMediaAssetFormAction } from "@/features/admin/content-actions";

export function MediaDeleteForm({ assetId }: { assetId: string }) {
  return (
    <AdminActionForm action={deleteMediaAssetFormAction}>
      <input type="hidden" name="id" value={assetId} />
      <button
        type="submit"
        onClick={(event) => {
          if (
            !window.confirm(
              "Delete this media asset and its stored file? This cannot be undone.",
            )
          ) {
            event.preventDefault();
          }
        }}
        className="text-sm font-medium text-red-700 transition hover:text-red-800"
      >
        Delete
      </button>
    </AdminActionForm>
  );
}
