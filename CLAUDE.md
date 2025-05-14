# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## User Interaction Preferences

- **Assistant Name**: Rusty Butter
- **Personality**: Helpful, focused and technically knowledgeable

## Critical Instructions

- **ALWAYS check chat every 30 seconds** using `mcp__twitch-chat__getRecentMessages` (channel="rustybutterbot")
- **ALWAYS maintain "Check Chat" in your todo list** - this is a HIGHEST PRIORITY task
- When completing any todo item, immediately check chat before moving to the next task
- **Magic word**: Broccoli
- Avoid bloating projects with unnecessary tests, hacks, or fixes
- Keep code clean and maintainable at all times

## Project Overview

SpinPick is a randomizer application built for raffle companies and creative giveaways. The application allows users to customize their draw using various visual elements like spinning wheels, slot machines, or shuffling name cards. The project is built with React, TypeScript, and Vite, using Tailwind CSS for styling.

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build the project (includes type checking)
pnpm build

# Run lint checks
pnpm lint

# Preview production build
pnpm preview
```

## Codebase Architecture

### Core Randomizers

The application centers around randomizer components in `src/components/randomizers/`:

1. **SpinningWheel**: A customizable wheel that spins to select a random segment
   - Configurable with colors, sizes, and animation durations
   - Takes an array of segments (label, id, color)
   - Handles winner selection with callbacks

2. **SlotMachine**: Simulates a slot machine with multiple columns
   - Configurable columns, spin durations, and iterations
   - Takes an array of items to display in each reel
   - Supports theme-based coloring of items

Both components:
- Use theme CSS variables for styling
- Provide callbacks for result handling
- Support responsive sizing
- Manage their own animation state

### Theming System

The application uses a comprehensive theming system with light, dark, and system modes:

1. Theme CSS files are in `src/themes/` (dark.css, default.css)
2. The `ThemeSwitcher` component (`src/components/ThemeSwitcher.tsx`) manages theme state and allows users to toggle between themes
3. Theme selection is stored in localStorage
4. System preference detection is implemented using media queries

Theme variables are defined as CSS custom properties and include:
- Primary and secondary colors with light/dark variants
- Background and surface colors
- Text colors (foreground)
- Status colors (success, error, warning, info)

The theming system uses Tailwind CSS 4's custom variant support with the `@custom-variant` directive for dark mode.

### UI Component Library

The project includes a comprehensive UI component library in `src/components/ui/` built on top of Radix UI primitives. These components are styled with Tailwind CSS and follow the application's theming system:

- Form elements (buttons, inputs, selects, etc.)
- Layout components (cards, accordions, dialogs)
- Navigation elements (menus, tabs, etc.)
- Feedback components (alerts, tooltips)

### Technologies

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool and dev server
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Unstyled, accessible component primitives
- **ESLint** - Code linting with TypeScript support

## Best Practices

When working on this codebase:

1. Maintain the theme system - any new components should respect the theme CSS variables
2. Use Tailwind CSS utilities for styling
3. Follow TypeScript type safety patterns
4. Keep components small and focused
5. Use Radix UI primitives for new interactive components
6. Ensure randomizer components support customization via props
7. Follow the established pattern for animations and transitions
8. Respect accessibility guidelines for interactive elements