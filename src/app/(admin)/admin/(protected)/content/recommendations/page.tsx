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
        description="Curate books, tools, and resources with the exact details the public recommendation page needs: what it offers, who it helps, why it is worth the time, and when someone should use it."
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

          <form
            key={selectedItem?.id ?? "new-recommendation"}
            action={saveRecommendationAction}
            className="mt-6 grid gap-5"
          >
            <input type="hidden" name="id" defaultValue={selectedItem?.id ?? ""} />

            <AdminField label="Title">
              <AdminInput name="title" defaultValue={selectedItem?.title ?? ""} required />
            </AdminField>

            <div className="grid gap-5 md:grid-cols-2">
              <AdminField label="Slug">
                <AdminInput name="slug" defaultValue={selectedItem?.slug ?? ""} />
              </AdminField>
              <AdminField label="Category" hint="Shown as the public recommendation type.">
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
              <AdminField
                label="Audience"
                hint="Required. This powers the public 'who gets the most from it' section."
              >
                <AdminInput
                  name="audience"
                  defaultValue={selectedItem?.audience ?? ""}
                  placeholder="Students moving from fundamentals into applied ML work"
                />
              </AdminField>
              <AdminField
                label="Use case"
                hint="Required. Explain when or how someone should use this recommendation."
              >
                <AdminInput
                  name="useCase"
                  defaultValue={selectedItem?.useCase ?? ""}
                  placeholder="Building intuition while implementing end-to-end workflows"
                />
              </AdminField>
            </div>

            <AdminField label="External URL">
              <AdminInput
                name="externalUrl"
                defaultValue={selectedItem?.externalUrl ?? ""}
              />
            </AdminField>

            <MediaAssetPicker
              key={`recommendation-cover-${selectedItem?.id ?? "new"}`}
              label="Cover image"
              name="coverAssetId"
              assets={assets}
              selectedAssetId={selectedItem?.coverAssetId ?? null}
              hint="This image supports the recommendation hero. Upload it in Media with meaningful alt text first."
            />

            <AdminCheckbox
              name="featured"
              label="Featured recommendation"
              defaultChecked={selectedItem?.featured ?? false}
            />

            <AdminField
              label="Summary"
              hint="Required. This is the main promise line in the recommendation hero."
            >
              <AdminTextarea
                name="summary"
                rows={4}
                defaultValue={selectedItem?.summary ?? ""}
                placeholder="Explain what this recommendation offers and why someone should care in 1-2 sentences."
              />
            </AdminField>

            <AdminField
              label="Why recommend it"
              hint="Required. This powers the main value framing on the public recommendation page."
            >
              <AdminTextarea
                name="whyRecommend"
                rows={4}
                defaultValue={selectedItem?.whyRecommend ?? ""}
                placeholder="Explain what makes this resource genuinely useful, trustworthy, or worth the time."
              />
            </AdminField>

            <MarkdownEditorField
              key={`recommendation-markdown-${selectedItem?.id ?? "new"}`}
              name="bodyMarkdown"
              label="Recommendation markdown"
              defaultValue={selectedItem?.bodyMarkdown ?? ""}
              hint="Use this for longer rationale, comparisons, cautions, setup notes, or examples. Keep it supportive of the recommendation instead of turning it into a blog post."
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

            <AdminField label="Meta description" hint="Used for search previews and social sharing.">
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
