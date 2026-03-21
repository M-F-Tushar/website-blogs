import Link from "next/link";

import {
  AdminCheckbox,
  AdminField,
  AdminInput,
  AdminPageIntro,
  AdminPanel,
  AdminSelect,
  StatusPill,
  SubmitButton,
} from "@/components/admin/primitives";
import { getAdminNavigationItems } from "@/lib/content/admin-queries";
import {
  deleteNavigationItemAction,
  saveNavigationItemAction,
} from "@/features/admin/actions";

interface AdminNavigationPageProps {
  searchParams: Promise<{ edit?: string }>;
}

export default async function AdminNavigationPage({
  searchParams,
}: AdminNavigationPageProps) {
  const items = await getAdminNavigationItems();
  const { edit } = await searchParams;
  const selectedItem = items.find((item) => item.id === edit) ?? null;

  return (
    <div className="space-y-8">
      <AdminPageIntro
        eyebrow="System"
        title="Navigation manager"
        description="Control header, footer, and social navigation items without making layout chrome fully editable."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <AdminPanel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">
                Existing items
              </h2>
              <p className="mt-2 text-sm text-muted">
                Choose an item to edit or start a new one.
              </p>
            </div>
            <Link
              href="/admin/navigation"
              className="rounded-full border border-border-strong px-4 py-2 text-sm"
            >
              New item
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/admin/navigation?edit=${item.id}`}
                className="block rounded-[1.25rem] border border-border bg-white/55 p-4 transition hover:bg-white/80"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="mt-1 text-sm text-muted">
                      {item.href} · {item.location}
                    </p>
                  </div>
                  <StatusPill tone={item.isVisible ? "success" : "warning"}>
                    {item.isVisible ? "visible" : "hidden"}
                  </StatusPill>
                </div>
              </Link>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel>
          <h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">
            {selectedItem ? "Edit navigation item" : "Create navigation item"}
          </h2>
          <form action={saveNavigationItemAction} className="mt-6 grid gap-5">
            <input type="hidden" name="id" defaultValue={selectedItem?.id ?? ""} />

            <div className="grid gap-5 md:grid-cols-2">
              <AdminField label="Label">
                <AdminInput name="label" defaultValue={selectedItem?.label ?? ""} required />
              </AdminField>
              <AdminField label="Href">
                <AdminInput name="href" defaultValue={selectedItem?.href ?? ""} required />
              </AdminField>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <AdminField label="Location">
                <AdminSelect
                  name="location"
                  defaultValue={selectedItem?.location ?? "header"}
                >
                  <option value="header">Header</option>
                  <option value="footer">Footer</option>
                  <option value="social">Social</option>
                </AdminSelect>
              </AdminField>
              <AdminField label="Sort order">
                <AdminInput
                  name="sortOrder"
                  type="number"
                  defaultValue={String(selectedItem?.sortOrder ?? 10)}
                />
              </AdminField>
            </div>

            <div className="flex flex-wrap gap-6">
              <AdminCheckbox
                name="isVisible"
                label="Visible"
                defaultChecked={selectedItem?.isVisible ?? true}
              />
              <AdminCheckbox
                name="isExternal"
                label="External link"
                defaultChecked={selectedItem?.isExternal ?? false}
              />
            </div>

            <div className="pt-2">
              <SubmitButton>Save item</SubmitButton>
            </div>
          </form>

          {selectedItem ? (
            <form action={deleteNavigationItemAction} className="mt-3">
              <input type="hidden" name="id" value={selectedItem.id} />
              <SubmitButton variant="danger">Delete item</SubmitButton>
            </form>
          ) : null}
        </AdminPanel>
      </div>
    </div>
  );
}
