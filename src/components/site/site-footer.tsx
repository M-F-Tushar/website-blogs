import Link from "next/link";

import type { NavigationItem, SiteSettings } from "@/types/content";

interface SiteFooterProps {
  siteSettings: SiteSettings;
  navigationItems: NavigationItem[];
}

export function SiteFooter({ siteSettings, navigationItems }: SiteFooterProps) {
  const defaultNavItems = [
    { id: "home", href: "/", isExternal: false, label: "Home" },
    { id: "about", href: "/about", isExternal: false, label: "About" },
    { id: "blogs", href: "/blogs", isExternal: false, label: "Blogs" },
    { id: "academic", href: "/academic", isExternal: false, label: "Academic" },
    { id: "contact", href: "/contact", isExternal: false, label: "Contact" },
  ];
  const footerItems = navigationItems.filter(
    (item) => item.location === "footer" && item.isVisible,
  );
  const socialItems = navigationItems.filter(
    (item) => item.location === "social" && item.isVisible,
  );

  const socials =
    socialItems.length > 0
      ? socialItems
      : [
          { label: "GitHub", href: siteSettings.githubUrl },
          { label: "LinkedIn", href: siteSettings.linkedinUrl },
          { label: "X", href: siteSettings.xUrl },
          { label: "Resume", href: siteSettings.resumeUrl },
        ].filter((item) => item.href);
  const fallbackItems = navigationItems.filter(
    (item) => item.location === "header" && item.isVisible,
  );
  const navItems =
    footerItems.length > 0
      ? footerItems
      : fallbackItems.length > 0
        ? fallbackItems
        : defaultNavItems;

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-white/5 bg-[#020617] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(29,78,216,0.15),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(30,64,175,0.1),transparent_40%)] opacity-80" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.35fr_0.75fr_0.75fr]">
        <div className="max-w-xl">
          <div className="flex items-center gap-4">
            <span className="brand-mark" aria-hidden="true">
              <span className="brand-link brand-link-a" />
              <span className="brand-link brand-link-b" />
              <span className="brand-link brand-link-c" />
              <span className="brand-node brand-node-a" />
              <span className="brand-node brand-node-b" />
              <span className="brand-node brand-node-c" />
            </span>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.32em] text-cyan-200/80">
                Research-driven platform
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.05em]">
                {siteSettings.siteName}
              </h2>
            </div>
          </div>
          <p className="mt-6 text-sm leading-7 text-slate-300">{siteSettings.footerBlurb}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`mailto:${siteSettings.contactEmail}`}
              className="inline-flex items-center rounded-full border border-white/14 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-200 transition hover:border-cyan-300/40 hover:bg-white/[0.08] hover:text-white"
            >
              {siteSettings.contactEmail}
            </a>
            {siteSettings.locationLabel ? (
              <span className="inline-flex items-center rounded-full border border-white/10 px-4 py-2.5 text-sm text-slate-300">
                {siteSettings.locationLabel}
              </span>
            ) : null}
          </div>
        </div>

        <div>
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-cyan-200/80">
            Navigate
          </p>
          <div className="mt-5 flex flex-col gap-3 text-sm text-slate-300">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                target={item.isExternal ? "_blank" : undefined}
                rel={item.isExternal ? "noreferrer" : undefined}
                className="transition hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-cyan-200/80">
            Connect
          </p>
          <div className="mt-5 flex flex-col gap-3 text-sm text-slate-300">
            {socials.map((item) => (
              <a
                key={item.label}
                href={item.href ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </div>
          <p className="mt-8 text-xs uppercase tracking-[0.24em] text-slate-500">
            Built for AI engineering, ML systems, and long-horizon research credibility.
          </p>
        </div>
      </div>
    </footer>
  );
}
