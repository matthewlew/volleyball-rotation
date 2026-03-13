# Sub In — 4-2 Volleyball Rotation Generator

**Sub In** is a free, mobile-first 4-2 volleyball rotation generator, constraint solver, and lineup sharing tool. Built for recreational leagues (Gotham, Volo, Big City) and everyday pickup games. Generate a valid 4-2 rotation in seconds—no login, no ads, and no signup required.

## Why I Created It

> **[TODO for author]: Add your authentic story here!**
>
> *Think about: What frustration were you trying to solve at your rec league? Why did existing apps fall short? Did you want something dead-simple that anyone could use on their phone right before a match without creating an account?*

## Features

- **No Backend, No Accounts:** Your privacy is guaranteed. The entire application state is persisted safely within the URL hash using Base64-encoded JSON. Share your lineup just by copying the link!
- **Constraint Solver:** Handles the complexity of a 4-2 rotation. Ensures you have at least 6 players and 2 setters, and optimally places your primary, flex, and stretch positions (S, M, O).
- **Mobile-First & Touch-Friendly:** Designed to be used on the court. Features swipe gestures to rotate your team clockwise or undo a rotation.
- **Strict Accessibility (WCAG 2.1 AA):** Built with 44x44px touch targets, comprehensive ARIA roles, and `prefers-reduced-motion` support.
- **Share Options:** Save an image of the court, copy emoji-based text representations, or simply copy the read-only URL for your team group chat (e.g., WhatsApp).

## How It Works

This project is intentionally built as a **frontend-only, vanilla web application** (HTML, CSS, JS).

1. **Roster Building (`app.js`):** Add players, select if they are "Here", and assign them roles (S - Setter, M - Middle, O - Outside).
2. **The Math (`solver.js`):** The app checks constraints (minimum 6 players, minimum 2 setters). It then calculates the best possible starting lineup and bench rotation.
3. **The Share (`share.js`):** Creates readable emoji text or generates an image layout of the court so everyone knows where to stand.
4. **The State:** When you update anything, the app generates a new URL hash (e.g., `https://subin.app/#eyJ2IjoxLCJ0Ij...`). That hash *is* the database.

## Running Locally

Because there are no build steps, running Sub In locally is incredibly simple.

1. Clone the repository.
2. Open `index.html` in your web browser.

For local development with auto-reload, you can use any basic static file server:

```bash
# Using Python
python3 -m http.server 8000

# Using Node.js (npx)
npx serve .
```

Then visit `http://localhost:8000`.

## Testing

Logic tests and syntax verification are handled via simple Node.js scripts.

```bash
# Check syntax
node -c solver.js
node -c app.js

# Run the constraint solver tests
node test_solver.js
```

## AI Agent Guidelines

If you are an AI assistant (or human contributor!) looking to help with this repository, please read the [AGENTS.md](./AGENTS.md) file. It contains the strict architectural constraints, accessibility standards, and state management rules required for this codebase.
