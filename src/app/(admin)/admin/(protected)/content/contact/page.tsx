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
      description="Control the public contact page intro, live contact cards, and form copy from admin."
      sectionTypes={CONTACT_SECTION_TYPES}
      settingsHint='Hero supports {"eyebrow":"Contact","tracks":["Research conversations"],"availabilityTitle":"Currently Available","availabilityDescription":"Reply timing or expectations"}. Form supports {"eyebrow":"Secure intake","badge":"Thoughtful replies over volume"}. Detail cards use Heading as the visible value and Subheading as supporting copy. For the email card, keep Section key as "email" and the public mailto link will follow the Heading automatically. Other cards can use Settings JSON like {"eyebrow":"GitHub","href":"https://github.com/username","icon":"github"}.'
      searchParams={searchParams}
      adminRoute="/admin/content/contact"
    />
  );
}
