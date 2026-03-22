"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import type { SiteSettings, PageSection } from "@/types/content";

interface HeroCosmicProps {
  siteSettings: SiteSettings;
  heroSection?: PageSection;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  heroEyebrow: string;
  focusTags: string[];
}

export function HeroCosmic({
  siteSettings,
  heroSection,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  heroEyebrow,
  focusTags,
}: HeroCosmicProps) {
  return (
    <section className="relative flex min-h-[100vh] flex-col items-center justify-center px-6 pt-20 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-5xl"
      >
        <span className="inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5 font-mono text-xs uppercase tracking-[0.3em] text-cyan-200 backdrop-blur-md">
          {heroEyebrow}
        </span>
        <h1 className="mt-8 font-display text-6xl font-bold tracking-tight text-white md:text-8xl">
          {heroSection?.heading ?? siteSettings.siteTagline}
        </h1>
        <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-slate-400 md:text-xl">
          {heroSection?.subheading ?? siteSettings.siteDescription}
        </p>
        
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Link
              href={primaryCtaHref}
              className="inline-flex items-center rounded-full bg-white px-8 py-4 text-sm font-semibold text-slate-950 transition-all hover:bg-cyan-50 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
            >
              {primaryCtaLabel}
            </Link>
          </motion.div>
          <Link
            href={secondaryCtaHref}
            className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-8 py-4 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10"
          >
            {secondaryCtaLabel}
          </Link>
        </div>

        <div className="mt-16 flex flex-wrap justify-center gap-3">
          {focusTags.map((tag) => (
            <span key={tag} className="rounded-full border border-white/5 bg-white/5 px-4 py-2 text-xs font-medium text-slate-400">
              {tag}
            </span>
          ))}
        </div>
      </motion.div>
      
      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/30"
      >
        <div className="h-10 w-6 rounded-full border border-white/20 p-1">
          <div className="mx-auto h-2 w-1 rounded-full bg-white/50" />
        </div>
      </motion.div>
    </section>
  );
}
