import { AdminPageSectionManager } from "@/components/admin/page-section-manager";

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
    <AdminPageSectionManager
      pageKey="home"
      pageTitle="Home"
      description="Keep the homepage hybrid: the layout stays coded and production-safe, while the major copy blocks, tags, CTA labels, vectors, and section intros stay editable from admin."
      sectionTypes={HOME_SECTION_TYPES}
      settingsHint='Hero supports {"eyebrow":"AI engineering platform","focusTags":["LLM systems"],"primaryCtaLabel":"Read the journey","primaryCtaHref":"/blogs","secondaryCtaLabel":"Connect","secondaryCtaHref":"/contact","metrics":[{"label":"Featured notes","value":"03","description":"Published writing nodes"}],"capabilitySignals":[{"label":"Primary track","value":"AI engineering and ML systems","description":"Optional"}],"systemMapEyebrow":"Research system map","systemMapTitle":"Why this platform exists","systemMapBadge":"Live notebook","vectorLabel":"Active vectors","vectorBadge":"Current emphasis","activeVectors":[{"label":"LLMs and orchestration","value":"82%"}]}. Focus supports {"eyebrow":"Current vectors","panelTitle":"What the work is optimizing for right now","panelDescription":"Intro copy","columns":["Learning loops that end in working systems, not just notes."]}. Preview/connect sections support {"eyebrow":"Featured writing","description":"Optional intro","tracks":["Research discussion"],"primaryCtaLabel":"Open contact page","primaryCtaHref":"/contact","secondaryCtaLabel":"Email directly"}.'
      searchParams={searchParams}
    />
  );
}
