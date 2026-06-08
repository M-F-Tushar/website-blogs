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

import { ContactForm, type ContactFormCopy } from "@/components/site/contact-form";
import { FaqAccordion } from "@/components/site/faq-accordion";
import {
  getContactPageData,
  getDetailTemplateSection,
} from "@/lib/content/queries";
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
        typeof (item as { question?: unknown }).question !== "string" ||
        typeof (item as { answer?: unknown }).answer !== "string"
      ) {
        return null;
      }

      const candidate = item as { question: string; answer: string };
      return {
        question: candidate.question.trim(),
        answer: candidate.answer.trim(),
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
  const [resolvedData, template] = await Promise.all([
    data ? Promise.resolve(data) : getContactPageData(),
    getDetailTemplateSection("contact", "contact-template"),
  ]);
  const { siteSettings, page, sections } = resolvedData;
  const heroSection = getPrimarySection(sections, ["hero", "intro"], ["hero"]);
  const detailSections = sections.filter((section) => section.sectionType === "detail");
  const formSection =
    sections.find((section) => section.sectionKey === "form") ??
    sections.find((section) => section.sectionType === "form") ??
    null;
  const formFaqs = parseFaqs(formSection?.settings.faqs);
  const heroFaqs = parseFaqs(heroSection?.settings.faqs);
  const templateFaqs = parseFaqs(template?.settings.fallbackFaqs);
  const faqItems =
    formFaqs.length > 0
      ? formFaqs
      : heroFaqs.length > 0
        ? heroFaqs
        : templateFaqs;
  const botProtection = getContactBotProtectionConfig();

  const heroEyebrow =
    getSectionSettingString(heroSection, "eyebrow") ??
    getSectionSettingString(template, "heroEyebrow") ??
    page?.title ??
    "Get in touch";
  const heroTitleLead =
    getSectionSettingString(template, "heroTitleLead") ?? "Let’s";
  const heroTitleAccent =
    getSectionSettingString(template, "heroTitleAccent") ?? "Connect";
  const heroDescription =
    heroSection?.subheading ??
    page?.metaDescription ??
    getSectionSettingString(template, "heroDescriptionFallback") ??
    "I’m always open to discussing new projects, creative ideas, or opportunities to be part of an amazing team.";
  const railLabel =
    getSectionSettingString(template, "railLabel") ?? "Best messages include";
  const railLine1 =
    getSectionSettingString(template, "railLine1") ??
    "Context, current stage, and the kind of collaboration you have in mind.";
  const railLine2 =
    getSectionSettingString(template, "railLine2") ??
    "AI, ML, LLM systems, research, and technical writing fit best.";
  const availabilityTitle =
    getSectionSettingString(heroSection, "availabilityTitle") ??
    getSectionSettingString(template, "availabilityTitle") ??
    "Currently Available";
  const availabilityDescription =
    getSectionSettingString(heroSection, "availabilityDescription") ??
    getSectionSettingString(template, "availabilityDescription") ??
    "I usually respond within 24-48 hours during business days. For urgent matters, mention “URGENT” in the subject line.";
  const formSectionHeading =
    getSectionSettingString(template, "formSectionHeading") ?? "Send a Message";
  const socialSectionHeading =
    getSectionSettingString(template, "socialSectionHeading") ?? "Connect Elsewhere";
  const faqSectionHeading =
    getSectionSettingString(template, "faqSectionHeading") ??
    "Frequently Asked Questions";
  const detailCardFallbackDescription =
    getSectionSettingString(template, "detailCardFallbackDescription") ??
    "Update this card from the admin contact page.";

  const contactFormCopy: ContactFormCopy = {
    eyebrow:
      getSectionSettingString(formSection, "eyebrow") ??
      getSectionSettingString(template, "formEyebrowFallback") ??
      "Direct form",
    title:
      formSection?.heading ??
      getSectionSettingString(template, "formTitleFallback") ??
      "Start the conversation",
    description:
      formSection?.subheading ??
      getSectionSettingString(template, "formDescriptionFallback") ??
      "Tell me about your project, research interest, or the kind of conversation you want to have.",
    badge:
      getSectionSettingString(formSection, "badge") ??
      getSectionSettingString(template, "formBadgeFallback") ??
      "Thoughtful replies over volume",
    nameLabel:
      getSectionSettingString(template, "formNameLabel") ?? "Your Name",
    namePlaceholder:
      getSectionSettingString(template, "formNamePlaceholder") ?? "John Doe",
    emailLabel:
      getSectionSettingString(template, "formEmailLabel") ?? "Email Address",
    emailPlaceholder:
      getSectionSettingString(template, "formEmailPlaceholder") ??
      "john@example.com",
    subjectLabel:
      getSectionSettingString(template, "formSubjectLabel") ?? "Subject",
    subjectPlaceholder:
      getSectionSettingString(template, "formSubjectPlaceholder") ??
      "Project inquiry",
    messageLabel:
      getSectionSettingString(template, "formMessageLabel") ?? "Message",
    messagePlaceholder:
      getSectionSettingString(template, "formMessagePlaceholder") ??
      "Tell me about your project or inquiry...",
    requiredMarker:
      getSectionSettingString(template, "formRequiredMarker") ?? "*",
    submitLabel:
      getSectionSettingString(template, "formSubmitLabel") ?? "Send Message",
    submittingLabel:
      getSectionSettingString(template, "formSubmittingLabel") ?? "Sending...",
    captchaPrompt:
      getSectionSettingString(template, "formCaptchaPrompt") ??
      "Complete the bot protection check before sending your message.",
    captchaRequired:
      getSectionSettingString(template, "formCaptchaRequired") ??
      "Bot protection is required for public submissions.",
    captchaMissingError:
      getSectionSettingString(template, "formCaptchaMissingError") ??
      "Complete the bot protection check before sending your message.",
    misconfiguredError:
      getSectionSettingString(template, "formMisconfiguredError") ??
      "This form is temporarily unavailable because bot protection is not configured correctly.",
    genericError:
      getSectionSettingString(template, "formGenericError") ??
      "Something went wrong while sending the message.",
    successFallback:
      getSectionSettingString(template, "formSuccessFallback") ??
      "Message sent successfully.",
  };

  const detailCards = detailSections.map((section) => {
    const href = resolveDetailSectionHref(section);

    return {
      key: section.id,
      eyebrow: getSectionSettingString(section, "eyebrow") ?? section.sectionKey,
      title: section.heading,
      description:
        section.subheading ??
        (section.bodyMarkdown.trim().length > 0 ? section.bodyMarkdown : null) ??
        detailCardFallbackDescription,
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
          eyebrow:
            getSectionSettingString(template, "fallbackEmailEyebrow") ?? "Email",
          title: siteSettings.contactEmail,
          description:
            getSectionSettingString(template, "fallbackEmailDescription") ??
            "Best for professional inquiries.",
          href: `mailto:${siteSettings.contactEmail}`,
          icon: Mail,
          featured: true,
        }
      : null,
    siteSettings.locationLabel && !detailKeys.has("location")
      ? {
          key: "location",
          eyebrow:
            getSectionSettingString(template, "fallbackLocationEyebrow") ??
            "Location",
          title: siteSettings.locationLabel,
          description:
            getSectionSettingString(template, "fallbackLocationDescription") ??
            "Available for thoughtful remote collaboration.",
          href: null,
          icon: MapPin,
          featured: false,
        }
      : null,
    siteSettings.githubUrl && !detailKeys.has("github")
      ? {
          key: "github",
          eyebrow:
            getSectionSettingString(template, "fallbackGithubEyebrow") ??
            "GitHub",
          title:
            getSectionSettingString(template, "fallbackGithubTitle") ?? "GitHub",
          description:
            getSectionSettingString(template, "fallbackGithubDescription") ??
            "Check out my open-source work.",
          href: siteSettings.githubUrl,
          icon: Github,
          featured: false,
        }
      : null,
    siteSettings.linkedinUrl && !detailKeys.has("linkedin")
      ? {
          key: "linkedin",
          eyebrow:
            getSectionSettingString(template, "fallbackLinkedinEyebrow") ??
            "LinkedIn",
          title:
            getSectionSettingString(template, "fallbackLinkedinTitle") ??
            "LinkedIn",
          description:
            getSectionSettingString(template, "fallbackLinkedinDescription") ??
            "Connect professionally.",
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
      <section className="relative overflow-hidden rounded-[2.5rem] border border-border dark:border-white/10 bg-surface-dark/10 dark:bg-[rgba(15,23,42,0.4)] px-8 py-12 shadow-2xl backdrop-blur-xl md:px-12 md:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(244,63,94,0.15),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(245,158,11,0.1),transparent_50%)]" />
        <div className="relative z-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2.5 rounded-full border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-[0.85rem] font-semibold uppercase tracking-widest text-rose-200 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
              </span>
              {heroEyebrow}
            </p>
            <h1 className="mt-8 max-w-4xl font-display text-5xl font-bold leading-[1.05] tracking-[-0.04em] text-foreground dark:text-white md:text-[5.5rem] drop-shadow-sm">
              {heroTitleLead} <span className="bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400 bg-clip-text text-transparent drop-shadow-lg">{heroTitleAccent}</span>
            </h1>
            <p className="mt-8 max-w-2xl text-[1.1rem] font-light leading-[1.7] text-muted dark:text-slate-300 md:text-[1.25rem]">
              {heroDescription}
            </p>
          </div>
          <div className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-border dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-8 shadow-lg backdrop-blur-md transition-colors hover:bg-black/[0.04] dark:bg-white/[0.04] hover:border-rose-500/20 hover:shadow-[0_12px_40px_rgba(244,63,94,0.15)]">
            <div className="absolute inset-0 bg-gradient-to-t from-rose-500/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="relative z-10">
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.25em] text-rose-400">
                {railLabel}
              </p>
              <div className="mt-4 space-y-4 text-[0.95rem] leading-relaxed text-muted dark:text-slate-300">
                <p className="group-hover:text-muted dark:text-slate-200 transition-colors">{railLine1}</p>
                <p className="text-orange-200 font-medium">{railLine2}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 overflow-hidden rounded-[2rem] border border-amber-500/20 bg-gradient-to-r from-[rgba(245,158,11,0.05)] to-[rgba(244,63,94,0.05)] p-8 shadow-xl backdrop-blur-xl transition-all duration-500 hover:border-amber-400/30 hover:shadow-[0_12px_40px_rgba(245,158,11,0.15)] md:p-10">
        <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
          <div className="relative flex shrink-0 items-center justify-center rounded-[1.25rem] bg-amber-500/15 p-4 text-amber-400 border border-amber-500/20 backdrop-blur-md">
            <div className="absolute inset-0 animate-pulse rounded-[1.25rem] bg-amber-400/10" />
            <Clock3 className="relative h-8 w-8" aria-hidden />
          </div>
          <div>
            <h2 className="font-display text-[2rem] font-bold tracking-[-0.04em] text-foreground dark:text-white">
              {availabilityTitle}
            </h2>
            <p className="mt-3 text-[1.05rem] leading-[1.7] text-muted dark:text-slate-300">
              {availabilityDescription}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.95fr]">
        <div className="space-y-8">
          <div>
            <h2 className="font-display text-[2.2rem] font-semibold tracking-[-0.04em] text-foreground dark:text-white md:text-[2.5rem]">
              {formSectionHeading}
            </h2>
          </div>
          <ContactForm
            copy={contactFormCopy}
            botProtectionMode={botProtection.mode}
            turnstileSiteKey={botProtection.siteKey}
          />
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="font-display text-[2.2rem] font-semibold tracking-[-0.04em] text-foreground dark:text-white md:text-[2.5rem]">
              {socialSectionHeading}
            </h2>
          </div>
          <div className="space-y-6">
            {socialCards.map((card) => {
              const Icon = card.icon;
              const cardClassName = `group relative block overflow-hidden rounded-[1.5rem] border p-6 transition-all duration-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-400/20 ${
                card.href ? "hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(244,63,94,0.15)]" : ""
              } ${
                card.featured
                  ? "border-rose-400/30 bg-gradient-to-br from-[rgba(244,63,94,0.15)] to-[rgba(245,158,11,0.05)] hover:border-rose-400/50 backdrop-blur-xl"
                  : "border-border dark:border-white/10 bg-surface-dark/10 dark:bg-[rgba(15,23,42,0.4)] hover:border-white/20 hover:bg-surface-dark/20 dark:bg-[rgba(15,23,42,0.6)] backdrop-blur-xl"
              }`;
              const cardContent = (
                <div className="relative z-10 flex items-start gap-5">
                  <div className={`flex shrink-0 items-center justify-center rounded-[1.25rem] p-3.5 transition-transform duration-500 group-hover:scale-110 ${
                    card.featured
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "bg-black/10 dark:bg-white/10 text-foreground dark:text-white/90 border border-white/5 group-hover:bg-white/20"
                  }`}>
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <div>
                    <p className="font-display text-[1.8rem] font-bold tracking-[-0.04em] text-foreground dark:text-white">
                      {card.title}
                    </p>
                    <p className="mt-2 text-[1.05rem] leading-[1.6] text-muted dark:text-slate-300">
                      {card.description}
                    </p>
                  </div>
                </div>
              );

              if (!card.href) {
                return (
                  <div key={card.key} className={cardClassName}>
                    {card.featured && <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(244,63,94,0.2),transparent_50%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />}
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
                  {card.featured && <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(244,63,94,0.2),transparent_50%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />}
                  {cardContent}
                </a>
              );
            })}
          </div>

          <div>
            <h2 className="font-display text-[2.2rem] font-semibold tracking-[-0.04em] text-foreground dark:text-white md:text-[2.5rem]">
              {faqSectionHeading}
            </h2>
            <div className="mt-5">
              <FaqAccordion items={faqItems} />
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
