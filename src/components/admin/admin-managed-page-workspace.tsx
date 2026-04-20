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

const PAGE_EDITOR_GUIDES: Record<
  PageKey,
  {
    overview: string;
    publicAreas: Array<{ title: string; description: string; sectionKeys: string[] }>;
  }
> = {
  home: {
    overview:
      "The homepage is the front door of the website. Edit the welcome text, main buttons, featured writing area, recent sections, and final contact prompt here.",
    publicAreas: [
      {
        title: "Top welcome area",
        description: "Name, intro sentence, buttons, and small focus labels.",
        sectionKeys: ["hero"],
      },
      {
        title: "Featured writing",
        description: "Heading and intro beside the main featured article.",
        sectionKeys: ["featured-writing"],
      },
      {
        title: "Recent updates",
        description: "Intro text above the latest posts list and topic sidebar.",
        sectionKeys: ["recent-updates"],
      },
      {
        title: "Study and resources previews",
        description: "Headings for academic and recommendation preview blocks.",
        sectionKeys: ["academic-preview", "recommendations-preview"],
      },
      {
        title: "Stay connected",
        description: "Bottom contact/newsletter style section.",
        sectionKeys: ["connect"],
      },
    ],
  },
  about: {
    overview:
      "The about page explains who you are, what you are learning, and how your story is developing.",
    publicAreas: [
      {
        title: "Profile introduction",
        description: "Name, tagline, portrait, and current focus.",
        sectionKeys: ["identity", "who-i-am"],
      },
      {
        title: "Journey timeline",
        description: "The step-by-step story shown in the timeline area.",
        sectionKeys: ["timeline", "roadmap"],
      },
      {
        title: "Supporting values",
        description: "Additional principles, notes, or supporting blocks.",
        sectionKeys: ["principles", "supporting", "values"],
      },
    ],
  },
  blogs: {
    overview:
      "The blog page introduces the writing archive. Actual blog posts are managed separately in Blog posts.",
    publicAreas: [
      {
        title: "Blog archive introduction",
        description: "Badge, title, and description above the search/filter area.",
        sectionKeys: ["hero", "intro"],
      },
      {
        title: "Supporting context",
        description: "Optional extra copy that explains what the writing is about.",
        sectionKeys: ["detail", "support", "why-writing"],
      },
    ],
  },
  academic: {
    overview:
      "The academic page introduces coursework, research notes, and experiments. Individual records are managed separately.",
    publicAreas: [
      {
        title: "Academic archive introduction",
        description: "Badge, title, and description above the academic records.",
        sectionKeys: ["hero", "intro"],
      },
      {
        title: "Supporting context",
        description: "Optional text that explains the study or research direction.",
        sectionKeys: ["detail", "support", "study-system"],
      },
    ],
  },
  recommendations: {
    overview:
      "The recommendations page introduces curated books, tools, courses, and resources. Individual resources are managed separately.",
    publicAreas: [
      {
        title: "Recommendations introduction",
        description: "Badge, title, and description above the resource archive.",
        sectionKeys: ["hero", "intro"],
      },
      {
        title: "Curation notes",
        description: "Optional text about why these resources are worth saving.",
        sectionKeys: ["detail", "support", "curation-rule"],
      },
    ],
  },
  contact: {
    overview:
      "The contact page controls how people reach you. Use the quick contact editor for normal changes.",
    publicAreas: [
      {
        title: "Contact intro",
        description: "Top heading and explanation.",
        sectionKeys: ["hero"],
      },
      {
        title: "Contact cards",
        description: "Email, GitHub, LinkedIn, and location cards.",
        sectionKeys: ["email", "github", "linkedin", "location"],
      },
      {
        title: "Form and FAQ",
        description: "Contact form labels, badge, and frequently asked questions.",
        sectionKeys: ["form"],
      },
    ],
  },
};

