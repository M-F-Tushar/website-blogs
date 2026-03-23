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
import { getAdminMediaAssets, getAdminPosts } from "@/lib/content/admin-queries";
import { archivePostAction, savePostAction } from "@/features/admin/content-actions";

interface AdminPostsPageProps {
  searchParams: Promise<{ edit?: string }>;
}

export default async function AdminPostsPage({
  searchParams,
}: AdminPostsPageProps) {
  const [posts, assets] = await Promise.all([getAdminPosts(), getAdminMediaAssets()]);
  const { edit } = await searchParams;
  const selectedPost = posts.find((post) => post.id === edit) ?? null;

  return (
    <div className="space-y-8">
      <AdminPageIntro
        eyebrow="Collections"
        title="Posts"
        description="Write in markdown, preview the final rendering, insert embedded media, and keep publish metadata close to the actual draft."
        actions={
          <Link
            href="/admin/content/posts"
            className="inline-flex items-center justify-center rounded-full border border-border-strong px-5 py-3 text-sm font-medium text-foreground transition hover:bg-white/60"
          >
            New post
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.88fr_minmax(0,1.12fr)]">
        <AdminPanel className="admin-panel-quiet xl:sticky xl:top-6 xl:self-start">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
                Writing library
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted">
                Pick an entry to continue editing, or start a fresh draft.
              </p>
            </div>
            <StatusPill>{posts.length} total</StatusPill>
          </div>

          <div className="mt-6 space-y-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/admin/content/posts?edit=${post.id}`}
                className="admin-list-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{post.title}</p>
                    <p className="mt-1 text-sm text-muted">
                      /blogs/{post.slug} | {post.categories.join(", ") || "uncategorized"}
                    </p>
                    {post.excerpt ? (
                      <p className="mt-2 text-sm leading-7 text-muted">{post.excerpt}</p>
                    ) : null}
                  </div>
                  <StatusPill tone={post.status === "published" ? "success" : "warning"}>
                    {post.status}
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
                {selectedPost ? "Edit post" : "Create post"}
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted">
                Use markdown for the full article body. The live renderer supports code fences,
                tables, task lists, embedded images, and Mermaid diagrams.
              </p>
            </div>
            {selectedPost ? (
              <Link
                href={`/blogs/${selectedPost.slug}`}
                target="_blank"
                className="inline-flex items-center justify-center rounded-full border border-border-strong px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white/60"
              >
                View live article
              </Link>
            ) : null}
          </div>

          <form
            key={selectedPost?.id ?? "new-post"}
            action={savePostAction}
            className="mt-6 grid gap-5"
          >
            <input type="hidden" name="id" defaultValue={selectedPost?.id ?? ""} />

            <AdminField label="Title">
              <AdminInput name="title" defaultValue={selectedPost?.title ?? ""} required />
            </AdminField>

            <div className="grid gap-5 md:grid-cols-2">
              <AdminField label="Slug">
                <AdminInput name="slug" defaultValue={selectedPost?.slug ?? ""} />
              </AdminField>
              <AdminField label="Status">
                <AdminSelect name="status" defaultValue={selectedPost?.status ?? "draft"}>
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                  <option value="archived">archived</option>
                </AdminSelect>
              </AdminField>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <AdminField label="Published at">
                <AdminInput
                  name="publishedAt"
                  type="datetime-local"
                  defaultValue={selectedPost?.publishedAt?.slice(0, 16) ?? ""}
                />
              </AdminField>
              <MediaAssetPicker
                key={`post-cover-${selectedPost?.id ?? "new"}`}
                label="Cover image"
                name="coverAssetId"
                assets={assets}
                selectedAssetId={selectedPost?.coverAssetId ?? null}
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <AdminField label="Categories" hint="Comma-separated">
                <AdminInput
                  name="categories"
                  defaultValue={selectedPost?.categories.join(", ") ?? ""}
                />
              </AdminField>
              <AdminField label="Tags" hint="Comma-separated">
                <AdminInput name="tags" defaultValue={selectedPost?.tags.join(", ") ?? ""} />
              </AdminField>
            </div>

            <AdminCheckbox
              name="featured"
              label="Featured post"
              defaultChecked={selectedPost?.featured ?? false}
            />

            <AdminField label="Excerpt">
              <AdminTextarea
                name="excerpt"
                rows={4}
                defaultValue={selectedPost?.excerpt ?? ""}
              />
            </AdminField>

            <MarkdownEditorField
              key={`post-markdown-${selectedPost?.id ?? "new"}`}
              name="bodyMarkdown"
              label="Article markdown"
              defaultValue={selectedPost?.bodyMarkdown ?? ""}
              hint="The preview uses the same markdown renderer as the public site."
              assets={assets}
              variant="post"
              required
              minHeightClassName="min-h-[28rem]"
            />

            <div className="grid gap-5 md:grid-cols-2">
              <AdminField label="Meta title">
                <AdminInput name="metaTitle" defaultValue={selectedPost?.metaTitle ?? ""} />
              </AdminField>
              <AdminField label="Canonical URL">
                <AdminInput
                  name="canonicalUrl"
                  defaultValue={selectedPost?.canonicalUrl ?? ""}
                />
              </AdminField>
            </div>

            <AdminField label="Meta description">
              <AdminTextarea
                name="metaDescription"
                rows={4}
                defaultValue={selectedPost?.metaDescription ?? ""}
              />
            </AdminField>

            <div className="flex flex-wrap gap-3 pt-2">
              <SubmitButton>Save post</SubmitButton>
            </div>
          </form>

          {selectedPost ? (
            <form action={archivePostAction} className="mt-4">
              <input type="hidden" name="id" value={selectedPost.id} />
              <SubmitButton variant="danger">Archive post</SubmitButton>
            </form>
          ) : null}
        </AdminPanel>
      </div>
    </div>
  );
}
