# Agent Guidelines

## Commands

**Setup:** `yarn install` (uses Yarn based on yarn.lock presence)  
**Build:** `yarn build`  
**Lint:** `yarn lint`  
**Tests:** No test suite configured  
**Dev Server:** `yarn dev` (runs on http://localhost:3000)

Additional: `yarn typecheck` (TypeScript validation), `yarn format` (Prettier)

## Tech Stack

- **Framework:** Next.js 14.2.10 (App Router) with React 18.3.1
- **Language:** TypeScript with strict mode
- **Styling:** Tailwind CSS + shadcn/ui components (Radix UI primitives)
- **State:** Zustand + TanStack Query
- **Backend:** Supabase (auth & database)
- **Forms:** React Hook Form + Zod validation

## Structure

- `app/` - Next.js App Router pages (auth, dashboard, leads, fichiers, rapports, etc.)
- `components/` - Reusable components organized by feature (ui/, common/, leads/, etc.)
- `lib/` - Utilities and shared logic
- `types/` - TypeScript type definitions
- `hooks/`, `contexts/` - React hooks and context providers

## Code Style

- Path aliases: `@/*` for root imports (e.g., `@/components`, `@/lib`)
- Tailwind for styling with `cn()` utility (tailwind-merge + clsx)
- No semicolons (check existing code for consistency)
- Prettier with Tailwind plugin for formatting
