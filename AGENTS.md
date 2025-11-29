# AGENTS.md

## Commands

**Setup:** `yarn install`  
**Build:** `yarn build`  
**Lint:** `yarn lint`  
**Test:** `yarn typecheck` (no test framework configured)  
**Dev Server:** `yarn dev`

## Tech Stack

- **Framework:** Next.js 14 (App Router) with TypeScript
- **Styling:** Tailwind CSS with shadcn/ui components
- **State:** Zustand + React Query (TanStack)
- **Backend:** Supabase (auth & database)
- **UI:** Radix UI primitives, Framer Motion, Lucide icons

## Architecture

- `app/` - Next.js routes (auth, dashboard, leads, rapports, settings, etc.)
- `components/` - Reusable components (ui/, common/, feature-specific)
- `lib/` - Utilities and shared logic
- `types/` - TypeScript type definitions
- `contexts/` & `hooks/` - React context and custom hooks

## Code Style

- Path alias: `@/` for root imports
- CSS utility: `cn()` from `lib/utils.ts` for class merging
- Component pattern: shadcn/ui style with `forwardRef`, CVA variants
- Naming: camelCase for functions/variables, PascalCase for components
- French UI text (locale: `fr-FR`)
