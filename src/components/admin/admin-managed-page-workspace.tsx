import Link from "next/link";

import { MarkdownEditorField } from "@/components/admin/markdown-editor-field";
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
  getAdminPageSections,
  getAdminPages,
} from "@/lib/content/admin-queries";
import { DEFAULT_TOP_LEVEL_PAGE_PATHS } from "@/lib/content/page-routing";
import {
  deletePageSectionAction,
  savePageAction,
  savePageSectionAction,
} from "@/features/admin/actions";
import type { PageKey } from "@/types/content";

interface SectionTypeOption {
  value: string;
  label: string;
}

interface AdminManagedPageWorkspaceProps {
  pageKey: PageKey;
  pageTitle: string;
  description: string;
  sectionTypes: readonly SectionTypeOption[];
  settingsHint: string;
  searchParams: Promise<{ edit?: string }>;
  adminRoute: string;
  showIntro?: boolean;
  collectionActions?: readonly {
    href: string;
    label: string;
  }[];
  allowImage?: boolean;
  imageHint?: string;
}

export async function AdminManagedPageWorkspace({
  pageKey,
  pageTitle,
  description,
  sectionTypes,
  settingsHint,
  searchParams,
  adminRoute,
  showIntro = true,
  collectionActions = [],
  allowImage = false,
  imageHint,
}: AdminManagedPageWorkspaceProps) {
  const [pages, sections, assets] = await Promise.all([
    getAdminPages(),
    getAdminPageSections(pageKey),
    allowImage ? getAdminMediaAssets() : Promise.resolve([]),
  ]);
  const { edit } = await searchParams;
  const page = pages.find((item) => item.pageKey === pageKey) ?? null;
  const selectedSection = sections.find((section) => section.id === edit) ?? null;
  const publicAssets = assets.filter((asset) => Boolean(asset.publicUrl));
  const publicPath = DEFAULT_TOP_LEVEL_PAGE_PATHS[pageKey];

  return (
    <div className="space-y-8">
      {showIntro ? (
        <AdminPageIntro
          eyebrow="Page workspace"
          title={`${pageTitle} page`}
          description={description}
          actions={
            collectionActions.length > 0
              ? collectionActions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="inline-flex items-center justify-center rounded-full border border-border-strong px-5 py-3 text-sm font-medium text-foreground transition hover:bg-white/60"
                  >
                    {action.label}
                  </Link>
                ))
              : undefined
          }
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <AdminPanel className="admin-panel-quiet">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
                  Route control
                </p>
                <p className="mt-2 text-sm leading-7 text-muted">
                  This is the single control surface for the live {pageTitle.toLowerCase()} page:
                  metadata, visibility, route, and section structure.
                </p>
              </div>
              {page ? (
                <StatusPill tone={page.status === "published" ? "success" : "warning"}>
                  {page.status}
                </StatusPill>
              ) : null}
            </div>

            {page ? (
              <form action={savePageAction} className="mt-6 grid gap-5">
                <input type="hidden" name="id" value={page.id} />
                <input type="hidden" name="pageKey" value={pageKey} />
                <input type="hidden" name="returnTo" value={adminRoute} />
                <input type="hidden" name="slug" value={publicPath} />

                <AdminField label="Page title">
                  <AdminInput name="title" defaultValue={page.title} required />
                </AdminField>

                <div className="grid gap-5 md:grid-cols-2">
                  <AdminField
                    label="Public path"
                    hint="Top-level page paths are fixed in code so navigation, redirects, and nested content routes stay stable in production."
                  >
                    <AdminInput
                      value={publicPath}
                      readOnly
                      aria-readonly="true"
                      className="cursor-not-allowed bg-slate-100/80 text-slate-500"
                    />
                  </AdminField>
                  <AdminField label="Publishing status">
                    <AdminSelect name="status" defaultValue={page.status}>
                      <option value="draft">draft</option>
                      <option value="published">published</option>
                      <option value="archived">archived</option>
                    </AdminSelect>
                  </AdminField>
                </div>

                <AdminCheckbox
                  name="isVisible"
                  label="Visible to the public"
                  defaultChecked={page.isVisible}
                />

                <div className="grid gap-5 md:grid-cols-2">
                  <AdminField label="Meta title">
                    <AdminInput name="metaTitle" defaultValue={page.metaTitle ?? ""} />
                  </AdminField>
                  <AdminField label="Canonical URL">
                    <AdminInput
                      name="canonicalUrl"
                      defaultValue={page.canonicalUrl ?? ""}
                    />
                  </AdminField>
                </div>

                <AdminField label="Meta description">
                  <AdminTextarea
                    name="metaDescription"
                    rows={4}
                    defaultValue={page.metaDescription ?? ""}
                  />
                </AdminField>

                <div className="flex flex-wrap gap-3">
                  <SubmitButton>Save page setup</SubmitButton>
                  <Link
                    href={publicPath}
                    target="_blank"
                    className="inline-flex items-center justify-center rounded-full border border-border-strong px-5 py-3 text-sm font-medium text-foreground transition hover:bg-white/60"
                  >
                    View live page
                  </Link>
                </div>
              </form>
            ) : (
              <p className="mt-4 text-sm text-muted">No page record exists for this route yet.</p>
            )}
          </AdminPanel>

          <AdminPanel className="admin-panel-quiet">
            <p className="font-display text-xl font-semibold tracking-[-0.04em] text-foreground">
              Section architecture
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="admin-mini-stat">
                <span className="admin-mini-label">Sections</span>
                <span className="admin-mini-value">{sections.length}</span>
              </div>
              <div className="admin-mini-stat">
                <span className="admin-mini-label">Visible</span>
                <span className="admin-mini-value">
                  {sections.filter((section) => section.isVisible).length}
                </span>
              </div>
              <div className="admin-mini-stat">
                <span className="admin-mini-label">Public route</span>
                <span className="admin-mini-value text-base">{publicPath}</span>
              </div>
            </div>
            <div className="mt-5 rounded-[1.3rem] border border-border bg-white/55 p-4">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-muted">
                Section settings guide
              </p>
              <p className="mt-3 text-sm leading-7 text-muted">{settingsHint}</p>
            </div>
          </AdminPanel>
        </div>

        <div className="space-y-6">
          <AdminPanel>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
                  Editable sections
                </h2>
                <p className="mt-2 text-sm leading-7 text-muted">
                  Each section stays designated inside this page workspace so copy and structure
                  are controlled together.
                </p>
              </div>
              <Link
                href={adminRoute}
                className="rounded-full border border-border-strong px-4 py-2 text-sm text-foreground transition hover:bg-white/70"
              >
                New section
              </Link>
            </div>

            <div className="mt-6 grid gap-3">
              {sections.length === 0 ? (
                <div className="rounded-[1.3rem] border border-dashed border-border bg-white/45 p-5 text-sm text-muted">
                  No sections yet. Start by creating the first section for this page.
                </div>
              ) : null}

              {sections.map((section) => (
                <Link
                  key={section.id}
                  href={`${adminRoute}?edit=${section.id}`}
                  className="admin-list-card"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{section.heading}</p>
                      <p className="mt-1 text-sm text-muted">
                        {section.sectionType} / {section.sectionKey} / order {section.sortOrder}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {section.featured ? <StatusPill>featured</StatusPill> : null}
                      <StatusPill tone={section.isVisible ? "success" : "warning"}>
                        {section.isVisible ? "visible" : "hidden"}
                      </StatusPill>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
                  {selectedSection ? "Edit section" : "Create section"}
                </h2>
                <p className="mt-2 text-sm leading-7 text-muted">
                  Section copy is markdown-enabled, so you can use structure, code, images,
                  tables, and mermaid diagrams directly from admin.
                </p>
              </div>
            </div>

            <form action={savePageSectionAction} className="mt-6 grid gap-5">
              <input type="hidden" name="id" defaultValue={selectedSection?.id ?? ""} />
              <input type="hidden" name="pageKey" value={pageKey} />
              <input type="hidden" name="returnTo" value={adminRoute} />

              <div className="grid gap-5 md:grid-cols-2">
                <AdminField label="Section key">
                  <AdminInput
                    name="sectionKey"
                    defaultValue={selectedSection?.sectionKey ?? ""}
                    required
                  />
                </AdminField>
                <AdminField label="Section type">
                  <AdminSelect
                    name="sectionType"
                    defaultValue={selectedSection?.sectionType ?? sectionTypes[0]?.value ?? ""}
                    required
                  >
                    {sectionTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
              </div>

              <AdminField label="Heading">
                <AdminInput
                  name="heading"
                  defaultValue={selectedSection?.heading ?? ""}
                  required
                />
              </AdminField>

              <AdminField label="Subheading">
                <AdminTextarea
                  name="subheading"
                  rows={4}
                  defaultValue={selectedSection?.subheading ?? ""}
                />
              </AdminField>

              <MarkdownEditorField
                name="bodyMarkdown"
                label="Body markdown"
                defaultValue={selectedSection?.bodyMarkdown ?? ""}
                hint="Use markdown for narrative copy, code samples, checklists, tables, image embeds, and Mermaid diagrams."
                variant="section"
                assets={publicAssets}
                required
                minHeightClassName="min-h-[20rem]"
              />

              {allowImage ? (
                <AdminField
                  label="Section image"
                  hint={imageHint ?? "Choose a public media asset for this section."}
                >
                  <AdminSelect
                    name="imageAssetId"
                    defaultValue={selectedSection?.imageAssetId ?? ""}
                  >
                    <option value="">No image selected</option>
                    {publicAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.label ?? asset.objectPath}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
              ) : null}

              <div className="grid gap-5 md:grid-cols-[12rem_minmax(0,1fr)]">
                <AdminField label="Sort order">
                  <AdminInput
                    name="sortOrder"
                    type="number"
                    defaultValue={String(selectedSection?.sortOrder ?? 10)}
                  />
                </AdminField>
                <AdminField label="Settings JSON" hint={settingsHint}>
                  <AdminTextarea
                    name="settingsJson"
                    rows={8}
                    spellCheck={false}
                    placeholder="{}"
                    className="font-mono"
                    defaultValue={JSON.stringify(selectedSection?.settings ?? {}, null, 2)}
                  />
                </AdminField>
              </div>

              <div className="flex flex-wrap gap-6">
                <AdminCheckbox
                  name="isVisible"
                  label="Visible"
                  defaultChecked={selectedSection?.isVisible ?? true}
                />
                <AdminCheckbox
                  name="featured"
                  label="Featured"
                  defaultChecked={selectedSection?.featured ?? false}
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <SubmitButton>Save section</SubmitButton>
              </div>
            </form>

            {selectedSection ? (
              <form action={deletePageSectionAction} className="mt-4">
                <input type="hidden" name="id" value={selectedSection.id} />
                <input type="hidden" name="pageKey" value={pageKey} />
                <input type="hidden" name="returnTo" value={adminRoute} />
                <SubmitButton variant="danger">Delete section</SubmitButton>
              </form>
            ) : null}
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}
