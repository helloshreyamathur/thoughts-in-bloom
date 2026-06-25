# Thoughts in Bloom — Design & UX Overhaul PRD

## Current State Summary

The app is functionally complete (5 pages, localStorage CRUD, D3 constellation, analytics) but visually broken and emotionally flat. Tailwind v4's cascade layer system causes a global CSS reset to override all utility classes — padding, margin, border-radius, and max-width are all zeroed out. Beyond the technical bugs, the design reads as a neutral product template rather than a memorable, branded experience.

---

## Design Principles

These principles govern every decision — from a 2px border change to a full page redesign. When in doubt, return here.

### 1. Atmosphere over interface

The app should feel like a place, not a tool. Every pixel contributes to a mood. If a UI element doesn't feel like it belongs in a sunlit studio with linen curtains, it doesn't belong here. The gradient backgrounds, the glassmorphic layers, the soft blobs — these aren't decoration. They're the room the user is thinking in.

### 2. Softness is not weakness

Every edge is rounded. Every shadow is diffused. Every transition is eased. But soft doesn't mean vague — there is precision in the spacing, clarity in the typography hierarchy, and decisiveness in the interaction design. The app whispers, but it always says something clear.

### 3. Let the content breathe

Whitespace is not empty space — it's the silence between notes. Card padding is generous (28px minimum). Line height is tall (1.7+ for body text). Section gaps are deliberate. When choosing between "tight and efficient" and "spacious and calm," always choose calm. This is a garden, not a dashboard.

### 4. Earn every pixel

Nothing exists without purpose. No ornamental borders, no decorative dividers, no filler elements. The abstract blobs earn their place because they create atmosphere. The glassmorphic treatment earns its place because it creates depth. If something is purely aesthetic, it must serve the emotional experience — otherwise remove it.

### 5. Motion as meaning

Animations communicate, they don't perform. A card sliding up says "I just arrived." A bloom pulse says "something was created." A gentle float says "I'm alive, I'm waiting." Every animation must answer: what is this motion telling the user? If the answer is "nothing, it just looks cool," slow it down or remove it. Easing is always ease-out or sinusoidal — never spring, never bounce. The motion language is gravity, not rubber.

### 6. Consistency is trust

