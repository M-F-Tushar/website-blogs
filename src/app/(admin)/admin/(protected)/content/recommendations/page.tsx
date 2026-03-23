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
  getAdminMediaAssets,
  getAdminRecommendations,
} from "@/lib/content/admin-queries";
import {
  archiveRecommendationAction,
  saveRecommendationAction,
} from "@/features/admin/content-actions";

interface AdminRecommendationsPageProps {
  searchParams: Promise<{ edit?: string }>;
}

export default async function AdminRecommendationsPage({
  searchParams,
}: AdminRecommendationsPageProps) {
  const [recommendations, assets] = await Promise.all([
    getAdminRecommendations(),
    getAdminMediaAssets(),
  ]);
  const { edit } = await searchParams;
  const selectedItem =
    recommendations.find((recommendation) => recommendation.id === edit) ?? null;

  return (
    <div className="space-y-8">
      <AdminPageIntro
        eyebrow="Collections"
        title="Recommendations"
        description="Curate books, tools, and resources with rationale, audience fit, and markdown-rich notes in one workflow."
        actions={
          <Link
            href="/admin/content/recommendations"
            className="inline-flex items-center justify-center rounded-full border border-border-strong px-5 py-3 text-sm font-medium text-foreground transition hover:bg-white/60"
          >
            New recommendation
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.88fr_minmax(0,1.12fr)]">
        <AdminPanel className="admin-panel-quiet xl:sticky xl:top-6 xl:self-start">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
                Resource library
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted">
                Practical resources, not filler.
              </p>
            </div>
            <StatusPill>{recommendations.length} total</StatusPill>
          </div>

          <div className="mt-6 space-y-3">
            {recommendations.map((item) => (
              <Link
                key={item.id}
                href={`/admin/content/recommendations?edit=${item.id}`}
                className="admin-list-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="mt-1 text-sm text-muted">
                      {item.category ?? "uncategorized"} | {item.level}
                    </p>
                    {item.summary ? (
                      <p className="mt-2 text-sm leading-7 text-muted">{item.summary}</p>
                    ) : null}
                  </div>
                  <StatusPill tone={item.status === "published" ? "success" : "warning"}>
                    {item.status}
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
                {selectedItem ? "Edit recommendation" : "Create recommendation"}
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted">
                Write richer recommendation notes with markdown, media embeds, code samples, and
                diagram support when needed.
              </p>
            </div>
            {selectedItem ? (
              <Link
                href={`/recommendations/${selectedItem.slug}`}
                target="_blank"
                className="inline-flex items-center justify-center rounded-full border border-border-strong px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white/60"
              >
                View live recommendation
              </Link>
            ) : null}
          </div>

          <form action={saveRecommendationAction} className="mt-6 grid gap-5">
            <input type="hidden" name="id" defaultValue={selectedItem?.id ?? ""} />

            <AdminField label="Title">
              <AdminInput name="title" defaultValue={selectedItem?.title ?? ""} required />
            </AdminField>

            <div className="grid gap-5 md:grid-cols-2">
              <AdminField label="Slug">
                <AdminInput name="slug" defaultValue={selectedItem?.slug ?? ""} />
              </AdminField>
              <AdminField label="Category">
                <AdminInput
                  name="categoryName"
                  defaultValue={selectedItem?.category ?? ""}
                  placeholder="books, tools, courses"
                />
              </AdminField>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <AdminField label="Status">
                <AdminSelect name="status" defaultValue={selectedItem?.status ?? "draft"}>
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                  <option value="archived">archived</option>
                </AdminSelect>
              </AdminField>
              <AdminField label="Level">
                <AdminSelect name="level" defaultValue={selectedItem?.level ?? "beginner"}>
                  <option value="beginner">beginner</option>
                  <option value="intermediate">intermediate</option>
                  <option value="advanced">advanced</option>
                </AdminSelect>
              </AdminField>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <AdminField label="Audience">
                <AdminInput name="audience" defaultValue={selectedItem?.audience ?? ""} />
              </AdminField>
              <AdminField label="Use case">
                <AdminInput name="useCase" defaultValue={selectedItem?.useCase ?? ""} />
              </AdminField>
            </div>

            <AdminField label="External URL">
              <AdminInput
                name="externalUrl"
                defaultValue={selectedItem?.externalUrl ?? ""}
              />
            </AdminField>

            <MediaAssetPicker
              label="Cover image"
              name="coverAssetId"
              assets={assets}
              selectedAssetId={selectedItem?.coverAssetId ?? null}
            />

            <AdminCheckbox
              name="featured"
              label="Featured recommendation"
              defaultChecked={selectedItem?.featured ?? false}
            />

            <AdminField label="Summary">
              <AdminTextarea
                name="summary"
                rows={4}
                defaultValue={selectedItem?.summary ?? ""}
              />
            </AdminField>

            <AdminField label="Why recommend it">
              <AdminTextarea
                name="whyRecommend"
                rows={4}
                defaultValue={selectedItem?.whyRecommend ?? ""}
              />
            </AdminField>

            <MarkdownEditorField
              name="bodyMarkdown"
              label="Recommendation markdown"
              defaultValue={selectedItem?.bodyMarkdown ?? ""}
              hint="Use markdown for longer rationale, usage notes, comparisons, or implementation examples."
              assets={assets}
              variant="recommendation"
              required
              minHeightClassName="min-h-[26rem]"
            />

            <div className="grid gap-5 md:grid-cols-2">
              <AdminField label="Meta title">
                <AdminInput name="metaTitle" defaultValue={selectedItem?.metaTitle ?? ""} />
              </AdminField>
              <AdminField label="Canonical URL">
                <AdminInput
                  name="canonicalUrl"
                  defaultValue={selectedItem?.canonicalUrl ?? ""}
                />
              </AdminField>
            </div>

            <AdminField label="Meta description">
              <AdminTextarea
                name="metaDescription"
                rows={4}
                defaultValue={selectedItem?.metaDescription ?? ""}
              />
            </AdminField>

            <div className="flex flex-wrap gap-3 pt-2">
              <SubmitButton>Save recommendation</SubmitButton>
            </div>
          </form>

          {selectedItem ? (
            <form action={archiveRecommendationAction} className="mt-4">
              <input type="hidden" name="id" value={selectedItem.id} />
              <SubmitButton variant="danger">Archive recommendation</SubmitButton>
            </form>
          ) : null}
        </AdminPanel>
      </div>
    </div>
  );
}
