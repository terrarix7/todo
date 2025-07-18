# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a daily todo tracking application built with TanStack Start (React framework) that works offline as a Progressive Web App (PWA). The app allows users to manage todos per day with offline support and service worker caching.

## Architecture

- **Framework**: TanStack Start (React-based full-stack framework)
- **Build Tool**: Vite with TypeScript
- **PWA Support**: Serwist for service worker management and offline caching
- **Storage**: localStorage for persistent data storage
- **Router**: TanStack Router with file-based routing

## Key Components

- `src/routes/__root.tsx` - Root layout with PWA features (offline status, update notifications)
- `src/routes/index.tsx` - Main todo interface with date navigation and todo management
- `src/lib/todos.ts` - Core business logic for todo CRUD operations and localStorage management
- `src/sw.ts` - Service worker configuration using Serwist
- `src/router.tsx` - Router configuration

## Data Model

Todos are organized by date with the following structure:

```typescript
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

interface TodosByDate {
  [date: string]: Todo[];
}
```

Data persists in localStorage under the `todos` key with automatic JSON serialization/deserialization.

## Development Commands (Use Bun)

```bash
# Install dependencies (supports both npm and pnpm)
bun install
# or
pnpm install

# Start development server (runs on port 3000)
bun run dev
# or
pnpm dev

# Build for production (includes TypeScript type checking)
bun run build
# or
pnpm build

# Start production server
bun run start
# or
pnpm start
```

## PWA Features

- Offline functionality with service worker caching
- App manifest for installation
- Update notifications when new versions are available
- Online/offline status indicators in the UI

## File Structure

- `src/routes/` - File-based routing (TanStack Router)
- `src/lib/` - Business logic and utilities
- `public/` - Static assets including PWA icons and manifest
- `vite.config.ts` - Vite configuration with Serwist PWA plugin

## TypeScript Configuration

- Path alias `~/*` maps to `./src/*`
- Strict TypeScript settings enabled
- React JSX transform configured
