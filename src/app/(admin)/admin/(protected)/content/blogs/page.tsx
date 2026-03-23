import { AdminManagedPageWorkspace } from "@/components/admin/admin-managed-page-workspace";

const BLOGS_SECTION_TYPES = [
  { value: "hero", label: "Hero" },
  { value: "detail", label: "Detail card" },
  { value: "support", label: "Support block" },
] as const;

interface AdminBlogsPageManagerProps {
  searchParams: Promise<{ edit?: string }>;
}

export default function AdminBlogsPageManager({
  searchParams,
}: AdminBlogsPageManagerProps) {
  return (
    <AdminManagedPageWorkspace
      pageKey="blogs"
      pageTitle="Blogs"
      description="Edit the writing index page intro and supporting context so the public blog landing page reflects admin content."
      sectionTypes={BLOGS_SECTION_TYPES}
      settingsHint='Hero supports {"eyebrow":"Blogs","panelLabel":"Writing system","panelItems":[{"label":"Published nodes","value":"07","description":"Published posts"}]}. Other sections can use {"eyebrow":"Why it matters"}.'
      searchParams={searchParams}
      adminRoute="/admin/content/blogs"
      allowImage
      imageHint="Choose an optional public image for any supporting section."
    />
  );
}
