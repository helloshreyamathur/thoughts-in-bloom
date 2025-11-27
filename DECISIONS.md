# Technical Decisions

## Project Overview
Building "Thoughts in Bloom" - a living digital garden web app where ideas grow and connect over time.

## Development Approach
**Philosophy**: Start simple, iterate and expand. Build something working quickly, then add complexity.

## Stage 1: Minimal MyMind-Style Interface (Current)

### Technology Stack
- **Frontend**: HTML, CSS, JavaScript (vanilla - no frameworks)
  - *Rationale*: Simplest approach for someone new to web development. No build tools, dependencies, or configuration needed.
- **Data Storage**: Browser localStorage
  - *Rationale*: No server setup required, data persists locally, perfect for personal use on a single device
  - *Limitation*: Data won't sync across devices or browsers

### Architecture Decisions
1. **Single Page Application**: All functionality in one HTML file + CSS + JS
2. **Card-Based Layout**: Masonry/Pinterest style grid (newest thoughts first)
3. **Data Structure**: JSON array of thought objects stored in localStorage
   ```javascript
   {
     id: timestamp,
     text: string,
     date: ISO string,
     tags: array of strings,
     archived: boolean
   }
   ```

### Core Decisions Made

**1. Visual Organization:** Pinterest/Masonry layout with newest thoughts appearing first
- Combines beautiful organic layout with chronological clarity

**2. Deletion:** Archive system (not permanent delete)
- Thoughts can be hidden but never truly lost
- Can be unarchived later

**3. Editing:** Yes, thoughts can be edited after saving
- Click any thought to edit and refine over time

**4. Length Limit:** Medium length (~500-1000 characters)
- Truncate long thoughts on cards with "expand" option to view full text

**5. Metadata:** Date/time + optional tags
- Manual tagging with #person, #theme for flexible categorization

**6. Search:** Yes, simple text search included
- Essential for growing collection of thoughts

**7. Mobile:** Fully responsive design
- Capture thoughts anywhere, on any device

**8. Card Interaction:** Expanded view + action menu
- Click to see full text and access edit/archive/tag options

### Features To Build (Stage 1)
- ✅ Text input for capturing thoughts
- ✅ Save thoughts to browser localStorage
- ✅ Display thoughts as cards with date/time stamps
- ✅ Responsive grid layout
- ✅ Clean, airy, dreamy aesthetic (gradient backgrounds, smooth animations)
- ✅ Keyboard shortcut (Ctrl+Enter to add thought)
- 🔲 Masonry/Pinterest layout (newest first)
- 🔲 Text truncation with expand option (500-1000 char limit)
- 🔲 Click card to open expanded view
- 🔲 Edit thought functionality
- 🔲 Archive thought functionality (not delete)
- 🔲 Tag input and display (#person, #theme)
- 🔲 Simple text search
- 🔲 Mobile-responsive refinements

### Design Choices
- **Color Palette**: Soft blues and purples with white cards (calming, dreamy)
- **Typography**: System fonts for performance and native feel
- **Animations**: Subtle slide-in effects when adding new thoughts
- **Interactions**: Hover effects for visual feedback

## Future Stages (Planned)

### Stage 2: Intelligence & Connections
- Semantic similarity detection between thoughts
- Auto-clustering and placement
- Tags and metadata (people, themes, days)
- Filtering capabilities

### Stage 3: Dual Visualization Modes
- Toggle between myMind mode (current cards) and Obsidian mode (constellation view)
- Interactive connection visualization
- Drag-and-merge thought functionality

### Stage 4: Analytics & Insights
- Statistics dashboard
- Source tracking
- Influence pattern analysis

## Trade-offs Made
1. **localStorage vs Database**: Chose localStorage for simplicity over cross-device sync
2. **Vanilla JS vs Framework**: Chose vanilla for learning curve over scalability
3. **Local-first vs Cloud-first**: Chose local for privacy and simplicity over accessibility

## What Could Change Later
- Migration to a framework (React/Vue) if complexity grows
- Backend/database if multi-device sync becomes essential
- AI/ML integration for semantic analysis and connections


