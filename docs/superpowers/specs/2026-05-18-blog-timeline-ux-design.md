# Blog Timeline UX Redesign

## 1. Overview and Purpose
The goal of this project is to redesign the presentation of content lists (Blogs, Academic, Recommendations) to encourage user engagement and scrolling. The current standard grid/list format will be replaced with a highly visual, immersive "Reading Timeline" that leverages the existing "cosmic" aesthetic of the platform.

## 2. Core Layout Strategy: Alternating Timeline
- **The Spine:** A central vertical line running down the page, styled as a glowing "cosmic" track (blue/purple hues matching `hero-cosmic` and `nebula-background`).
- **The Nodes:** Glowing dots along the track representing individual posts.
- **The Placement:** Post cards will alternate left and right along the central timeline in a zig-zag pattern on desktop. On mobile, this will elegantly collapse to a left-aligned track with cards on the right.

## 3. Component Redesign: Interactive Glass Panels
The individual `ContentCard` will be refactored to align with this new aesthetic:
- **Visuals:** Translucent glassmorphism background with a subtle border glow.
- **Media Integration:** Larger featured images with a smooth gradient fade into the content area.
- **Typography & Metadata:** Clear separation of metadata (date, read time, eyebrow tag) from the main title, utilizing monospace elements for technical data.

## 4. Interactive Enchantment
- **Card Hover:** Hovering over a card will trigger a slight scale/lift effect and intensify the border glow.
- **Timeline Synergy:** Hovering a card will cause its connected node on the central timeline to pulse, creating a physical connection between the content and the journey.
- **Scroll Animations:** Cards must fade and slide in slightly as they enter the viewport to make the act of scrolling feel rewarding.

## 5. Technical Implementation Details
- Create a new `TimelineDirectory` component to handle the layout logic (alternating placement, drawing the connecting lines).
- The `TimelineDirectory` must be generic enough to accept an array of `PostSummary` items, as it will be used across Blogs, Academic, and Recommendations directories.
- Update `ContentCard` to support the new "glass panel" variant.
- Ensure the layout remains responsive (switching from center-track zig-zag to left-track linear on smaller screens).

## 6. Pagination and Data Loading
- The `TimelineDirectory` will replace `PostsDirectory` and handle the same `posts` array, honoring existing client-side filtering and sorting.
- Since the platform currently loads and filters all posts client-side without explicit pagination, the timeline spine will smoothly terminate at the last item. If a "Load More" button or infinite scroll is added later, the spine must terminate cleanly into that UI element.