import { AdminManagedPageWorkspace } from "@/components/admin/admin-managed-page-workspace";

const RECOMMENDATIONS_PAGE_SECTION_TYPES = [
  { value: "hero", label: "Hero" },
  { value: "detail", label: "Detail card" },
  { value: "support", label: "Support block" },
] as const;

interface AdminRecommendationsPageManagerProps {
  searchParams: Promise<{ edit?: string }>;
}

export default function AdminRecommendationsPageManager({
  searchParams,
}: AdminRecommendationsPageManagerProps) {
  return (
    <AdminManagedPageWorkspace
      pageKey="recommendations"
      pageTitle="Recommendations"
      description="Control the recommendations landing page intro and supporting curation context from admin."
      sectionTypes={RECOMMENDATIONS_PAGE_SECTION_TYPES}
      settingsHint="Optional advanced settings for intro badges, archive labels, and recommendation metrics. Leave this as {} for normal editing."
      searchParams={searchParams}
      adminRoute="/admin/content/recommendations-page"
      collectionActions={[
        { href: "/admin/content/recommendations", label: "Manage recommendations" },
      ]}
      allowImage
      imageHint="Choose an optional public image for any supporting section."
    />
  );
}
