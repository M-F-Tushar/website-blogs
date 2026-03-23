"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Github, Linkedin, Search } from "lucide-react";

import { PublicThemeToggle } from "@/components/site/public-theme-toggle";
import type { NavigationItem, SiteSettings } from "@/types/content";
import { cn } from "@/lib/utils";

interface SiteHeaderProps {
  siteSettings: SiteSettings;
  navigationItems: NavigationItem[];
}

function normalizeNavLabel(item: Pick<NavigationItem, "href" | "label">) {
  if (item.href === "/blogs" && item.label.trim().toLowerCase() === "blogs") {
    return "Blog";
  }

  return item.label;
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({ siteSettings, navigationItems }: SiteHeaderProps) {
  const pathname = usePathname();
  const configuredHeaderItems = navigationItems.filter(
    (item) => item.location === "header" && item.isVisible,
  );
  const headerItems =
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
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 py-5">
        <Link href="/" className="font-display text-[2rem] font-semibold tracking-[-0.05em] text-white">
          {siteSettings.siteName}
        </Link>

        <div className="hidden flex-1 items-center justify-center lg:flex">
          <nav className="flex items-center gap-8 text-[0.98rem] text-slate-300">
            {headerItems.map((item) => {
              const isActive = !item.isExternal && isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  target={item.isExternal ? "_blank" : undefined}
                  rel={item.isExternal ? "noreferrer" : undefined}
                  className={cn(
                    "relative pb-2 transition hover:text-white",
                    isActive && "text-white",
                  )}
                >
                  {normalizeNavLabel(item)}
                  <span
                    className={cn(
                      "absolute inset-x-0 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full bg-sky-400 transition-transform",
                      isActive && "scale-x-100",
                    )}
                  />
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden items-center gap-3 text-slate-200 lg:flex">
          <Link
            href="/blogs#search"
            className="site-icon-button"
            aria-label="Search articles"
            title="Search articles"
          >
            <Search className="h-4 w-4" />
          </Link>
          <PublicThemeToggle />
          <span className="mx-1 h-8 w-px bg-white/10" />
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

      <div className="overflow-x-auto border-t border-white/6 px-6 pb-4 pt-3 lg:hidden">
        <nav className="flex min-w-max items-center gap-4 text-sm text-slate-300">
          {headerItems.map((item) => {
            const isActive = !item.isExternal && isActivePath(pathname, item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                target={item.isExternal ? "_blank" : undefined}
                rel={item.isExternal ? "noreferrer" : undefined}
                className={cn(
                  "rounded-full border px-4 py-2 transition",
                  isActive
                    ? "border-sky-400/30 bg-sky-400/10 text-white"
                    : "border-white/8 bg-white/4 text-slate-300",
                )}
              >
                {normalizeNavLabel(item)}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
