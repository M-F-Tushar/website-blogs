"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { AdminField, AdminInput, AdminSelect } from "@/components/admin/primitives";
import { uploadMediaAssetFormAction } from "@/features/admin/content-actions";

const initialMediaUploadActionState = {
  status: "idle" as const,
  message: null,
};

function UploadButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full bg-surface-dark px-5 py-3 text-sm font-medium text-white transition hover:bg-surface-dark/92 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Uploading..." : "Upload asset"}
    </button>
  );
}

export function MediaUploadForm() {
  const [state, formAction] = useActionState(
    uploadMediaAssetFormAction,
    initialMediaUploadActionState,
  );

  return (
    <form action={formAction} className="mt-6 grid gap-5">
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

      {state.status === "error" && state.message ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </p>
      ) : null}

      <UploadButton />
    </form>
  );
}
