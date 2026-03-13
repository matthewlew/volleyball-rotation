# AI Agent Guidelines (Sub In)

Welcome to the **Sub In** repository! This document provides context, constraints, and instructions for AI agents (and human contributors) working on this project.

## Architecture & Technology Stack

- **Frontend-Only**: This is a pure vanilla HTML, CSS, and JavaScript web application.
- **No Build Steps**: Do not introduce bundlers (Webpack, Vite, etc.), transpilers (Babel), or package managers (npm, yarn) for the production code. The code runs directly in the browser.
- **No Backend or Database**: There is no server-side logic.

## State Management

- **URL Hash Persistence**: Application state is persisted entirely within the URL hash using Base64-encoded JSON (`btoa` / `atob`).
- When a user modifies the roster or lineup, the URL updates immediately.
- Shared links are inherently "read-only" views if they include a lineup key, but users can always copy/modify from their end.

## Accessibility (a11y)

- **Strict Adherence**: All new features and UI changes must strictly adhere to **WCAG 2.1 AA** accessibility standards.
- **Touch Targets**: Minimum 44x44px for all interactive elements.
- **ARIA**: Use comprehensive ARIA roles and labels (e.g., `role="switch"`, `aria-checked`, `aria-label`).
- **Visuals**: Maintain explicit color + text pairing for visual elements (don't rely solely on color to convey meaning).
- **Motion**: Respect media queries for `prefers-reduced-motion: reduce`. Animations should be subtle and disable gracefully.

## Mobile-First Design

- The application is primarily a mobile tool for recreational league volleyball players (Gotham, Volo, Big City).
- Ensure the layout, interactions (like swipe gestures), and font sizes are optimized for small touch screens.

## Testing

- **Local Script Testing**: Syntax verification and logic tests are performed using Node.js locally.
- Use `node -c <filename>.js` for syntax checks.
- Run `node test_solver.js` (or similar test files) to verify core logic like the 4-2 rotation constraint solver.
- Do not introduce complex testing frameworks (Jest, Mocha) unless specifically requested by the maintainer. Keep tests lightweight and runnable via basic Node.js scripts.

## Core Logic (Solver)

- The core feature is a **4-2 volleyball rotation generator**.
- A valid 4-2 rotation requires at least 6 players and 2 setters.
- The constraint solver (`solver.js`) handles generating the optimal lineup and bench rotations based on player positions (Setter, Middle, Outside).

## File Structure

- `index.html`: Main entry point and layout.
- `app.js`: UI logic, state management, routing (hash parsing), and rendering.
- `solver.js`: The constraint solver for generating 4-2 lineups.
- `share.js`: Logic for sharing lineups (text, clipboard, image generation).
- `style.css`: All styling (must remain vanilla CSS).
- `test_*.js`: Node.js scripts for testing logic.
