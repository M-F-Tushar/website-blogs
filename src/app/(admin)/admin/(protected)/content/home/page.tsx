import { AdminManagedPageWorkspace } from "@/components/admin/admin-managed-page-workspace";

const HOME_SECTION_TYPES = [
  { value: "hero", label: "Hero" },
  { value: "focus", label: "Current focus" },
  { value: "preview", label: "Collection preview" },
  { value: "connect", label: "Connect" },
] as const;

interface AdminHomePageManagerProps {
  searchParams: Promise<{ edit?: string }>;
}

export default function AdminHomePageManager({
  searchParams,
}: AdminHomePageManagerProps) {
  return (
    <AdminManagedPageWorkspace
      pageKey="home"
      pageTitle="Home"
      description="Keep the homepage hybrid: the layout stays coded and production-safe, while the major copy blocks, tags, CTA labels, vectors, and section intros stay editable from admin."
      sectionTypes={HOME_SECTION_TYPES}
      settingsHint="Optional advanced settings for homepage buttons, focus labels, metrics, and special display options. Leave this as {} for normal editing."
      searchParams={searchParams}
      adminRoute="/admin/content/home"
    />
  );
}
