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
      settingsHint="Optional advanced settings for intro badges, archive labels, and small page metrics. Leave this as {} for normal editing."
      searchParams={searchParams}
      adminRoute="/admin/content/blogs"
      collectionActions={[{ href: "/admin/content/posts", label: "Manage posts" }]}
      allowImage
      imageHint="Choose an optional public image for any supporting section."
    />
  );
}
