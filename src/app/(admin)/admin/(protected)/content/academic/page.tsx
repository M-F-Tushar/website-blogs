import Link from "next/link";

import { MarkdownEditorField } from "@/components/admin/markdown-editor-field";
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
        eyebrow="Collections"
        title="Academic entries"
        description="Write research notes, coursework reflections, experiments, and paper summaries with the same markdown workflow used on the public site."
        actions={
          <Link
            href="/admin/content/academic"
            className="inline-flex items-center justify-center rounded-full border border-border-strong px-5 py-3 text-sm font-medium text-foreground transition hover:bg-white/60"
          >
            New entry
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.88fr_minmax(0,1.12fr)]">
        <AdminPanel className="admin-panel-quiet xl:sticky xl:top-6 xl:self-start">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
                Academic library
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted">
                Coursework, research notes, paper logs, and experiments.
              </p>
            </div>
            <StatusPill>{entries.length} total</StatusPill>
          </div>

          <div className="mt-6 space-y-3">
            {entries.map((entry) => (
              <Link
                key={entry.id}
                href={`/admin/content/academic?edit=${entry.id}`}
                className="admin-list-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{entry.title}</p>
                    <p className="mt-1 text-sm text-muted">
                      {entry.entryType.replace(/_/g, " ")}
                    </p>
                    {entry.summary ? (
                      <p className="mt-2 text-sm leading-7 text-muted">{entry.summary}</p>
                    ) : null}
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
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
                {selectedEntry ? "Edit entry" : "Create entry"}
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted">
                Use markdown for research structure, evidence tables, code, image embeds, and
                Mermaid diagrams.
              </p>
            </div>
            {selectedEntry ? (
              <Link
                href={`/academic/${selectedEntry.slug}`}
                target="_blank"
                className="inline-flex items-center justify-center rounded-full border border-border-strong px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white/60"
              >
                View live entry
              </Link>
            ) : null}
          </div>

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
                rows={4}
                defaultValue={selectedEntry?.summary ?? ""}
              />
            </AdminField>

            <MarkdownEditorField
              name="bodyMarkdown"
              label="Entry markdown"
              defaultValue={selectedEntry?.bodyMarkdown ?? ""}
              hint="Preview matches the public academic renderer."
              assets={assets}
              variant="academic"
              required
              minHeightClassName="min-h-[28rem]"
            />

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
                rows={4}
                defaultValue={selectedEntry?.metaDescription ?? ""}
              />
            </AdminField>

            <div className="flex flex-wrap gap-3 pt-2">
              <SubmitButton>Save entry</SubmitButton>
            </div>
          </form>

          {selectedEntry ? (
            <form action={archiveAcademicEntryAction} className="mt-4">
              <input type="hidden" name="id" value={selectedEntry.id} />
              <SubmitButton variant="danger">Archive entry</SubmitButton>
            </form>
          ) : null}
        </AdminPanel>
      </div>
    </div>
  );
}