function humanizeKey(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getSectionLabel(
  section: { sectionKey: string; sectionType: string },
  sectionTypes: readonly SectionTypeOption[],
) {
  const typeLabel = sectionTypes.find((type) => type.value === section.sectionType)?.label;
  return typeLabel
    ? `${typeLabel}: ${humanizeKey(section.sectionKey)}`
    : humanizeKey(section.sectionKey);
}

function getAreaForSection(pageKey: PageKey, sectionKey: string) {
  return PAGE_EDITOR_GUIDES[pageKey].publicAreas.find((area) =>
    area.sectionKeys.includes(sectionKey),
  );
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
  const guide = PAGE_EDITOR_GUIDES[pageKey];
  const visibleSectionCount = sections.filter((section) => section.isVisible).length;
  const selectedArea = selectedSection
    ? getAreaForSection(pageKey, selectedSection.sectionKey)
    : null;

  return (
    <div className="space-y-8">
      {showIntro ? (
        <AdminPageIntro
          eyebrow="Public page editor"
          title={`Edit ${pageTitle}`}
          description={guide.overview}
          actions={[
            <Link
              key="view-live"
              href={publicPath}
              target="_blank"
              className="inline-flex items-center justify-center rounded-full border border-border-strong px-5 py-3 text-sm font-medium text-foreground transition hover:bg-white/60"
            >
              View live page
            </Link>,
            ...collectionActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="inline-flex items-center justify-center rounded-full border border-border-strong px-5 py-3 text-sm font-medium text-foreground transition hover:bg-white/60"
              >
                {action.label}
              </Link>
            )),
          ]}
        />
      ) : null}

      <AdminPanel className="admin-panel-quiet">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-accent-strong">
              What can you edit here?
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-foreground">
              Page map for {pageTitle}
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted">{description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill>{sections.length} sections</StatusPill>
            <StatusPill tone={visibleSectionCount > 0 ? "success" : "warning"}>
              {visibleSectionCount} visible
            </StatusPill>
          </div>
        </div>

        <div className="mt-7 divide-y divide-border">
          {guide.publicAreas.map((area) => {
            const matches = sections.filter((section) =>
              area.sectionKeys.includes(section.sectionKey),
            );

            return (
              <div
                key={area.title}
                className="grid gap-4 py-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"
              >
                <div>
                  <p className="font-display text-xl font-semibold tracking-[-0.04em] text-foreground">
                    {area.title}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-muted">{area.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {matches.length > 0 ? (
                    matches.map((section) => (
                      <Link
                        key={section.id}
                        href={`${adminRoute}?edit=${section.id}`}
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent/30 hover:bg-white"
                      >
                        <span>{section.heading || getSectionLabel(section, sectionTypes)}</span>
                        <span className="font-mono text-[0.64rem] uppercase tracking-[0.2em] text-muted">
                          Edit
                        </span>
                      </Link>
                    ))
                  ) : (
                    <span className="rounded-full border border-dashed border-border px-4 py-2 text-sm text-muted">
                      No section connected yet
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </AdminPanel>

      <div className="grid gap-6 xl:grid-cols-[minmax(300px,0.78fr)_minmax(0,1.22fr)]">
        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <AdminPanel className="admin-panel-quiet">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
                  Choose what to edit
                </p>
                <p className="mt-2 text-sm leading-7 text-muted">
                  Pick the public section you want to change. The list follows the page
                  structure.
                </p>
              </div>
              <Link
                href={adminRoute}
                className="rounded-full border border-border-strong px-4 py-2 text-sm text-foreground transition hover:bg-white/70"
              >
                Add section
              </Link>
            </div>

            <div className="mt-6 divide-y divide-border">
              {sections.length === 0 ? (
                <div className="rounded-[1.3rem] border border-dashed border-border bg-white/45 p-5 text-sm text-muted">
                  No sections yet. Start by creating the first editable part for this page.
                </div>
              ) : null}

              {sections.map((section) => {
                const area = getAreaForSection(pageKey, section.sectionKey);
                const isActive = selectedSection?.id === section.id;

                return (
                  <Link
                    key={section.id}
                    href={`${adminRoute}?edit=${section.id}`}
                    className={`block py-4 transition ${
                      isActive
                        ? "text-accent-strong"
                        : "text-foreground hover:text-accent-strong"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          {section.heading || getSectionLabel(section, sectionTypes)}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-muted">
                          {area?.title ?? "Saved section not shown on the public page"}
                        </p>
                      </div>
                      <StatusPill tone={section.isVisible ? "success" : "warning"}>
                        {section.isVisible ? "visible" : "hidden"}
                      </StatusPill>
                    </div>
                  </Link>
                );
              })}
            </div>
          </AdminPanel>

          <details className="surface-panel rounded-[1.5rem] p-5">
            <summary className="cursor-pointer list-none font-display text-xl font-semibold tracking-[-0.04em] text-foreground">
              Page visibility and search settings
            </summary>
            <p className="mt-2 text-sm leading-7 text-muted">
              Use this when you need to rename the page, hide it, or adjust search engine text.
              Most day-to-day editing happens in the section editor.
            </p>

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
                    label="Public address"
                    hint="Locked so links around the website keep working."
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
                  <AdminField label="Search title">
                    <AdminInput name="metaTitle" defaultValue={page.metaTitle ?? ""} />
                  </AdminField>
                  <AdminField label="Canonical URL">
                    <AdminInput
                      name="canonicalUrl"
                      defaultValue={page.canonicalUrl ?? ""}
                    />
                  </AdminField>
                </div>

                <AdminField label="Search description">
                  <AdminTextarea
                    name="metaDescription"
                    rows={4}
                    defaultValue={page.metaDescription ?? ""}
                  />
                </AdminField>

                <SubmitButton>Save page settings</SubmitButton>
              </form>
            ) : (
              <p className="mt-4 text-sm text-muted">No page record exists for this route yet.</p>
            )}
          </details>
        </div>

        <AdminPanel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
                {selectedSection ? "Edit selected public part" : "Create a new public part"}
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted">
                Change the public wording first. Technical fields are below in advanced
                options.
              </p>
            </div>
          </div>

          {selectedArea ? (
            <div className="mt-6 rounded-[1.2rem] border border-accent/20 bg-accent-soft p-4">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-accent-strong">
                This edits
              </p>
              <p className="mt-2 font-medium text-foreground">{selectedArea.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{selectedArea.description}</p>
            </div>
          ) : selectedSection ? (
            <div className="mt-6 rounded-[1.2rem] border border-amber-300/40 bg-amber-50/80 p-4">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-amber-700">
                Saved, but not currently shown
              </p>
              <p className="mt-2 text-sm leading-6 text-amber-900">
                This section exists in the database, but the current public page layout does
                not render it directly. It can still be saved here, but visitor-facing changes
                may not appear until the layout is wired to this section.
              </p>
            </div>
          ) : null}

          <form action={savePageSectionAction} className="mt-6 grid gap-5">
            <input type="hidden" name="id" defaultValue={selectedSection?.id ?? ""} />
            <input type="hidden" name="pageKey" value={pageKey} />
            <input type="hidden" name="returnTo" value={adminRoute} />

            {!selectedSection ? (
              <div className="grid gap-5 md:grid-cols-2">
                <AdminField
                  label="Section name"
                  hint="Short lowercase name, such as hero, intro, timeline, or form."
                >
                  <AdminInput name="sectionKey" required />
                </AdminField>
                <AdminField label="Where this appears">
                  <AdminSelect
                    name="sectionType"
                    defaultValue={sectionTypes[0]?.value ?? ""}
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
            ) : null}

            <AdminField label="Main heading">
              <AdminInput
                name="heading"
                defaultValue={selectedSection?.heading ?? ""}
                required
              />
            </AdminField>

            <AdminField label="Short description">
              <AdminTextarea
                name="subheading"
                rows={4}
                defaultValue={selectedSection?.subheading ?? ""}
              />
            </AdminField>

            <MarkdownEditorField
              name="bodyMarkdown"
              label="Long content"
              defaultValue={selectedSection?.bodyMarkdown ?? ""}
              hint="Use this for longer page copy. The toolbar can add headings, lists, links, images, and code blocks."
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

            <div className="flex flex-wrap gap-6">
              <AdminCheckbox
                name="isVisible"
                label="Show this section on the public page"
                defaultChecked={selectedSection?.isVisible ?? true}
              />
            </div>

            <details className="rounded-[1.25rem] border border-border bg-white/50 p-4">
              <summary className="cursor-pointer list-none font-medium text-foreground">
                Advanced section controls
              </summary>
              <p className="mt-2 text-sm leading-7 text-muted">
                Use these only when the section needs a different internal name, placement,
                order, or custom display data.
              </p>

              {selectedSection ? (
                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <AdminField
                    label="Section ID"
                    hint="The website uses this to connect the editor to the right public block."
                  >
                    <AdminInput
                      name="sectionKey"
                      defaultValue={selectedSection.sectionKey}
                      required
                    />
                  </AdminField>
                  <AdminField label="Section type">
                    <AdminSelect
                      name="sectionType"
                      defaultValue={selectedSection.sectionType}
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
              ) : null}

              <div className="mt-5 grid gap-5 md:grid-cols-[12rem_minmax(0,1fr)]">
                <AdminField label="Display order">
                  <AdminInput
                    name="sortOrder"
                    type="number"
                    defaultValue={String(selectedSection?.sortOrder ?? 10)}
                  />
                </AdminField>
                <AdminField label="Custom display settings" hint={settingsHint}>
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

              <div className="mt-5">
                <AdminCheckbox
                  name="featured"
                  label="Mark as featured"
                  defaultChecked={selectedSection?.featured ?? false}
                />
              </div>
            </details>

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
  );
}
