# Frontend Redesign: "Dark Nebula" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the existing frontend to a "Dark Nebula" aesthetic with an "Immersive Long-Scroll" structure, ensuring a high-impact professional feel while maintaining zero regressions for the admin dashboard and data flow.

**Architecture:** A persistent `NebulaBackground` in the root layout handles animated gradients, while modular components in `src/components/site/sections/` manage each part of the "Immersive Journey."

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS 4, Framer Motion, Lucide React, Supabase.

---

### Task 1: Foundation & Dependencies

**Files:**
- Modify: `package.json`
- Create: `src/components/site/nebula-background.tsx`
- Modify: `src/app/(public)/layout.tsx`

- [ ] **Step 1: Install dependencies**
Run: `npm install framer-motion lucide-react`

- [ ] **Step 2: Create the NebulaBackground component**
```tsx
"use client";
import { motion } from "framer-motion";

export function NebulaBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-950">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -top-[20%] -left-[10%] h-[70%] w-[70%] rounded-full bg-blue-700/20 blur-[120px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 2 }}
        className="absolute -bottom-[20%] -right-[10%] h-[60%] w-[60%] rounded-full bg-purple-700/20 blur-[100px]"
      />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] [mask-image:linear-gradient(180deg,white,transparent)]" />
    </div>
  );
}
```

- [ ] **Step 3: Integrate NebulaBackground into Public Layout**
Update `src/app/(public)/layout.tsx` to include `<NebulaBackground />` and wrap the children in a `div` with the `theme-nebula` class.

```tsx
return (
  <div className="theme-nebula relative min-h-screen overflow-x-clip">
    <NebulaBackground />
    <SiteHeader siteSettings={siteSettings} navigationItems={navigationItems} />
    <main className="relative z-10">{children}</main>
    <SiteFooter siteSettings={siteSettings} navigationItems={navigationItems} />
  </div>
);
```

- [ ] **Step 4: Commit**
```bash
git add package.json src/components/site/nebula-background.tsx src/app/(public)/layout.tsx
git commit -m "feat: add nebula background foundation"
```

---

### Task 2: Scoped Theme & Glass Primitives

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/components/ui/glass-card.tsx`

- [ ] **Step 1: Update globals.css with scoped .theme-nebula class**
Define the Dark Nebula variables and styles within a `.theme-nebula` class to ensure the admin dashboard remains unaffected.

```css
.theme-nebula {
  --background: #020617;
  --foreground: #f8fafc;
  --muted: #94a3b8;
  --border: rgba(255, 255, 255, 0.08);
  --accent: #1d4ed8;
  --accent-strong: #1e40af;
  --glass-bg: rgba(255, 255, 255, 0.03);
  --glass-blur: 40px;
}

.theme-nebula .glass-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--border);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
```

- [ ] **Step 2: Create GlassCard primitive**
```tsx
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl transition-all hover:bg-white/10",
      className
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**
```bash
git add src/app/globals.css src/components/ui/glass-card.tsx
git commit -m "feat: add scoped nebula theme and glass primitives"
```

---

### Task 3: The Cosmic Hero Section

**Files:**
- Create: `src/components/site/sections/hero-cosmic.tsx`
- Modify: `src/app/(public)/page.tsx`

- [ ] **Step 1: Implement HeroCosmic component**
Focus on 100vh height, centered typography, and pulsating CTA.

- [ ] **Step 2: Swap existing Hero in HomePageContent**
Replace the current hero section in `src/app/(public)/page.tsx` with `<HeroCosmic />`.

- [ ] **Step 3: Commit**
```bash
git add src/components/site/sections/hero-cosmic.tsx src/app/(public)/page.tsx
git commit -m "feat: implement cosmic hero section"
```

---

### Task 4: HUD Metrics & Active Vectors

**Files:**
- Create: `src/components/site/sections/hud-metrics.tsx`
- Modify: `src/app/(public)/page.tsx`

- [ ] **Step 1: Implement HUDMetrics component**
Use Framer Motion `useScroll` to trigger animations as the user scrolls past the hero.

- [ ] **Step 2: Commit**
```bash
git add src/components/site/sections/hud-metrics.tsx
git commit -m "feat: implement hud metrics section"
```

---

### Task 5: Final Polish & Verification

**Files:**
- Modify: `src/components/site/site-header.tsx`
- Modify: `src/components/site/site-footer.tsx`

- [ ] **Step 1: Update Header/Footer to Glass style**
Ensure they match the new `Dark Nebula` aesthetic with transparency and blurs.

- [ ] **Step 2: Run verification**
Run: `npm run build && npm run lint`
Expected: Success with no regressions in `(admin)`.

- [ ] **Step 3: Final Commit**
```bash
git add .
git commit -m "feat: finalize dark nebula redesign"
```
