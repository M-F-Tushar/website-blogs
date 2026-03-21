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
import {
  getAdminMediaAssets,
  getAdminPageSections,
} from "@/lib/content/admin-queries";
import {
  deletePageSectionAction,
  savePageSectionAction,
} from "@/features/admin/actions";

interface AdminAboutPageManagerProps {
  searchParams: Promise<{ edit?: string }>;
}

const ABOUT_SECTION_TYPES = [
  {
    value: "identity",
    label: "Identity",
  },
  {
    value: "timeline",
    label: "Timeline",
  },
  {
    value: "principles",
    label: "Principles",
  },
  {
    value: "supporting",
    label: "Supporting",
  },
] as const;

export default async function AdminAboutPageManager({
  searchParams,
}: AdminAboutPageManagerProps) {
  const [sections, assets] = await Promise.all([
    getAdminPageSections("about"),
    getAdminMediaAssets(),
  ]);
  const { edit } = await searchParams;
  const selectedSection = sections.find((section) => section.id === edit) ?? null;
  const publicAssets = assets.filter((asset) => Boolean(asset.publicUrl));

  return (
    <div className="space-y-8">
      <AdminPageIntro
        eyebrow="Content"
        title="About page manager"
        description="Edit your identity, learning roadmap, values, and long-term goals without turning the page into a page-builder."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <AdminPanel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">
                About sections
              </h2>
              <p className="mt-2 text-sm text-muted">
                Keep the page structured around depth, roadmap, and values.
              </p>
            </div>
            <Link
              href="/admin/content/about"
              className="rounded-full border border-border-strong px-4 py-2 text-sm"
            >
              New section
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {sections.map((section) => (
              <Link
                key={section.id}
                href={`/admin/content/about?edit=${section.id}`}
                className="block rounded-[1.25rem] border border-border bg-white/55 p-4 transition hover:bg-white/80"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{section.heading}</p>
                    <p className="mt-1 text-sm text-muted">
                      {section.sectionKey} - order {section.sortOrder}
                    </p>
                  </div>
                  <StatusPill tone={section.isVisible ? "success" : "warning"}>
                    {section.isVisible ? "visible" : "hidden"}
                  </StatusPill>
                </div>
              </Link>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel>
          <h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">
            {selectedSection ? "Edit section" : "Create section"}
          </h2>
          <form action={savePageSectionAction} className="mt-6 grid gap-5">
            <input type="hidden" name="id" defaultValue={selectedSection?.id ?? ""} />
            <input type="hidden" name="pageKey" value="about" />

            <div className="grid gap-5 md:grid-cols-2">
              <AdminField label="Section key">
                <AdminInput
                  name="sectionKey"
                  defaultValue={selectedSection?.sectionKey ?? ""}
                  required
                />
              </AdminField>
              <AdminField
                label="Section type"
                hint="Use the fixed About layout types so the public page stays aligned with admin content."
              >
                <AdminSelect
                  name="sectionType"
                  defaultValue={selectedSection?.sectionType ?? "identity"}
                  required
                >
                  {ABOUT_SECTION_TYPES.map((type) => (
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
                rows={3}
                defaultValue={selectedSection?.subheading ?? ""}
              />
            </AdminField>

            <AdminField label="Body markdown">
              <AdminTextarea
                name="bodyMarkdown"
                rows={10}
                defaultValue={selectedSection?.bodyMarkdown ?? ""}
                required
              />
            </AdminField>

            <AdminField
              label="Portrait or section image"
              hint="Choose a public media asset. Identity is used for the main portrait; timeline can act as a fallback."
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

            <div className="grid gap-5 md:grid-cols-2">
              <AdminField label="Sort order">
                <AdminInput
                  name="sortOrder"
                  type="number"
                  defaultValue={String(selectedSection?.sortOrder ?? 10)}
                />
              </AdminField>
              <AdminField
                label="Settings JSON"
                hint='For identity: {"signals":["AI engineering trajectory"],"metrics":[{"label":"Base","value":"CSE and software systems"}]}. For timeline: {"timelineItems":[{"phase":"01","status":"Foundation","title":"Computer science grounding","description":"Core engineering habits, systems thinking, and implementation discipline.","tags":["CSE","systems"],"align":"left"}]}.'
              >
                <AdminTextarea
                  name="settingsJson"
                  rows={5}
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
            <form action={deletePageSectionAction} className="mt-3">
              <input type="hidden" name="id" value={selectedSection.id} />
              <input type="hidden" name="pageKey" value="about" />
              <SubmitButton variant="danger">Delete section</SubmitButton>
            </form>
          ) : null}
        </AdminPanel>
      </div>
    </div>
  );
}
