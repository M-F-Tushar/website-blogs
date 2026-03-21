import Link from "next/link";

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
import { getAdminPosts } from "@/lib/content/admin-queries";
import {
  archivePostAction,
  savePostAction,
} from "@/features/admin/content-actions";

interface AdminPostsPageProps {
  searchParams: Promise<{ edit?: string }>;
}

export default async function AdminPostsPage({
  searchParams,
}: AdminPostsPageProps) {
  const posts = await getAdminPosts();
  const { edit } = await searchParams;
  const selectedPost = posts.find((post) => post.id === edit) ?? null;

  return (
    <div className="space-y-8">
      <AdminPageIntro
        eyebrow="Content"
        title="Blog manager"
        description="Create, publish, archive, and refine blog posts with controlled metadata and normalized taxonomy."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <AdminPanel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">
                Posts
              </h2>
              <p className="mt-2 text-sm text-muted">
                Drafts, published writing, and archived entries.
              </p>
            </div>
            <Link
              href="/admin/content/posts"
              className="rounded-full border border-border-strong px-4 py-2 text-sm"
            >
              New post
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/admin/content/posts?edit=${post.id}`}
                className="block rounded-[1.25rem] border border-border bg-white/55 p-4 transition hover:bg-white/80"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{post.title}</p>
                    <p className="mt-1 text-sm text-muted">
                      /blogs/{post.slug} · {post.categories.join(", ") || "uncategorized"}
                    </p>
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
          <h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">
            {selectedPost ? "Edit post" : "Create post"}
          </h2>
          <form action={savePostAction} className="mt-6 grid gap-5">
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
              <AdminField label="Cover asset ID">
                <AdminInput
                  name="coverAssetId"
                  defaultValue={selectedPost?.coverUrl ? "" : ""}
                  placeholder="Paste a media asset UUID"
                />
              </AdminField>
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
                rows={3}
                defaultValue={selectedPost?.excerpt ?? ""}
              />
            </AdminField>

            <AdminField label="Body markdown">
              <AdminTextarea
                name="bodyMarkdown"
                rows={14}
                defaultValue={selectedPost?.bodyMarkdown ?? ""}
                required
              />
            </AdminField>

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
                rows={3}
                defaultValue={selectedPost?.metaDescription ?? ""}
              />
            </AdminField>

            <div className="pt-2">
              <SubmitButton>Save post</SubmitButton>
            </div>
          </form>

          {selectedPost ? (
            <form action={archivePostAction} className="mt-3">
              <input type="hidden" name="id" value={selectedPost.id} />
              <SubmitButton variant="danger">Archive post</SubmitButton>
            </form>
          ) : null}
        </AdminPanel>
      </div>
    </div>
  );
}
