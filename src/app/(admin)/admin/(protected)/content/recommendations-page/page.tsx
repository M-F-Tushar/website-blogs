import { AdminPageSectionManager } from "@/components/admin/page-section-manager";

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
    <AdminPageSectionManager
      pageKey="recommendations"
      pageTitle="Recommendations"
      description="Control the recommendations landing page intro and supporting curation context from admin."
      sectionTypes={RECOMMENDATIONS_PAGE_SECTION_TYPES}
      settingsHint='Hero supports {"eyebrow":"Recommendations","panelLabel":"Curated stack","panelItems":[{"label":"Saved resources","value":"05","description":"Published recommendations"}]}. Other sections can use {"eyebrow":"Curation rule"}.'
      searchParams={searchParams}
      allowImage
      imageHint="Choose an optional public image for any supporting section."
    />
  );
}