The same interaction should feel the same everywhere. A card hover on the home page should feel identical to a card hover on insights. The same tag pill style appears in thought cards, the capture area, the constellation tooltip, and the edit modal. Typography scale, spacing scale, and color usage follow the same rules on every page. Breaking consistency requires a clear reason (e.g., the constellation page uses a different spatial model — that's a reason).

### 7. Respect the serif

Cormorant Garamond is the voice of the app. It should never be bold (500 max). It should never be cramped (generous letter-spacing and line-height). It speaks in italics when the content is personal (thoughts, questions, empty states) and in roman when the content is structural (card titles, section heads). The serif carries the brand — Inter is infrastructure, Cormorant is personality.

### 8. Progressive disclosure

Show what matters first. Hover to reveal actions. Scroll to discover more. The card hover overlay (edit/archive) is the model: actions exist but don't compete with content. This principle extends to the constellation controls, the analytics details, and any future feature.

### 9. Design for the portfolio viewer

This is a portfolio piece. The first 3 seconds matter more than the 30th minute. The gradient background, the hero typography, the first card animation — these are the first impression. A design-focused viewer will judge the craft before they try the features. Every visible-on-load element must be flawless.

### 10. The bloom is in the details

The name "Thoughts in Bloom" isn't decoration — it's the design ethos. Thoughts bloom: they start small (a seed in the textarea), they grow (a card in the garden), they connect (edges in the constellation), they reveal patterns (insights). The submit button says "Bloom →" because that's what's happening. The abstract blobs evoke organic growth. The color palette is drawn from a garden at golden hour. Every design choice should feel like it could have grown here naturally.

---

## Part 1: Brand Identity & Emotional Design

### Brand Personality

**Thoughts in Bloom** should feel like opening a private journal in a sunlit room. The experience is meditative, warm, and unhurried — a space that rewards slowness. The "bloom" metaphor is expressed not through literal flowers, but through **soft organic forms that feel like they're gently expanding, breathing, growing**.

**Keywords**: Dreamy. Meditative. Warm. Intimate. Alive.

**Reference points**: The Dot app's warm gradient backgrounds and personal tone. The amotion UI's translucent glass sphere and floating elements. The watercolor blob illustrations that feel hand-made and organic rather than digital.

### 1.1 — Gradient Background System

**Problem**: The current flat `#FAFAF8` background feels sterile and generic. It could be any app.

**Fix**: Replace the flat background with a **soft radial gradient** that shifts subtly across the page. The gradient should feel like light filtering through frosted glass — warm pinks bleeding into lavender, with a hint of sage.

**Spec**:
- Primary background: A subtle radial gradient anchored top-right, using very diluted versions of the accent palette:
  - `radial-gradient(ellipse at 70% 20%, rgba(201,160,160,0.12) 0%, rgba(160,154,201,0.08) 40%, rgba(250,250,248,1) 70%)`
- The gradient should be **fixed** (doesn't scroll with content), creating a sense of ambient light
- On the constellation page: same warm gradient but slightly more saturated, replacing the current harsh `#0F0F0F` black
- Consider a secondary, smaller gradient blob positioned bottom-left using sage tones for balance

**Impact**: High. This single change transforms the entire feel from "template" to "world."

### 1.2 — Abstract Organic Blob Illustrations

**Problem**: Empty states, page headers, and card backgrounds lack personality. There's no visual signature.

**Fix**: Introduce **CSS-only abstract blobs** — soft, blurred radial gradients that evoke watercolor washes. These act as the app's visual signature, the way the reference screenshots use diffused color clouds as identity markers.

**Where to use**:
- **Home page hero area**: A large, very soft blob behind the "What are you thinking about today?" heading — positioned top-right, partially off-screen, using dusty rose at ~10% opacity with a large blur
- **Empty states**: When the garden or archive is empty, show a centered bloom blob (radial gradient, ~200px, blurred edges) above the text — it should feel like a thought waiting to form
- **Insight cards**: Each card gets a subtle blob in one corner (top-right or bottom-left) using the card's accent color at ~6% opacity — gives each card a unique warmth
- **Analytics heatmap area**: A soft sage blob behind the heatmap section
- **Constellation page background**: Replace the dark void with warm gradient + 2-3 floating blobs at very low opacity

**Implementation**: Pure CSS with `background: radial-gradient(...)` and `filter: blur(60px)`. No images needed. Positioned absolutely, `pointer-events: none`, `z-index: 0`.

**Impact**: High. Creates the "instantly identifiable" brand moment from the brief.

### 1.3 — Glassmorphic Card Treatment

**Problem**: Cards currently have a plain white background with a barely-visible border. They feel flat and lifeless — no depth, no warmth.

**Fix**: Cards should use a **glassmorphic treatment** — semi-transparent white with backdrop blur. Against the gradient background, this creates the layered, dreamy depth seen in the reference screenshots.

**Spec**:
- Card background: `rgba(255, 255, 255, 0.65)`
- Backdrop filter: `blur(16px) saturate(1.2)`
- Border: `1px solid rgba(255, 255, 255, 0.5)` (white border catches light, feels glass-like)
- Box shadow: `0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)` (very soft, almost imperceptible)
- Border radius: `20px` (slightly more generous than current 16px)
- On hover: shadow deepens to `0 8px 40px rgba(0, 0, 0, 0.07)`, subtle `scale(1.01)` — gentler than the current 1.015

**Impact**: High. Every page uses cards; this elevates the entire app.

### 1.4 — Typography Refinement

**Problem**: The serif/sans pairing works conceptually but the execution lacks warmth. Headings feel utilitarian. The italic is used but doesn't feel intentional.

**Fix**:
- **Hero headings** (Home, Insights, Analytics, Archive page titles): Use Cormorant Garamond at `font-weight: 300` (light), italic, with `letter-spacing: -0.03em`. The light weight + italic creates an elegant, almost calligraphic feel. Size: `3.5rem` on desktop, `2.5rem` on mobile.
- **Card body text**: Cormorant Garamond `400` italic, `1.1rem`, `line-height: 1.75`. The generous line height lets the text breathe.
- **UI labels and metadata**: Inter `400`, `0.75rem`, `letter-spacing: 0.04em`, `text-transform: uppercase` for labels. `text-transform: none` for dates and counts.
- **Subheadings** (card titles like "Most frequent tags"): Cormorant Garamond `400` italic, `1.2rem`. Not bold — let the serif do the work.
- **Nav links**: Inter `400`, `0.78rem`, `letter-spacing: 0.06em`, uppercase. More tracking creates an airy, editorial feel.

**Impact**: Medium. Refines what's already there rather than changing it.

### 1.5 — Color Palette Evolution

**Problem**: The accent colors (rose, sage, lavender) are good individually but feel disconnected — they don't blend into a cohesive palette. They're used only on tag pills, not woven through the experience.

**Fix**: The accents should be used as **atmospheric color**, not just UI accents:
- The gradient background uses all three at very low opacity
- Each insight card has a subtle tint from one accent
- The heatmap uses a rose gradient (light to deep) instead of a single color
- Constellation nodes get a soft glow (box-shadow with accent color at 40% opacity)
- Tag pills get slightly more saturation and a softer border (current borders are too visible)
- Add a **warm gold** accent (`#C9B89A`) for "streak" and "thought of the day" — warmth signaling achievement

**Tag pill redesign**:
- Current: visible border, flat background
- New: no border, slightly more saturated background (`opacity: 0.18` instead of `0.15`), `border-radius: 9999px`, `padding: 3px 10px`, `font-size: 0.68rem`

**Impact**: Medium. Unifies the visual language.

---

## Part 2: UX Friction & Interaction Issues

Prioritized by impact on a design-focused audience.

### 2.1 — CRITICAL: Entire Layout Is Broken (CSS Cascade)

**Problem**: The `* { padding: 0; margin: 0; }` reset in `globals.css` is un-layered CSS, which in Tailwind v4 overrides ALL layered utility classes. This means:
- `padding-top: 0px` instead of `pt-28` (112px) — content collides with the nav
- `margin: 0` overrides `mx-auto` — nothing is centered
- `max-width: none` — content bleeds to edges
- `border-radius` from `rounded-2xl` is lost
- `gap` in grid layouts doesn't apply

Every page is broken. The heading overlaps the navigation bar on every single page.

**Fix**: Remove the manual `* { padding: 0; margin: 0; }` reset entirely. Tailwind v4's preflight already handles resets inside `@layer base`, which respects the cascade. Also add `@config "./tailwind.config.ts"` to `globals.css` so Tailwind v4 picks up the custom theme values.

**Impact**: Critical. This is the #1 blocker. Nothing else matters until this is fixed.

### 2.2 — HIGH: Masonry Grid Not Rendering as 3 Columns

**Problem**: The masonry grid shows as a single column. While the `columns: 3` CSS technically works at wide viewports, the broken max-width means the grid wrapper has no width constraint, and the viewport width in the preview renders the mobile breakpoint (`columns: 1`). On desktop, even when columns work, the CSS `columns` property has known issues with animated children (Framer Motion transforms can break column flow).

**Fix**:
- First: fix the Tailwind cascade issue (2.1) so `max-w-[1100px]` actually applies
- Replace CSS `columns` with a proper CSS Grid masonry approach:
  ```
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  ```
- For true masonry (variable height), use JavaScript-based column assignment: distribute cards into 3 arrays by shortest column, render each as a flex column. This is more reliable than CSS columns with animated content.
- Responsive: 3 columns > 1024px, 2 columns > 640px, 1 column mobile

**Impact**: High. The masonry grid is the visual centerpiece of the home page.

### 2.3 — HIGH: No Page Transitions

**Problem**: Navigating between pages has no transition. The content just appears. For a "meditative" experience, this feels jarring.

**Fix**: Wrap all page content in a shared Framer Motion `AnimatePresence` with consistent enter/exit:
- Enter: `opacity: 0, y: 12` → `opacity: 1, y: 0`, `duration: 0.45`, `ease: [0.25, 0.1, 0.25, 1]`
- Exit: `opacity: 0`, `duration: 0.2`
- Stagger child elements by `60ms` on page enter

Note: The individual pages already have `motion.main` with enter animations, but there's no exit animation. Wrap the page slot in `layout.tsx` with a transition provider.

**Impact**: High. Transitions are table stakes for a portfolio piece targeting a design audience.

### 2.4 — HIGH: Nav Bar Issues

**Problems**:
1. Nav overlaps page content on every page (no top padding — see 2.1)
2. The frosted glass effect doesn't activate because the scroll handler works but the backdrop-filter has no visual impact against the current flat background (it needs the gradient background from 1.1 to be visible)
3. Nav links are cramped — "CONSTELLATION" is long and causes crowding
4. No mobile nav — links overflow on small screens
5. The "Thoughts in Bloom" logo text is plain — no brand moment

**Fixes**:
1. Fixed by 2.1 (padding restoration)
2. Fixed by 1.1 (gradient background makes the blur visible)
3. Increase nav link gap to `32px`. Consider abbreviating: "Garden" / "Stars" / "Insights" / "Analytics" / "Archive" — or use icons on smaller breakpoints
4. Add a hamburger menu below `768px` with a slide-down drawer
5. Consider a small abstract blob mark (CSS gradient circle, ~20px) before the wordmark — acts as a favicon and brand anchor

**Impact**: High. The nav is the first thing users interact with.

### 2.5 — MEDIUM: Thought Capture Area Lacks Warmth

**Problems**:
1. The textarea is invisible until focused — users may not realize they can type
2. The bottom border is the only affordance — too minimal for discoverability
3. Tag input has no visual distinction from the textarea
4. The "Bloom →" button is nearly invisible when disabled
5. No success feedback after submitting a thought

**Fixes**:
1. Give the textarea area a **subtle glassmorphic container** — `background: rgba(255,255,255,0.4)`, `border-radius: 16px`, `padding: 24px`, `border: 1px solid rgba(255,255,255,0.5)`. On focus: border transitions to `rgba(201,160,160,0.4)`.
2. Replace the bottom line with the full card treatment above
3. Add a thin divider between the textarea and tag input area, with a small label "Tags" in uppercase Inter
4. Disabled state: `opacity: 0.25` (current `0.30` is too subtle). On valid input, animate the button opacity in
5. On submit: the new card should animate in from the capture area position (origin-aware animation). Add a brief, subtle bloom pulse — a radial gradient that expands from the button and fades, ~300ms. This is the "bloom" moment.

**Impact**: Medium-high. This is the primary interaction.

### 2.6 — MEDIUM: Hover States Are Inconsistent

**Problem**: Some elements have hover states, others don't. The card hover (scale + shadow) is the only defined interaction. Nav links, buttons, tag pills, and the heatmap cells lack consistent hover vocabulary.

**Fix**: Define a hover vocabulary:
- **Cards**: `scale(1.01)`, shadow deepens, `0.2s ease-out`
- **Buttons ("Bloom →", modal buttons)**: subtle color shift + `translateX(2px)` for arrow buttons
- **Tag pills**: `brightness(0.95)`, `0.15s`
- **Nav links**: color from `#6B6B6B` to `#1C1C1E`, `0.2s`
- **Heatmap cells**: `scale(1.3)`, show tooltip, `0.15s`
- **Constellation nodes**: radius increases by 2px, glow intensifies
- **Insight cards**: same as thought cards — `scale(1.01)` + shadow
- **No bouncy or springy easing anywhere** — always `ease-out` or custom cubic-bezier

**Impact**: Medium. Polishes the interaction layer.

### 2.7 — MEDIUM: Edit Modal Feels Generic

**Problem**: The edit modal is a standard centered dialog with a dark overlay. It doesn't match the dreamy aesthetic.

**Fix**:
- Overlay: replace the dark `rgba(28,28,30,0.4)` with a **frosted light overlay** — `rgba(250,250,248,0.7)` with `backdrop-filter: blur(12px)`. This keeps the user in the brand world instead of breaking into a dark context.
- Modal card: use the glassmorphic treatment (1.3)
- Entry animation: fade in overlay + modal slides up from `y: 20` with `scale: 0.97` → `scale: 1`, `0.3s ease-out`
- Add a soft blob in the modal background (top-right corner) for visual warmth

**Impact**: Medium. Modals are infrequent but they break immersion when they feel different.

### 2.8 — MEDIUM: Constellation Page Redesign

**Problems**:
1. Dark `#0F0F0F` background clashes with the warm brand (user confirmed: switch to light)
2. Nodes are plain circles with no depth — they feel like dots, not "thoughts"
3. Edge lines are barely visible
4. The control panel feels detached from the brand
5. No floating animation is actually running (the float function is defined but never called)
6. Clicking a node shows a tooltip at cursor position — on large screens this feels disconnected from the node

**Fixes**:
1. Light warm background with the same gradient system (1.1) but slightly more saturated blobs
2. Nodes: add a soft radial glow around each node (CSS `box-shadow` with accent color, `0 0 12px rgba(accent, 0.4)`). Slightly larger base size (min 8px instead of 5px). Consider a subtle pulse animation on the selected node.
3. Edges: increase base opacity to `0.25`, use accent colors instead of white. Edge style: `stroke-dasharray: 4 4` for a dotted look that feels more delicate.
4. Control panel: glassmorphic card matching the rest of the app. Border: `1px solid rgba(0,0,0,0.06)` instead of the current white-on-dark style.
5. Fix the float animation: actually initiate the recursive transition chain (currently `float()` is defined inside `.each()` but never called)
6. Anchor the tooltip to the node's SVG position, not cursor position. Use a small connecting line from node to card.

**Impact**: Medium-high. The constellation is the most visually ambitious page and currently underdelivers.

### 2.9 — LOW-MEDIUM: Insights Page Card Grid

**Problems**:
1. Cards have no internal padding (cascade issue — see 2.1)
2. The "Thought of the day" card spanning full width is good, but it doesn't feel special enough
3. The "Questions to consider" section is static and feels like placeholder content
4. The bar chart bars are too thick — they feel heavy

**Fixes**:
1. Fixed by 2.1
2. "Thought of the day" card: use a distinct gradient background (`linear-gradient(135deg, rgba(201,160,160,0.08) 0%, rgba(160,154,201,0.06) 100%)`) — already partially implemented but invisible due to the glassmorphic overlay. Add a large decorative quote mark (`"`) in Cormorant Garamond at `8rem`, positioned top-left, color at `rgba(201,160,160,0.1)`.
3. Questions: add a subtle left border (2px, accent color) to each question for visual rhythm
4. Bar chart: reduce bar height from `6px` to `4px`, use `border-radius: 9999px` for pill-shaped bars, add an ease-in animation that fills the bar from left on page load (`width: 0` → `width: N%`, `0.6s ease-out`, staggered by 80ms)

**Impact**: Low-medium per item, but collectively they elevate the page.

### 2.10 — LOW-MEDIUM: Analytics Heatmap

**Problems**:
1. The 30-cell grid in a single row is hard to read — no week grouping
2. Cells are tiny circles at small viewports
3. The "Less / More" legend is functional but bland

**Fixes**:
1. Reorganize as a **7-column grid (Mon-Sun)** with 4-5 rows for the month. This matches the GitHub contribution graph mental model users already know. Add day-of-week labels on the left column.
2. Cells should be rounded squares (`border-radius: 4px`), minimum `28px` wide
3. Legend: use the gradient directly — a single horizontal bar that fades from transparent to the deepest accent color, with "Less" and "More" labels. More elegant than discrete squares.

**Impact**: Low-medium. Analytics is a secondary page but this makes it feel considered.

### 2.11 — LOW: Empty States

**Problem**: Empty states (archive, fresh garden) show only italic text. There's no visual affordance, no delight.

**Fix**: Add an abstract blob illustration (CSS radial gradient, ~120px, soft blur) centered above the empty state text. The blob should use the page's accent color. Below the text, add a subtle CTA: "Start writing →" that links to the home page capture area.

**Impact**: Low (users see these rarely), but they're moments to reinforce the brand.

### 2.12 — LOW: Missing Loading / Skeleton States

**Problem**: Pages that read from localStorage flash blank before hydration. On first load, there's a brief moment of nothing.

**Fix**: Add skeleton states for cards — glassmorphic rectangles with a subtle shimmer animation (a gradient that moves left to right, `2s infinite`). Match the card dimensions so there's no layout shift.

**Impact**: Low. LocalStorage is fast, but the polish matters for a portfolio piece.

---

## Part 3: Spacing & Layout Fixes

### 3.1 — Global Spacing Scale

Define a consistent spacing scale used everywhere:
- `4px` — micro (between tag pills)
- `8px` — tight (between label and value)
- `16px` — default (between card sections)
- `24px` — comfortable (card internal padding)
- `32px` — spacious (between cards in grid)
- `48px` — section break (between page sections)
- `80px` — page breathing room (top padding below nav)
- `120px` — hero section top padding

### 3.2 — Specific Spacing Fixes

| Element | Current | Target |
|---------|---------|--------|
| Page top padding (below nav) | 0px (broken) | 120px (hero pages), 100px (other pages) |
| Card internal padding | 0px (broken) | 28px |
| Card border-radius | 0px (broken) | 20px |
| Masonry grid gap | 20px (works) | 24px |
| Tag pill padding | 2px 8px | 3px 10px |
| Tag pill gap | 6px | 6px (fine) |
| Tag pill font-size | 0.65rem | 0.68rem |
| Section heading margin-bottom | 0px (broken) | 12px |
| Nav height | 64px | 64px (fine) |
| Nav link gap | 28px | 32px |
| Capture area card padding | 0 (no card) | 28px inside glassmorphic container |
| Insight card grid gap | 0px (broken) | 24px |
| Analytics metric card grid gap | 0px (broken) | 20px |
| Heatmap cell size | auto (tiny) | 28px min |

### 3.3 — Max-Width Containers

| Context | Max Width |
|---------|-----------|
| Home hero + capture area | 720px (slightly wider than current 680) |
| Masonry grid | 1100px |
| Insights grid | 920px |
| Analytics grid | 920px |
| Archive grid | 1100px |
| Nav bar | 1200px |

---

## Part 4: Animation & Micro-Interaction Spec

### 4.1 — Global Easing

All animations use one of two curves:
- **Gentle**: `cubic-bezier(0.25, 0.1, 0.25, 1.0)` — for enters, reveals, scaling
- **Quick**: `cubic-bezier(0.4, 0, 0.2, 1)` — for hovers, color changes

Never use spring physics or bounce. The motion language is **smooth and inevitable**, like a petal falling.

### 4.2 — Animation Inventory

| Interaction | Animation | Duration |
|-------------|-----------|----------|
| Page enter | Fade in + 12px up slide | 0.45s gentle |
| Card appear (stagger) | Fade in + 6px up slide, 60ms stagger | 0.35s gentle |
| Card hover | scale(1.01) + shadow deepen | 0.2s quick |
| Button hover | color shift + 2px translateX | 0.15s quick |
| Tag pill add | scale(0.85) → scale(1) + fade in | 0.2s gentle |
| Submit bloom | Radial gradient pulse from button | 0.3s gentle |
| Modal overlay in | Fade 0 → 1 | 0.25s gentle |
| Modal card in | Fade + 20px up + scale(0.97→1) | 0.3s gentle |
| Constellation node float | translateY ±4px, 3s loop, sinusoidal | infinite |
| Constellation node hover | radius +2px + glow intensify | 0.2s quick |
| Heatmap cell hover | scale(1.3) | 0.15s quick |
| Bar chart fill | width 0→N%, 80ms stagger | 0.6s gentle |
| Skeleton shimmer | gradient slide left→right | 2s linear infinite |
| Nav scroll blur | opacity + blur transition | 0.3s quick |

### 4.3 — The "Bloom" Moment

When a user submits a thought, there should be a brief, delightful moment:
1. The "Bloom →" text fades to "Bloomed" for 600ms
2. A soft radial gradient (dusty rose, ~100px) pulses outward from the button position — `scale(0) opacity(0.3)` → `scale(3) opacity(0)`, 400ms
3. The textarea content fades out (150ms)
4. The new card animates into the masonry grid from the top (normal card stagger animation)

This micro-moment is the emotional core of the app. It should feel like watching a flower open in timelapse — brief, natural, satisfying.

---

## Part 5: Implementation Priority

### Phase 1 — Fix What's Broken (do first)
1. Fix Tailwind v4 cascade issue (remove `* { padding: 0; margin: 0 }`, add `@config`)
2. Fix masonry grid (switch to JS-based column distribution)
3. Fix all spacing (padding, margin, gap, border-radius restored)

### Phase 2 — Brand Foundation
4. Gradient background system
5. Glassmorphic card treatment
6. Abstract blob illustrations (CSS-only)
7. Typography refinements

### Phase 3 — Interaction Polish
8. Constellation page light redesign
9. Page transitions
10. Hover state vocabulary
11. Bloom submit animation
12. Modal redesign
13. Nav mobile menu + brand mark

### Phase 4 — Detail & Delight
14. Bar chart animations
15. Heatmap 7-column redesign
16. Empty state illustrations
17. Skeleton loading states
18. Analytics metric card refinements

---

## Part 6: Comprehensive UX Audit

A page-by-page examination of every interaction, edge case, accessibility gap, and unmet user expectation. Findings are grouped by page, then by severity.

---

### 6.1 — Global / Cross-Page Issues

#### 6.1.1 — No keyboard navigation support
**Severity**: High
**Problem**: The app has zero keyboard accessibility. Tab order is undefined — pressing Tab from the textarea doesn't move to the tag input or the submit button in a logical flow. Cards have no `tabindex` or `role`, so keyboard-only users cannot access edit/archive actions. The constellation page is entirely mouse-dependent.
**Why it matters**: A design-focused portfolio audience includes accessibility-aware reviewers. WCAG compliance aside, keyboard navigation signals craft.
**Fix**: Add `tabindex="0"` and `onKeyDown` handlers to thought cards. Make the edit/archive buttons accessible via `aria-label`. Ensure Tab flows: textarea → tag input → submit button. On the constellation page, add arrow-key navigation between nodes.

#### 6.1.2 — No focus-visible indicators
**Severity**: Medium
**Problem**: When tabbing through elements, there's no visible focus ring or indicator. The global `input:focus { outline: none }` and `textarea:focus { outline: none }` in `globals.css` strip the browser's native focus indicators without providing replacements.
**Why it matters**: Users who rely on keyboard navigation or screen readers have no way to know which element is focused.
**Fix**: Replace `outline: none` with a custom focus ring: `outline: 2px solid rgba(201,160,160,0.5); outline-offset: 2px;` on interactive elements. Use `:focus-visible` (not `:focus`) so the ring only appears on keyboard navigation, not mouse clicks.

#### 6.1.3 — No confirmation before destructive actions
**Severity**: Medium
**Problem**: Archiving a thought is a single click — no confirmation, no undo toast. The card simply disappears. If a user accidentally hovers and clicks the archive button, the thought is silently moved to archive with no way to undo from the current page.
**Why it matters**: In a "meditative" app about preserving thoughts, accidentally losing a thought breaks trust.
**Fix**: After archiving, show a toast notification at the bottom of the screen: "Thought archived. Undo?" with a 5-second timer. The toast should use the glassmorphic card style. Clicking "Undo" restores the thought immediately.

#### 6.1.4 — No scroll-to-top behavior on navigation
**Severity**: Low
**Problem**: When navigating between pages, the scroll position can carry over. If you scroll to the bottom of the home page and then navigate to insights, you may land mid-page.
**Fix**: Add `window.scrollTo(0, 0)` on page mount in each page component, or handle it via a layout-level scroll restoration.

#### 6.1.5 — Constellation nav uses wrong text color on dark background
**Severity**: High (visual)
**Problem**: The navigation bar renders dark text (`#6B6B6B`) against the constellation page's `#0F0F0F` background. The nav links and logo become nearly invisible. The frosted glass effect uses `bg-[rgba(250,250,248,0.8)]` which creates a jarring light strip across the dark page.
**Why it matters**: The nav is unreadable on the constellation page.
**Fix**: This is resolved by moving the constellation to a light background (per user's decision). But as a general safeguard, the nav component should detect page-level background context and adjust accordingly, or the constellation page should not use `fixed inset-0` which causes the nav to be inside the dark container.

#### 6.1.6 — localStorage is read on every render, not synced across tabs
**Severity**: Low
**Problem**: If a user has two tabs open and adds a thought in one, the other tab won't reflect the change until a full page reload. The `useEffect` only reads localStorage on mount.
**Fix**: Add a `storage` event listener that re-reads thoughts when localStorage changes in another tab:
```js
window.addEventListener('storage', (e) => {
  if (e.key === 'tib_thoughts') setThoughts(getThoughts());
});
```

---

### 6.2 — Home Page (/home)

#### 6.2.1 — Textarea does not auto-resize properly
**Severity**: Medium
**Problem**: The `autoResize` function is defined but only called inside the `onChange` handler. On initial load or when editing, the textarea height doesn't match its content. The textarea has `rows={3}` and `minHeight: 80px` but these values are hardcoded — a one-line thought still gets a 3-row-tall input area with wasted space.
**Fix**: Set `rows={1}` and call `autoResize` on mount and whenever `text` changes. The textarea should grow with content and shrink when content is deleted.

#### 6.2.2 — Character counter doesn't change color near the limit
**Severity**: Low
**Problem**: The character counter shows "247 / 280" in the same muted grey regardless of how close the user is to the limit. There's no urgency signal.
**Fix**: When `text.length > 240`, transition the counter color to `#C9A0A0` (dusty rose). When `text.length >= 275`, transition to a deeper rose. This uses color as information, not decoration.

#### 6.2.3 — Tag input is discoverable only by placeholder text
**Severity**: Medium
**Problem**: The tag input reads "Add tags (press Enter)..." but looks identical to the textarea area above it. There's no visual separator, no label, no icon. First-time users may not notice it.
**Fix**: Add a small `Tags` label in uppercase Inter above the tag input. Add a subtle top border or spacing divider between the textarea and tag area. Consider a small tag icon (SVG, 12px) inline with the placeholder.

#### 6.2.4 — Pressing Enter in the textarea submits nothing
**Severity**: Low (but confusing)
**Problem**: There's no keyboard shortcut to submit a thought. Users might expect Cmd+Enter or Ctrl+Enter to submit (standard pattern in many text input UIs). The only way to submit is clicking "Bloom →".
**Fix**: Add `onKeyDown` handler on textarea: `if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit()`. Show a subtle hint below the submit button: `⌘ + Enter` in tiny grey Inter text.

#### 6.2.5 — No visual confirmation after submitting a thought
**Severity**: High
**Problem**: When the user clicks "Bloom →", the textarea clears, and the new card appears in the grid — but there's no feedback moment. The transition is instant and silent. For an app called "Thoughts in Bloom," the moment of creation should feel significant.
**Why it matters**: This is the core interaction. It should feel like something happened.
**Fix**: See Part 4.3 (the "Bloom" moment spec). Additionally, briefly scroll the new card into view if the user has scrolled down.

#### 6.2.6 — Cards with no tags look unbalanced
**Severity**: Low
**Problem**: When a thought is submitted without tags (as tested — "Testing thought submission and what happens after"), the card's bottom row shows only a date on the left with empty space on the right. The visual weight is lopsided.
**Fix**: When there are no tags, center the date or add a subtle "no tags" indicator (a small `+` button: "Add tags" in muted text, clicking opens the edit modal).

#### 6.2.7 — Edit and archive buttons have no text labels
**Severity**: Low
**Problem**: The edit (pencil) and archive (box) icons are 13x13px SVGs with no text labels. They appear on hover as a fade-in overlay. The icons are generic and small — users have to hover to discover them, then interpret what each one does.
**Fix**: Add text labels next to the icons: "Edit" and "Archive" in tiny Inter. Or, increase icon size to 15px and add `aria-label`. The icon-only approach works if the icons are universally recognizable, but at 13px they're too small to be read confidently.

#### 6.2.8 — Masonry grid has no loading skeleton
**Severity**: Low
**Problem**: On initial page load, there's a brief flash of empty space before thoughts are hydrated from localStorage. The `useState<Thought[]>([])` initializes empty, then `useEffect` populates it. For the ~100ms gap, the user sees the empty state text "Your garden is waiting..." before cards appear.
**Fix**: Show skeleton cards (2-3 ghost cards with shimmer animation) until hydration is complete. Use a `mounted` state flag to distinguish "loading" from "genuinely empty."

---

### 6.3 — Constellation Page (/constellation)

#### 6.3.1 — Float animation is defined but never triggered
**Severity**: Medium
**Problem**: Inside the `.each()` loop on line ~100 of `constellation/page.tsx`, a `float()` function is defined that creates a recursive D3 transition for vertical oscillation. But the function is **never called** — the last line of the `.each()` callback defines `float` but doesn't invoke it. Every node is static.
**Fix**: Add `float();` at the end of the `.each()` callback to start the animation loop.

#### 6.3.2 — No empty state
**Severity**: Low
**Problem**: If all thoughts are archived, the constellation page renders a blank dark screen with only the controls panel. No message, no guidance.
**Fix**: Show centered text: "Add thoughts to see your constellation" in serif italic, with a soft blob background.

#### 6.3.3 — Tooltip positioning can go off-screen
**Severity**: Medium
**Problem**: The selected thought tooltip is positioned at `event.clientX + 12, event.clientY - 20`. There's a `Math.min` guard for right and bottom edges, but it uses `window.innerWidth - 320` and `window.innerHeight - 200` — hardcoded sizes that don't account for the actual tooltip dimensions. On mobile, the tooltip frequently clips.
**Fix**: Measure the tooltip after render and reposition if it overflows any edge. Better yet, anchor the tooltip to the node's SVG position (not mouse position) with a small connecting line, as spec'd in Part 2.8.

#### 6.3.4 — Drag interaction has no visual cue
**Severity**: Low
**Problem**: Nodes are draggable in force-directed layout, but there's no cursor change (`cursor: grab` / `cursor: grabbing`) and no visual indication that dragging is possible. Users discover this only by accident.
**Fix**: Add `cursor: grab` to nodes. On drag start, change to `cursor: grabbing` and slightly increase the node's opacity/glow to confirm the interaction.

#### 6.3.5 — Layout switches cause a jarring jump
**Severity**: Medium
**Problem**: Switching between force/circular/hierarchical layouts rebuilds the entire SVG from scratch. Nodes jump instantly to new positions with no transition. This contradicts the "meditative" motion language.
**Fix**: Instead of clearing and rebuilding, animate nodes to their new positions. For the force→circular switch: stop the simulation, calculate target positions, then transition each node `cx/cy` to the target over 800ms with the gentle easing curve.

#### 6.3.6 — The slider has only 4 discrete steps (0-3)
**Severity**: Low
**Problem**: The "Connection strength" slider goes from 0 to 3 in integer steps. With the seed data (3 tags per thought, some shared), the useful range is very narrow. At threshold 0, most edges show. At threshold 1, almost none do. The slider feels like an on/off switch, not a continuous control.
**Fix**: Keep the 0-3 range but use `step="0.5"` for finer control. Alternatively, use shared tag count as the threshold but normalize against the maximum shared count in the dataset.

---

### 6.4 — Insights Page (/insights)

#### 6.4.1 — Two-column grid doesn't render at expected viewport
**Severity**: High (visual)
**Problem**: The grid uses `grid-cols-1 md:grid-cols-2`. Inspected at desktop width, it still shows `grid-template-columns: 427px` (single column). This is likely the same Tailwind v4 cascade issue affecting responsive utilities.
**Fix**: Resolved by Part 2.1 (cascade fix). Verify that `md:` breakpoint utilities work after the fix.

#### 6.4.2 — "Strongest connection" only considers number of shared tags, not recency
**Severity**: Low
**Problem**: Two thoughts from 6 days ago sharing 1 tag rank equally with two thoughts from today sharing 1 tag. There's no temporal weighting. The "strongest connection" may always show the same old pair.
**Fix**: Weight by recency: `score = sharedTags * (1 + 0.1 * daysSinceOlder)` inverted, so newer pairs with the same tag count rank higher. Or simply break ties by showing the more recent pair.

#### 6.4.3 — "This week's theme" shows the wrong week range
**Severity**: Low
**Problem**: `getWeekThoughts()` calculates "7 days ago" from the current timestamp. If it's Monday morning, "this week" includes last Tuesday through Sunday — which feels like "last week." Users expect "this week" to mean Mon-Sun or Sun-Sat of the current calendar week.
**Fix**: Align to calendar week (Monday start): `weekAgo.setDate(weekAgo.getDate() - weekAgo.getDay() + 1)` for Monday-based weeks.

#### 6.4.4 — "Questions to consider" doesn't update when the top tag changes
**Severity**: Low
**Problem**: The questions are derived from `weekTheme` (this week's most-used tag). But the question templates only cover 9 specific tags. If the user's top tag is something not in the template map (e.g., "morning-routine"), it falls back to generic defaults. There's no indication of why these particular questions were chosen.
**Fix**: Show the source tag above the questions: "Based on your focus on *creativity* this week:" — this makes the connection explicit and the questions feel personalized rather than random.

#### 6.4.5 — "Thought of the day" doesn't feel special enough
**Severity**: Medium
**Problem**: The daily thought is just another card, slightly wider. It doesn't have a unique visual treatment that signals "this is featured content." It also uses `Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % thoughts.length` which means adding a new thought changes which thought is displayed (the modulo shifts). The daily thought isn't actually stable for 24 hours.
**Fix**: Use a date-seeded hash instead of modulo: `seed = dateString.split('').reduce((a,c) => a + c.charCodeAt(0), 0) % thoughts.length`. Visually: add the large decorative quote mark, a distinct warm gradient, and generous padding as spec'd in Part 2.9.

---

### 6.5 — Analytics Page (/analytics)

#### 6.5.1 — Metric cards and heatmap are nearly invisible at desktop width
**Severity**: High (visual)
**Problem**: At desktop viewport, the metric cards appear to stack vertically in a single column (the `grid-cols-2 md:grid-cols-4` responsive class isn't applying). The "7" for thoughts bloomed renders as a massive serif number with nothing next to it. The heatmap is below the fold and the 30-cell single-row layout stretches edge-to-edge at wide viewports, making cells tiny and hard to interact with.
**Fix**: Resolved by Part 2.1 (cascade fix) for the grid layout. The heatmap should be redesigned as a 7-column week grid (Part 2.10).

#### 6.5.2 — Streak calculation doesn't handle "no thought today" gracefully
**Severity**: Low
**Problem**: The streak counter starts from today and works backward. If the user hasn't posted today yet, the streak shows 0 even if they posted every day for the past week. This is discouraging — the user sees "0 Day streak" even though their streak is alive.
**Fix**: If today has no thought but yesterday does, show the streak as ongoing and add "(add a thought to keep it going)" in tiny text. Only break the streak after midnight passes without a thought from the previous day.

#### 6.5.3 — Heatmap tooltip is a CSS-only hover effect
**Severity**: Low
**Problem**: The tooltip (absolute-positioned div with `group-hover:opacity-100`) works but has no entry animation. It appears and disappears instantly, which feels abrupt compared to the app's otherwise-animated interactions.
**Fix**: Add `transition: opacity 0.15s ease-out, transform 0.15s ease-out` and a slight `translateY(-2px)` on hover for a micro-lift effect.

#### 6.5.4 — "Most active day" shows a full day name with no context
**Severity**: Low
**Problem**: The metric shows "Sunday" in large serif text with "Most active day" below. But it doesn't say *how* active — is it 2 thoughts or 20? A single thought on a Sunday with zero on other days still shows "Sunday" as the most active day, which feels misleading.
**Fix**: Add the count beneath the day name: "Sunday (3 thoughts)" in small Inter text.

---

### 6.6 — Archive Page (/archive)

#### 6.6.1 — No way to permanently delete a thought
**Severity**: Low
**Problem**: The archive page only allows "Restore." There's no way to permanently delete a thought. Over time, the archive accumulates and there's no cleanup mechanism.
**Fix**: Add a "Delete permanently" option alongside Restore, with a confirmation step ("This cannot be undone. Delete?"). Use a muted red for the delete action — not bright red, but a desaturated rose.

#### 6.6.2 — No bulk actions
**Severity**: Low
**Problem**: If a user has 20 archived thoughts and wants to restore or delete several, they must click each card individually. There's no select-multiple or "Restore all" option.
**Fix**: Add a "Restore all" button in the page header (when archive is non-empty). For deletion, individual deletion is fine — bulk delete is too risky for an app that values preservation.

#### 6.6.3 — Archive count says "0 archived thoughts" even with the plural grammar issue
**Severity**: Low (polish)
**Problem**: `thoughts.length !== 1 ? "s" : ""` handles pluralization, but the empty state shows "0 archived thoughts" above "Nothing archived yet" — redundant information.
**Fix**: Hide the count when it's 0. Only show "N archived thoughts" when N > 0.

#### 6.6.4 — Archived cards have no timestamp context
**Severity**: Low
**Problem**: Archived cards show the creation date but not the archival date. The user can't tell when they archived something or how long it's been archived.
**Fix**: Add "Archived on [date]" in small text below the creation date — this requires adding an `archivedAt` field to the data model (mark as optional to maintain backward compatibility with existing data).

---

### 6.7 — Cross-Page Information Architecture Issues

#### 6.7.1 — No way to navigate from Insights/Analytics back to the relevant thought
**Severity**: Medium
**Problem**: The insights page shows "Strongest connection" with two thought excerpts, and "Thought of the day" with a full thought. But none of these are clickable — the user can read the thought but can't navigate to it, edit it, or see it in context. The analytics heatmap shows a count per day but doesn't let you drill down to see which thoughts were from that day.
**Fix**: Make thought excerpts on the insights page clickable — clicking should either: (a) navigate to /home and scroll to that card, or (b) open the edit modal inline. For the heatmap, clicking a day cell should show a small popover listing that day's thoughts.

#### 6.7.2 — No search or filter on the home page
**Severity**: Medium
**Problem**: As the user accumulates thoughts, there's no way to find a specific one. No search bar, no tag filter, no date filter. The masonry grid shows everything in reverse chronological order with no interaction beyond scroll.
**Fix**: Add a subtle search/filter row between the capture area and the masonry grid. Two controls: (1) a search input that filters by text content (real-time, as-you-type), (2) a horizontal scrolling row of tag pills that filter the grid when clicked. Both controls should use the glassmorphic style and appear only when the user has 5+ thoughts.

#### 6.7.3 — No visual connection between pages
**Severity**: Low
**Problem**: Each page feels like an isolated view. There's no sense that the garden, constellation, and insights are different lenses on the same data. The only connection is the shared nav.
**Fix**: Add subtle cross-page affordances: On the home page, show a small "View in constellation →" link below the masonry grid. On the insights page, show "Explore connections →" linking to constellation. These breadcrumbs create a journey through the app.

---

## Non-Goals

- No backend, auth, or external APIs
- No additional pages or features
- No changes to the data model
- No font changes (Cormorant Garamond + Inter pairing is correct)
- No dark mode (the warm light theme IS the brand)
