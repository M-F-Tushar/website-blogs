"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import type { NavigationItem } from "@/types/content";

export type HeaderNavigationItem = Pick<
  NavigationItem,
  "id" | "href" | "isExternal" | "label"
>;

interface SiteHeaderNavigationProps {
  items: HeaderNavigationItem[];
  variant: "desktop" | "mobile";
}

function normalizeNavLabel(item: HeaderNavigationItem) {
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

export function SiteHeaderNavigation({
  items,
  variant,
}: SiteHeaderNavigationProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        variant === "desktop"
          ? "flex items-center gap-8 text-[0.98rem] text-muted dark:text-slate-300"
          : "grid grid-cols-2 gap-3 text-sm text-muted dark:text-slate-300 min-[430px]:grid-cols-3",
      )}
    >
      {items.map((item) => {
        const isActive = !item.isExternal && isActivePath(pathname, item.href);

        return (
          <Link
            key={item.id}
            href={item.href}
            prefetch={false}
            target={item.isExternal ? "_blank" : undefined}
            rel={item.isExternal ? "noreferrer" : undefined}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              variant === "desktop" ? "relative pb-2 transition hover:text-foreground dark:hover:text-white" : "rounded-full border px-4 py-2 text-center transition",
              variant === "desktop" &&
                isActive &&
                "text-foreground dark:text-white",
              variant === "mobile" &&
                (isActive
                  ? "border-sky-400/30 bg-sky-400/10 text-foreground dark:text-white"
                  : "border-border bg-white/4 text-muted dark:border-white/8 dark:text-slate-300"),
            )}
          >
            {normalizeNavLabel(item)}
            {variant === "desktop" ? (
              <span
                className={cn(
                  "absolute inset-x-0 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full bg-sky-400 transition-transform",
                  isActive && "scale-x-100",
                )}
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
