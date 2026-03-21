import { ContactForm } from "@/components/site/contact-form";
import { SectionHeading } from "@/components/ui/section-heading";
import { getContactPageData } from "@/lib/content/queries";
import { buildSiteMetadata } from "@/lib/content/seo";

export async function generateMetadata() {
  return buildSiteMetadata({
    title: "Contact",
    description:
      "Reach out for collaboration, conversation, project ideas, or research-oriented discussion.",
    path: "/contact",
  });
}

export default async function ContactPage() {
  const { siteSettings } = await getContactPageData();
  const contactTracks = [
    "Research conversations",
    "AI/ML collaboration",
    "Systems and tooling",
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-6">
          <div className="grid-backdrop overflow-hidden rounded-[2.15rem] border border-white/45">
            <div className="px-6 py-10 md:px-8 md:py-10">
              <SectionHeading
                eyebrow="Contact"
                title="Open a conversation"
                description="If there's an idea, project, or direction worth exploring together, I'd like to hear about it."
              />
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
            <div className="surface-panel rounded-[1.75rem] p-6">
              <p className="signal-label">Email</p>
              <a
                className="mt-4 inline-block text-lg font-medium text-foreground transition hover:text-accent-strong"
                href={`mailto:${siteSettings.contactEmail}`}
              >
                {siteSettings.contactEmail}
              </a>
              <p className="mt-3 text-sm leading-7 text-muted">
                Best for collaboration, research questions, or project discussion.
              </p>
            </div>

            {siteSettings.locationLabel ? (
              <div className="surface-panel rounded-[1.75rem] p-6">
                <p className="signal-label">Location</p>
                <p className="mt-4 text-lg font-medium text-foreground">
                  {siteSettings.locationLabel}
                </p>
                <p className="mt-3 text-sm leading-7 text-muted">
                  Remote-friendly and open to thoughtful technical conversations across
                  time zones.
                </p>
              </div>
            ) : null}

            <div className="surface-panel rounded-[1.75rem] p-6">
              <p className="signal-label">Response mode</p>
              <p className="mt-4 text-lg font-medium text-foreground">
                Clear context helps the fastest reply
              </p>
              <p className="mt-3 text-sm leading-7 text-muted">
                A short summary, relevant links, and the kind of discussion you want make
                it easier to respond well.
              </p>
            </div>
          </div>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
