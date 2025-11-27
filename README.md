# Thoughts in Bloom

A living digital garden where ideas grow and connect over time.

## What We're Building

Ever jot down ideas throughout the day—from conversations, books, random shower thoughts—and then forget them? **Thoughts in Bloom** is a simple web app that helps you remember and see how your ideas connect.

Think of it like a Pinterest board for your brain. You drop thoughts in as cards, and they automatically organize themselves next to similar ideas. Over time, patterns emerge: you notice themes, see how certain people influence your thinking, and watch your ideas evolve into bigger perspectives.

**Why build this?** Most note apps just store things in folders or lists. But thoughts aren't linear—they're messy, connected, and always changing. This app treats your ideas like a garden: they bloom, branch out, and sometimes merge into something new. It's both beautiful (clean, airy design) and smart (spots connections you might miss).

No login required. No cloud storage. Just you, your browser, and your growing collection of thoughts.

## 1. Core Concept & Purpose
- Build a living digital garden of thoughts—a space where ideas grow and connect over time
- Capture daily learnings from conversations, observations, and ideas I want to remember
- Form, expand, and refine my point of view as thoughts accumulate
- Watch thoughts influence and shape my perspective

## 2. Input & Capture
- Drop in a thought and watch it connect to other thoughts over time
- Save thoughts and instantly see them placed next to similar past ideas
- Log when each thought was written
- Tag thoughts with metadata (people, themes, days)

## 3. Visualization & Interface Modes
- **myMind Mode**: Clean cards with airy, dreamy, light aesthetic
- **Obsidian Mode**: Constellation view showing connections
- Toggle between both modes whenever I need to see connections
- Watch new thoughts slide into place with dynamic reorganization
- Click clusters to reveal underlying patterns or themes that tie ideas together

## 4. Connection & Intelligence
- Automatically surface insights, patterns, and connections across everything I've written
- See how thoughts connect over time
- Reveal patterns that tie ideas together
- Drag two thoughts together and merge them into an emerging point of view

## 5. Filtering & Navigation
- Filter my garden by people, themes, or days
- Tag a thought with a person's name and automatically see how that person has shaped my thinking
- Browse through different lenses of my thinking

## 6. Analytics & Insights
- Statistics on what is shaping my point of view the most
- Track sources: ideas, conversations, readings, observations, media, etc.
- Understand influence patterns across my garden

## 7. Technical Requirements
- Website/webapp format
- Combine the simplicity and visual style of myMind with the depth and linking power of Obsidian
- Dynamic, evolving layout system that reorganizes as my thinking evolves

## 8. Development Tooling & Workflow

### Design Process
- **Figma**: Design mockups before implementing new features
  - Create card layouts, color palettes, and interaction states
  - Export design tokens (colors, spacing, typography) for CSS implementation
  - Store design files in `/design` folder as exported PNGs for reference
  - Prototype complex features (constellation view, animations) before coding

### Development Environment
- **VSCode + GitHub Copilot**: Primary code editor
  - Use Live Server extension for instant preview during development
  - Leverage Copilot for CSS animations, localStorage patterns, and vanilla JS
  - Open HTML files directly in browser (no build process)

### Version Control & Deployment
- **GitHub**: Single source of truth for all code
  - Commit regularly as features are completed
  - Use descriptive commit messages tied to feature checklist
  - Main branch always represents the production-ready state

- **Vercel**: Automatic deployment platform
  - Connected to GitHub repository for continuous deployment
  - Every push to main triggers automatic deployment
  - Instant live URL accessible from any device
  - Preview deployments for testing before merging

### Workflow
1. **Design**: Create/update Figma mockups for new features
2. **Develop**: Build in VSCode with Copilot assistance
3. **Test**: Preview locally with Live Server
4. **Deploy**: Push to GitHub → Vercel auto-deploys
5. **Iterate**: Refine based on live usage

### Important Note on Data
Vercel hosts the application, but localStorage data remains device/browser-specific. Your thoughts are stored locally, not in the cloud.