import Link from "next/link";

import type { NavigationItem, SiteSettings } from "@/types/content";

interface SiteFooterProps {
  siteSettings: SiteSettings;
  navigationItems: NavigationItem[];
}

export function SiteFooter({ siteSettings, navigationItems }: SiteFooterProps) {
  const footerItems = navigationItems.filter((item) => item.location !== "header");

  const socials = [
    { label: "GitHub", href: siteSettings.githubUrl },
    { label: "LinkedIn", href: siteSettings.linkedinUrl },
    { label: "X", href: siteSettings.xUrl },
    { label: "Resume", href: siteSettings.resumeUrl },
  ].filter((item) => item.href);

  return (
    <footer className="mt-24 border-t border-white/10 bg-surface-dark text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
        <div className="max-w-xl">
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-accent/80">
            Long-horizon platform
          </p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-[-0.04em]">
            {siteSettings.siteName}
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            {siteSettings.footerBlurb}
          </p>
          <p className="mt-6 text-sm text-slate-400">{siteSettings.contactEmail}</p>
        </div>

        <div>
          <h3 className="font-display text-lg">Navigate</h3>
          <div className="mt-4 flex flex-col gap-3 text-sm text-slate-300">
            {footerItems.length > 0
              ? footerItems.map((item) => (
                  <Link key={item.id} href={item.href}>
                    {item.label}
                  </Link>
                ))
              : navigationItems
                  .filter((item) => item.location === "header")
                  .map((item) => (
                    <Link key={item.id} href={item.href}>
                      {item.label}
                    </Link>
                  ))}
          </div>
        </div>

        <div>
          <h3 className="font-display text-lg">Connect</h3>
          <div className="mt-4 flex flex-col gap-3 text-sm text-slate-300">
            {socials.map((item) => (
              <a key={item.label} href={item.href ?? "#"} target="_blank" rel="noreferrer">
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
