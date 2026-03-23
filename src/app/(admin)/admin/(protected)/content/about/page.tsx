import { AdminManagedPageWorkspace } from "@/components/admin/admin-managed-page-workspace";

const ABOUT_SECTION_TYPES = [
  { value: "identity", label: "Identity" },
  { value: "timeline", label: "Timeline" },
  { value: "principles", label: "Principles" },
  { value: "supporting", label: "Supporting" },
] as const;

interface AdminAboutPageManagerProps {
  searchParams: Promise<{ edit?: string }>;
}

export default function AdminAboutPageManager({
  searchParams,
}: AdminAboutPageManagerProps) {
  return (
    <AdminManagedPageWorkspace
      pageKey="about"
      pageTitle="About"
      description="Manage the identity page from one workspace so profile framing, supporting sections, portrait usage, and metadata stay aligned."
      sectionTypes={ABOUT_SECTION_TYPES}
      settingsHint='Identity supports {"signals":["AI engineering trajectory"],"metrics":[{"label":"Base","value":"CSE and software systems"}]}. Timeline can use {"timelineItems":[{"phase":"01","status":"Foundation","title":"Computer science grounding","description":"Core engineering habits, systems thinking, and implementation discipline.","tags":["CSE","systems"],"align":"left"}]}. Supporting blocks can use custom notes or metric arrays.'
      searchParams={searchParams}
      adminRoute="/admin/content/about"
      allowImage
      imageHint="Use a public media asset for the portrait or any supporting visual."
    />
  );
}
