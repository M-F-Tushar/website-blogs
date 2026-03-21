import { ContactForm } from "@/components/site/contact-form";
import { SectionHeading } from "@/components/ui/section-heading";
import { getContactPageData } from "@/lib/content/queries";
import { buildMetadata } from "@/lib/content/seo";

export const metadata = buildMetadata({
  title: "Contact",
  description:
    "Reach out for collaboration, conversation, project ideas, or research-oriented discussion.",
  path: "/contact",
});

export default async function ContactPage() {
  const { siteSettings } = await getContactPageData();

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-[0.85fr_1.15fr] md:py-24">
      <div>
        <SectionHeading
          eyebrow="Contact"
          title="Open a conversation"
          description="If there’s an idea, project, or direction worth exploring together, I’d like to hear about it."
        />
        <div className="surface-panel mt-10 rounded-[1.75rem] p-6">
          <div className="space-y-5 text-sm text-muted">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.26em] text-accent">
                Email
              </p>
              <a
                className="mt-2 inline-block text-base text-foreground"
                href={`mailto:${siteSettings.contactEmail}`}
              >
                {siteSettings.contactEmail}
              </a>
            </div>
            {siteSettings.locationLabel ? (
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.26em] text-accent">
                  Location
                </p>
                <p className="mt-2 text-base text-foreground">
                  {siteSettings.locationLabel}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <ContactForm />
    </div>
  );
}
