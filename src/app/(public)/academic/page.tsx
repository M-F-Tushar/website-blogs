import { notFound, permanentRedirect } from "next/navigation";

import { AcademicDirectory } from "@/components/site/academic-directory";
import { getAcademicPageData } from "@/lib/content/queries";
import {
  getPrimarySection,
  getSectionSettingString,
} from "@/lib/content/section-settings";
import {
  buildTopLevelPageMetadata,
  DEFAULT_TOP_LEVEL_PAGE_PATHS,
} from "@/lib/content/page-routing";

export async function generateMetadata() {
  return buildTopLevelPageMetadata("academic", {
    title: "Academic",
    description:
      "Coursework, research interests, paper-reading notes, experiments, and academic growth over time.",
  });
}

export async function AcademicPageContent({
  data,
}: {
  data?: Awaited<ReturnType<typeof getAcademicPageData>>;
} = {}) {
  const resolvedData = data ?? (await getAcademicPageData());
  const { page, sections, entries } = resolvedData;
  const heroSection = getPrimarySection(sections, ["hero", "intro"], ["hero"]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      <section className="mx-auto max-w-4xl text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm text-slate-300">
          <span className="text-sky-400">✦</span>
          {getSectionSettingString(heroSection, "eyebrow") ?? "Academic trail"}
        </p>
        <h1 className="mt-6 font-display text-[3.9rem] font-semibold leading-[0.92] tracking-[-0.06em] text-white md:text-[5.2rem]">
          <span className="accent-gradient-text">
            {getSectionSettingString(heroSection, "heroTitle") ?? page?.title ?? "Academic"}
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-3xl text-[1.04rem] leading-8 text-slate-300 md:text-[1.14rem]">
          {heroSection?.subheading ??
            page?.metaDescription ??
            "Coursework, research notes, experiments, and evidence of deeper study."}
        </p>
      </section>

      <AcademicDirectory entries={entries} />
    </div>
  );
}

export default async function AcademicPage() {
  const data = await getAcademicPageData();

  if (!data.page) {
    notFound();
  }

  if (data.page.slug !== DEFAULT_TOP_LEVEL_PAGE_PATHS.academic) {
    permanentRedirect(data.page.slug);
  }

  return <AcademicPageContent data={data} />;
}
