import { Markdown } from "@/components/site/markdown";
import { SectionHeading } from "@/components/ui/section-heading";
import { getAboutPageData } from "@/lib/content/queries";
import { buildMetadata } from "@/lib/content/seo";

export const metadata = buildMetadata({
  title: "About",
  description:
    "Who I am, what I study, why AI/ML matters to me, and the values shaping my long-term professional direction.",
  path: "/about",
});

export default async function AboutPage() {
  const { sections } = await getAboutPageData();

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
      <SectionHeading
        eyebrow="About"
        title="Building a serious identity around learning, research depth, and technical consistency"
        description="This is where the path from CSE student to AI/ML/LLM/MLOps professional becomes visible, documented, and evidence-driven."
      />

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {sections.map((section) => (
          <section key={section.id} className="surface-panel rounded-[1.75rem] p-6 md:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-accent">
              {section.sectionType.replace(/-/g, " ")}
            </p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-[-0.04em]">
              {section.heading}
            </h2>
            {section.subheading ? (
              <p className="mt-3 text-sm leading-7 text-muted">{section.subheading}</p>
            ) : null}
            <Markdown className="mt-6" content={section.bodyMarkdown} />
          </section>
        ))}
      </div>
    </div>
  );
}
