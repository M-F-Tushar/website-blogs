import {
  Clock3,
  FileText,
  Github,
  Globe,
  Linkedin,
  Link2,
  Mail,
  MapPin,
  Phone,
  type LucideIcon,
} from "lucide-react";
import { notFound, permanentRedirect } from "next/navigation";

import { ContactForm } from "@/components/site/contact-form";
import { FaqAccordion } from "@/components/site/faq-accordion";
import { getContactPageData } from "@/lib/content/queries";
import {
  getPrimarySection,
  getSectionSettingString,
} from "@/lib/content/section-settings";
import {
  buildTopLevelPageMetadata,
  DEFAULT_TOP_LEVEL_PAGE_PATHS,
} from "@/lib/content/page-routing";
import { getContactBotProtectionConfig } from "@/lib/supabase/env";
import type { PageSection } from "@/types/content";

export async function generateMetadata() {
  return buildTopLevelPageMetadata("contact", {
    title: "Contact",
    description:
      "Reach out for collaboration, conversation, project ideas, or research-oriented discussion.",
  });
}

function parseFaqs(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (
        typeof item !== "object" ||
        item === null ||
        typeof item.question !== "string" ||
        typeof item.answer !== "string"
      ) {
        return null;
      }

      return {
        question: item.question.trim(),
        answer: item.answer.trim(),
      };
    })
    .filter((item): item is { question: string; answer: string } => Boolean(item));
}

function resolveContactCardIcon(
  section: Pick<PageSection, "sectionKey" | "settings">,
  href: string | null,
): LucideIcon {
  const configuredIcon = getSectionSettingString(section, "icon")?.toLowerCase();

  switch (configuredIcon) {
    case "mail":
    case "email":
      return Mail;
    case "github":
      return Github;
    case "linkedin":
      return Linkedin;
    case "location":
    case "map":
    case "mappin":
      return MapPin;
    case "phone":
    case "tel":
      return Phone;
    case "resume":
    case "file":
      return FileText;
    case "globe":
    case "website":
      return Globe;
    case "link":
      return Link2;
    default:
      break;
  }

  const normalizedKey = section.sectionKey.toLowerCase();
  if (normalizedKey.includes("email") || href?.startsWith("mailto:")) {
    return Mail;
  }
  if (normalizedKey.includes("github")) {
    return Github;
  }
  if (normalizedKey.includes("linkedin")) {
    return Linkedin;
  }
  if (normalizedKey.includes("location")) {
    return MapPin;
  }
  if (normalizedKey.includes("phone") || href?.startsWith("tel:")) {
    return Phone;
  }
  if (normalizedKey.includes("resume")) {
    return FileText;
  }

  return Globe;
}

function resolveDetailSectionHref(
  section: Pick<PageSection, "heading" | "sectionKey" | "settings">,
) {
  const title = section.heading.trim();
  if (section.sectionKey.toLowerCase() === "email" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(title)) {
    return `mailto:${title}`;
  }

  const explicitHref = getSectionSettingString(section, "href");
  if (explicitHref) {
    return explicitHref;
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(title)) {
    return `mailto:${title}`;
  }

  return null;
}

