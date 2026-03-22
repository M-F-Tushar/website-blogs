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

function formatContactLinkTitle(href: string, fallback: string) {
  try {
    const url = new URL(href);
    const path = url.pathname.replace(/\/$/, "");

    if (!path || path === "/") {
      return url.hostname.replace(/^www\./, "");
    }

    return `${url.hostname.replace(/^www\./, "")}${path}`;
  } catch {
    return fallback;
  }
}

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
  const detailSectionKeys = new Set(
    detailSections.map((section) => section.sectionKey.trim().toLowerCase()),
  );
  const contactTracks =
    getSectionSettingStringArray(heroSection, "tracks").length > 0
      ? getSectionSettingStringArray(heroSection, "tracks")
      : ["Research conversations", "AI/ML collaboration", "Systems and tooling"];
  const autoSocialCards = [
    {
      key: "github",
      eyebrow: "GitHub",
      title: siteSettings.githubUrl
        ? formatContactLinkTitle(siteSettings.githubUrl, "GitHub profile")
        : null,
      description:
        "Browse code, experiments, and project history in a public engineering context.",
      href: siteSettings.githubUrl,
    },
    {
      key: "linkedin",
      eyebrow: "LinkedIn",
      title: siteSettings.linkedinUrl
        ? formatContactLinkTitle(siteSettings.linkedinUrl, "LinkedIn profile")
        : null,
      description:
        "Best for professional context, background, and long-term career connection.",
      href: siteSettings.linkedinUrl,
    },
    {
      key: "x",
      eyebrow: "X",
      title: siteSettings.xUrl
        ? formatContactLinkTitle(siteSettings.xUrl, "X profile")
        : null,
      description:
        "A lighter-weight channel for public thoughts, links, and quick updates.",
      href: siteSettings.xUrl,
    },
    {
      key: "resume",
      eyebrow: "Resume",
      title: siteSettings.resumeUrl ? "View resume" : null,
      description:
        "Open the current resume when a concise overview is more useful than a message thread.",
      href: siteSettings.resumeUrl,
    },
  ].filter(
    (card): card is {
      key: string;
      eyebrow: string;
      title: string;
      description: string;
      href: string;
    } => Boolean(card.href && card.title) && !detailSectionKeys.has(card.key),
  );
  const fallbackCards = [
    {
      key: "email",
      eyebrow: "Email",
      title: siteSettings.contactEmail,
      description:
        "Best for collaboration, research questions, or project discussion.",
      href: `mailto:${siteSettings.contactEmail}`,
    },
    ...(siteSettings.locationLabel
      ? [
          {
            key: "location",
            eyebrow: "Location",
            title: siteSettings.locationLabel,
            description:
              "Remote-friendly and open to thoughtful technical conversations across time zones.",
            href: null,
          },
        ]
      : []),
    {
      key: "response-mode",
      eyebrow: "Response mode",
      title: "Clear context helps the fastest reply",
      description:
        "A short summary, relevant links, and the kind of discussion you want make it easier to respond well.",
      href: null,
    },
  ];
  const contactCards =
    detailSections.length > 0 || autoSocialCards.length > 0
      ? [
          ...detailSections.map((section) => {
            const linkHref =
              section.sectionKey === "email"
                ? `mailto:${siteSettings.contactEmail}`
                : getSectionSettingString(section, "href") ?? null;
            const body = section.bodyMarkdown;
            const title =
              getSectionSettingString(section, "title") ??
              (section.sectionKey === "email"
                ? siteSettings.contactEmail
                : section.sectionKey === "location" && siteSettings.locationLabel
                  ? siteSettings.locationLabel
                  : section.heading);
            const eyebrow =
              getSectionSettingString(section, "eyebrow") ?? section.sectionKey;

            return {
              key: section.id,
              eyebrow,
              title,
              description: section.subheading,
              href: linkHref,
              body,
            };
          }),
          ...autoSocialCards.map((card) => ({
            key: card.key,
            eyebrow: card.eyebrow,
            title: card.title,
            description: card.description,
            href: card.href,
            body: null,
          })),
        ]
      : fallbackCards.map((card) => ({
          key: card.key,
          eyebrow: card.eyebrow,
          title: card.title,
          description: card.description,
          href: card.href,
          body: null,
        }));

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
            {contactCards.map((card) => (
              <DetailCard
                key={card.key}
                eyebrow={card.eyebrow}
                title={card.title}
                description={card.description}
                href={card.href}
                className="transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_90px_rgba(9,21,33,0.12)]"
              >
                {card.body ? <Markdown className="mt-1" content={card.body} /> : null}
              </DetailCard>
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
