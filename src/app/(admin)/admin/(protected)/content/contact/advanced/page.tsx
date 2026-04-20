import { AdminManagedPageWorkspace } from "@/components/admin/admin-managed-page-workspace";

const CONTACT_SECTION_TYPES = [
  { value: "hero", label: "Hero" },
  { value: "detail", label: "Detail card" },
  { value: "form", label: "Form intro" },
] as const;

interface AdminContactAdvancedPageProps {
  searchParams: Promise<{ edit?: string }>;
}

export default function AdminContactAdvancedPage({
  searchParams,
}: AdminContactAdvancedPageProps) {
  return (
    <AdminManagedPageWorkspace
      pageKey="contact"
      pageTitle="Contact advanced editor"
      description="Use this only when you need the low-level section builder for the contact page."
      sectionTypes={CONTACT_SECTION_TYPES}
      settingsHint="Optional advanced settings for contact links, icons, form badges, and availability text. Leave this as {} for normal editing."
      searchParams={searchParams}
      adminRoute="/admin/content/contact/advanced"
    />
  );
}
