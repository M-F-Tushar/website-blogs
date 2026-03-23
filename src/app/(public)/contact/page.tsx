import { Mail, Github, Linkedin, Clock3 } from "lucide-react";
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
  const formFaqs = parseFaqs(formSection?.settings.faqs);
  const heroFaqs = parseFaqs(heroSection?.settings.faqs);
  const faqItems = formFaqs.length > 0 ? formFaqs : heroFaqs;
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
  const socialCards = [
    {
      key: "email",
      eyebrow: "Email",
      title: siteSettings.contactEmail,
      description: "Best for professional inquiries",
      href: `mailto:${siteSettings.contactEmail}`,
      icon: Mail,
      featured: true,
    },
    siteSettings.githubUrl
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
    siteSettings.linkedinUrl
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
    href: string;
    icon: typeof Mail;
    featured: boolean;
  }>;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      <section className="mx-auto max-w-4xl text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm text-slate-300">
          <span className="text-sky-400">✦</span>
          {getSectionSettingString(heroSection, "eyebrow") ?? page?.title ?? "Get in touch"}
        </p>
        <h1 className="mt-6 font-display text-[3.9rem] font-semibold leading-[0.92] tracking-[-0.06em] text-white md:text-[5.2rem]">
          Let&apos;s <span className="accent-gradient-text">Connect</span>
        </h1>
        <p className="mx-auto mt-5 max-w-3xl text-[1.04rem] leading-8 text-slate-300 md:text-[1.14rem]">
          {heroSection?.subheading ??
            page?.metaDescription ??
            "I’m always open to discussing new projects, creative ideas, or opportunities to be part of an amazing team."}
        </p>
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
            <h2 className="font-display text-[2.5rem] font-semibold tracking-[-0.04em] text-white">
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
          />
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="font-display text-[2.5rem] font-semibold tracking-[-0.04em] text-white">
              Connect Elsewhere
            </h2>
          </div>
          <div className="space-y-4">
            {socialCards.map((card) => {
              const Icon = card.icon;

              return (
                <a
                  key={card.key}
                  href={card.href}
                  target={card.href.startsWith("mailto:") ? undefined : "_blank"}
                  rel={card.href.startsWith("mailto:") ? undefined : "noreferrer"}
                  className={`block overflow-hidden rounded-[1.45rem] border p-5 transition hover:-translate-y-0.5 ${
                    card.featured
                      ? "border-sky-400/20 bg-[linear-gradient(90deg,rgba(14,165,233,0.9),rgba(79,70,229,0.8))]"
                      : "border-white/8 bg-white/4"
                  }`}
                >
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
                </a>
              );
            })}
          </div>

          <div>
            <h2 className="font-display text-[2.5rem] font-semibold tracking-[-0.04em] text-white">
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
