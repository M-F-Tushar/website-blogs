import Link from "next/link";

import { MediaAssetPicker } from "@/components/admin/media-asset-picker";
import {
  AdminCheckbox,
  AdminField,
  AdminInput,
  AdminPageIntro,
  AdminPanel,
  AdminSelect,
  AdminTextarea,
  StatusPill,
  SubmitButton,
} from "@/components/admin/primitives";
import {
  getAdminAcademicEntries,
  getAdminMediaAssets,
} from "@/lib/content/admin-queries";
import {
  archiveAcademicEntryAction,
  saveAcademicEntryAction,
} from "@/features/admin/content-actions";

interface AdminAcademicPageProps {
  searchParams: Promise<{ edit?: string }>;
}

export default async function AdminAcademicPage({
  searchParams,
}: AdminAcademicPageProps) {
  const [entries, assets] = await Promise.all([
    getAdminAcademicEntries(),
    getAdminMediaAssets(),
  ]);
  const { edit } = await searchParams;
  const selectedEntry = entries.find((entry) => entry.id === edit) ?? null;

  return (
    <div className="space-y-8">
      <AdminPageIntro
        eyebrow="Content"
        title="Academic manager"
        description="Track coursework, research notes, experiments, paper summaries, and future thesis work."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <AdminPanel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">
                Academic entries
              </h2>
              <p className="mt-2 text-sm text-muted">
                Research-facing content and academic signals.
              </p>
            </div>
            <Link
              href="/admin/content/academic"
              className="rounded-full border border-border-strong px-4 py-2 text-sm"
            >
              New entry
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {entries.map((entry) => (
              <Link
                key={entry.id}
                href={`/admin/content/academic?edit=${entry.id}`}
                className="block rounded-[1.25rem] border border-border bg-white/55 p-4 transition hover:bg-white/80"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{entry.title}</p>
                    <p className="mt-1 text-sm text-muted">
                      {entry.entryType.replace(/_/g, " ")}
                    </p>
                  </div>
                  <StatusPill tone={entry.status === "published" ? "success" : "warning"}>
                    {entry.status}
                  </StatusPill>
                </div>
              </Link>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel>
          <h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">
            {selectedEntry ? "Edit entry" : "Create entry"}
          </h2>
          <form action={saveAcademicEntryAction} className="mt-6 grid gap-5">
            <input type="hidden" name="id" defaultValue={selectedEntry?.id ?? ""} />

            <AdminField label="Title">
              <AdminInput name="title" defaultValue={selectedEntry?.title ?? ""} required />
            </AdminField>

            <div className="grid gap-5 md:grid-cols-2">
              <AdminField label="Slug">
                <AdminInput name="slug" defaultValue={selectedEntry?.slug ?? ""} />
              </AdminField>
              <AdminField label="Entry type">
                <AdminSelect
                  name="entryType"
                  defaultValue={selectedEntry?.entryType ?? "research_note"}
                >
                  <option value="coursework">coursework</option>
                  <option value="project">project</option>
                  <option value="research_note">research_note</option>
                  <option value="paper_note">paper_note</option>
                  <option value="experiment">experiment</option>
                  <option value="certificate">certificate</option>
                </AdminSelect>
              </AdminField>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <AdminField label="Status">
                <AdminSelect name="status" defaultValue={selectedEntry?.status ?? "draft"}>
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                  <option value="archived">archived</option>
                </AdminSelect>
              </AdminField>
              <AdminField label="External URL">
                <AdminInput
                  name="externalUrl"
                  defaultValue={selectedEntry?.externalUrl ?? ""}
                />
              </AdminField>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <AdminField label="Started date">
                <AdminInput
                  name="startedAt"
                  type="date"
                  defaultValue={selectedEntry?.startedAt ?? ""}
                />
              </AdminField>
              <AdminField label="Completed date">
                <AdminInput
                  name="completedAt"
                  type="date"
                  defaultValue={selectedEntry?.completedAt ?? ""}
                />
              </AdminField>
            </div>

            <MediaAssetPicker
              label="Cover image"
              name="coverAssetId"
              assets={assets}
              selectedAssetId={selectedEntry?.coverAssetId ?? null}
            />

            <AdminCheckbox
              name="featured"
              label="Featured entry"
              defaultChecked={selectedEntry?.featured ?? false}
            />

            <AdminField label="Summary">
              <AdminTextarea
                name="summary"
                rows={3}
                defaultValue={selectedEntry?.summary ?? ""}
              />
            </AdminField>

            <AdminField label="Body markdown">
              <AdminTextarea
                name="bodyMarkdown"
                rows={14}
                defaultValue={selectedEntry?.bodyMarkdown ?? ""}
                required
              />
            </AdminField>

            <div className="grid gap-5 md:grid-cols-2">
              <AdminField label="Meta title">
                <AdminInput name="metaTitle" defaultValue={selectedEntry?.metaTitle ?? ""} />
              </AdminField>
              <AdminField label="Canonical URL">
                <AdminInput
                  name="canonicalUrl"
                  defaultValue={selectedEntry?.canonicalUrl ?? ""}
                />
              </AdminField>
            </div>

            <AdminField label="Meta description">
              <AdminTextarea
                name="metaDescription"
                rows={3}
                defaultValue={selectedEntry?.metaDescription ?? ""}
              />
            </AdminField>

            <div className="pt-2">
              <SubmitButton>Save entry</SubmitButton>
            </div>
          </form>

          {selectedEntry ? (
            <form action={archiveAcademicEntryAction} className="mt-3">
              <input type="hidden" name="id" value={selectedEntry.id} />
              <SubmitButton variant="danger">Archive entry</SubmitButton>
            </form>
          ) : null}
        </AdminPanel>
      </div>
    </div>
  );
}
