# Design System

## Colors
_Extracted from Figma homepage design_

### Primary Colors
- Primary Blue: #5B9BD5 (used in "Bloom" text)
- Background: #FAF9F6 (warm off-white)
- Card White: #FFFFFF
- Text Dark: #2C2C2C
- Text Light: #6B6B6B (timestamps, metadata)

### UI Colors
- Search Background: #E8F5A5 (lime yellow highlight)
- Filter Button: #E8F5A5 (matching search)
- Border/Stroke: #E8E8E8 (subtle card borders)
- Tag Background: #F5F5F5 (light gray for hashtags)
- Hover State: rgba(0, 0, 0, 0.05)
- Links Count: #8B8B8B (gray for "2 links" text)

## Typography
_Extracted from Figma designs_

### Font Family
- Primary: System font stack
- Fallback: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif

### Font Sizes
- Page Title: 48px ("Thoughts in Bloom")
- Input Placeholder: 16px
- Body Text: 15px (card content)
- Timestamp: 12px
- Tags: 13px
- Small Metadata: 12px ("2 links")

### Font Weights
- Title: 600 (semi-bold)
- Body: 400 (regular)
- Tags: 500 (medium)

## Spacing
_Extracted from Figma designs_

### Container & Layout
- Page Padding: 40px (left/right)
- Top Spacing: 60px (to title)
- Content Max Width: ~1200px

### Card Spacing
- Card Padding: 20px
- Grid Gap: 16px (between cards)
- Card Border Radius: 12px
- Card Shadow: 0 2px 8px rgba(0, 0, 0, 0.06)

### Input Area
- Input Height: ~60px
- Input Padding: 20px
- Input Border Radius: 30px (pill shape)
- Submit Button Size: 44px (circular)

### Search Bar
- Search Height: ~50px
- Search Border Radius: 25px
- Search Padding: 16px 24px

## Layout Structure

### Masonry Grid
- Column Width: Variable (responsive)
- Min Card Width: 240px
- Max Card Width: 380px
- Columns: 3-4 on desktop, 2 on tablet, 1 on mobile

### Card Layout
- Each card contains:
  - Body text (top)
  - Tags (middle, gray background)
  - Date + Links count (bottom row, space-between)

## Borders & Shadows
- Card Border Radius: 12px
- Card Shadow: 0 2px 8px rgba(0, 0, 0, 0.06)
- Input Border: subtle, light gray
- Input Border Radius: 30px (pill shape)

## Animations
- Transition Duration: 200ms
- Easing Function: ease-in-out
- Card hover: subtle lift + shadow increase 
