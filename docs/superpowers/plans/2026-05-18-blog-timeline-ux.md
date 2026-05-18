# Blog Timeline UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign content lists (Blogs, Academic, Recommendations) into a central, alternating "Reading Timeline" with interactive glassmorphism cards.

**Architecture:** We will create a generic `TimelineDirectory` layout component that renders the central spine and positions items in a zig-zag pattern. We will update `ContentCard` to support a new `variant="glass"` style with hover enchantments. Finally, we will refactor all three directory components to use the new timeline and remove the legacy grid/list view toggles.

**Tech Stack:** React, Tailwind CSS, lucide-react

---

### Task 1: Update ContentCard with Glass Variant

**Files:**
- Modify: `src/components/site/content-card.tsx`

- [ ] **Step 1: Update the interface**
Add `variant?: "default" | "glass"` to `ContentCardProps`.

- [ ] **Step 2: Add glass styling to the main shell**
When `variant === "glass"`, apply a highly translucent background (`bg-slate-900/40`), intense backdrop blur (`backdrop-blur-md`), and a glowing border effect on hover (`hover:border-sky-400/50 hover:shadow-[0_0_30px_rgba(56,189,248,0.15)]`). Ensure the base classes maintain the hover lift/scale effect (`hover:-translate-y-1` or `hover:scale-[1.02]`). Remove the solid background classes when in glass mode.

- [ ] **Step 3: Update typography and layout for glass variant**
In glass variant, ensure the featured image has a smooth gradient fade into the text area. Update the metadata container (date, read time, eyebrow tag) to utilize monospace typography (e.g., `font-mono text-sky-400`) to separate it visually from the main title, ensuring a tech-forward look. Add a class to the root `Link` like `group/card` to allow targeting inner elements on hover.

- [ ] **Step 4: Verify and Commit**
Run `npm run verify` to ensure no lint/type errors.
```bash
npm run verify
git add src/components/site/content-card.tsx
git commit -m "feat: add glass variant to ContentCard"
```

### Task 2: Create the TimelineDirectory Component

**Files:**
- Create: `src/components/site/timeline-directory.tsx`

- [ ] **Step 1: Scaffold the component**
Create the component accepting `items: T[]` and `renderItem: (item: T, index: number) => React.ReactNode`. Make it a `"use client"` component. Import `motion` from `framer-motion`.

- [ ] **Step 2: Implement the central spine with termination**
Create a relative container. Add an absolute `div` representing the "Cosmic" timeline spine down the center (e.g., `absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-sky-400/20 via-purple-500/20 to-transparent`). The `to-transparent` at the bottom smoothly terminates the spine at the last item.

- [ ] **Step 3: Implement alternating placement**
Map over the items. On desktop (`md:`), alternate items left and right using a 3-column CSS Grid (`grid-cols-[1fr_auto_1fr]`). The central column will contain the timeline node. Even items sit in the left column, odd items sit in the right column. On mobile (default), use a linear layout with the track on the left.

- [ ] **Step 4: Add timeline nodes and hover synergies**
For each item, add a glowing dot on the timeline track (e.g., `w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_10px_#38bdf8]`). Ensure that hovering the card can trigger a pulse effect on the node (e.g., `group-hover/row:scale-150`).

- [ ] **Step 5: Implement scroll entrance animations with framer-motion**
Wrap each mapped row in a `<motion.div>`. Use `initial={{ opacity: 0, y: 20 }}` and `whileInView={{ opacity: 1, y: 0 }}` with `viewport={{ once: true, margin: "-50px" }}` to create a smooth fade and slide-in effect as the card enters the viewport.

- [ ] **Step 6: Verify and Commit**
Run `npm run verify` to ensure no lint/type errors.
```bash
npm run verify
git add src/components/site/timeline-directory.tsx
git commit -m "feat: create generic TimelineDirectory layout component with animations"
```

### Task 3: Refactor PostsDirectory to use Timeline

**Files:**
- Modify: `src/components/site/posts-directory.tsx`

- [ ] **Step 1: Remove legacy view toggles**
Remove the `view` state (`"grid" | "list"`). Remove the `archive-view-button` UI for toggling Grid/List.

- [ ] **Step 2: Replace rendering logic**
Replace the current `filteredPosts.length > 0 ? ( <div className={cn("mt-8 gap-6"...> ) : ...` rendering block with the new `<TimelineDirectory>`.

- [ ] **Step 3: Render ContentCards as glass**
Pass `filteredPosts` to `TimelineDirectory`, and in the `renderItem` function, return the `<ContentCard>` with `variant="glass"` and no `layout` prop (as the timeline dictates the structural layout).

- [ ] **Step 4: Manual Verification**
Start the dev server (`npm run dev`). Navigate to `/blogs`. Ensure the layout is a zig-zag timeline. Type into the search input and verify that the timeline updates seamlessly to show only matching items without breaking the layout. Ensure sorting works.

- [ ] **Step 5: Verify and Commit**
Run `npm run verify`.
```bash
npm run verify
git add src/components/site/posts-directory.tsx
git commit -m "refactor: migrate PostsDirectory to Timeline layout"
```

### Task 4: Refactor AcademicDirectory to use Timeline

**Files:**
- Modify: `src/components/site/academic-directory.tsx`

- [ ] **Step 1: Remove legacy view toggles**
Remove the `view` state and the Grid/List toggle UI. Leave the `activeType` filter pills in place.

- [ ] **Step 2: Replace rendering logic**
Replace the grid/list rendering block with `<TimelineDirectory>`. 

- [ ] **Step 3: Render ContentCards as glass**
Use the `TimelineDirectory` to map over `filteredEntries`, returning `<ContentCard>` elements with `variant="glass"`.

- [ ] **Step 4: Verify and Commit**
Run `npm run verify`.
```bash
npm run verify
git add src/components/site/academic-directory.tsx
git commit -m "refactor: migrate AcademicDirectory to Timeline layout"
```

### Task 5: Refactor RecommendationsDirectory to use Timeline

**Files:**
- Modify: `src/components/site/recommendations-directory.tsx`

- [ ] **Step 1: Remove legacy view toggles**
Remove the `view` state and the Grid/List toggle UI. Leave the `activeCategory` filter pills.

- [ ] **Step 2: Replace rendering logic**
Replace the grid/list rendering block with `<TimelineDirectory>`.

- [ ] **Step 3: Render ContentCards as glass**
Use the `TimelineDirectory` to map over `filteredRecommendations`, returning `<ContentCard>` elements with `variant="glass"`.

- [ ] **Step 4: Verify and Commit**
Run `npm run verify`.
```bash
npm run verify
git add src/components/site/recommendations-directory.tsx
git commit -m "refactor: migrate RecommendationsDirectory to Timeline layout"
```

### Task 6: Automated Verification

**Files:**
- Modify: `tests/smoke/public-site.spec.ts` (if applicable) or run smoke tests.

- [ ] **Step 1: Run end-to-end tests**
Run `npm run verify:smoke` to ensure the layout refactoring hasn't caused existing public site tests to fail (e.g. testing the existence of blogs or navigation).

- [ ] **Step 2: Fix any broken tests**
If any E2E tests were checking for the `grid`/`list` buttons that we removed, remove those assertions from the tests.

- [ ] **Step 3: Verify and Commit**
```bash
git add tests/smoke/public-site.spec.ts
git commit -m "test: update smoke tests for timeline layout"
```