# Copilot Instructions for Thoughts in Bloom

## Project Overview
A living digital garden web app where ideas grow and connect over time. Early stage development using vanilla HTML/CSS/JS with localStorage.

## Architecture & Tech Stack
- **No framework**: Pure HTML, CSS, JavaScript (deliberate choice for simplicity)
- **No build process**: Single-file or minimal-file structure, runs directly in browser
- **Data storage**: Browser localStorage with JSON arrays
- **Deployment**: Static files via Vercel (no backend yet)

## Development Tooling

### Required Tools
- **VSCode + GitHub Copilot**: Primary development environment
- **GitHub**: Version control and code repository
- **Vercel**: Automated deployment platform
- **Figma**: Design and prototyping tool

### Prescribed Workflow
1. **Design First**: Before implementing visual features, create mockups in Figma
   - Design card layouts, color schemes, and interactions
   - Export key screens as PNGs to `/design` folder for reference
   - Document color codes and spacing values for CSS implementation

2. **Local Development**: Use VSCode with Live Server extension
   - Write code with Copilot assistance for patterns and boilerplate
   - Test in browser immediately (no build step)
   - Use browser DevTools for debugging localStorage

3. **Version Control**: Commit to GitHub regularly
   - Follow SDLC with conventional commits
   - Commit often
   - Commit after completing each feature from checklist
   - Use clear commit messages (e.g., "Add masonry layout", "Implement archive functionality")
   - Main branch = production-ready code

4. **Deployment**: Push to GitHub triggers automatic Vercel deployment
   - Vercel provides live URL for testing on any device
   - No manual deployment steps needed
   - Preview deployments available for branches

### Folder Structure
```
/
├── index.html          # Main app file
├── style.css           # Styles
├── script.js           # Logic
├── /design            # Figma exports and design assets
├── README.md
├── DECISIONS.md
└── .github/
    └── copilot-instructions.md
```

### Important Reminders
- Always design in Figma before building visual features
- Test locally before pushing to GitHub
- localStorage data is device-specific (not synced via Vercel)
- Keep code vanilla—no npm packages or build tools

## Data Structure
Thoughts are stored as JSON objects in localStorage:
```javascript
{
  id: timestamp,
  text: string,
  date: ISO string,
  tags: array of strings,
  archived: boolean
}
```

## Key Design Principles
1. **Start simple, iterate**: Build working features first, add complexity later
2. **No deletion**: Archive thoughts instead of deleting (they can be unarchived)
3. **Editing allowed**: Thoughts can be refined after saving
4. **Newest first**: Chronological display with most recent thoughts at the top
5. **Medium length**: ~500-1000 character limit with truncation and expand option

## Visual Style
- **Aesthetic**: Clean, airy, dreamy (myMind-inspired)
- **Colors**: Soft blues and purples with white cards
- **Layout**: Masonry/Pinterest-style grid (responsive)
- **Animations**: Subtle slide-in effects, smooth transitions
- **Interactions**: Hover effects for visual feedback

## Feature Checklist Reference
See `DECISIONS.md` for detailed feature status (✅ complete, 🔲 planned).

Current stage focuses on basic card display, input, and storage. Next priorities:
- Masonry layout implementation
- Text truncation with expand
- Edit/archive functionality
- Tag support (#person, #theme)

## Future Stages (Not Yet Built)
1. **Stage 2**: Semantic similarity, auto-clustering, filtering
2. **Stage 3**: Dual modes (card view + constellation view), drag-to-merge
3. **Stage 4**: Analytics dashboard, influence tracking

When building features, reference `README.md` for product vision and `DECISIONS.md` for implementation details and trade-offs made.

## Conventions
- Use vanilla JS ES6+ features (no transpilation)
- System fonts for performance
- Mobile-first responsive design
- Keyboard shortcuts (e.g., Ctrl+Enter to save)
