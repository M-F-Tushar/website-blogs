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
import { deletePageSectionAction, savePageSectionAction } from "@/features/admin/actions";
import type { PageKey } from "@/types/content";

interface SectionTypeOption {
  value: string;
  label: string;
}

interface AdminPageSectionManagerProps {
  pageKey: PageKey;
  pageTitle: string;
  description: string;
  sectionTypes: readonly SectionTypeOption[];
  settingsHint: string;
  searchParams: Promise<{ edit?: string }>;
  allowImage?: boolean;
  imageHint?: string;
}

export async function AdminPageSectionManager({
  pageKey,
  pageTitle,
  description,
  sectionTypes,
  settingsHint,
  searchParams,
  allowImage = false,
  imageHint,
}: AdminPageSectionManagerProps) {
  const [sections, assets] = await Promise.all([
    getAdminPageSections(pageKey),
    allowImage ? getAdminMediaAssets() : Promise.resolve([]),
  ]);
  const { edit } = await searchParams;
  const selectedSection = sections.find((section) => section.id === edit) ?? null;
  const publicAssets = assets.filter((asset) => Boolean(asset.publicUrl));
  const pageLabel = `${pageTitle} page`;

  return (
    <div className="space-y-8">
      <AdminPageIntro
        eyebrow="Content"
        title={`${pageTitle} page manager`}
        description={description}
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <AdminPanel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">
                {pageTitle} sections
              </h2>
              <p className="mt-2 text-sm text-muted">
                Manage the sections that shape the live {pageLabel} experience.
              </p>
            </div>
            <Link
              href={`/admin/content/${pageKey === "recommendations" ? "recommendations-page" : pageKey === "academic" ? "academic-page" : pageKey}`}
              className="rounded-full border border-border-strong px-4 py-2 text-sm"
            >
              New section
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {sections.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-border bg-white/50 p-4 text-sm text-muted">
                No sections yet. Create the first section to make this page fully CMS-driven.
              </div>
            ) : null}
            {sections.map((section) => (
              <Link
                key={section.id}
                href={`/admin/content/${pageKey === "recommendations" ? "recommendations-page" : pageKey === "academic" ? "academic-page" : pageKey}?edit=${section.id}`}
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
            <input type="hidden" name="pageKey" value={pageKey} />

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

            <div className="grid gap-5 md:grid-cols-2">
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
                  rows={5}
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
            <form action={deletePageSectionAction} className="mt-3">
              <input type="hidden" name="id" value={selectedSection.id} />
              <input type="hidden" name="pageKey" value={pageKey} />
              <SubmitButton variant="danger">Delete section</SubmitButton>
            </form>
          ) : null}
        </AdminPanel>
      </div>
    </div>
  );
}