export async function ContactPageContent({
  data,
}: {
  data?: Awaited<ReturnType<typeof getContactPageData>>;
} = {}) {
  const resolvedData = data ?? (await getContactPageData());
  const { siteSettings, page, sections } = resolvedData;
  const heroSection = getPrimarySection(sections, ["hero", "intro"], ["hero"]);
  const detailSections = sections.filter((section) => section.sectionType === "detail");
  const formSection =
    sections.find((section) => section.sectionKey === "form") ??
    sections.find((section) => section.sectionType === "form") ??
    null;
  const formFaqs = parseFaqs(formSection?.settings.faqs);
  const heroFaqs = parseFaqs(heroSection?.settings.faqs);
  const faqItems = formFaqs.length > 0 ? formFaqs : heroFaqs;
  const botProtection = getContactBotProtectionConfig();
  const fallbackFaqs = [
    {
      question: "What’s the best way to reach you?",
      answer:
        "Email or the contact form both work well. If the message is specific and thoughtful, I can usually respond faster.",
    },
    {
      question: "Do you offer consulting services?",
      answer:
        "I’m most open to collaborations, research discussions, and technically meaningful projects rather than generic consulting requests.",
    },
    {
      question: "Can you help with my project?",
      answer:
        "If the project aligns with AI, ML, LLM systems, learning infrastructure, or technical writing, send context and I’ll tell you honestly whether it’s a fit.",
    },
    {
      question: "How can I collaborate with you?",
      answer:
        "The best outreach explains the problem, the current stage, and what kind of collaboration you have in mind.",
    },
  ];
  const detailCards = detailSections.map((section) => {
    const href = resolveDetailSectionHref(section);

    return {
      key: section.id,
      eyebrow: getSectionSettingString(section, "eyebrow") ?? section.sectionKey,
      title: section.heading,
      description:
        section.subheading ??
        (section.bodyMarkdown.trim().length > 0 ? section.bodyMarkdown : null) ??
        "Update this card from the admin contact page.",
      href,
      icon: resolveContactCardIcon(section, href),
      featured: section.featured,
    };
  });
  const detailKeys = new Set(detailSections.map((section) => section.sectionKey.toLowerCase()));
  const fallbackCards = [
    !detailKeys.has("email")
      ? {
          key: "email",
          eyebrow: "Email",
          title: siteSettings.contactEmail,
          description: "Best for professional inquiries",
          href: `mailto:${siteSettings.contactEmail}`,
          icon: Mail,
          featured: true,
        }
      : null,
    siteSettings.locationLabel && !detailKeys.has("location")
      ? {
          key: "location",
          eyebrow: "Location",
          title: siteSettings.locationLabel,
          description: "Available for thoughtful remote collaboration.",
          href: null,
          icon: MapPin,
          featured: false,
        }
      : null,
    siteSettings.githubUrl && !detailKeys.has("github")
      ? {
          key: "github",
          eyebrow: "GitHub",
          title: "GitHub",
          description: "Check out my open-source work",
          href: siteSettings.githubUrl,
          icon: Github,
          featured: false,
        }
      : null,
    siteSettings.linkedinUrl && !detailKeys.has("linkedin")
      ? {
          key: "linkedin",
          eyebrow: "LinkedIn",
          title: "LinkedIn",
          description: "Connect professionally",
          href: siteSettings.linkedinUrl,
          icon: Linkedin,
          featured: false,
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    eyebrow: string;
    title: string;
    description: string;
    href: string | null;
    icon: LucideIcon;
    featured: boolean;
  }>;
  const socialCards = detailCards.length > 0 ? [...detailCards, ...fallbackCards] : fallbackCards;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:py-14">
      <section className="redesign-hero rounded-[2rem] border border-white/8 px-6 py-8 md:px-8 md:py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm text-slate-300">
              <span className="text-sky-400">✦</span>
              {getSectionSettingString(heroSection, "eyebrow") ?? page?.title ?? "Get in touch"}
            </p>
            <h1 className="mt-6 max-w-4xl font-display text-[3.7rem] font-semibold leading-[0.92] tracking-[-0.06em] text-white md:text-[5.2rem]">
              Let&apos;s <span className="accent-gradient-text">Connect</span>
            </h1>
            <p className="mt-5 max-w-3xl text-[1.04rem] leading-8 text-slate-300 md:text-[1.14rem]">
              {heroSection?.subheading ??
                page?.metaDescription ??
                "I’m always open to discussing new projects, creative ideas, or opportunities to be part of an amazing team."}
            </p>
          </div>
          <div className="page-rail">
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-slate-500">
              Best messages include
            </p>
            <div className="space-y-3 text-sm leading-7 text-slate-400">
              <p>Context, current stage, and the kind of collaboration you have in mind.</p>
              <p className="text-sky-200">AI, ML, LLM systems, research, and technical writing fit best.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-[1.7rem] border border-emerald-400/18 bg-emerald-400/6 px-6 py-5 text-slate-200">
        <div className="flex items-start gap-4">
          <div className="rounded-[1rem] bg-emerald-400/12 p-3 text-emerald-300">
            <Clock3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-[1.8rem] font-semibold tracking-[-0.04em] text-white">
              {getSectionSettingString(heroSection, "availabilityTitle") ?? "Currently Available"}
            </h2>
            <p className="mt-2 text-[0.98rem] leading-8 text-slate-300">
              {getSectionSettingString(heroSection, "availabilityDescription") ??
                "I usually respond within 24-48 hours during business days. For urgent matters, mention “URGENT” in the subject line."}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.95fr]">
        <div className="space-y-8">
          <div>
            <h2 className="font-display text-[2.2rem] font-semibold tracking-[-0.04em] text-white md:text-[2.5rem]">
              Send a Message
            </h2>
          </div>
          <ContactForm
            eyebrow={getSectionSettingString(formSection, "eyebrow") ?? "Direct form"}
            title={formSection?.heading ?? "Start the conversation"}
            description={
              formSection?.subheading ??
              "Tell me about your project, research interest, or the kind of conversation you want to have."
            }
            badge={getSectionSettingString(formSection, "badge") ?? "Thoughtful replies over volume"}
            botProtectionMode={botProtection.mode}
            turnstileSiteKey={botProtection.siteKey}
          />
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="font-display text-[2.2rem] font-semibold tracking-[-0.04em] text-white md:text-[2.5rem]">
              Connect Elsewhere
            </h2>
          </div>
          <div className="space-y-4">
            {socialCards.map((card) => {
              const Icon = card.icon;
              const cardClassName = `block overflow-hidden rounded-[1.45rem] border p-5 transition ${
                card.href ? "hover:-translate-y-0.5" : ""
              } ${
                card.featured
                  ? "border-sky-400/20 bg-[linear-gradient(90deg,rgba(14,165,233,0.9),rgba(79,70,229,0.8))]"
                  : "border-white/8 bg-white/4"
              }`;
              const cardContent = (
                <div className="flex items-start gap-4">
                  <div className="rounded-[1rem] bg-white/10 p-3 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-display text-[2rem] font-semibold tracking-[-0.04em] text-white">
                      {card.title}
                    </p>
                    <p className="mt-1 text-[0.98rem] leading-7 text-white/80">
                      {card.description}
                    </p>
                  </div>
                </div>
              );

              if (!card.href) {
                return (
                  <div key={card.key} className={cardClassName}>
                    {cardContent}
                  </div>
                );
              }

              return (
                <a
                  key={card.key}
                  href={card.href}
                  target={
                    card.href.startsWith("mailto:") || card.href.startsWith("tel:")
                      ? undefined
                      : "_blank"
                  }
                  rel={
                    card.href.startsWith("mailto:") || card.href.startsWith("tel:")
                      ? undefined
                      : "noreferrer"
                  }
                  className={cardClassName}
                >
                  {cardContent}
                </a>
              );
            })}
          </div>

          <div>
            <h2 className="font-display text-[2.2rem] font-semibold tracking-[-0.04em] text-white md:text-[2.5rem]">
              Frequently Asked Questions
            </h2>
            <div className="mt-5">
              <FaqAccordion items={faqItems.length > 0 ? faqItems : fallbackFaqs} />
            </div>
          </div>
        </div>
      </section>
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
