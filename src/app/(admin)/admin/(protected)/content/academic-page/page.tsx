import { AdminManagedPageWorkspace } from "@/components/admin/admin-managed-page-workspace";

const ACADEMIC_PAGE_SECTION_TYPES = [
  { value: "hero", label: "Hero" },
  { value: "detail", label: "Detail card" },
  { value: "support", label: "Support block" },
] as const;

interface AdminAcademicPageManagerProps {
  searchParams: Promise<{ edit?: string }>;
}

export default function AdminAcademicPageManager({
  searchParams,
}: AdminAcademicPageManagerProps) {
  return (
    <AdminManagedPageWorkspace
      pageKey="academic"
      pageTitle="Academic"
      description="Manage the academic landing page narrative, supporting cards, and research positioning from admin."
      sectionTypes={ACADEMIC_PAGE_SECTION_TYPES}
      settingsHint="Optional advanced settings for intro badges, archive labels, and small academic metrics. Leave this as {} for normal editing."
      searchParams={searchParams}
      adminRoute="/admin/content/academic-page"
      collectionActions={[{ href: "/admin/content/academic", label: "Manage entries" }]}
      allowImage
      imageHint="Choose an optional public image for any supporting section."
    />
  );
}
