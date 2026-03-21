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
import { getAdminPages } from "@/lib/content/admin-queries";
import { savePageAction } from "@/features/admin/actions";

interface AdminPagesPageProps {
  searchParams: Promise<{ edit?: string }>;
}

export default async function AdminPagesPage({
  searchParams,
}: AdminPagesPageProps) {
  const pages = await getAdminPages();
  const { edit } = await searchParams;
  const selectedPage = pages.find((page) => page.id === edit) ?? pages[0] ?? null;

  return (
    <div className="space-y-8">
      <AdminPageIntro
        eyebrow="Content"
        title="Pages manager"
        description="Manage route-level metadata, visibility, publishing state, and canonical SEO fields."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <AdminPanel>
          <h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">
            Registered pages
          </h2>
          <div className="mt-6 space-y-3">
            {pages.map((page) => (
              <Link
                key={page.id}
                href={`/admin/content/pages?edit=${page.id}`}
                className="block rounded-[1.25rem] border border-border bg-white/55 p-4 transition hover:bg-white/80"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{page.title}</p>
                    <p className="mt-1 text-sm text-muted">
                      {page.pageKey} · {page.slug}
                    </p>
                  </div>
                  <StatusPill tone={page.status === "published" ? "success" : "warning"}>
                    {page.status}
                  </StatusPill>
                </div>
              </Link>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel>
          <h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">
            Edit page metadata
          </h2>
          {selectedPage ? (
            <form action={savePageAction} className="mt-6 grid gap-5">
              <input type="hidden" name="id" defaultValue={selectedPage.id} />

              <div className="grid gap-5 md:grid-cols-2">
                <AdminField label="Page key">
                  <AdminSelect name="pageKey" defaultValue={selectedPage.pageKey}>
                    <option value="home">home</option>
                    <option value="about">about</option>
                    <option value="blogs">blogs</option>
                    <option value="academic">academic</option>
                    <option value="recommendations">recommendations</option>
                    <option value="contact">contact</option>
                  </AdminSelect>
                </AdminField>
                <AdminField label="Title">
                  <AdminInput name="title" defaultValue={selectedPage.title} required />
                </AdminField>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <AdminField label="Slug">
                  <AdminInput name="slug" defaultValue={selectedPage.slug} required />
                </AdminField>
                <AdminField label="Status">
                  <AdminSelect name="status" defaultValue={selectedPage.status}>
                    <option value="draft">draft</option>
                    <option value="published">published</option>
                    <option value="archived">archived</option>
                  </AdminSelect>
                </AdminField>
              </div>

              <AdminCheckbox
                name="isVisible"
                label="Visible to the public"
                defaultChecked={selectedPage.isVisible}
              />

              <AdminField label="Meta title">
                <AdminInput name="metaTitle" defaultValue={selectedPage.metaTitle ?? ""} />
              </AdminField>
              <AdminField label="Meta description">
                <AdminTextarea
                  name="metaDescription"
                  defaultValue={selectedPage.metaDescription ?? ""}
                  rows={3}
                />
              </AdminField>
              <AdminField label="Canonical URL">
                <AdminInput
                  name="canonicalUrl"
                  defaultValue={selectedPage.canonicalUrl ?? ""}
                />
              </AdminField>

              <div className="pt-2">
                <SubmitButton>Save page</SubmitButton>
              </div>
            </form>
          ) : (
            <p className="mt-4 text-sm text-muted">No page records available yet.</p>
          )}
        </AdminPanel>
      </div>
    </div>
  );
}
