import { AdminManagedPageWorkspace } from "@/components/admin/admin-managed-page-workspace";

const CONTACT_SECTION_TYPES = [
  { value: "hero", label: "Hero" },
  { value: "detail", label: "Detail card" },
  { value: "form", label: "Form intro" },
] as const;

interface AdminContactPageManagerProps {
  searchParams: Promise<{ edit?: string }>;
}

export default function AdminContactPageManager({
  searchParams,
}: AdminContactPageManagerProps) {
  return (
    <AdminManagedPageWorkspace
      pageKey="contact"
      pageTitle="Contact"
      description="Control the public contact page intro, supporting cards, and form copy from admin."
      sectionTypes={CONTACT_SECTION_TYPES}
      settingsHint='Hero supports {"eyebrow":"Contact","tracks":["Research conversations"]}. Form supports {"eyebrow":"Secure intake","badge":"Thoughtful replies over volume"}. Detail cards can use {"eyebrow":"Email"}.'
      searchParams={searchParams}
      adminRoute="/admin/content/contact"
    />
  );
}
