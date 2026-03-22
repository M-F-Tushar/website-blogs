# Design Doc: Frontend Redesign - "Dark Nebula" Immersive Journey

## 1. Overview
Redesign the existing website-blogs frontend to attract a larger technical audience interested in AI, ML, and MLOps. The redesign will transition from a light-themed glassmorphism to a "Dark Nebula" aesthetic with an "Immersive Long-Scroll" structure.

## 2. Visual Identity
- **Theme**: "Dark Nebula" (Deep & Immersive)
- **Palette**: Midnight base (`#020617`), dynamic mesh gradients (Blue-700, Purple-700), and neon accents.
- **Glassmorphism**: Enhanced blur (40px) with thin borders (1px, 8% opacity) and inner shadows for depth.
- **Typography**: Bold, wide sans-serif (Inter Tight) for headings; high-legibility Inter for body.

## 3. Structural Flow ("Immersive Journey")
1. **Cosmic Hero**: Full-height (100vh) immersive entry with minimal, high-impact messaging.
2. **HUD Metrics**: Scroll-linked horizontal "Heads-Up Display" showing technical proficiency (Active Vectors).
3. **Research Ledger**: High-contrast glass cards for featured blog posts with depth-of-field effects.
4. **Academic Node Map**: Visual, connected representation of research and learning nodes.
5. **Signal Hub**: Immersive footer with contact and social signals.

## 4. Architecture
- **Persistent Canvas**: A `NebulaBackground` component in the root layout to manage animated gradients.
- **Modular Sections**: Standardized components in `src/components/site/sections/` for each journey segment.
- **Glass Primitives**: Reusable `GlassCard` and `GlassPanel` components using Tailwind CSS 4.
- **Motion**: Framer Motion for scroll-linked animations and hardware-accelerated transitions.

## 5. Technical Requirements
- **Next.js 16 (App Router)**: Utilizing server components for performance.
- **Tailwind CSS 4**: For precise styling control.
- **Framer Motion**: For high-fidelity interactions.
- **Supabase Integration**: Maintaining existing data flow via `src/lib/content/queries.ts`.

## 6. Performance & Safety
- **LCP Optimization**: Server-side rendering for the hero section.
- **Lazy Loading**: Deferred loading for heavy visual components (Node Map).
- **GPU Acceleration**: Using `will-change` and hardware-accelerated transforms for blurs/gradients.
- **Zero Regression**: No changes to existing Supabase schemas or admin dashboard logic.
