import { notFound, permanentRedirect } from "next/navigation";

import { ContactForm } from "@/components/site/contact-form";
import { DetailCard } from "@/components/site/detail-card";
import { Markdown } from "@/components/site/markdown";
import { SectionHeading } from "@/components/ui/section-heading";
import { getContactPageData } from "@/lib/content/queries";
import {
  getPrimarySection,
  getSectionSettingString,
  getSectionSettingStringArray,
} from "@/lib/content/section-settings";
import {
  buildTopLevelPageMetadata,
  DEFAULT_TOP_LEVEL_PAGE_PATHS,
} from "@/lib/content/page-routing";
import { stripMarkdown } from "@/lib/utils";

export async function generateMetadata() {
  return buildTopLevelPageMetadata("contact", {
    title: "Contact",
    description:
      "Reach out for collaboration, conversation, project ideas, or research-oriented discussion.",
  });
}

export async function ContactPageContent({
  data,
}: {
  data?: Awaited<ReturnType<typeof getContactPageData>>;
} = {}) {
  const resolvedData = data ?? (await getContactPageData());
  const { siteSettings, page, sections } = resolvedData;
  const heroSection = getPrimarySection(sections, ["hero", "intro"], ["hero"]);
  const formSection =
    sections.find((section) => section.sectionKey === "form") ??
    sections.find((section) => section.sectionType === "form") ??
    null;
  const detailSections = sections.filter(
    (section) => section.id !== heroSection?.id && section.id !== formSection?.id,
  );
  const contactTracks =
    getSectionSettingStringArray(heroSection, "tracks").length > 0
      ? getSectionSettingStringArray(heroSection, "tracks")
      : ["Research conversations", "AI/ML collaboration", "Systems and tooling"];
  const fallbackCards = [
    {
      eyebrow: "Email",
      title: siteSettings.contactEmail,
      description:
        "Best for collaboration, research questions, or project discussion.",
      href: `mailto:${siteSettings.contactEmail}`,
    },
    ...(siteSettings.locationLabel
      ? [
          {
            eyebrow: "Location",
            title: siteSettings.locationLabel,
            description:
              "Remote-friendly and open to thoughtful technical conversations across time zones.",
            href: null,
          },
        ]
      : []),
    {
      eyebrow: "Response mode",
      title: "Clear context helps the fastest reply",
      description:
        "A short summary, relevant links, and the kind of discussion you want make it easier to respond well.",
      href: null,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-6">
          <div className="grid-backdrop overflow-hidden rounded-[2.15rem] border border-white/45">
            <div className="editorial-panel px-6 py-10 md:px-8 md:py-10">
              <SectionHeading
                eyebrow={
                  getSectionSettingString(heroSection, "eyebrow") ??
                  page?.title ??
                  "Contact"
                }
                title={heroSection?.heading ?? page?.title ?? "Open a conversation"}
                description={
                  heroSection?.subheading ??
                  page?.metaDescription ??
                  "If there's an idea, project, or direction worth exploring together, I'd like to hear about it."
                }
              />
              {heroSection?.bodyMarkdown ? (
                <Markdown className="mt-6" content={heroSection.bodyMarkdown} />
              ) : null}
              <div className="mt-8 flex flex-wrap gap-3">
                {contactTracks.map((track) => (
                  <span key={track} className="signal-pill">
                    {track}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {detailSections.length > 0
              ? detailSections.map((section) => {
                  const linkHref =
                    section.sectionKey === "email"
                      ? `mailto:${siteSettings.contactEmail}`
                      : getSectionSettingString(section, "href") ?? null;
                  const body = section.bodyMarkdown;
                  const title =
                    getSectionSettingString(section, "title") ??
                    (section.sectionKey === "email"
                      ? siteSettings.contactEmail
                      : section.sectionKey === "location" &&
                          siteSettings.locationLabel
                        ? siteSettings.locationLabel
                        : section.heading);
                  const eyebrow =
                    getSectionSettingString(section, "eyebrow") ?? section.sectionKey;

                  return (
                    <DetailCard
                      key={section.id}
                      eyebrow={eyebrow}
                      title={title}
                      description={section.subheading}
                      href={linkHref}
                      className="transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_90px_rgba(9,21,33,0.12)]"
                    >
                      {body ? <Markdown className="mt-1" content={body} /> : null}
                    </DetailCard>
                  );
                })
              : fallbackCards.map((card) => (
                  <DetailCard
                    key={card.eyebrow}
                    eyebrow={card.eyebrow}
                    title={card.title}
                    description={card.description}
                    href={card.href}
                    className="transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_90px_rgba(9,21,33,0.12)]"
                  />
                ))}
          </div>
        </div>

        <ContactForm
          eyebrow={getSectionSettingString(formSection, "eyebrow") ?? "Secure intake"}
          title={formSection?.heading ?? "Start the conversation"}
          description={
            formSection?.subheading ??
            (formSection?.bodyMarkdown
              ? stripMarkdown(formSection.bodyMarkdown)
              : "Use this channel for collaboration, research questions, project ideas, or thoughtful technical discussion.")
          }
          badge={
            getSectionSettingString(formSection, "badge") ??
            "Thoughtful replies over volume"
          }
        />
      </div>
    </div>
  );
}

export default async function ContactPage() {
  const data = await getContactPageData();

  if (!data.page) {
    notFound();
  }

  if (data.page.slug !== DEFAULT_TOP_LEVEL_PAGE_PATHS.contact) {
    permanentRedirect(data.page.slug);
  }

  return <ContactPageContent data={data} />;
}
