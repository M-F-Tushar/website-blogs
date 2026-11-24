import Link from "next/link";
import { Github, Linkedin, Search } from "lucide-react";

import { PublicThemeToggle } from "@/components/site/public-theme-toggle";
import {
  SiteHeaderNavigation,
  type HeaderNavigationItem,
} from "@/components/site/site-header-navigation";
import type { NavigationItem, SiteSettings } from "@/types/content";

interface SiteHeaderProps {
  siteSettings: SiteSettings;
  navigationItems: NavigationItem[];
}

export function SiteHeader({ siteSettings, navigationItems }: SiteHeaderProps) {
  const configuredHeaderItems = navigationItems.filter(
    (item) => item.location === "header" && item.isVisible,
  );
  const headerItems: HeaderNavigationItem[] =
    configuredHeaderItems.length > 0
      ? configuredHeaderItems
      : [
          { id: "home", href: "/", isExternal: false, label: "Home" },
          { id: "about", href: "/about", isExternal: false, label: "About" },
          { id: "blogs", href: "/blogs", isExternal: false, label: "Blog" },
          { id: "academic", href: "/academic", isExternal: false, label: "Academic" },
          {
            id: "recommendations",
            href: "/recommendations",
            isExternal: false,
            label: "Recommendations",
          },
          { id: "contact", href: "/contact", isExternal: false, label: "Contact" },
        ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/6 bg-[rgba(7,14,28,0.82)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-5 sm:gap-8">
        <Link
          href="/"
          prefetch={false}
          className="font-display text-[1.7rem] font-semibold tracking-[-0.05em] text-foreground dark:text-white sm:text-[2rem]"
        >
          {siteSettings.siteName}
        </Link>

        <div className="hidden flex-1 items-center justify-center lg:flex">
          <SiteHeaderNavigation items={headerItems} variant="desktop" />
        </div>

        <div className="flex shrink-0 items-center gap-2 text-muted dark:text-slate-200 lg:gap-3">
          <Link
            href="/blogs#search"
            prefetch={false}
            className="site-icon-button"
            aria-label="Search articles"
            title="Search articles"
          >
            <Search className="h-4 w-4" />
          </Link>
          <PublicThemeToggle />
          <div className="hidden items-center gap-3 lg:flex">
            <span className="mx-1 h-8 w-px bg-black/10 dark:bg-white/10" />
            {siteSettings.githubUrl ? (
              <a
                href={siteSettings.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="site-icon-button"
                aria-label="GitHub"
                title="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
            ) : null}
            {siteSettings.linkedinUrl ? (
              <a
                href={siteSettings.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="site-icon-button"
                aria-label="LinkedIn"
                title="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-t border-white/6 px-6 pb-4 pt-3 lg:hidden">
        <SiteHeaderNavigation items={headerItems} variant="mobile" />
      </div>
    </header>
  );
}
